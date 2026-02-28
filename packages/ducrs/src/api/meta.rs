//! Accessor for the `_meta` key/value table.

use rusqlite::OptionalExtension;

use crate::db::{DbError, DbResult, DucConnection};

/// A short-lived view over the `_meta` table.
pub struct MetaTable<'a> {
    conn: &'a DucConnection,
}

impl<'a> MetaTable<'a> {
    pub(crate) fn new(conn: &'a DucConnection) -> Self {
        Self { conn }
    }

    /// Get a metadata value by `key`, returning `None` if the key is absent.
    pub fn get(&self, key: &str) -> DbResult<Option<String>> {
        self.conn
            .with(|c| {
                c.query_row(
                    "SELECT value FROM _meta WHERE key = ?1",
                    [key],
                    |row| row.get(0),
                )
                .optional()
            })
            .map_err(DbError::from)
    }

    /// Insert or replace a metadata entry.
    pub fn set(&self, key: &str, value: &str) -> DbResult<()> {
        self.conn
            .with(|c| {
                c.execute(
                    "INSERT OR REPLACE INTO _meta (key, value) VALUES (?1, ?2)",
                    [key, value],
                )
            })
            .map(|_| ())
            .map_err(DbError::from)
    }

    /// Remove a metadata entry.  No-op if the key doesn't exist.
    pub fn delete(&self, key: &str) -> DbResult<()> {
        self.conn
            .with(|c| c.execute("DELETE FROM _meta WHERE key = ?1", [key]))
            .map(|_| ())
            .map_err(DbError::from)
    }

    /// Return all key/value pairs.
    pub fn all(&self) -> DbResult<Vec<(String, String)>> {
        self.conn
            .with(|c| -> rusqlite::Result<Vec<(String, String)>> {
                let mut stmt = c.prepare("SELECT key, value FROM _meta ORDER BY key")?;
                let rows: rusqlite::Result<Vec<(String, String)>> =
                    stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?.collect();
                rows
            })
            .map_err(DbError::from)
    }
}
