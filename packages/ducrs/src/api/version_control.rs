//! Version-graph restore & mutation API over a `DucConnection`.
//!
//! Provides high-level operations for:
//! - Restoring document state at any version (checkpoint or delta replay)
//! - Creating new checkpoints and deltas
//! - Listing version history
//!
//! All operations work directly against the embedded SQLite schema
//! (`version_control.sql`) and produce/consume the canonical Rust types
//! from `crate::types`.

use flate2::read::{GzDecoder, ZlibDecoder};
use flate2::write::GzEncoder;
use flate2::Compression;
use rusqlite::OptionalExtension;

use crate::db::{DbError, DbResult, DucConnection};
use crate::external_file_chunks::{self, DEFAULT_EXTERNAL_FILE_CHUNK_SIZE};
use crate::types::{
    Checkpoint, Delta, SchemaMigration, VersionBase, VersionChain, VersionGraph,
    VersionGraphMetadata,
};

/// The current version-control schema version.
///
/// This is generated at build time from `schema/duc.sql` (`PRAGMA user_version`).
/// TypeScript reads this value via the WASM binding `getCurrentSchemaVersion()`.
pub const CURRENT_SCHEMA_VERSION: i32 =
    include!(concat!(env!("OUT_DIR"), "/schema_user_version.rs"));

/// The result of restoring a specific version.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoredVersion {
    /// The version number that was restored.
    pub version_number: i64,
    /// The schema version of the restored data.
    pub schema_version: i32,
    /// The full document-state blob at this version.
    pub data: Vec<u8>,
    /// Whether this was restored directly from a checkpoint (true)
    /// or by replaying deltas on top of a base checkpoint (false).
    pub from_checkpoint: bool,
}

/// Lightweight version entry for listing history without loading data blobs.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionEntry {
    pub id: String,
    pub version_number: i64,
    pub schema_version: i32,
    pub timestamp: i64,
    pub description: Option<String>,
    pub is_manual_save: bool,
    pub user_id: Option<String>,
    /// `"checkpoint"` or `"delta"`
    pub version_type: String,
    pub size_bytes: i64,
}

/// A short-lived accessor for version-control operations on a `DucConnection`.
pub struct VersionControl<'a> {
    conn: &'a DucConnection,
}

impl<'a> VersionControl<'a> {
    pub(crate) fn new(conn: &'a DucConnection) -> Self {
        Self { conn }
    }

    /// Create a `VersionControl` accessor from a `DucConnection` reference.
    /// Public so WASM bindings can construct it directly.
    pub fn from_connection(conn: &'a DucConnection) -> Self {
        Self { conn }
    }

    // ────────────────────────────────────────────────────────────────────────
    // READ — Restore
    // ────────────────────────────────────────────────────────────────────────

    /// Restore the document state at *exactly* `version_number`.
    ///
    /// Algorithm:
    /// 1. If a checkpoint exists at that version → return its `data` directly.
    /// 2. Otherwise find the delta at that version, load its base checkpoint,
    ///    and decode the changeset (handles both legacy full-snapshot and
    ///    modern XOR diff formats transparently).
    pub fn restore_version(&self, version_number: i64) -> DbResult<RestoredVersion> {
        self.conn.with(|c| {
            // 1) Try direct checkpoint hit
            let direct: Option<(String, i32)> = c
                .query_row(
                    "SELECT id, schema_version FROM checkpoints
                     WHERE version_number = ?1",
                    [version_number],
                    |row| {
                        let id: String = row.get(0)?;
                        let sv: i32 = row.get(1)?;
                        Ok((id, sv))
                    },
                )
                .optional()
                .map_err(DbError::from)?;

            if let Some((checkpoint_id, schema_version)) = direct {
                let data = read_checkpoint_data(c, &checkpoint_id)?;
                return Ok(RestoredVersion {
                    version_number,
                    schema_version,
                    data,
                    from_checkpoint: true,
                });
            }

            // 2) Find the target delta to determine schema_version
            let (target_sv, target_base_cp_id): (i32, String) = c
                .query_row(
                    "SELECT schema_version, base_checkpoint_id FROM deltas
                     WHERE version_number = ?1",
                    [version_number],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .map_err(DbError::from)?;

            // 3) Load the base checkpoint data
            let base_data = read_checkpoint_data(c, &target_base_cp_id)?;

            // 4) Load the target delta's changeset
            let target_delta_id: String = c
                .query_row(
                    "SELECT id FROM deltas WHERE version_number = ?1",
                    [version_number],
                    |row| row.get(0),
                )
                .map_err(DbError::from)?;
            let target_changeset = read_delta_changeset(c, &target_delta_id)?;

            // 5) Decode: auto-detects v3 (bsdiff) / v2 (XOR) / v1 (legacy snapshot)
            let final_data = apply_delta_changeset(&base_data, &target_changeset)?;

            Ok(RestoredVersion {
                version_number,
                schema_version: target_sv,
                data: final_data,
                from_checkpoint: false,
            })
        })
    }

    /// Restore the document state from a specific checkpoint (by checkpoint ID).
    pub fn restore_checkpoint(&self, checkpoint_id: &str) -> DbResult<RestoredVersion> {
        self.conn.with(|c| {
            let (version_number, schema_version): (i64, i32) = c
                .query_row(
                    "SELECT version_number, schema_version FROM checkpoints WHERE id = ?1",
                    [checkpoint_id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .map_err(DbError::from)?;
            let data = read_checkpoint_data(c, checkpoint_id)?;

            Ok(RestoredVersion {
                version_number,
                schema_version,
                data,
                from_checkpoint: true,
            })
        })
    }

    /// Load the full `VersionGraph` from the database (same logic as `parse.rs`
    /// but accessible through the document API).
    pub fn read_version_graph(&self) -> DbResult<Option<VersionGraph>> {
        self.conn.with(|c| read_version_graph_inner(c))
    }

    // ────────────────────────────────────────────────────────────────────────
    // READ — Listing
    // ────────────────────────────────────────────────────────────────────────

    /// List all versions (checkpoints + deltas) ordered by version number,
    /// without loading the heavy data/changeset blobs.
    pub fn list_versions(&self) -> DbResult<Vec<VersionEntry>> {
        self.conn.with(|c| {
            let mut entries = Vec::new();

            // Checkpoints
            let mut cp_stmt = c
                .prepare(
                    "SELECT id, version_number, schema_version, timestamp,
                            description, is_manual_save, user_id, size_bytes
                     FROM checkpoints ORDER BY version_number",
                )
                .map_err(DbError::from)?;

            let cp_iter = cp_stmt
                .query_map([], |row| {
                    Ok(VersionEntry {
                        id: row.get(0)?,
                        version_number: row.get(1)?,
                        schema_version: row.get(2)?,
                        timestamp: row.get(3)?,
                        description: row.get(4)?,
                        is_manual_save: row.get::<_, i32>(5)? != 0,
                        user_id: row.get(6)?,
                        version_type: "checkpoint".into(),
                        size_bytes: row.get::<_, Option<i64>>(7)?.unwrap_or(0),
                    })
                })
                .map_err(DbError::from)?;

            for entry in cp_iter {
                entries.push(entry.map_err(DbError::from)?);
            }

            // Deltas
            let mut d_stmt = c
                .prepare(
                    "SELECT id, version_number, schema_version, timestamp,
                            description, is_manual_save, user_id, size_bytes
                     FROM deltas ORDER BY version_number",
                )
                .map_err(DbError::from)?;

            let d_iter = d_stmt
                .query_map([], |row| {
                    Ok(VersionEntry {
                        id: row.get(0)?,
                        version_number: row.get(1)?,
                        schema_version: row.get(2)?,
                        timestamp: row.get(3)?,
                        description: row.get(4)?,
                        is_manual_save: row.get::<_, i32>(5)? != 0,
                        user_id: row.get(6)?,
                        version_type: "delta".into(),
                        size_bytes: row.get::<_, Option<i64>>(7)?.unwrap_or(0),
                    })
                })
                .map_err(DbError::from)?;

            for entry in d_iter {
                entries.push(entry.map_err(DbError::from)?);
            }

            // Sort combined list by version_number
            entries.sort_by_key(|e| e.version_number);

            Ok(entries)
        })
    }

    /// Get the current version graph metadata (singleton row).
    pub fn get_metadata(&self) -> DbResult<Option<VersionGraphMetadata>> {
        self.conn.with(|c| {
            c.query_row(
                "SELECT current_version, current_schema_version, chain_count,
                        total_size
                 FROM version_graph WHERE id = 1",
                [],
                |row| {
                    Ok(VersionGraphMetadata {
                        current_version: row.get(0)?,
                        current_schema_version: row.get(1)?,
                        chain_count: row.get(2)?,
                        total_size: row.get::<_, Option<i64>>(3)?.unwrap_or(0),
                    })
                },
            )
            .optional()
            .map_err(DbError::from)
        })
    }

    // ────────────────────────────────────────────────────────────────────────
    // WRITE — Create versions
    // ────────────────────────────────────────────────────────────────────────

    /// Insert a new checkpoint into the database and update the version graph
    /// singleton row.
    ///
    /// If the checkpoint's `schema_version` is higher than the stored
    /// `current_schema_version`, the migration bookkeeping is performed
    /// automatically (close old chain, record migration, open new chain).
    pub fn create_checkpoint(&self, checkpoint: &Checkpoint) -> DbResult<()> {
        self.conn.with(|c| {
            with_version_control_savepoint(c, || {
                validate_new_version(
                    c,
                    &checkpoint.base.id,
                    checkpoint.version_number,
                    checkpoint.schema_version,
                )?;
                let migration_id = self.maybe_migrate_schema(
                    c,
                    checkpoint.schema_version,
                    &checkpoint.base.id,
                    checkpoint.is_schema_boundary,
                )?;
                let chain_id = self.resolve_chain_id(
                    c,
                    checkpoint.schema_version,
                    checkpoint.version_number,
                    migration_id,
                )?;
                let stored_size = i64::try_from(checkpoint.data.len()).map_err(|_| {
                    version_control_error("checkpoint payload size exceeds SQLite INTEGER range")
                })?;

                c.execute(
                    "INSERT INTO checkpoints
                    (id, parent_id, chain_id, version_number, schema_version,
                     timestamp, description, is_manual_save, is_schema_boundary,
                     user_id, size_bytes)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                    rusqlite::params![
                        checkpoint.base.id,
                        checkpoint.base.parent_id,
                        chain_id,
                        checkpoint.version_number,
                        checkpoint.schema_version,
                        checkpoint.base.timestamp,
                        checkpoint.base.description,
                        checkpoint.base.is_manual_save as i32,
                        checkpoint.is_schema_boundary as i32,
                        checkpoint.base.user_id,
                        stored_size,
                    ],
                )
                .map_err(DbError::from)?;
                external_file_chunks::write_checkpoint_data_chunks_on_connection(
                    c,
                    &checkpoint.base.id,
                    &checkpoint.data,
                    DEFAULT_EXTERNAL_FILE_CHUNK_SIZE,
                )
                .map_err(chunk_error_to_db)?;

                c.execute(
                    "UPDATE version_chains
                     SET root_checkpoint_id = COALESCE(root_checkpoint_id, ?1)
                     WHERE id = ?2",
                    rusqlite::params![checkpoint.base.id, chain_id],
                )
                .map_err(DbError::from)?;

                self.update_version_graph_pointer(
                    c,
                    &checkpoint.base.id,
                    checkpoint.version_number,
                    checkpoint.schema_version,
                )?;

                Ok(())
            })
        })
    }

    /// Insert a new delta into the database and update the version graph
    /// singleton row.
    ///
    /// `delta.payload` must be the **full document state** at this version
    /// (uncompressed). The method automatically computes a fossil delta
    /// against the base checkpoint, producing a compact changeset.
    ///
    /// The delta schema must match both its base checkpoint and the active
    /// version chain. Schema transitions must begin with a boundary checkpoint.
    pub fn create_delta(&self, delta: &Delta) -> DbResult<()> {
        self.conn.with(|c| {
            with_version_control_savepoint(c, || {
                validate_new_version(
                    c,
                    &delta.base.id,
                    delta.version_number,
                    delta.schema_version,
                )?;

                let (base_schema_version, chain_id): (i32, String) = c
                    .query_row(
                        "SELECT schema_version, chain_id FROM checkpoints WHERE id = ?1",
                        [&delta.base_checkpoint_id],
                        |row| Ok((row.get(0)?, row.get(1)?)),
                    )
                    .map_err(DbError::from)?;
                if base_schema_version != delta.schema_version {
                    return Err(version_control_error(format!(
                        "delta schema version {} does not match base checkpoint schema version {}",
                        delta.schema_version, base_schema_version
                    )));
                }

                let current_schema_version: i32 = c
                    .query_row(
                        "SELECT current_schema_version FROM version_graph WHERE id = 1",
                        [],
                        |row| row.get(0),
                    )
                    .map_err(DbError::from)?;
                if delta.schema_version != current_schema_version {
                    return Err(version_control_error(format!(
                        "delta schema version {} is not the active schema version {}",
                        delta.schema_version, current_schema_version
                    )));
                }

                let active_chain: bool = c
                    .query_row(
                        "SELECT end_version IS NULL FROM version_chains WHERE id = ?1",
                        [&chain_id],
                        |row| row.get(0),
                    )
                    .map_err(DbError::from)?;
                if !active_chain {
                    return Err(version_control_error(
                        "delta base checkpoint belongs to a closed version chain",
                    ));
                }

                // Compute delta_sequence within the base checkpoint group.
                let delta_sequence: i64 = c
                    .query_row(
                        "SELECT COALESCE(MAX(delta_sequence), 0) + 1
                         FROM deltas WHERE base_checkpoint_id = ?1",
                        [&delta.base_checkpoint_id],
                        |row| row.get(0),
                    )
                    .map_err(DbError::from)?;

                // Load the base checkpoint data for delta computation.
                let base_data = read_checkpoint_data(c, &delta.base_checkpoint_id)?;

                // Compute checkpoint-relative fossil delta changeset.
                let changeset = create_bsdiff_changeset(&base_data, &delta.payload)?;
                let stored_size = i64::try_from(changeset.len()).map_err(|_| {
                    version_control_error("delta payload size exceeds SQLite INTEGER range")
                })?;

                c.execute(
                    "INSERT INTO deltas
                    (id, parent_id, base_checkpoint_id, chain_id, delta_sequence,
                     version_number, schema_version, timestamp, description,
                     is_manual_save, user_id, size_bytes)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                    rusqlite::params![
                        delta.base.id,
                        delta.base.parent_id,
                        delta.base_checkpoint_id,
                        chain_id,
                        delta_sequence,
                        delta.version_number,
                        delta.schema_version,
                        delta.base.timestamp,
                        delta.base.description,
                        delta.base.is_manual_save as i32,
                        delta.base.user_id,
                        stored_size,
                    ],
                )
                .map_err(DbError::from)?;
                external_file_chunks::write_delta_changeset_chunks_on_connection(
                    c,
                    &delta.base.id,
                    &changeset,
                    DEFAULT_EXTERNAL_FILE_CHUNK_SIZE,
                )
                .map_err(chunk_error_to_db)?;

                self.update_version_graph_pointer(
                    c,
                    &delta.base.id,
                    delta.version_number,
                    delta.schema_version,
                )?;

                Ok(())
            })
        })
    }

    /// Set the user-designated checkpoint version id.
    pub fn set_user_checkpoint(&self, version_id: &str) -> DbResult<()> {
        self.conn.with(|c| {
            let exists: bool = c
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM checkpoints WHERE id = ?1)",
                    [version_id],
                    |row| row.get(0),
                )
                .map_err(DbError::from)?;
            if !exists {
                return Err(version_control_error(format!(
                    "checkpoint {version_id} does not exist"
                )));
            }

            c.execute(
                "UPDATE version_graph SET user_checkpoint_version_id = ?1 WHERE id = 1",
                [version_id],
            )
            .map(|_| ())
            .map_err(DbError::from)
        })
    }

    // ────────────────────────────────────────────────────────────────────────
    // WRITE — Revert
    // ────────────────────────────────────────────────────────────────────────

    /// Revert the version graph to `target_version` by deleting all versions
    /// newer than the target and updating the graph's pointers.
    ///
    /// Returns the restored document state at the target version.
    pub fn revert_to_version(&self, target_version: i64) -> DbResult<RestoredVersion> {
        // First, restore the data at the target version
        let restored = self.restore_version(target_version)?;

        self.conn.with(|c| -> DbResult<()> {
            with_version_control_savepoint(c, || {
                // Delete all versions newer than the target. Payload chunks are
                // removed through their ON DELETE CASCADE foreign keys.
                c.execute(
                    "DELETE FROM deltas WHERE version_number > ?1",
                    [target_version],
                )
                .map_err(DbError::from)?;
                c.execute(
                    "DELETE FROM checkpoints WHERE version_number > ?1",
                    [target_version],
                )
                .map_err(DbError::from)?;

                let (version_id, chain_id): (String, String) = c
                    .query_row(
                        "SELECT id, chain_id FROM checkpoints WHERE version_number = ?1
                         UNION ALL
                         SELECT id, chain_id FROM deltas WHERE version_number = ?1
                         LIMIT 1",
                        [target_version],
                        |row| Ok((row.get(0)?, row.get(1)?)),
                    )
                    .map_err(DbError::from)?;

                // Remove chains and migrations that no longer own any retained
                // versions, then reopen the target chain for future versions.
                c.execute(
                    "DELETE FROM version_chains
                     WHERE NOT EXISTS (
                         SELECT 1 FROM checkpoints WHERE checkpoints.chain_id = version_chains.id
                     ) AND NOT EXISTS (
                         SELECT 1 FROM deltas WHERE deltas.chain_id = version_chains.id
                     )",
                    [],
                )
                .map_err(DbError::from)?;
                c.execute(
                    "DELETE FROM schema_migrations
                     WHERE id NOT IN (
                         SELECT migration_id FROM version_chains WHERE migration_id IS NOT NULL
                     )",
                    [],
                )
                .map_err(DbError::from)?;
                c.execute(
                    "UPDATE version_chains SET end_version = NULL WHERE id = ?1",
                    [&chain_id],
                )
                .map_err(DbError::from)?;

                c.execute(
                    "UPDATE version_graph
                     SET current_version = ?1,
                         current_schema_version = ?2,
                         latest_version_id = ?3,
                         user_checkpoint_version_id = CASE
                             WHEN EXISTS (
                                 SELECT 1 FROM checkpoints
                                 WHERE id = version_graph.user_checkpoint_version_id
                             ) THEN user_checkpoint_version_id
                             ELSE NULL
                         END,
                         chain_count = (SELECT COUNT(*) FROM version_chains)
                     WHERE id = 1",
                    rusqlite::params![target_version, restored.schema_version, version_id],
                )
                .map_err(DbError::from)?;

                self.recalculate_total_size(c)?;
                Ok(())
            })
        })?;

        Ok(restored)
    }

    // ────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ────────────────────────────────────────────────────────────────────────

    /// Update the version_graph singleton to point at the latest version.
    fn update_version_graph_pointer(
        &self,
        c: &rusqlite::Connection,
        version_id: &str,
        version_number: i64,
        schema_version: i32,
    ) -> DbResult<()> {
        c.execute(
            "UPDATE version_graph
             SET current_version = ?1,
                 current_schema_version = ?2,
                 latest_version_id = ?3
             WHERE id = 1",
            rusqlite::params![version_number, schema_version, version_id],
        )
        .map(|_| ())
        .map_err(DbError::from)?;

        self.recalculate_total_size(c)?;
        Ok(())
    }

    /// Find (or create) the chain_id for a given schema_version.
    fn resolve_chain_id(
        &self,
        c: &rusqlite::Connection,
        schema_version: i32,
        start_version: i64,
        migration_id: Option<i64>,
    ) -> DbResult<String> {
        let existing: Option<String> = c
            .query_row(
                "SELECT id FROM version_chains
                 WHERE schema_version = ?1 AND end_version IS NULL
                 ORDER BY start_version DESC LIMIT 1",
                [schema_version],
                |row| row.get(0),
            )
            .optional()
            .map_err(DbError::from)?;

        match existing {
            Some(id) => Ok(id),
            None => {
                let new_id = nanoid();
                c.execute(
                    "INSERT INTO version_chains
                        (id, schema_version, start_version, migration_id)
                     VALUES (?1, ?2, ?3, ?4)",
                    rusqlite::params![new_id, schema_version, start_version, migration_id],
                )
                .map_err(DbError::from)?;

                c.execute(
                    "UPDATE version_graph
                     SET chain_count = (SELECT COUNT(*) FROM version_chains)
                     WHERE id = 1",
                    [],
                )
                .map_err(DbError::from)?;

                Ok(new_id)
            }
        }
    }

    /// Recalculate and update the total_size in version_graph.
    fn recalculate_total_size(&self, c: &rusqlite::Connection) -> DbResult<()> {
        let total: i64 = c
            .query_row(
                "SELECT COALESCE(
                    (SELECT SUM(COALESCE(size_bytes, 0)) FROM checkpoints), 0
                 ) + COALESCE(
                    (SELECT SUM(COALESCE(size_bytes, 0)) FROM deltas), 0
                 )",
                [],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;

        c.execute(
            "UPDATE version_graph SET total_size = ?1 WHERE id = 1",
            [total],
        )
        .map(|_| ())
        .map_err(DbError::from)
    }

    /// Automatically handle schema migration bookkeeping when
    /// `new_schema_version` is higher than the stored `current_schema_version`.
    ///
    /// Steps performed:
    /// 1. Close the currently-open chain for the old schema version
    ///    (sets `end_version` to the current max version number).
    /// 2. Insert a `schema_migrations` row recording the transition.
    ///
    /// The new chain for `new_schema_version` is created lazily by
    /// `resolve_chain_id` on the next `create_checkpoint` / `create_delta`.
    fn maybe_migrate_schema(
        &self,
        c: &rusqlite::Connection,
        new_schema_version: i32,
        boundary_checkpoint_id: &str,
        is_schema_boundary: bool,
    ) -> DbResult<Option<i64>> {
        let current_sv: i32 = c
            .query_row(
                "SELECT current_schema_version FROM version_graph WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;

        let version_count: i64 = c
            .query_row(
                "SELECT (SELECT COUNT(*) FROM checkpoints) +
                        (SELECT COUNT(*) FROM deltas)",
                [],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;
        if version_count == 0 {
            c.execute(
                "UPDATE version_graph SET current_schema_version = ?1 WHERE id = 1",
                [new_schema_version],
            )
            .map_err(DbError::from)?;
            return Ok(None);
        }

        if new_schema_version < current_sv {
            return Err(version_control_error(format!(
                "schema version cannot move backwards from {current_sv} to {new_schema_version}"
            )));
        }
        if new_schema_version == current_sv {
            return Ok(None);
        }
        if !is_schema_boundary {
            return Err(version_control_error(format!(
                "checkpoint {boundary_checkpoint_id} must be marked as a schema boundary when moving from schema {current_sv} to {new_schema_version}"
            )));
        }

        let current_max_version: i64 = c
            .query_row(
                "SELECT MAX(v) FROM (
                    SELECT COALESCE(MAX(version_number), 0) AS v FROM checkpoints
                    UNION ALL
                    SELECT COALESCE(MAX(version_number), 0) AS v FROM deltas
                 )",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // Close all open chains for the old schema version
        c.execute(
            "UPDATE version_chains
             SET end_version = ?1
             WHERE schema_version = ?2 AND end_version IS NULL",
            rusqlite::params![current_max_version, current_sv],
        )
        .map_err(DbError::from)?;

        let now_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        let migration_id: i64 = c
            .query_row(
                "INSERT INTO schema_migrations
                    (from_schema_version, to_schema_version, migration_name, applied_at,
                     boundary_checkpoint_id)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 RETURNING id",
                rusqlite::params![
                    current_sv,
                    new_schema_version,
                    format!("auto_migration_v{}_to_v{}", current_sv, new_schema_version),
                    now_ms,
                    boundary_checkpoint_id,
                ],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;

        log::info!(
            "Schema migration: {} → {} (closed old chains, recorded migration)",
            current_sv,
            new_schema_version
        );

        Ok(Some(migration_id))
    }
}

fn version_control_error(message: impl Into<String>) -> DbError {
    DbError::Bootstrap(format!("version control: {}", message.into()))
}

fn validate_new_version(
    c: &rusqlite::Connection,
    version_id: &str,
    version_number: i64,
    schema_version: i32,
) -> DbResult<()> {
    if version_id.is_empty() {
        return Err(version_control_error("version id must not be empty"));
    }
    if version_number < 0 {
        return Err(version_control_error("version number must be non-negative"));
    }
    if schema_version < 1 {
        return Err(version_control_error("schema version must be positive"));
    }

    let duplicate_id: bool = c
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM checkpoints WHERE id = ?1)
                 OR EXISTS(SELECT 1 FROM deltas WHERE id = ?1)",
            [version_id],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if duplicate_id {
        return Err(version_control_error(format!(
            "version id {version_id} already exists"
        )));
    }

    let duplicate_number: bool = c
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM checkpoints WHERE version_number = ?1)
                 OR EXISTS(SELECT 1 FROM deltas WHERE version_number = ?1)",
            [version_number],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if duplicate_number {
        return Err(version_control_error(format!(
            "version number {version_number} already exists"
        )));
    }

    let latest_version: Option<i64> = c
        .query_row(
            "SELECT MAX(version_number) FROM (
                 SELECT version_number FROM checkpoints
                 UNION ALL
                 SELECT version_number FROM deltas
             )",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if latest_version.is_some_and(|latest| version_number <= latest) {
        return Err(version_control_error(format!(
            "version number {version_number} must be greater than the latest version {}",
            latest_version.unwrap_or_default()
        )));
    }

    Ok(())
}

fn with_version_control_savepoint<T>(
    c: &rusqlite::Connection,
    operation: impl FnOnce() -> DbResult<T>,
) -> DbResult<T> {
    c.execute_batch("SAVEPOINT duc_version_control_write")
        .map_err(DbError::from)?;
    match operation() {
        Ok(value) => {
            if let Err(error) = c.execute_batch("RELEASE duc_version_control_write") {
                let _ = c.execute_batch(
                    "ROLLBACK TO duc_version_control_write;
                     RELEASE duc_version_control_write;",
                );
                return Err(DbError::from(error));
            }
            Ok(value)
        }
        Err(error) => {
            let _ = c.execute_batch(
                "ROLLBACK TO duc_version_control_write;
                 RELEASE duc_version_control_write;",
            );
            Err(error)
        }
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Standalone helpers (reused by `parse.rs` as well)
// ────────────────────────────────────────────────────────────────────────────

/// Read the full `VersionGraph` from a raw `Connection`.
/// Factored out so both `parse.rs` and `VersionControl` can share the logic.
pub(crate) fn read_version_graph_inner(
    conn: &rusqlite::Connection,
) -> DbResult<Option<VersionGraph>> {
    let graph = read_version_graph_unchecked(conn)?;
    if let Some(graph) = &graph {
        validate_version_graph_integrity(
            conn,
            &graph.metadata,
            &graph.user_checkpoint_version_id,
            &graph.latest_version_id,
            true,
        )?;
    }
    Ok(graph)
}

/// Read version history as optional document metadata. Recoverable bookkeeping
/// drift must not prevent the current drawing state from opening.
pub(crate) fn read_version_graph_for_document_open(
    conn: &rusqlite::Connection,
) -> DbResult<Option<VersionGraph>> {
    let Some(mut graph) = read_version_graph_unchecked(conn)? else {
        return Ok(None);
    };

    if let Err(error) = validate_version_graph_integrity(
        conn,
        &graph.metadata,
        &graph.user_checkpoint_version_id,
        &graph.latest_version_id,
        true,
    ) {
        validate_version_graph_integrity(
            conn,
            &graph.metadata,
            &graph.user_checkpoint_version_id,
            &graph.latest_version_id,
            false,
        )?;
        log::warn!("{error}; opening drawing with normalized version graph metadata");
        normalize_version_graph_metadata(&mut graph);
    }

    Ok(Some(graph))
}

fn read_version_graph_unchecked(conn: &rusqlite::Connection) -> DbResult<Option<VersionGraph>> {
    use std::collections::HashMap;

    let has_table: bool = conn
        .prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='version_graph'")
        .and_then(|mut s| s.query_row([], |row| row.get::<_, i32>(0)))
        .unwrap_or(0)
        > 0;

    if !has_table {
        return Ok(None);
    }

    let mut vg_stmt = conn
        .prepare(
            "SELECT current_version, current_schema_version, user_checkpoint_version_id,
                    latest_version_id, chain_count, total_size
             FROM version_graph WHERE id = 1",
        )
        .map_err(DbError::from)?;

    let (metadata, user_cp_id, latest_id) = match vg_stmt.query_row([], |row| {
        Ok((
            VersionGraphMetadata {
                current_version: row.get(0)?,
                current_schema_version: row.get(1)?,
                chain_count: row.get(4)?,
                total_size: row.get::<_, Option<i64>>(5)?.unwrap_or(0),
            },
            row.get::<_, Option<String>>(2)?.unwrap_or_default(),
            row.get::<_, Option<String>>(3)?.unwrap_or_default(),
        ))
    }) {
        Ok(v) => v,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
        Err(e) => return Err(DbError::from(e)),
    };

    // Migrations keyed by id
    let mut m_stmt = conn
        .prepare(
            "SELECT id, from_schema_version, to_schema_version, migration_name,
                    migration_checksum, applied_at, boundary_checkpoint_id
             FROM schema_migrations",
        )
        .map_err(DbError::from)?;

    let migrations: HashMap<i64, SchemaMigration> = m_stmt
        .query_map([], |row| {
            let id: i64 = row.get(0)?;
            Ok((
                id,
                SchemaMigration {
                    from_schema_version: row.get(1)?,
                    to_schema_version: row.get(2)?,
                    migration_name: row.get(3)?,
                    migration_checksum: row.get(4)?,
                    applied_at: row.get(5)?,
                    boundary_checkpoint_id: row.get(6)?,
                },
            ))
        })
        .map_err(DbError::from)?
        .collect::<Result<HashMap<_, _>, _>>()
        .map_err(DbError::from)?;

    // Chains
    let mut ch_stmt = conn
        .prepare(
            "SELECT id, schema_version, start_version, end_version, migration_id, root_checkpoint_id
             FROM version_chains ORDER BY start_version",
        )
        .map_err(DbError::from)?;

    let chains: Vec<VersionChain> = ch_stmt
        .query_map([], |row| {
            let mig_id: Option<i64> = row.get(4)?;
            Ok(VersionChain {
                id: row.get(0)?,
                schema_version: row.get(1)?,
                start_version: row.get(2)?,
                end_version: row.get(3)?,
                migration: mig_id.and_then(|mid| migrations.get(&mid).cloned()),
                root_checkpoint_id: row.get(5)?,
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    // Checkpoints
    let mut cp_stmt = conn
        .prepare(
            "SELECT id, parent_id, version_number, schema_version, timestamp,
                    description, is_manual_save, is_schema_boundary, user_id, size_bytes
             FROM checkpoints ORDER BY version_number",
        )
        .map_err(DbError::from)?;

    let checkpoints: Vec<Checkpoint> = cp_stmt
        .query_map([], |row| {
            Ok(Checkpoint {
                base: VersionBase {
                    id: row.get(0)?,
                    parent_id: row.get(1)?,
                    timestamp: row.get(4)?,
                    description: row.get(5)?,
                    is_manual_save: row.get::<_, i32>(6)? != 0,
                    user_id: row.get(8)?,
                },
                version_number: row.get(2)?,
                schema_version: row.get(3)?,
                is_schema_boundary: row.get::<_, i32>(7)? != 0,
                data: Vec::new(),
                size_bytes: row.get::<_, Option<i64>>(9)?.unwrap_or(0),
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    // Deltas
    let mut d_stmt = conn
        .prepare(
            "SELECT id, parent_id, base_checkpoint_id, version_number, schema_version,
                    timestamp, description, is_manual_save, user_id, size_bytes
             FROM deltas ORDER BY version_number",
        )
        .map_err(DbError::from)?;

    let deltas: Vec<Delta> = d_stmt
        .query_map([], |row| {
            Ok(Delta {
                base: VersionBase {
                    id: row.get(0)?,
                    parent_id: row.get(1)?,
                    timestamp: row.get(5)?,
                    description: row.get(6)?,
                    is_manual_save: row.get::<_, i32>(7)? != 0,
                    user_id: row.get(8)?,
                },
                base_checkpoint_id: row.get(2)?,
                version_number: row.get(3)?,
                schema_version: row.get(4)?,
                payload: Vec::new(),
                size_bytes: row.get::<_, Option<i64>>(9)?.unwrap_or(0),
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    Ok(Some(VersionGraph {
        user_checkpoint_version_id: user_cp_id,
        latest_version_id: latest_id,
        chains,
        checkpoints,
        deltas,
        metadata,
    }))
}

fn validate_version_graph_integrity(
    conn: &rusqlite::Connection,
    metadata: &VersionGraphMetadata,
    user_checkpoint_id: &str,
    latest_version_id: &str,
    validate_bookkeeping: bool,
) -> DbResult<()> {
    let duplicate_version: Option<i64> = conn
        .query_row(
            "SELECT checkpoints.version_number
             FROM checkpoints
             INNER JOIN deltas USING (version_number)
             LIMIT 1",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(DbError::from)?;
    if let Some(version) = duplicate_version {
        return Err(version_control_error(format!(
            "version number {version} is used by both a checkpoint and a delta"
        )));
    }

    let invalid_checkpoint_relations: i64 = conn
        .query_row(
            "SELECT COUNT(*)
             FROM checkpoints
             LEFT JOIN version_chains ON version_chains.id = checkpoints.chain_id
             WHERE version_chains.id IS NULL
                OR checkpoints.schema_version != version_chains.schema_version
                OR checkpoints.version_number < version_chains.start_version
                OR (version_chains.end_version IS NOT NULL
                    AND checkpoints.version_number > version_chains.end_version)",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if invalid_checkpoint_relations != 0 {
        return Err(version_control_error(format!(
            "{invalid_checkpoint_relations} checkpoints violate their version chain"
        )));
    }

    let invalid_delta_relations: i64 = conn
        .query_row(
            "SELECT COUNT(*)
             FROM deltas
             LEFT JOIN checkpoints AS base ON base.id = deltas.base_checkpoint_id
             LEFT JOIN version_chains ON version_chains.id = deltas.chain_id
             WHERE base.id IS NULL
                OR version_chains.id IS NULL
                OR deltas.schema_version != base.schema_version
                OR deltas.chain_id != base.chain_id
                OR deltas.schema_version != version_chains.schema_version
                OR deltas.version_number < version_chains.start_version
                OR (version_chains.end_version IS NOT NULL
                    AND deltas.version_number > version_chains.end_version)",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if invalid_delta_relations != 0 {
        return Err(version_control_error(format!(
            "{invalid_delta_relations} deltas violate their base checkpoint or version chain"
        )));
    }

    let invalid_roots: i64 = conn
        .query_row(
            "SELECT COUNT(*)
             FROM version_chains
             WHERE root_checkpoint_id IS NOT NULL
               AND NOT EXISTS (
                   SELECT 1 FROM checkpoints
                   WHERE checkpoints.id = version_chains.root_checkpoint_id
                     AND checkpoints.chain_id = version_chains.id
               )",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if invalid_roots != 0 {
        return Err(version_control_error(format!(
            "{invalid_roots} version chains reference an invalid root checkpoint"
        )));
    }

    let invalid_migrations: i64 = conn
        .query_row(
            "SELECT COUNT(*)
             FROM version_chains
             LEFT JOIN schema_migrations ON schema_migrations.id = version_chains.migration_id
             WHERE version_chains.migration_id IS NOT NULL
               AND (schema_migrations.id IS NULL
                OR schema_migrations.to_schema_version != version_chains.schema_version
                OR schema_migrations.to_schema_version <= schema_migrations.from_schema_version)",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if invalid_migrations != 0 {
        return Err(version_control_error(format!(
            "{invalid_migrations} version chains reference an incompatible schema migration"
        )));
    }

    if !validate_bookkeeping {
        return Ok(());
    }

    let invalid_sequences: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM (
                 SELECT base_checkpoint_id
                 FROM deltas
                 GROUP BY base_checkpoint_id
                 HAVING MIN(delta_sequence) != 1
                    OR MAX(delta_sequence) != COUNT(*)
                    OR COUNT(DISTINCT delta_sequence) != COUNT(*)
             )",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if invalid_sequences != 0 {
        return Err(version_control_error(format!(
            "{invalid_sequences} checkpoint delta sequences contain gaps or duplicates"
        )));
    }

    if !user_checkpoint_id.is_empty() {
        let user_checkpoint_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM checkpoints WHERE id = ?1)",
                [user_checkpoint_id],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;
        if !user_checkpoint_exists {
            return Err(version_control_error(format!(
                "user checkpoint {user_checkpoint_id} does not exist"
            )));
        }
    }

    let chain_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM version_chains", [], |row| row.get(0))
        .map_err(DbError::from)?;
    let expected_chain_count = if chain_count == 0 { 1 } else { chain_count };
    if i64::from(metadata.chain_count) != expected_chain_count {
        return Err(version_control_error(format!(
            "version graph declares {} chains but stores {chain_count}",
            metadata.chain_count
        )));
    }

    let stored_total_size: i64 = conn
        .query_row(
            "SELECT COALESCE((SELECT SUM(COALESCE(size_bytes, 0)) FROM checkpoints), 0)
                  + COALESCE((SELECT SUM(COALESCE(size_bytes, 0)) FROM deltas), 0)",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;
    if metadata.total_size != stored_total_size {
        return Err(version_control_error(format!(
            "version graph declares {} total bytes but versions declare {stored_total_size}",
            metadata.total_size
        )));
    }

    let latest: Option<(String, i64, i32)> = conn
        .query_row(
            "SELECT id, version_number, schema_version FROM (
                 SELECT id, version_number, schema_version FROM checkpoints
                 UNION ALL
                 SELECT id, version_number, schema_version FROM deltas
             )
             ORDER BY version_number DESC
             LIMIT 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()
        .map_err(DbError::from)?;
    match latest {
        Some((id, version, schema_version)) => {
            if latest_version_id != id
                || metadata.current_version != version
                || metadata.current_schema_version != schema_version
            {
                return Err(version_control_error(format!(
                    "version graph latest pointer does not match stored version {version} ({id})"
                )));
            }
        }
        None if metadata.current_version != 0 || !latest_version_id.is_empty() => {
            return Err(version_control_error(
                "empty version graph has a non-empty latest pointer",
            ));
        }
        None => {}
    }

    Ok(())
}

fn normalize_version_graph_metadata(graph: &mut VersionGraph) {
    if !graph.user_checkpoint_version_id.is_empty()
        && !graph
            .checkpoints
            .iter()
            .any(|checkpoint| checkpoint.base.id == graph.user_checkpoint_version_id)
    {
        graph.user_checkpoint_version_id.clear();
    }

    graph.metadata.chain_count = if graph.chains.is_empty() {
        1
    } else {
        i32::try_from(graph.chains.len()).unwrap_or(i32::MAX)
    };
    graph.metadata.total_size = graph
        .checkpoints
        .iter()
        .map(|checkpoint| checkpoint.size_bytes)
        .chain(graph.deltas.iter().map(|delta| delta.size_bytes))
        .fold(0_i64, i64::saturating_add);

    let latest_checkpoint = graph.checkpoints.iter().map(|checkpoint| {
        (
            checkpoint.version_number,
            checkpoint.schema_version,
            checkpoint.base.id.as_str(),
        )
    });
    let latest_delta = graph.deltas.iter().map(|delta| {
        (
            delta.version_number,
            delta.schema_version,
            delta.base.id.as_str(),
        )
    });

    if let Some((version, schema_version, id)) = latest_checkpoint.chain(latest_delta).max() {
        graph.latest_version_id = id.to_owned();
        graph.metadata.current_version = version;
        graph.metadata.current_schema_version = schema_version;
    } else {
        graph.latest_version_id.clear();
        graph.metadata.current_version = 0;
    }
}

pub(crate) fn read_checkpoint_data(
    conn: &rusqlite::Connection,
    checkpoint_id: &str,
) -> DbResult<Vec<u8>> {
    if external_file_chunks::table_exists(conn, "checkpoint_data_chunks").map_err(DbError::from)? {
        let data = external_file_chunks::read_checkpoint_data_chunks(conn, checkpoint_id)
            .map_err(chunk_error_to_db)?;
        let (expected_size, storage_key): (Option<i64>, Option<String>) = conn
            .query_row(
                "SELECT size_bytes, storage_key FROM checkpoints WHERE id = ?1",
                [checkpoint_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(DbError::from)?;
        if data.is_empty() && storage_key.is_some() {
            return Err(version_control_error(format!(
                "checkpoint {checkpoint_id} payload is stored externally and is not locally available"
            )));
        }
        validate_payload_size("checkpoint", checkpoint_id, expected_size, data.len())?;
        return Ok(data);
    }

    if external_file_chunks::column_exists(conn, "checkpoints", "data").map_err(DbError::from)? {
        return conn
            .query_row(
                "SELECT data FROM checkpoints WHERE id = ?1",
                [checkpoint_id],
                |row| row.get::<_, Option<Vec<u8>>>(0),
            )
            .map(|data| data.unwrap_or_default())
            .map_err(DbError::from);
    }

    Ok(Vec::new())
}

pub(crate) fn read_delta_changeset(
    conn: &rusqlite::Connection,
    delta_id: &str,
) -> DbResult<Vec<u8>> {
    if external_file_chunks::table_exists(conn, "delta_changeset_chunks").map_err(DbError::from)? {
        let changeset = external_file_chunks::read_delta_changeset_chunks(conn, delta_id)
            .map_err(chunk_error_to_db)?;
        let expected_size: Option<i64> = conn
            .query_row(
                "SELECT size_bytes FROM deltas WHERE id = ?1",
                [delta_id],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;
        validate_payload_size("delta", delta_id, expected_size, changeset.len())?;
        return Ok(changeset);
    }

    if external_file_chunks::column_exists(conn, "deltas", "changeset").map_err(DbError::from)? {
        return conn
            .query_row(
                "SELECT changeset FROM deltas WHERE id = ?1",
                [delta_id],
                |row| row.get::<_, Vec<u8>>(0),
            )
            .map_err(DbError::from);
    }

    Ok(Vec::new())
}

fn validate_payload_size(
    payload_type: &str,
    id: &str,
    expected_size: Option<i64>,
    actual_size: usize,
) -> DbResult<()> {
    let Some(expected_size) = expected_size else {
        return Ok(());
    };
    let actual_size = i64::try_from(actual_size)
        .map_err(|_| version_control_error(format!("{payload_type} {id} payload is too large")))?;
    if expected_size != actual_size {
        return Err(version_control_error(format!(
            "{payload_type} {id} declares {expected_size} payload bytes but stores {actual_size}"
        )));
    }
    Ok(())
}

fn chunk_error_to_db(e: external_file_chunks::ExternalFileChunkError) -> DbError {
    match e {
        external_file_chunks::ExternalFileChunkError::Sqlite(e) => DbError::Rusqlite(e),
        external_file_chunks::ExternalFileChunkError::Io(e) => DbError::Bootstrap(e.to_string()),
        external_file_chunks::ExternalFileChunkError::InvalidData(e) => DbError::Bootstrap(e),
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Compression utilities
// ────────────────────────────────────────────────────────────────────────────

const GZIP_MAGIC: &[u8] = &[0x1f, 0x8b];
const SQLITE_HEADER_MAGIC: &[u8; 16] = b"SQLite format 3\0";

/// Returns true if the buffer starts with the gzip magic header.
#[inline]
fn is_gzip_header(buf: &[u8]) -> bool {
    buf.starts_with(GZIP_MAGIC)
}

#[inline]
fn is_sqlite_header(buf: &[u8]) -> bool {
    buf.len() >= SQLITE_HEADER_MAGIC.len()
        && &buf[..SQLITE_HEADER_MAGIC.len()] == SQLITE_HEADER_MAGIC
}

fn decompress_duc_bytes(compressed: &[u8]) -> DbResult<Vec<u8>> {
    use flate2::read::DeflateDecoder;
    use std::io::Read;

    let mut out = Vec::new();
    if is_gzip_header(compressed) {
        let mut decoder = GzDecoder::new(compressed);
        decoder
            .read_to_end(&mut out)
            .map_err(|e| DbError::Bootstrap(format!("DUC gzip decompression failed: {e}")))?;
    } else {
        let mut decoder = DeflateDecoder::new(compressed);
        decoder
            .read_to_end(&mut out)
            .map_err(|e| DbError::Bootstrap(format!("DUC deflate decompression failed: {e}")))?;
    }
    Ok(out)
}

/// Decompress a changeset payload, auto-detecting gzip vs legacy zlib/deflate.
fn decompress_changeset_payload(compressed: &[u8]) -> DbResult<Vec<u8>> {
    use std::io::Read;

    let mut decompressed = Vec::new();
    if is_gzip_header(compressed) {
        let mut decoder = GzDecoder::new(compressed);
        decoder
            .read_to_end(&mut decompressed)
            .map_err(|e| DbError::Bootstrap(format!("gzip changeset decompression failed: {e}")))?;
    } else {
        // Legacy: zlib-wrapped delta/snapshot (v1/v2/v3).
        let mut decoder = ZlibDecoder::new(compressed);
        decoder
            .read_to_end(&mut decompressed)
            .map_err(|e| DbError::Bootstrap(format!("zlib changeset decompression failed: {e}")))?;
    }
    Ok(decompressed)
}

/// Compress a changeset payload with gzip.
fn compress_changeset_payload(raw: &[u8]) -> DbResult<Vec<u8>> {
    use std::io::Write;

    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(raw)
        .map_err(|e| DbError::Bootstrap(format!("gzip changeset compression failed: {e}")))?;
    encoder
        .finish()
        .map_err(|e| DbError::Bootstrap(format!("gzip changeset finalize failed: {e}")))
}

/// Ensure the input is raw (uncompressed) SQLite bytes.
///
/// `.duc` files produced by the streaming exporters are gzip (or legacy deflate) compressed.
/// This helper transparently inflates them so that fossil delta operates on the
/// raw SQLite pages — producing compact patches. If the input is already
/// raw SQLite, it is returned as-is (zero-copy via `Cow`).
fn ensure_raw_sqlite(buf: &[u8]) -> DbResult<std::borrow::Cow<'_, [u8]>> {
    if is_sqlite_header(buf) {
        Ok(std::borrow::Cow::Borrowed(buf))
    } else {
        let raw = decompress_duc_bytes(buf)?;
        if !is_sqlite_header(&raw) {
            return Err(DbError::Bootstrap(
                "decompressed blob is not a valid SQLite database".into(),
            ));
        }
        Ok(std::borrow::Cow::Owned(raw))
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Fossil delta encoding — checkpoint-relative structural diffing
// ────────────────────────────────────────────────────────────────────────────
//
// Format (v5 — fossil delta):
//   [0x44 'D'][0x46 'F']          – magic bytes ("DF" = Delta Fossil)
//   [0x05]                        – format version
//   [4 bytes LE u32]              – raw SQLite length of new state
//   [remaining bytes]             – gzip-compressed fossil delta
//
// The fossil delta algorithm uses rolling checksums and emits granular
// COPY (reference old bytes) + INSERT (literal new bytes) commands.
// This is far more compact than page-level diffs because a 4KB page
// with 20 changed bytes only stores those 20 bytes, not the full page.
//
// Fallback: if the delta is larger than a gzip-compressed full snapshot,
// the snapshot is stored directly (no magic header → detected by gzip/zlib magic).

/// Magic header identifying a fossil delta changeset.
const DELTA_MAGIC_FOSSIL: [u8; 2] = [0x44, 0x46]; // "DF"
const DELTA_FORMAT_V5: u8 = 5;

/// Header: magic(2) + version(1) + new_len(4) = 7 bytes.
const FOSSIL_HEADER_SIZE: usize = 2 + 1 + 4;

/// Returns `true` if the blob starts with the fossil v5 magic header.
fn is_fossil_format(changeset: &[u8]) -> bool {
    changeset.len() >= FOSSIL_HEADER_SIZE
        && changeset[0] == DELTA_MAGIC_FOSSIL[0]
        && changeset[1] == DELTA_MAGIC_FOSSIL[1]
        && changeset[2] == DELTA_FORMAT_V5
}

/// Compute a checkpoint-relative changeset using fossil delta.
///
/// Both inputs are transparently decompressed to raw SQLite bytes,
/// then a fossil delta is computed and gzip-compressed.
/// Falls back to a full gzip snapshot if the delta isn't smaller.
pub fn create_bsdiff_changeset(base: &[u8], current: &[u8]) -> DbResult<Vec<u8>> {
    let raw_base = ensure_raw_sqlite(base)?;
    let raw_current = ensure_raw_sqlite(current)?;

    // fossil_delta::delta(target, source) — target is what we want to reconstruct,
    // source is what we already have. apply(source, delta) → target.
    let raw_delta = fossil_delta::delta(&raw_current, &raw_base);
    let compressed_delta = compress_changeset_payload(&raw_delta)?;

    let new_len = u32::try_from(raw_current.len())
        .map_err(|_| version_control_error("delta target exceeds the 4 GiB fossil format limit"))?;
    let mut encoded = Vec::with_capacity(FOSSIL_HEADER_SIZE + compressed_delta.len());
    encoded.extend_from_slice(&DELTA_MAGIC_FOSSIL);
    encoded.push(DELTA_FORMAT_V5);
    encoded.extend_from_slice(&new_len.to_le_bytes());
    encoded.extend_from_slice(&compressed_delta);

    // Fallback: full gzip snapshot if delta isn't beneficial
    let snapshot = compress_changeset_payload(&raw_current)?;

    if encoded.len() < snapshot.len() {
        Ok(encoded)
    } else {
        Ok(snapshot)
    }
}

/// Apply a fossil delta changeset to reconstruct the document state.
///
/// `base` is transparently decompressed if compressed.
/// Returns raw (uncompressed) SQLite bytes.
fn apply_fossil_changeset(base: &[u8], changeset: &[u8]) -> DbResult<Vec<u8>> {
    let raw_base = ensure_raw_sqlite(base)?;
    let expected_len = u32::from_le_bytes(
        changeset[3..FOSSIL_HEADER_SIZE]
            .try_into()
            .map_err(|_| version_control_error("fossil delta header is truncated"))?,
    ) as usize;

    let compressed_delta = &changeset[FOSSIL_HEADER_SIZE..];
    let raw_delta = decompress_changeset_payload(compressed_delta)?;

    let result = fossil_delta::apply(&raw_base, &raw_delta)
        .map_err(|e| DbError::Bootstrap(format!("fossil delta apply failed: {e:?}")))?;
    if result.len() != expected_len {
        return Err(version_control_error(format!(
            "fossil delta declared {expected_len} output bytes but reconstructed {}",
            result.len()
        )));
    }
    if !is_sqlite_header(&result) {
        return Err(version_control_error(
            "fossil delta reconstructed a non-SQLite payload",
        ));
    }
    Ok(result)
}

/// Decode a stored changeset.
///
/// Detects fossil delta (v5) by magic header. Anything else is treated as
/// a gzip-compressed full snapshot (fallback).
///
/// Returns raw (uncompressed) SQLite bytes.
pub fn apply_delta_changeset(base_data: &[u8], changeset: &[u8]) -> DbResult<Vec<u8>> {
    if is_fossil_format(changeset) {
        apply_fossil_changeset(base_data, changeset)
    } else if changeset.starts_with(&DELTA_MAGIC_FOSSIL) {
        Err(version_control_error(format!(
            "unsupported fossil delta format version {}",
            changeset.get(2).copied().unwrap_or_default()
        )))
    } else {
        // Snapshot fallback: gzip-compressed full state
        let snapshot = decompress_changeset_payload(changeset)?;
        if !is_sqlite_header(&snapshot) {
            return Err(version_control_error(
                "snapshot changeset decompressed to a non-SQLite payload",
            ));
        }
        Ok(snapshot)
    }
}

/// Generate a nanoid-style ID (22-char URL-safe random string).
fn nanoid() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();

    // Simple base62 encoding of timestamp + random suffix
    let charset: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";
    let mut id = String::with_capacity(21);
    let mut val = now;
    for _ in 0..10 {
        id.push(charset[(val % 64) as usize] as char);
        val /= 64;
    }
    // Add random suffix using a simple hash mix
    val = now
        .wrapping_mul(6364136223846793005)
        .wrapping_add(1442695040888963407);
    for _ in 0..11 {
        id.push(charset[(val % 64) as usize] as char);
        val /= 64;
    }
    id
}

#[cfg(test)]
#[path = "version_control_tests.rs"]
mod tests;
