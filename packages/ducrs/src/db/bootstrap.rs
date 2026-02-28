//! Schema bootstrap — applies `schema/duc.sql` to a fresh connection.
//!
//! Called by both `native` and `wasm` backends after opening a connection.
//! The canonical schema lives at `duc.sql` in the workspace root; it is
//! embedded at compile time so the binary carries no file-system dependency.

use rusqlite::Connection;

use crate::db::DbError;

/// Canonical schemas, embedded at compile time.
/// `build.rs` copies them into `OUT_DIR` so this works both in-tree and from sdists.
/// Applied in order: duc.sql → version_control.sql → search.sql
const DUC_SCHEMA: &str = include_str!(concat!(env!("OUT_DIR"), "/duc.sql"));
const VERSION_CONTROL_SCHEMA: &str = include_str!(concat!(env!("OUT_DIR"), "/version_control.sql"));
const SEARCH_SCHEMA: &str = include_str!(concat!(env!("OUT_DIR"), "/search.sql"));

/// Expected `application_id` written by `duc.sql`.
const APP_ID: i64 = 1_146_569_567; // "DUC_" in ASCII

/// Per-connection PRAGMAs that must be re-applied on every open (they are
/// either ephemeral or take effect only after the first statement on the
/// connection).
#[cfg(not(all(target_family = "wasm", target_os = "unknown")))]
const CONN_PRAGMAS: &str = "
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys  = ON;
";

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
const CONN_PRAGMAS: &str = "
    PRAGMA journal_mode = MEMORY;
    PRAGMA foreign_keys  = ON;
";

/// Apply the full schema to `conn` if it is a new (empty) database, then
/// always re-apply the per-connection PRAGMAs.
///
/// Safe to call multiple times on an already-bootstrapped database — it
/// will only run the DDL once.
pub(crate) fn bootstrap(conn: &Connection) -> Result<(), DbError> {
    let user_version: i64 = conn.pragma_query_value(None, "user_version", |r| r.get(0))?;

    if user_version == 0 {
        // New database — apply schemas in order.
        conn.execute_batch(DUC_SCHEMA)
            .map_err(|e| DbError::Bootstrap(format!("duc.sql apply failed: {e}")))?;
        conn.execute_batch(VERSION_CONTROL_SCHEMA)
            .map_err(|e| DbError::Bootstrap(format!("version_control.sql apply failed: {e}")))?;
        conn.execute_batch(SEARCH_SCHEMA)
            .map_err(|e| DbError::Bootstrap(format!("search.sql apply failed: {e}")))?;

        // Verify the schema set the expected application_id.
        let app_id: i64 = conn.pragma_query_value(None, "application_id", |r| r.get(0))?;
        if app_id != APP_ID {
            return Err(DbError::Bootstrap(format!(
                "unexpected application_id after bootstrap: {app_id} (expected {APP_ID})"
            )));
        }
    } else {
        // Existing database — just ensure per-connection pragmas are active.
        conn.execute_batch(CONN_PRAGMAS)
            .map_err(|e| DbError::Bootstrap(format!("pragma apply failed: {e}")))?;
    }

    Ok(())
}
