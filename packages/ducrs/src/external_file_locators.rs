//! Optional locator metadata is separate from embedded revision bytes.
use std::collections::HashMap;
use rusqlite::{Connection, Transaction, params};
use crate::types::{DucExternalFile, ExternalFileLocator};

pub(crate) fn write(tx: &Transaction, files: &Option<HashMap<String, DucExternalFile>>) -> rusqlite::Result<()> {
    tx.execute_batch("CREATE TABLE IF NOT EXISTS external_file_locators (revision_id TEXT PRIMARY KEY REFERENCES external_file_revisions(id) ON DELETE CASCADE, locator TEXT NOT NULL CHECK(json_valid(locator))); DELETE FROM external_file_locators;")?;
    if let Some(files) = files {
        for file in files.values() {
            for revision in file.revisions.values() {
                if let Some(locator) = &revision.locator {
                    tx.execute("INSERT INTO external_file_locators (revision_id, locator) VALUES (?1, ?2)", params![revision.id, serde_json::to_string(locator).unwrap()])?;
                }
            }
        }
    }
    Ok(())
}

pub(crate) fn read(conn: &Connection, files: &mut Option<HashMap<String, DucExternalFile>>) -> rusqlite::Result<()> {
    let exists: i64 = conn.query_row("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='external_file_locators'", [], |row| row.get(0))?;
    if exists == 0 { return Ok(()) }
    let Some(files) = files else { return Ok(()) };
    let mut statement = conn.prepare("SELECT revision_id, locator FROM external_file_locators")?;
    let rows = statement.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))?;
    for row in rows {
        let (revision_id, json) = row?;
        let locator: ExternalFileLocator = serde_json::from_str(&json).map_err(|error| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(error)))?;
        for file in files.values_mut() {
            if let Some(revision) = file.revisions.get_mut(&revision_id) { revision.locator = Some(locator.clone()); }
        }
    }
    Ok(())
}
