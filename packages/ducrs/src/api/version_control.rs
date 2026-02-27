//! Version-graph restore & mutation API over a `DucConnection`.
//!
//! Provides high-level operations for:
//! - Restoring document state at any version (checkpoint or delta replay)
//! - Creating new checkpoints and deltas
//! - Listing version history
//! - Pruning old versions
//!
//! All operations work directly against the embedded SQLite schema
//! (`version_control.sql`) and produce/consume the canonical Rust types
//! from `crate::types`.

use flate2::read::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use rusqlite::OptionalExtension;
use std::io::{Read, Write};
use std::os::raw::c_char;

use crate::db::{DbError, DbResult, DucConnection};
use crate::types::{
    Checkpoint, Delta, SchemaMigration, VersionBase, VersionChain, VersionGraph,
    VersionGraphMetadata,
};

/// The current version-control schema version.
///
/// This is generated at build time from `schema/duc.sql` (`PRAGMA user_version`).
/// TypeScript reads this value via the WASM binding `getCurrentSchemaVersion()`.
pub const CURRENT_SCHEMA_VERSION: i32 = include!(concat!(env!("OUT_DIR"), "/schema_user_version.rs"));

/// Open a `.duc` byte buffer as a `DucConnection` for read operations.
///
/// Uses `sqlite3_deserialize` to load bytes into an in-memory connection,
/// avoiding filesystem operations that would trap in WASM.
pub fn open_duc_bytes(buf: &[u8]) -> DbResult<DucConnection> {
    use rusqlite::Connection;

    let conn = Connection::open_in_memory()
        .map_err(DbError::Rusqlite)?;

    let n = buf.len();
    if n == 0 {
        return Err(DbError::Bootstrap("empty .duc buffer".into()));
    }

    let db_name = b"main\0";
    let mem = unsafe { rusqlite::ffi::sqlite3_malloc64(n as u64) as *mut u8 };
    if mem.is_null() {
        return Err(DbError::Bootstrap("sqlite3_malloc64 failed".into()));
    }

    unsafe {
        std::ptr::copy_nonoverlapping(buf.as_ptr(), mem, n);
    }

    let flags = rusqlite::ffi::SQLITE_DESERIALIZE_FREEONCLOSE as u32;
    let rc = unsafe {
        rusqlite::ffi::sqlite3_deserialize(
            conn.handle(),
            db_name.as_ptr() as *const c_char,
            mem,
            n as i64,
            n as i64,
            flags,
        )
    };

    if rc != rusqlite::ffi::SQLITE_OK {
        unsafe { rusqlite::ffi::sqlite3_free(mem as *mut std::ffi::c_void) };
        return Err(DbError::Bootstrap(format!(
            "sqlite3_deserialize failed with code {rc}"
        )));
    }

    conn.execute_batch("PRAGMA journal_mode = MEMORY; PRAGMA foreign_keys = ON;")
        .map_err(|e| DbError::Bootstrap(format!("pragma apply failed: {e}")))?;

    Ok(DucConnection::from_inner(conn))
}

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
    /// Algorithm (matches the SQL schema comments):
    /// 1. If a checkpoint exists at that version → return its `data` directly.
    /// 2. Otherwise find the nearest checkpoint with `version_number <= target`
    ///    in the same schema version, then replay deltas sequentially.
    pub fn restore_version(&self, version_number: i64) -> DbResult<RestoredVersion> {
        self.conn.with(|c| {
            // 1) Try direct checkpoint hit
            let direct: Option<(Vec<u8>, i32)> = c
                .query_row(
                    "SELECT data, schema_version FROM checkpoints
                     WHERE version_number = ?1",
                    [version_number],
                    |row| {
                        let data: Vec<u8> = row.get(0)?;
                        let sv: i32 = row.get(1)?;
                        Ok((data, sv))
                    },
                )
                .optional()
                .map_err(DbError::from)?;

            if let Some((data, schema_version)) = direct {
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

            // 3) Load the base checkpoint
            let base_data: Vec<u8> = c
                .query_row(
                    "SELECT data FROM checkpoints WHERE id = ?1",
                    [&target_base_cp_id],
                    |row| row.get(0),
                )
                .map_err(DbError::from)?;

            let base_cp_version: i64 = c
                .query_row(
                    "SELECT version_number FROM checkpoints WHERE id = ?1",
                    [&target_base_cp_id],
                    |row| row.get(0),
                )
                .map_err(DbError::from)?;

            // 4) Collect and replay deltas from base_checkpoint up to target version
            let mut stmt = c
                .prepare(
                    "SELECT changeset FROM deltas
                     WHERE base_checkpoint_id = ?1
                       AND schema_version = ?2
                       AND version_number > ?3
                       AND version_number <= ?4
                     ORDER BY delta_sequence ASC",
                )
                .map_err(DbError::from)?;

            let delta_payloads: Vec<Vec<u8>> = stmt
                .query_map(
                    rusqlite::params![target_base_cp_id, target_sv, base_cp_version, version_number],
                    |row| row.get::<_, Vec<u8>>(0),
                )
                .map_err(DbError::from)?
                .collect::<Result<Vec<_>, _>>()
                .map_err(DbError::from)?;

            // 5) Apply deltas sequentially. Each delta payload is zlib-compressed.
            //    The application-level delta format is opaque — the caller is
            //    responsible for interpreting the bytes. What we do here is
            //    decompress each payload and return the *final* state.
            //
            //    For snapshot-based deltas (our current model), each delta
            //    payload IS the full state at that version (compressed).
            //    So we just need the *last* payload.
            let final_data = if let Some(last_changeset) = delta_payloads.last() {
                decompress_zlib(last_changeset)?
            } else {
                base_data
            };

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
            let (data, version_number, schema_version): (Vec<u8>, i64, i32) = c
                .query_row(
                    "SELECT data, version_number, schema_version FROM checkpoints WHERE id = ?1",
                    [checkpoint_id],
                    |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
                )
                .map_err(DbError::from)?;

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
        self.conn.with(|c| {
            read_version_graph_inner(c)
        })
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
                        last_pruned, total_size
                 FROM version_graph WHERE id = 1",
                [],
                |row| {
                    Ok(VersionGraphMetadata {
                        current_version: row.get(0)?,
                        current_schema_version: row.get(1)?,
                        chain_count: row.get(2)?,
                        last_pruned: row.get::<_, Option<i64>>(3)?.unwrap_or(0),
                        total_size: row.get::<_, Option<i64>>(4)?.unwrap_or(0),
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
            self.maybe_migrate_schema(c, checkpoint.schema_version)?;
            let chain_id = self.resolve_chain_id(c, checkpoint.schema_version)?;

            c.execute(
                "INSERT OR REPLACE INTO checkpoints
                    (id, parent_id, chain_id, version_number, schema_version,
                     timestamp, description, is_manual_save, is_schema_boundary,
                     user_id, data, size_bytes)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
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
                    checkpoint.data,
                    checkpoint.size_bytes,
                ],
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
    }

    /// Insert a new delta into the database and update the version graph
    /// singleton row.
    ///
    /// If the delta's `schema_version` is higher than the stored
    /// `current_schema_version`, the migration bookkeeping is performed
    /// automatically.
    pub fn create_delta(&self, delta: &Delta) -> DbResult<()> {
        self.conn.with(|c| {
            self.maybe_migrate_schema(c, delta.schema_version)?;
            let chain_id = self.resolve_chain_id(c, delta.schema_version)?;

            // Compute delta_sequence within the base checkpoint group
            let delta_sequence: i64 = c
                .query_row(
                    "SELECT COALESCE(MAX(delta_sequence), 0) + 1
                     FROM deltas WHERE base_checkpoint_id = ?1",
                    [&delta.base_checkpoint_id],
                    |row| row.get(0),
                )
                .map_err(DbError::from)?;

            // Compress the payload with zlib before storing
            let compressed = compress_zlib(&delta.payload)?;

            c.execute(
                "INSERT OR REPLACE INTO deltas
                    (id, parent_id, base_checkpoint_id, chain_id, delta_sequence,
                     version_number, schema_version, timestamp, description,
                     is_manual_save, user_id, changeset, size_bytes)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
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
                    compressed,
                    delta.size_bytes,
                ],
            )
            .map_err(DbError::from)?;

            self.update_version_graph_pointer(
                c,
                &delta.base.id,
                delta.version_number,
                delta.schema_version,
            )?;

            Ok(())
        })
    }

    /// Set the user-designated checkpoint version id.
    pub fn set_user_checkpoint(&self, version_id: &str) -> DbResult<()> {
        self.conn.with(|c| {
            c.execute(
                "UPDATE version_graph SET user_checkpoint_version_id = ?1 WHERE id = 1",
                [version_id],
            )
            .map(|_| ())
            .map_err(DbError::from)
        })
    }

    // ────────────────────────────────────────────────────────────────────────
    // WRITE — Pruning
    // ────────────────────────────────────────────────────────────────────────

    /// Prune old deltas that precede the given `keep_after_version`.
    /// Checkpoints are never pruned (they are self-contained recovery points).
    /// Returns the number of deltas removed.
    pub fn prune_deltas_before(&self, keep_after_version: i64) -> DbResult<usize> {
        self.conn.with(|c| {
            let removed = c
                .execute(
                    "DELETE FROM deltas WHERE version_number < ?1",
                    [keep_after_version],
                )
                .map_err(DbError::from)?;

            // Update last_pruned timestamp
            let now_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as i64;

            c.execute(
                "UPDATE version_graph SET last_pruned = ?1 WHERE id = 1",
                [now_ms],
            )
            .map_err(DbError::from)?;

            // Recalculate total_size
            self.recalculate_total_size(c)?;

            Ok(removed)
        })
    }

    /// Remove ALL versions (checkpoints + deltas) that are strictly older than
    /// `keep_after_version`, except the most recent checkpoint before that
    /// boundary (needed as a recovery base).
    pub fn prune_before(&self, keep_after_version: i64) -> DbResult<usize> {
        self.conn.with(|c| {
            // Find the latest checkpoint at or before the boundary — keep it
            let safe_cp_version: Option<i64> = c
                .query_row(
                    "SELECT MAX(version_number) FROM checkpoints
                     WHERE version_number <= ?1",
                    [keep_after_version],
                    |row| row.get(0),
                )
                .optional()
                .map_err(DbError::from)?
                .flatten();

            let safe_version = safe_cp_version.unwrap_or(0);

            // Delete deltas before the safe checkpoint
            let del_deltas = c
                .execute(
                    "DELETE FROM deltas WHERE version_number < ?1",
                    [safe_version],
                )
                .map_err(DbError::from)?;

            // Delete checkpoints before the safe checkpoint (keep the safe one)
            let del_cps = c
                .execute(
                    "DELETE FROM checkpoints WHERE version_number < ?1",
                    [safe_version],
                )
                .map_err(DbError::from)?;

            let now_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as i64;

            c.execute(
                "UPDATE version_graph SET last_pruned = ?1 WHERE id = 1",
                [now_ms],
            )
            .map_err(DbError::from)?;

            self.recalculate_total_size(c)?;

            Ok(del_deltas + del_cps)
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
            // Delete all deltas newer than the target
            c.execute(
                "DELETE FROM deltas WHERE version_number > ?1",
                [target_version],
            )
            .map_err(DbError::from)?;

            // Delete all checkpoints newer than the target
            c.execute(
                "DELETE FROM checkpoints WHERE version_number > ?1",
                [target_version],
            )
            .map_err(DbError::from)?;

            // Find the id of the version at target_version
            let version_id: String = c
                .query_row(
                    "SELECT id FROM checkpoints WHERE version_number = ?1
                     UNION ALL
                     SELECT id FROM deltas WHERE version_number = ?1
                     LIMIT 1",
                    [target_version],
                    |row| row.get(0),
                )
                .map_err(DbError::from)?;

            // Update pointers
            c.execute(
                "UPDATE version_graph
                 SET current_version = ?1,
                     latest_version_id = ?2
                 WHERE id = 1",
                rusqlite::params![target_version, version_id],
            )
            .map_err(DbError::from)?;

            self.recalculate_total_size(c)?;

            Ok(())
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
             SET current_version = MAX(current_version, ?1),
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
                let start_version: i64 = c
                    .query_row(
                        "SELECT COALESCE(MAX(version_number), 0) FROM checkpoints
                         UNION ALL
                         SELECT COALESCE(MAX(version_number), 0) FROM deltas",
                        [],
                        |row| row.get(0),
                    )
                    .unwrap_or(0);

                c.execute(
                    "INSERT INTO version_chains (id, schema_version, start_version)
                     VALUES (?1, ?2, ?3)",
                    rusqlite::params![new_id, schema_version, start_version],
                )
                .map_err(DbError::from)?;

                // Update chain_count
                c.execute(
                    "UPDATE version_graph SET chain_count = chain_count + 1 WHERE id = 1",
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
    ) -> DbResult<()> {
        let current_sv: i32 = c
            .query_row(
                "SELECT current_schema_version FROM version_graph WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;

        if new_schema_version <= current_sv {
            return Ok(());
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

        c.execute(
            "INSERT OR IGNORE INTO schema_migrations
                (from_schema_version, to_schema_version, migration_name, applied_at)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![
                current_sv,
                new_schema_version,
                format!("auto_migration_v{}_to_v{}", current_sv, new_schema_version),
                now_ms,
            ],
        )
        .map_err(DbError::from)?;

        log::info!(
            "Schema migration: {} → {} (closed old chains, recorded migration)",
            current_sv,
            new_schema_version
        );

        Ok(())
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
                    latest_version_id, chain_count, last_pruned, total_size
             FROM version_graph WHERE id = 1",
        )
        .map_err(DbError::from)?;

    let (metadata, user_cp_id, latest_id) = match vg_stmt.query_row([], |row| {
        Ok((
            VersionGraphMetadata {
                current_version: row.get(0)?,
                current_schema_version: row.get(1)?,
                chain_count: row.get(4)?,
                last_pruned: row.get::<_, Option<i64>>(5)?.unwrap_or(0),
                total_size: row.get::<_, Option<i64>>(6)?.unwrap_or(0),
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
        .unwrap_or_default();

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
                    description, is_manual_save, is_schema_boundary, user_id, data, size_bytes
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
                data: row.get::<_, Option<Vec<u8>>>(9)?.unwrap_or_default(),
                size_bytes: row.get::<_, Option<i64>>(10)?.unwrap_or(0),
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    // Deltas
    let mut d_stmt = conn
        .prepare(
            "SELECT id, parent_id, base_checkpoint_id, version_number, schema_version,
                    timestamp, description, is_manual_save, user_id, changeset, size_bytes
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
                payload: row.get::<_, Option<Vec<u8>>>(9)?.unwrap_or_default(),
                size_bytes: row.get::<_, Option<i64>>(10)?.unwrap_or(0),
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

// ────────────────────────────────────────────────────────────────────────────
// Compression utilities
// ────────────────────────────────────────────────────────────────────────────

/// Decompress a zlib-compressed blob.
fn decompress_zlib(compressed: &[u8]) -> DbResult<Vec<u8>> {
    let mut decoder = ZlibDecoder::new(compressed);
    let mut decompressed = Vec::new();
    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| DbError::Bootstrap(format!("zlib decompression failed: {e}")))?;
    Ok(decompressed)
}

/// Compress a blob with zlib.
fn compress_zlib(data: &[u8]) -> DbResult<Vec<u8>> {
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(data)
        .map_err(|e| DbError::Bootstrap(format!("zlib compression failed: {e}")))?;
    encoder
        .finish()
        .map_err(|e| DbError::Bootstrap(format!("zlib compression finish failed: {e}")))
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
    val = now.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
    for _ in 0..11 {
        id.push(charset[(val % 64) as usize] as char);
        val /= 64;
    }
    id
}
