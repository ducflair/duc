//! Native (non-WASM) storage backend.
//!
//! Uses the standard `rusqlite` file VFS — no extra dependencies.

use std::path::Path;

use rusqlite::Connection;

use crate::db::{bootstrap, DbResult, DucConnection};

/// Open or create a `.duc` SQLite file at `path`.
pub(crate) fn open_file(path: impl AsRef<Path>) -> DbResult<DucConnection> {
    let conn = Connection::open(path)?;
    bootstrap::bootstrap(&conn)?;
    Ok(DucConnection(conn))
}

/// Open a private in-memory `.duc` database.
pub(crate) fn open_memory() -> DbResult<DucConnection> {
    let conn = Connection::open_in_memory()?;
    bootstrap::bootstrap(&conn)?;
    Ok(DucConnection(conn))
}
