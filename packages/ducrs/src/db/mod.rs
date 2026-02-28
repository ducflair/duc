//! Storage layer — target-transparent SQLite access.
//!
//! Call [`open_file`] or [`open_memory`] instead of calling `rusqlite::Connection`
//! directly. Internally they dispatch to the correct backend for each compile target.

mod bootstrap;

#[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
mod native;

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
mod wasm;

use rusqlite::Connection;
#[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
use std::path::Path;
use thiserror::Error;

/// Unified error type for the storage layer.
#[derive(Debug, Error)]
pub enum DbError {
    #[error("rusqlite error: {0}")]
    Rusqlite(#[from] rusqlite::Error),

    #[error("bootstrap error: {0}")]
    Bootstrap(String),

    #[cfg(all(target_family = "wasm", target_os = "unknown", feature = "opfs"))]
    #[error("OPFS/SAH-pool error: {0}")]
    Opfs(String),
}

pub type DbResult<T> = Result<T, DbError>;

/// A fully-initialized [`rusqlite::Connection`] with schema applied.
///
/// All call sites receive this type regardless of platform; the internals
/// differ per target through the `native` / `wasm` backend modules.
pub struct DucConnection(pub(crate) Connection);

impl DucConnection {
    /// Run a closure with the inner [`rusqlite::Connection`].
    pub fn with<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&Connection) -> R,
    {
        f(&self.0)
    }

    /// Consume and return the inner connection (escape hatch).
    pub fn into_inner(self) -> Connection {
        self.0
    }

    /// Open an existing `.duc` file by path without applying bootstrap.
    /// Useful for read-only operations against an already-bootstrapped database.
    pub fn open_raw(path: &str) -> DbResult<Self> {
        let conn = Connection::open(path).map_err(DbError::from)?;
        #[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
        conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")
            .map_err(|e| DbError::Bootstrap(format!("pragma apply failed: {e}")))?;
        #[cfg(all(target_family = "wasm", target_os = "unknown"))]
        conn.execute_batch("PRAGMA journal_mode = MEMORY; PRAGMA foreign_keys = ON;")
            .map_err(|e| DbError::Bootstrap(format!("pragma apply failed: {e}")))?;
        Ok(Self(conn))
    }

    /// Wrap an existing `Connection` into a `DucConnection` (escape hatch).
    pub fn from_inner(conn: Connection) -> Self {
        Self(conn)
    }
}

// ── Native entry-points (synchronous) ────────────────────────────────────────

/// Open (or create) a `.duc` file at `path` on non-WASM targets.
///
/// The schema is applied automatically if the database is new.
#[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
pub fn open_file(path: impl AsRef<Path>) -> DbResult<DucConnection> {
    native::open_file(path)
}

/// Open an in-memory `.duc` database on non-WASM targets.
#[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
pub fn open_memory() -> DbResult<DucConnection> {
    native::open_memory()
}

// ── WASM entry-points (async) ─────────────────────────────────────────────────

/// Open (or create) a persistent `.duc` file backed by OPFS (SAH pool) in the browser.
///
/// **Must be called from a Dedicated Worker**, not from the main thread,
/// because SAH-pool VFS uses `FileSystemSyncAccessHandle` which is worker-only.
///
/// ```no_run
/// // inside a wasm_bindgen_futures::spawn_local / #[wasm_bindgen] async fn
/// let conn = duc::db::open_file_opfs("project.duc").await?;
/// ```
#[cfg(all(target_family = "wasm", target_os = "unknown", feature = "opfs"))]
pub async fn open_file_opfs(name: &str) -> DbResult<DucConnection> {
    wasm::open_file_opfs(name).await
}

/// Open a transient in-memory `.duc` database in WASM (no persistence).
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
pub fn open_memory() -> DbResult<DucConnection> {
    wasm::open_memory()
}

// ── Compact variant (all targets) ────────────────────────────────────────────

/// Open an in-memory `.duc` database with `page_size = 1024`,
/// optimized for minimal serialization output size.
pub fn open_memory_compact() -> DbResult<DucConnection> {
    let conn = Connection::open_in_memory()?;
    conn.execute_batch("PRAGMA page_size = 1024;")
        .map_err(|e| DbError::Bootstrap(format!("page_size pragma: {e}")))?;
    bootstrap::bootstrap(&conn)?;
    Ok(DucConnection(conn))
}
