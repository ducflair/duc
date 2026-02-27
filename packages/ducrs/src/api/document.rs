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

    // ── Sub-tables ────────────────────────────────────────────────────────────

    /// Access the `_meta` key/value table for this document.
    pub fn meta(&self) -> MetaTable<'_> {
        MetaTable::new(&self.conn)
    }

    /// Access version-control operations for this document.
    pub fn version_control(&self) -> VersionControl<'_> {
        VersionControl::new(&self.conn)
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    /// Retrieve the schema version stored in `PRAGMA user_version`.
    pub fn schema_version(&self) -> DbResult<i64> {
        self.conn
            .with(|c| c.pragma_query_value(None, "user_version", |r| r.get(0)))
            .map_err(DbError::from)
    }

    /// Consume the document and return the raw [`DucConnection`] (escape hatch).
    pub fn into_connection(self) -> DucConnection {
        self.conn
    }
}
