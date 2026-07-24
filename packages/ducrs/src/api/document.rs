//! `DucDocument` — the main entry-point for opening and manipulating `.duc` files.
//!
//! # Native example
//! ```no_run
//! use duc::api::DucDocument;
//!
//! let doc = DucDocument::open("drawing.duc")?;
//! let title = doc.meta().get("title")?;
//! # Ok::<(), duc::db::DbError>(())
//! ```
//!
//! # WASM example (inside a Dedicated Worker)
//! ```ignore
//! use duc::api::DucDocument;
//!
//! let doc = DucDocument::open_opfs("drawing.duc").await?;
//! ```

use crate::{
    api::meta::MetaTable,
    api::version_control::VersionControl,
    db::{DbError, DbResult, DucConnection},
    external_file_chunks,
    parse::{self, ParseResult},
    serialize::{self, SerializeResult},
    types::{ExportedDataState, ExternalFileMeta},
};

/// A live handle to an open `.duc` SQLite database.
///
/// Dropping this struct closes the underlying connection.
pub struct DucDocument {
    conn: DucConnection,
}

impl DucDocument {
    // ── Constructors ─────────────────────────────────────────────────────────

    /// Open or create a `.duc` file on the native file-system.
    #[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
    pub fn open(path: impl AsRef<std::path::Path>) -> DbResult<Self> {
        let conn = crate::db::open_file(path)?;
        Ok(Self { conn })
    }

    /// Open a private in-memory `.duc` database (native or WASM).
    pub fn open_memory() -> DbResult<Self> {
        let conn = crate::db::open_memory()?;
        Ok(Self { conn })
    }

    /// Open or create a persistent OPFS-backed `.duc` database (WASM only).
    ///
    /// Must be called from a Dedicated Worker.
    #[cfg(all(target_family = "wasm", target_os = "unknown", feature = "opfs"))]
    pub async fn open_opfs(name: &str) -> DbResult<Self> {
        let conn = crate::db::open_file_opfs(name).await?;
        Ok(Self { conn })
    }

    /// Open an OPFS document in an isolated SAH-pool namespace. Separate
    /// workers must use separate namespaces because SyncAccessHandles are
    /// exclusive to the worker which acquired them.
    #[cfg(all(target_family = "wasm", target_os = "unknown", feature = "opfs"))]
    pub async fn open_opfs_in_namespace(name: &str, namespace: &str) -> DbResult<Self> {
        let conn = crate::db::open_file_opfs_in_namespace(name, namespace).await?;
        Ok(Self { conn })
    }

    // ── Sub-tables ────────────────────────────────────────────────────────────

    /// Access the `_meta` key/value table for this document.
    pub fn meta(&self) -> MetaTable<'_> {
        MetaTable::new(&self.conn)
    }

    /// Access version-control operations for this document.
    pub fn version_control(&self) -> VersionControl<'_> {
        VersionControl::new(&self.conn)
    }

    /// Read the document state from the open SQLite document.
    pub fn read_document_state(&self) -> ParseResult<ExportedDataState> {
        self.conn
            .with(|conn| parse::read_document_state_from_connection(conn))
    }

    /// List external file metadata without reading revision bytes.
    pub fn list_external_files(&self) -> ParseResult<Vec<ExternalFileMeta>> {
        self.conn
            .with(|conn| parse::list_external_files_from_connection(conn))
    }

    /// Read one chunk of an external file revision.
    pub fn read_external_file_revision_chunk(
        &self,
        revision_id: &str,
        chunk_index: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.conn.with(|conn| {
            if external_file_chunks::table_exists(conn, "external_file_revision_chunks")? {
                return Ok(external_file_chunks::read_revision_chunk(
                    conn,
                    revision_id,
                    chunk_index,
                )?);
            }
            Ok(None)
        })
    }

    /// Read a bounded batch of consecutive chunks for an external file revision.
    pub fn read_external_file_revision_chunks(
        &self,
        revision_id: &str,
        start_chunk_index: i64,
        max_chunks: i64,
    ) -> ParseResult<Vec<Vec<u8>>> {
        self.conn.with(|conn| {
            if external_file_chunks::table_exists(conn, "external_file_revision_chunks")? {
                return Ok(external_file_chunks::read_revision_chunk_batch(
                    conn,
                    revision_id,
                    start_chunk_index,
                    max_chunks,
                )?);
            }
            Ok(Vec::new())
        })
    }

    /// Read a bounded byte range without materializing an entire legacy BLOB.
    pub fn read_external_file_revision_range(
        &self,
        revision_id: &str,
        offset_bytes: i64,
        length_bytes: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.conn.with(|conn| {
            if external_file_chunks::table_exists(conn, "external_file_revision_chunks")? {
                return Ok(external_file_chunks::read_revision_range(
                    conn,
                    revision_id,
                    offset_bytes,
                    length_bytes,
                )?);
            }
            Ok(None)
        })
    }

    /// Read one chunk of checkpoint data.
    pub fn read_checkpoint_data_chunk(
        &self,
        checkpoint_id: &str,
        chunk_index: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.conn.with(|conn| {
            if external_file_chunks::table_exists(conn, "checkpoint_data_chunks")? {
                return Ok(external_file_chunks::read_checkpoint_data_chunk(
                    conn,
                    checkpoint_id,
                    chunk_index,
                )?);
            }
            Ok(None)
        })
    }

    /// Read one chunk of delta changeset data.
    pub fn read_delta_changeset_chunk(
        &self,
        delta_id: &str,
        chunk_index: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.conn.with(|conn| {
            if external_file_chunks::table_exists(conn, "delta_changeset_chunks")? {
                return Ok(external_file_chunks::read_delta_changeset_chunk(
                    conn,
                    delta_id,
                    chunk_index,
                )?);
            }
            Ok(None)
        })
    }

    /// Replace the open SQLite document contents with the provided state.
    pub fn write_document_state(&mut self, state: &ExportedDataState) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            serialize::write_state_to_connection(
                conn,
                state,
                crate::external_file_chunks::DEFAULT_EXTERNAL_FILE_CHUNK_SIZE,
            )
        })
    }

    /// Clear existing chunks for an external file revision before streaming replacements.
    pub fn clear_external_file_revision_chunks(
        &mut self,
        revision_id: &str,
    ) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            external_file_chunks::delete_revision_chunks_on_connection(conn, revision_id)?;
            Ok(())
        })
    }

    /// Write one chunk for an external file revision.
    pub fn write_external_file_revision_chunk(
        &mut self,
        revision_id: &str,
        chunk_index: i64,
        offset_bytes: i64,
        data: &[u8],
    ) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            external_file_chunks::write_revision_chunk_on_connection(
                conn,
                revision_id,
                chunk_index,
                offset_bytes,
                data,
            )?;
            Ok(())
        })
    }

    /// Clear existing chunks for a checkpoint before streaming replacements.
    pub fn clear_checkpoint_data_chunks(&mut self, checkpoint_id: &str) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            external_file_chunks::delete_checkpoint_data_chunks_on_connection(conn, checkpoint_id)?;
            Ok(())
        })
    }

    /// Write one checkpoint data chunk.
    pub fn write_checkpoint_data_chunk(
        &mut self,
        checkpoint_id: &str,
        chunk_index: i64,
        offset_bytes: i64,
        data: &[u8],
    ) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            external_file_chunks::write_checkpoint_data_chunk_on_connection(
                conn,
                checkpoint_id,
                chunk_index,
                offset_bytes,
                data,
            )?;
            Ok(())
        })
    }

    /// Clear existing chunks for a delta before streaming replacements.
    pub fn clear_delta_changeset_chunks(&mut self, delta_id: &str) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            external_file_chunks::delete_delta_changeset_chunks_on_connection(conn, delta_id)?;
            Ok(())
        })
    }

    /// Write one delta changeset chunk.
    pub fn write_delta_changeset_chunk(
        &mut self,
        delta_id: &str,
        chunk_index: i64,
        offset_bytes: i64,
        data: &[u8],
    ) -> SerializeResult<()> {
        self.conn.with_mut(|conn| {
            external_file_chunks::write_delta_changeset_chunk_on_connection(
                conn,
                delta_id,
                chunk_index,
                offset_bytes,
                data,
            )?;
            Ok(())
        })
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    /// Retrieve the schema version stored in `PRAGMA user_version`.
    pub fn schema_version(&self) -> DbResult<i64> {
        self.conn
            .with(|c| c.pragma_query_value(None, "user_version", |r| r.get(0)))
            .map_err(DbError::from)
    }

    /// Run `PRAGMA wal_checkpoint(TRUNCATE)` to flush the WAL journal
    /// into the main database file so the file is in a consistent state
    /// for external readers.
    pub fn checkpoint_wal(&self) -> DbResult<()> {
        self.conn.with(|c| {
            c.pragma_update(None, "wal_checkpoint", "TRUNCATE")
                .map_err(DbError::from)
        })
    }

    /// Return the estimated database file size in bytes, computed as
    /// `page_count * page_size`.  After [`checkpoint_wal`] this is a
    /// good approximation of the on-disk file size.
    pub fn db_size_bytes(&self) -> DbResult<i64> {
        self.conn.with(|c| {
            let page_count: i64 = c
                .pragma_query_value(None, "page_count", |r| r.get(0))
                .map_err(DbError::from)?;
            let page_size: i64 = c
                .pragma_query_value(None, "page_size", |r| r.get(0))
                .map_err(DbError::from)?;
            Ok(page_count * page_size)
        })
    }

    /// Execute an arbitrary SQL batch (e.g. `VACUUM INTO '...'`).
    pub fn execute_batch(&self, sql: &str) -> DbResult<()> {
        self.conn
            .with(|c| c.execute_batch(sql).map_err(DbError::from))
    }

    /// Consume the document and return the raw [`DucConnection`] (escape hatch).
    pub fn into_connection(self) -> DucConnection {
        self.conn
    }
}
