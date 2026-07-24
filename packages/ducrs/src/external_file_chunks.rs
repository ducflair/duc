use rusqlite::{params, Connection, Transaction};
use std::io::{Read, Write};

pub const DEFAULT_EXTERNAL_FILE_CHUNK_SIZE: usize = 8 * 1024 * 1024;
pub const MIN_EXTERNAL_FILE_CHUNK_SIZE: usize = 4 * 1024 * 1024;
pub const MAX_EXTERNAL_FILE_CHUNK_SIZE: usize = 16 * 1024 * 1024;
pub const MAX_EXTERNAL_FILE_RANGE_SIZE: i64 = 8 * 1024 * 1024;

#[derive(Debug)]
pub enum ExternalFileChunkError {
    Sqlite(rusqlite::Error),
    Io(std::io::Error),
    InvalidData(String),
}

impl std::fmt::Display for ExternalFileChunkError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExternalFileChunkError::Sqlite(e) => write!(f, "sqlite: {e}"),
            ExternalFileChunkError::Io(e) => write!(f, "io: {e}"),
            ExternalFileChunkError::InvalidData(e) => write!(f, "invalid data: {e}"),
        }
    }
}

impl std::error::Error for ExternalFileChunkError {}

impl From<rusqlite::Error> for ExternalFileChunkError {
    fn from(e: rusqlite::Error) -> Self {
        ExternalFileChunkError::Sqlite(e)
    }
}

impl From<std::io::Error> for ExternalFileChunkError {
    fn from(e: std::io::Error) -> Self {
        ExternalFileChunkError::Io(e)
    }
}

pub type ExternalFileChunkResult<T> = Result<T, ExternalFileChunkError>;

#[derive(Debug, Clone, Copy)]
struct ChunkTable {
    table: &'static str,
    owner_column: &'static str,
    owner_label: &'static str,
}

const EXTERNAL_FILE_REVISION_CHUNKS: ChunkTable = ChunkTable {
    table: "external_file_revision_chunks",
    owner_column: "revision_id",
    owner_label: "external file revision",
};

const CHECKPOINT_DATA_CHUNKS: ChunkTable = ChunkTable {
    table: "checkpoint_data_chunks",
    owner_column: "checkpoint_id",
    owner_label: "checkpoint",
};

const DELTA_CHANGESET_CHUNKS: ChunkTable = ChunkTable {
    table: "delta_changeset_chunks",
    owner_column: "delta_id",
    owner_label: "delta",
};

pub fn validate_chunk_size(chunk_size: usize) -> ExternalFileChunkResult<usize> {
    if !(MIN_EXTERNAL_FILE_CHUNK_SIZE..=MAX_EXTERNAL_FILE_CHUNK_SIZE).contains(&chunk_size) {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "external file chunk size must be between {MIN_EXTERNAL_FILE_CHUNK_SIZE} and {MAX_EXTERNAL_FILE_CHUNK_SIZE} bytes, got {chunk_size}"
        )));
    }
    Ok(chunk_size)
}

pub fn table_exists(conn: &Connection, table_name: &str) -> rusqlite::Result<bool> {
    conn.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = ?1")?
        .query_row(params![table_name], |row| row.get::<_, i32>(0))
        .map(|count| count > 0)
}

pub fn column_exists(
    conn: &Connection,
    table_name: &str,
    column_name: &str,
) -> rusqlite::Result<bool> {
    conn.prepare("SELECT count(*) FROM pragma_table_info(?1) WHERE name = ?2")?
        .query_row(params![table_name, column_name], |row| row.get::<_, i32>(0))
        .map(|count| count > 0)
}

pub fn write_blob_chunks(
    tx: &Transaction,
    revision_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    write_blob_chunks_for_table(
        tx,
        EXTERNAL_FILE_REVISION_CHUNKS,
        revision_id,
        blob,
        chunk_size,
    )
}

pub fn write_checkpoint_data_chunks(
    tx: &Transaction,
    checkpoint_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    write_blob_chunks_for_table(tx, CHECKPOINT_DATA_CHUNKS, checkpoint_id, blob, chunk_size)
}

pub fn write_checkpoint_data_chunks_on_connection(
    conn: &Connection,
    checkpoint_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    write_blob_chunks_for_connection(
        conn,
        CHECKPOINT_DATA_CHUNKS,
        checkpoint_id,
        blob,
        chunk_size,
    )
}

pub fn write_delta_changeset_chunks(
    tx: &Transaction,
    delta_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    write_blob_chunks_for_table(tx, DELTA_CHANGESET_CHUNKS, delta_id, blob, chunk_size)
}

pub fn write_delta_changeset_chunks_on_connection(
    conn: &Connection,
    delta_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    write_blob_chunks_for_connection(conn, DELTA_CHANGESET_CHUNKS, delta_id, blob, chunk_size)
}

fn write_blob_chunks_for_table(
    tx: &Transaction,
    table: ChunkTable,
    owner_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    validate_chunk_size(chunk_size)?;
    delete_chunks(tx, table, owner_id)?;

    let sql = format!(
        "INSERT OR REPLACE INTO {}
            ({}, chunk_index, offset_bytes, size_bytes, data)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        table.table, table.owner_column
    );
    let mut stmt = tx.prepare_cached(&sql)?;

    let mut offset = 0usize;
    for (chunk_index, chunk) in blob.chunks(chunk_size).enumerate() {
        insert_chunk(&mut stmt, table, owner_id, chunk_index, offset, chunk)?;
        offset = offset.checked_add(chunk.len()).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "{} {owner_id} size overflow",
                table.owner_label
            ))
        })?;
    }

    Ok(offset as u64)
}

fn write_blob_chunks_for_connection(
    conn: &Connection,
    table: ChunkTable,
    owner_id: &str,
    blob: &[u8],
    chunk_size: usize,
) -> ExternalFileChunkResult<u64> {
    validate_chunk_size(chunk_size)?;
    delete_chunks_on_connection(conn, table, owner_id)?;

    let sql = format!(
        "INSERT OR REPLACE INTO {}
            ({}, chunk_index, offset_bytes, size_bytes, data)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        table.table, table.owner_column
    );
    let mut stmt = conn.prepare_cached(&sql)?;

    let mut offset = 0usize;
    for (chunk_index, chunk) in blob.chunks(chunk_size).enumerate() {
        insert_chunk(&mut stmt, table, owner_id, chunk_index, offset, chunk)?;
        offset = offset.checked_add(chunk.len()).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "{} {owner_id} size overflow",
                table.owner_label
            ))
        })?;
    }

    Ok(offset as u64)
}

pub fn write_reader_chunks<R: Read>(
    tx: &Transaction,
    revision_id: &str,
    reader: &mut R,
    chunk_size: usize,
    expected_size: Option<i64>,
) -> ExternalFileChunkResult<u64> {
    validate_chunk_size(chunk_size)?;
    delete_chunks(tx, EXTERNAL_FILE_REVISION_CHUNKS, revision_id)?;

    let mut stmt = tx.prepare_cached(
        "INSERT OR REPLACE INTO external_file_revision_chunks
            (revision_id, chunk_index, offset_bytes, size_bytes, data)
         VALUES (?1, ?2, ?3, ?4, ?5)",
    )?;

    let mut buffer = vec![0u8; chunk_size];
    let mut chunk_index = 0usize;
    let mut offset = 0usize;

    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }

        insert_chunk(
            &mut stmt,
            EXTERNAL_FILE_REVISION_CHUNKS,
            revision_id,
            chunk_index,
            offset,
            &buffer[..bytes_read],
        )?;

        offset = offset.checked_add(bytes_read).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "external file revision {revision_id} size overflow"
            ))
        })?;
        chunk_index += 1;
    }

    if let Some(expected_size) = expected_size {
        if expected_size >= 0 && offset as i64 != expected_size {
            return Err(ExternalFileChunkError::InvalidData(format!(
                "external file revision {revision_id} wrote {offset} bytes, expected {expected_size}"
            )));
        }
    }

    Ok(offset as u64)
}

pub fn write_checkpoint_data_reader_chunks<R: Read>(
    tx: &Transaction,
    checkpoint_id: &str,
    reader: &mut R,
    chunk_size: usize,
    expected_size: Option<i64>,
) -> ExternalFileChunkResult<u64> {
    write_reader_chunks_for_table(
        tx,
        CHECKPOINT_DATA_CHUNKS,
        checkpoint_id,
        reader,
        chunk_size,
        expected_size,
    )
}

pub fn write_delta_changeset_reader_chunks<R: Read>(
    tx: &Transaction,
    delta_id: &str,
    reader: &mut R,
    chunk_size: usize,
    expected_size: Option<i64>,
) -> ExternalFileChunkResult<u64> {
    write_reader_chunks_for_table(
        tx,
        DELTA_CHANGESET_CHUNKS,
        delta_id,
        reader,
        chunk_size,
        expected_size,
    )
}

fn write_reader_chunks_for_table<R: Read>(
    tx: &Transaction,
    table: ChunkTable,
    owner_id: &str,
    reader: &mut R,
    chunk_size: usize,
    expected_size: Option<i64>,
) -> ExternalFileChunkResult<u64> {
    validate_chunk_size(chunk_size)?;
    delete_chunks(tx, table, owner_id)?;

    let sql = format!(
        "INSERT OR REPLACE INTO {}
            ({}, chunk_index, offset_bytes, size_bytes, data)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        table.table, table.owner_column
    );
    let mut stmt = tx.prepare_cached(&sql)?;

    let mut buffer = vec![0u8; chunk_size];
    let mut chunk_index = 0usize;
    let mut offset = 0usize;

    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }

        insert_chunk(
            &mut stmt,
            table,
            owner_id,
            chunk_index,
            offset,
            &buffer[..bytes_read],
        )?;

        offset = offset.checked_add(bytes_read).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "{} {owner_id} size overflow",
                table.owner_label
            ))
        })?;
        chunk_index += 1;
    }

    if let Some(expected_size) = expected_size {
        if expected_size >= 0 && offset as i64 != expected_size {
            return Err(ExternalFileChunkError::InvalidData(format!(
                "{} {owner_id} wrote {offset} bytes, expected {expected_size}",
                table.owner_label
            )));
        }
    }

    Ok(offset as u64)
}

fn delete_chunks(
    tx: &Transaction,
    table: ChunkTable,
    owner_id: &str,
) -> ExternalFileChunkResult<()> {
    let sql = format!(
        "DELETE FROM {} WHERE {} = ?1",
        table.table, table.owner_column
    );
    tx.execute(&sql, params![owner_id])?;
    Ok(())
}

fn delete_chunks_on_connection(
    conn: &Connection,
    table: ChunkTable,
    owner_id: &str,
) -> ExternalFileChunkResult<()> {
    let sql = format!(
        "DELETE FROM {} WHERE {} = ?1",
        table.table, table.owner_column
    );
    conn.execute(&sql, params![owner_id])?;
    Ok(())
}

pub fn delete_revision_chunks_on_connection(
    conn: &Connection,
    revision_id: &str,
) -> ExternalFileChunkResult<()> {
    delete_chunks_on_connection(conn, EXTERNAL_FILE_REVISION_CHUNKS, revision_id)
}

pub fn delete_checkpoint_data_chunks_on_connection(
    conn: &Connection,
    checkpoint_id: &str,
) -> ExternalFileChunkResult<()> {
    delete_chunks_on_connection(conn, CHECKPOINT_DATA_CHUNKS, checkpoint_id)
}

pub fn delete_delta_changeset_chunks_on_connection(
    conn: &Connection,
    delta_id: &str,
) -> ExternalFileChunkResult<()> {
    delete_chunks_on_connection(conn, DELTA_CHANGESET_CHUNKS, delta_id)
}

pub fn write_revision_chunk_on_connection(
    conn: &Connection,
    revision_id: &str,
    chunk_index: i64,
    offset_bytes: i64,
    data: &[u8],
) -> ExternalFileChunkResult<()> {
    write_chunk_on_connection(
        conn,
        EXTERNAL_FILE_REVISION_CHUNKS,
        revision_id,
        chunk_index,
        offset_bytes,
        data,
    )
}

pub fn write_checkpoint_data_chunk_on_connection(
    conn: &Connection,
    checkpoint_id: &str,
    chunk_index: i64,
    offset_bytes: i64,
    data: &[u8],
) -> ExternalFileChunkResult<()> {
    write_chunk_on_connection(
        conn,
        CHECKPOINT_DATA_CHUNKS,
        checkpoint_id,
        chunk_index,
        offset_bytes,
        data,
    )
}

pub fn write_delta_changeset_chunk_on_connection(
    conn: &Connection,
    delta_id: &str,
    chunk_index: i64,
    offset_bytes: i64,
    data: &[u8],
) -> ExternalFileChunkResult<()> {
    write_chunk_on_connection(
        conn,
        DELTA_CHANGESET_CHUNKS,
        delta_id,
        chunk_index,
        offset_bytes,
        data,
    )
}

fn write_chunk_on_connection(
    conn: &Connection,
    table: ChunkTable,
    owner_id: &str,
    chunk_index: i64,
    offset_bytes: i64,
    data: &[u8],
) -> ExternalFileChunkResult<()> {
    if chunk_index < 0 {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "{} {owner_id} chunk index must be non-negative",
            table.owner_label
        )));
    }
    if offset_bytes < 0 {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "{} {owner_id} offset must be non-negative",
            table.owner_label
        )));
    }

    let sql = format!(
        "INSERT OR REPLACE INTO {}
            ({}, chunk_index, offset_bytes, size_bytes, data)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        table.table, table.owner_column
    );
    conn.execute(
        &sql,
        params![owner_id, chunk_index, offset_bytes, data.len() as i64, data],
    )?;
    Ok(())
}

fn insert_chunk(
    stmt: &mut rusqlite::CachedStatement<'_>,
    table: ChunkTable,
    owner_id: &str,
    chunk_index: usize,
    offset: usize,
    chunk: &[u8],
) -> ExternalFileChunkResult<()> {
    let chunk_index = i64::try_from(chunk_index).map_err(|_| {
        ExternalFileChunkError::InvalidData(format!(
            "{} {owner_id} chunk index overflow",
            table.owner_label
        ))
    })?;
    let offset = i64::try_from(offset).map_err(|_| {
        ExternalFileChunkError::InvalidData(format!(
            "{} {owner_id} offset overflow",
            table.owner_label
        ))
    })?;
    let size = i64::try_from(chunk.len()).map_err(|_| {
        ExternalFileChunkError::InvalidData(format!(
            "{} {owner_id} chunk size overflow",
            table.owner_label
        ))
    })?;

    stmt.execute(params![owner_id, chunk_index, offset, size, chunk])?;
    Ok(())
}

pub fn read_revision_chunk(
    conn: &Connection,
    revision_id: &str,
    chunk_index: i64,
) -> ExternalFileChunkResult<Option<Vec<u8>>> {
    let result = conn
        .prepare_cached(
            "SELECT data
         FROM external_file_revision_chunks
         WHERE revision_id = ?1 AND chunk_index = ?2",
        )?
        .query_row(params![revision_id, chunk_index], |row| {
            row.get::<_, Vec<u8>>(0)
        });

    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn read_revision_chunk_batch(
    conn: &Connection,
    revision_id: &str,
    start_chunk_index: i64,
    max_chunks: i64,
) -> ExternalFileChunkResult<Vec<Vec<u8>>> {
    if start_chunk_index < 0 {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "external file revision {revision_id} start chunk index must be non-negative"
        )));
    }
    if !(1..=4).contains(&max_chunks) {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "external file revision {revision_id} chunk batch size must be between 1 and 4"
        )));
    }

    let mut stmt = conn.prepare_cached(
        "SELECT data
         FROM external_file_revision_chunks
         WHERE revision_id = ?1 AND chunk_index >= ?2
         ORDER BY chunk_index
         LIMIT ?3",
    )?;
    let chunks = stmt
        .query_map(params![revision_id, start_chunk_index, max_chunks], |row| {
            row.get::<_, Vec<u8>>(0)
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(chunks)
}

pub fn read_revision_range(
    conn: &Connection,
    revision_id: &str,
    offset_bytes: i64,
    length_bytes: i64,
) -> ExternalFileChunkResult<Option<Vec<u8>>> {
    if offset_bytes < 0 {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "external file revision {revision_id} range offset must be non-negative"
        )));
    }
    if !(1..=MAX_EXTERNAL_FILE_RANGE_SIZE).contains(&length_bytes) {
        return Err(ExternalFileChunkError::InvalidData(format!(
            "external file revision {revision_id} range length must be between 1 and {MAX_EXTERNAL_FILE_RANGE_SIZE}"
        )));
    }
    let end_bytes = offset_bytes.checked_add(length_bytes).ok_or_else(|| {
        ExternalFileChunkError::InvalidData(format!(
            "external file revision {revision_id} range overflow"
        ))
    })?;

    // SUBSTR on the BLOB keeps legacy one-row revisions bounded as well. Reading
    // the row as Vec<u8> here would materialize a 100-200 MB legacy attachment.
    let mut stmt = conn.prepare_cached(
        "SELECT MAX(offset_bytes, ?2) AS piece_offset,
                SUBSTR(
                    data,
                    MAX(?2 - offset_bytes, 0) + 1,
                    MIN(offset_bytes + size_bytes, ?3) - MAX(offset_bytes, ?2)
                ) AS piece
         FROM external_file_revision_chunks
         WHERE revision_id = ?1
           AND offset_bytes < ?3
           AND offset_bytes + size_bytes > ?2
         ORDER BY offset_bytes",
    )?;
    let mut rows = stmt.query(params![revision_id, offset_bytes, end_bytes])?;
    let mut output = Vec::with_capacity(length_bytes as usize);
    let mut cursor = offset_bytes;

    while let Some(row) = rows.next()? {
        let piece_offset: i64 = row.get(0)?;
        let piece: Vec<u8> = row.get(1)?;
        if piece_offset != cursor {
            return Err(ExternalFileChunkError::InvalidData(format!(
                "external file revision {revision_id} has a gap at byte {cursor}"
            )));
        }
        cursor = cursor.checked_add(piece.len() as i64).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "external file revision {revision_id} range cursor overflow"
            ))
        })?;
        output.extend_from_slice(&piece);
    }

    if output.is_empty() {
        Ok(None)
    } else {
        Ok(Some(output))
    }
}

pub fn read_checkpoint_data_chunk(
    conn: &Connection,
    checkpoint_id: &str,
    chunk_index: i64,
) -> ExternalFileChunkResult<Option<Vec<u8>>> {
    read_chunk(conn, CHECKPOINT_DATA_CHUNKS, checkpoint_id, chunk_index)
}

pub fn read_delta_changeset_chunk(
    conn: &Connection,
    delta_id: &str,
    chunk_index: i64,
) -> ExternalFileChunkResult<Option<Vec<u8>>> {
    read_chunk(conn, DELTA_CHANGESET_CHUNKS, delta_id, chunk_index)
}

fn read_chunk(
    conn: &Connection,
    table: ChunkTable,
    owner_id: &str,
    chunk_index: i64,
) -> ExternalFileChunkResult<Option<Vec<u8>>> {
    let sql = format!(
        "SELECT data FROM {} WHERE {} = ?1 AND chunk_index = ?2",
        table.table, table.owner_column
    );
    let result = conn
        .prepare_cached(&sql)?
        .query_row(params![owner_id, chunk_index], |row| {
            row.get::<_, Vec<u8>>(0)
        });

    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

pub fn stream_revision_chunks_to_writer<W: Write>(
    conn: &Connection,
    revision_id: &str,
    writer: &mut W,
) -> ExternalFileChunkResult<u64> {
    let mut stmt = conn.prepare_cached(
        "SELECT data
         FROM external_file_revision_chunks
         WHERE revision_id = ?1
         ORDER BY chunk_index",
    )?;
    let mut rows = stmt.query(params![revision_id])?;
    let mut total = 0u64;

    while let Some(row) = rows.next()? {
        let data: Vec<u8> = row.get(0)?;
        writer.write_all(&data)?;
        total = total.checked_add(data.len() as u64).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "external file revision {revision_id} size overflow"
            ))
        })?;
    }

    Ok(total)
}

pub fn read_revision_chunks(
    conn: &Connection,
    revision_id: &str,
) -> ExternalFileChunkResult<Vec<u8>> {
    let mut out = Vec::new();
    stream_revision_chunks_to_writer(conn, revision_id, &mut out)?;
    Ok(out)
}

pub fn stream_checkpoint_data_chunks_to_writer<W: Write>(
    conn: &Connection,
    checkpoint_id: &str,
    writer: &mut W,
) -> ExternalFileChunkResult<u64> {
    stream_chunks_to_writer(conn, CHECKPOINT_DATA_CHUNKS, checkpoint_id, writer)
}

pub fn read_checkpoint_data_chunks(
    conn: &Connection,
    checkpoint_id: &str,
) -> ExternalFileChunkResult<Vec<u8>> {
    let mut out = Vec::new();
    stream_checkpoint_data_chunks_to_writer(conn, checkpoint_id, &mut out)?;
    Ok(out)
}

pub fn stream_delta_changeset_chunks_to_writer<W: Write>(
    conn: &Connection,
    delta_id: &str,
    writer: &mut W,
) -> ExternalFileChunkResult<u64> {
    stream_chunks_to_writer(conn, DELTA_CHANGESET_CHUNKS, delta_id, writer)
}

pub fn read_delta_changeset_chunks(
    conn: &Connection,
    delta_id: &str,
) -> ExternalFileChunkResult<Vec<u8>> {
    let mut out = Vec::new();
    stream_delta_changeset_chunks_to_writer(conn, delta_id, &mut out)?;
    Ok(out)
}

fn stream_chunks_to_writer<W: Write>(
    conn: &Connection,
    table: ChunkTable,
    owner_id: &str,
    writer: &mut W,
) -> ExternalFileChunkResult<u64> {
    let sql = format!(
        "SELECT data
         FROM {}
         WHERE {} = ?1
         ORDER BY chunk_index",
        table.table, table.owner_column
    );
    let mut stmt = conn.prepare_cached(&sql)?;
    let mut rows = stmt.query(params![owner_id])?;
    let mut total = 0u64;

    while let Some(row) = rows.next()? {
        let data: Vec<u8> = row.get(0)?;
        writer.write_all(&data)?;
        total = total.checked_add(data.len() as u64).ok_or_else(|| {
            ExternalFileChunkError::InvalidData(format!(
                "{} {owner_id} size overflow",
                table.owner_label
            ))
        })?;
    }

    Ok(total)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_bounded_revision_range_across_chunk_boundaries() {
        let conn = Connection::open_in_memory().expect("open test database");
        conn.execute_batch(
            "CREATE TABLE external_file_revision_chunks (
                revision_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                offset_bytes INTEGER NOT NULL,
                size_bytes INTEGER NOT NULL,
                data BLOB NOT NULL,
                PRIMARY KEY (revision_id, chunk_index)
            );",
        )
        .expect("create chunk table");

        conn.execute(
            "INSERT INTO external_file_revision_chunks
                (revision_id, chunk_index, offset_bytes, size_bytes, data)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params!["revision-1", 0_i64, 0_i64, 4_i64, b"abcd".as_slice()],
        )
        .expect("insert first chunk");
        conn.execute(
            "INSERT INTO external_file_revision_chunks
                (revision_id, chunk_index, offset_bytes, size_bytes, data)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params!["revision-1", 1_i64, 4_i64, 6_i64, b"efghij".as_slice()],
        )
        .expect("insert second chunk");

        let range = read_revision_range(&conn, "revision-1", 3, 6)
            .expect("read range")
            .expect("range exists");
        assert_eq!(range, b"defghi");
    }
}
