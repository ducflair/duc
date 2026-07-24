use flate2::read::{DeflateDecoder, GzDecoder};
use flate2::write::GzEncoder;
use flate2::Compression;
use rusqlite::{params, Connection, OptionalExtension};
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufReader, BufWriter, Cursor, Read, Seek, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::api::version_control;
use crate::db;
use crate::external_file_chunks::{
    self, DEFAULT_EXTERNAL_FILE_CHUNK_SIZE, MAX_EXTERNAL_FILE_CHUNK_SIZE,
    MIN_EXTERNAL_FILE_CHUNK_SIZE,
};
use crate::parse::{self, ParseError, ParseResult};
use crate::serialize::{self, SerializeError, SerializeResult};
use crate::types::{
    DucExternalFile, ExportedDataState, ExternalFileMeta, ExternalFileRevisionMeta,
};

const SQLITE_HEADER_MAGIC: &[u8; 16] = b"SQLite format 3\0";
const GZIP_MAGIC: &[u8] = &[0x1f, 0x8b];

static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DucSessionMode {
    Export,
    Read,
}

#[derive(Debug, Clone)]
pub struct DucSessionOptions {
    pub chunk_size: usize,
}

impl Default for DucSessionOptions {
    fn default() -> Self {
        Self {
            chunk_size: DEFAULT_EXTERNAL_FILE_CHUNK_SIZE,
        }
    }
}

impl DucSessionOptions {
    pub fn with_chunk_size(chunk_size: usize) -> SerializeResult<Self> {
        external_file_chunks::validate_chunk_size(chunk_size)?;
        Ok(Self { chunk_size })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExternalFileChunk {
    pub revision_id: String,
    pub chunk_index: i64,
    pub offset_bytes: i64,
    pub size_bytes: i64,
    pub data: Vec<u8>,
}

pub struct DucSession {
    conn: Option<Connection>,
    raw_sqlite_path: PathBuf,
    chunk_size: usize,
    mode: DucSessionMode,
}

impl DucSession {
    pub fn create_export_session() -> SerializeResult<Self> {
        Self::create_export_session_with_options(DucSessionOptions::default())
    }

    pub fn create_export_session_with_options(options: DucSessionOptions) -> SerializeResult<Self> {
        external_file_chunks::validate_chunk_size(options.chunk_size)?;
        let (path, file) = create_temp_sqlite_file("duc-export").map_err(SerializeError::from)?;
        drop(file);

        let conn = match db::open_file(&path) {
            Ok(conn) => conn.into_inner(),
            Err(e) => {
                remove_sqlite_temp_files(&path);
                return Err(e.into());
            }
        };
        conn.execute_batch(
            "PRAGMA journal_mode = DELETE;
             PRAGMA foreign_keys = ON;
             PRAGMA synchronous = NORMAL;",
        )?;

        Ok(Self {
            conn: Some(conn),
            raw_sqlite_path: path,
            chunk_size: options.chunk_size,
            mode: DucSessionMode::Export,
        })
    }

    pub fn open_path(path: impl AsRef<Path>) -> ParseResult<Self> {
        let file = File::open(path).map_err(|e| ParseError::Io(e.to_string()))?;
        Self::open_reader(file)
    }

    pub fn open_reader<R: Read>(reader: R) -> ParseResult<Self> {
        let options = DucSessionOptions::default();
        let (path, file) =
            create_temp_sqlite_file("duc-import").map_err(|e| ParseError::Io(e.to_string()))?;

        if let Err(e) = copy_duc_payload_to_sqlite_file(reader, file, options.chunk_size) {
            remove_sqlite_temp_files(&path);
            return Err(e);
        }

        let conn = match db::open_file(&path) {
            Ok(conn) => conn.into_inner(),
            Err(e) => {
                remove_sqlite_temp_files(&path);
                return Err(e.into());
            }
        };
        conn.execute_batch("PRAGMA query_only = ON;")?;

        Ok(Self {
            conn: Some(conn),
            raw_sqlite_path: path,
            chunk_size: options.chunk_size,
            mode: DucSessionMode::Read,
        })
    }

    pub fn write_document_state(&mut self, state: &ExportedDataState) -> SerializeResult<()> {
        let chunk_size = self.chunk_size;
        let conn = self.export_conn_mut()?;
        serialize::write_state_to_connection(conn, state, chunk_size)
    }

    pub fn write_external_file_revision<R: Read>(
        &mut self,
        file: &DucExternalFile,
        revision_id: &str,
        reader: &mut R,
    ) -> SerializeResult<u64> {
        let revision = file.revisions.get(revision_id).ok_or_else(|| {
            SerializeError::InvalidData(format!(
                "external file {} has no revision {}",
                file.id, revision_id
            ))
        })?;
        self.write_external_file_revision_with_metadata(file, revision, reader)
    }

    pub fn write_external_file_revision_with_metadata<R: Read>(
        &mut self,
        file: &DucExternalFile,
        revision: &ExternalFileRevisionMeta,
        reader: &mut R,
    ) -> SerializeResult<u64> {
        let chunk_size = self.chunk_size;
        let conn = self.export_conn_mut()?;
        let tx = conn.transaction()?;

        tx.execute(
            "INSERT OR REPLACE INTO external_files (id, active_revision_id, updated, version)
             VALUES (?1, ?2, ?3, ?4)",
            params![file.id, file.active_revision_id, file.updated, file.version],
        )?;
        tx.execute(
            "INSERT OR REPLACE INTO external_file_revisions
                (id, file_id, size_bytes, checksum, source_name, mime_type, message, created, last_retrieved)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                revision.id,
                file.id,
                revision.size_bytes,
                revision.checksum,
                revision.source_name,
                revision.mime_type,
                revision.message,
                revision.created,
                revision.last_retrieved,
            ],
        )?;

        let written = external_file_chunks::write_reader_chunks(
            &tx,
            &revision.id,
            reader,
            chunk_size,
            Some(revision.size_bytes),
        )?;
        tx.commit()?;
        Ok(written)
    }

    pub fn write_checkpoint_data<R: Read>(
        &mut self,
        checkpoint_id: &str,
        reader: &mut R,
        expected_size: Option<i64>,
    ) -> SerializeResult<u64> {
        let chunk_size = self.chunk_size;
        let conn = self.export_conn_mut()?;
        let tx = conn.transaction()?;
        let written = external_file_chunks::write_checkpoint_data_reader_chunks(
            &tx,
            checkpoint_id,
            reader,
            chunk_size,
            expected_size,
        )?;
        tx.commit()?;
        Ok(written)
    }

    pub fn write_delta_changeset<R: Read>(
        &mut self,
        delta_id: &str,
        reader: &mut R,
        expected_size: Option<i64>,
    ) -> SerializeResult<u64> {
        let chunk_size = self.chunk_size;
        let conn = self.export_conn_mut()?;
        let tx = conn.transaction()?;
        let written = external_file_chunks::write_delta_changeset_reader_chunks(
            &tx,
            delta_id,
            reader,
            chunk_size,
            expected_size,
        )?;
        tx.commit()?;
        Ok(written)
    }

    pub fn finish_to_path(self, path: impl AsRef<Path>) -> SerializeResult<()> {
        let file = File::create(path).map_err(SerializeError::from)?;
        let mut writer = BufWriter::new(file);
        self.finish_to_writer(&mut writer)?;
        writer.flush().map_err(SerializeError::from)
    }

    pub fn finish_to_writer<W: Write>(mut self, writer: &mut W) -> SerializeResult<()> {
        self.ensure_mode(DucSessionMode::Export)?;

        if let Some(conn) = self.conn.take() {
            conn.execute_batch(
                "PRAGMA foreign_keys = ON;
                 PRAGMA wal_checkpoint(TRUNCATE);
                 PRAGMA optimize;",
            )?;
            drop(conn);
        }

        let raw = File::open(&self.raw_sqlite_path).map_err(SerializeError::from)?;
        let mut reader = BufReader::with_capacity(self.chunk_size, raw);
        let mut encoder = GzEncoder::new(writer, Compression::default());
        copy_with_buffer(&mut reader, &mut encoder, self.chunk_size)
            .map_err(SerializeError::from)?;
        encoder.finish().map_err(SerializeError::from)?;
        remove_sqlite_temp_files(&self.raw_sqlite_path);
        Ok(())
    }

    pub fn read_document_state(&self) -> ParseResult<ExportedDataState> {
        self.ensure_read_mode()?;
        parse::read_document_state_from_connection(self.conn_ref()?)
    }

    pub fn list_external_files(&self) -> ParseResult<Vec<ExternalFileMeta>> {
        self.ensure_read_mode()?;
        parse::list_external_files_from_connection(self.conn_ref()?)
    }

    pub fn read_external_file_chunk(
        &self,
        revision_id: &str,
        chunk_index: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_revision_exists(conn, revision_id)?;

        if external_file_chunks::table_exists(conn, "external_file_revision_chunks")? {
            return Ok(external_file_chunks::read_revision_chunk(
                conn,
                revision_id,
                chunk_index,
            )?);
        }

        if chunk_index != 0 {
            return Ok(None);
        }
        read_legacy_revision_data(conn, revision_id)
    }

    pub fn for_each_external_file_revision_chunk<F>(
        &self,
        revision_id: &str,
        mut on_chunk: F,
    ) -> ParseResult<()>
    where
        F: FnMut(ExternalFileChunk) -> ParseResult<()>,
    {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_revision_exists(conn, revision_id)?;

        if external_file_chunks::table_exists(conn, "external_file_revision_chunks")? {
            let mut stmt = conn.prepare_cached(
                "SELECT revision_id, chunk_index, offset_bytes, size_bytes, data
                 FROM external_file_revision_chunks
                 WHERE revision_id = ?1
                 ORDER BY chunk_index",
            )?;
            let mut rows = stmt.query(params![revision_id])?;
            while let Some(row) = rows.next()? {
                on_chunk(ExternalFileChunk {
                    revision_id: row.get(0)?,
                    chunk_index: row.get(1)?,
                    offset_bytes: row.get(2)?,
                    size_bytes: row.get(3)?,
                    data: row.get(4)?,
                })?;
            }
            return Ok(());
        }

        if let Some(data) = read_legacy_revision_data(conn, revision_id)? {
            on_chunk(ExternalFileChunk {
                revision_id: revision_id.to_string(),
                chunk_index: 0,
                offset_bytes: 0,
                size_bytes: data.len() as i64,
                data,
            })?;
        }
        Ok(())
    }

    pub fn stream_external_file_revision_to_writer<W: Write>(
        &self,
        revision_id: &str,
        writer: &mut W,
    ) -> ParseResult<u64> {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_revision_exists(conn, revision_id)?;

        if external_file_chunks::table_exists(conn, "external_file_revision_chunks")? {
            return Ok(external_file_chunks::stream_revision_chunks_to_writer(
                conn,
                revision_id,
                writer,
            )?);
        }

        if let Some(data) = read_legacy_revision_data(conn, revision_id)? {
            writer
                .write_all(&data)
                .map_err(|e| ParseError::Io(e.to_string()))?;
            return Ok(data.len() as u64);
        }
        Ok(0)
    }

    pub fn stream_checkpoint_data_to_writer<W: Write>(
        &self,
        checkpoint_id: &str,
        writer: &mut W,
    ) -> ParseResult<u64> {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_checkpoint_exists(conn, checkpoint_id)?;

        if external_file_chunks::table_exists(conn, "checkpoint_data_chunks")? {
            return Ok(
                external_file_chunks::stream_checkpoint_data_chunks_to_writer(
                    conn,
                    checkpoint_id,
                    writer,
                )?,
            );
        }

        let data = version_control::read_checkpoint_data(conn, checkpoint_id)?;
        writer
            .write_all(&data)
            .map_err(|e| ParseError::Io(e.to_string()))?;
        Ok(data.len() as u64)
    }

    pub fn stream_delta_changeset_to_writer<W: Write>(
        &self,
        delta_id: &str,
        writer: &mut W,
    ) -> ParseResult<u64> {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_delta_exists(conn, delta_id)?;

        if external_file_chunks::table_exists(conn, "delta_changeset_chunks")? {
            return Ok(
                external_file_chunks::stream_delta_changeset_chunks_to_writer(
                    conn, delta_id, writer,
                )?,
            );
        }

        let data = version_control::read_delta_changeset(conn, delta_id)?;
        writer
            .write_all(&data)
            .map_err(|e| ParseError::Io(e.to_string()))?;
        Ok(data.len() as u64)
    }

    pub fn read_checkpoint_data_chunk(
        &self,
        checkpoint_id: &str,
        chunk_index: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_checkpoint_exists(conn, checkpoint_id)?;

        if external_file_chunks::table_exists(conn, "checkpoint_data_chunks")? {
            return Ok(external_file_chunks::read_checkpoint_data_chunk(
                conn,
                checkpoint_id,
                chunk_index,
            )?);
        }

        if chunk_index != 0 {
            return Ok(None);
        }
        Ok(Some(version_control::read_checkpoint_data(
            conn,
            checkpoint_id,
        )?))
    }

    pub fn read_delta_changeset_chunk(
        &self,
        delta_id: &str,
        chunk_index: i64,
    ) -> ParseResult<Option<Vec<u8>>> {
        self.ensure_read_mode()?;
        let conn = self.conn_ref()?;
        ensure_delta_exists(conn, delta_id)?;

        if external_file_chunks::table_exists(conn, "delta_changeset_chunks")? {
            return Ok(external_file_chunks::read_delta_changeset_chunk(
                conn,
                delta_id,
                chunk_index,
            )?);
        }

        if chunk_index != 0 {
            return Ok(None);
        }
        Ok(Some(version_control::read_delta_changeset(conn, delta_id)?))
    }

    pub fn chunk_size(&self) -> usize {
        self.chunk_size
    }

    pub fn chunk_size_range() -> std::ops::RangeInclusive<usize> {
        MIN_EXTERNAL_FILE_CHUNK_SIZE..=MAX_EXTERNAL_FILE_CHUNK_SIZE
    }

    fn export_conn_mut(&mut self) -> SerializeResult<&mut Connection> {
        self.ensure_mode(DucSessionMode::Export)?;
        self.conn.as_mut().ok_or_else(|| {
            SerializeError::InvalidData("DucSession connection is already closed".to_string())
        })
    }

    fn ensure_mode(&self, mode: DucSessionMode) -> SerializeResult<()> {
        if self.mode != mode {
            return Err(SerializeError::InvalidData(format!(
                "DucSession is in {:?} mode, expected {:?}",
                self.mode, mode
            )));
        }
        Ok(())
    }

    fn ensure_read_mode(&self) -> ParseResult<()> {
        if self.mode != DucSessionMode::Read {
            return Err(ParseError::InvalidData(format!(
                "DucSession is in {:?} mode, expected Read",
                self.mode
            )));
        }
        Ok(())
    }

    fn conn_ref(&self) -> ParseResult<&Connection> {
        self.conn.as_ref().ok_or_else(|| {
            ParseError::InvalidData("DucSession connection is already closed".to_string())
        })
    }
}

impl Drop for DucSession {
    fn drop(&mut self) {
        self.conn.take();
        remove_sqlite_temp_files(&self.raw_sqlite_path);
    }
}

fn create_temp_sqlite_file(prefix: &str) -> io::Result<(PathBuf, File)> {
    let temp_dir = std::env::temp_dir();
    for _ in 0..100 {
        let counter = TEMP_COUNTER.fetch_add(1, Ordering::Relaxed);
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let path = temp_dir.join(format!(
            "{prefix}-{}-{nanos}-{counter}.sqlite",
            std::process::id(),
        ));
        match OpenOptions::new()
            .read(true)
            .write(true)
            .create_new(true)
            .open(&path)
        {
            Ok(file) => return Ok((path, file)),
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e),
        }
    }
    Err(io::Error::new(
        io::ErrorKind::AlreadyExists,
        "failed to allocate unique DucSession temp path",
    ))
}

fn copy_duc_payload_to_sqlite_file<R: Read>(
    mut reader: R,
    file: File,
    chunk_size: usize,
) -> ParseResult<()> {
    let mut prefix = [0u8; 16];
    let mut prefix_len = 0usize;
    while prefix_len < prefix.len() {
        let read = reader
            .read(&mut prefix[prefix_len..])
            .map_err(|e| ParseError::Io(e.to_string()))?;
        if read == 0 {
            break;
        }
        prefix_len += read;
    }

    if prefix_len == 0 {
        return Err(ParseError::InvalidData("empty .duc stream".to_string()));
    }

    let mut writer = BufWriter::with_capacity(chunk_size, file);
    let prefix = prefix[..prefix_len].to_vec();
    if prefix_len == SQLITE_HEADER_MAGIC.len() && prefix.as_slice() == SQLITE_HEADER_MAGIC {
        writer
            .write_all(&prefix)
            .map_err(|e| ParseError::Io(e.to_string()))?;
        copy_with_buffer(&mut reader, &mut writer, chunk_size)
            .map_err(|e| ParseError::Io(e.to_string()))?;
    } else {
        let is_gzip = prefix.starts_with(GZIP_MAGIC);
        let chained = Cursor::new(prefix).chain(reader);
        if is_gzip {
            let mut decoder = GzDecoder::new(chained);
            copy_with_buffer(&mut decoder, &mut writer, chunk_size)
                .map_err(|e| ParseError::Io(e.to_string()))?;
        } else {
            let mut decoder = DeflateDecoder::new(chained);
            copy_with_buffer(&mut decoder, &mut writer, chunk_size)
                .map_err(|e| ParseError::Io(e.to_string()))?;
        }
    }
    writer.flush().map_err(|e| ParseError::Io(e.to_string()))?;

    validate_sqlite_file_header(writer.get_ref())
}

fn validate_sqlite_file_header(file: &File) -> ParseResult<()> {
    let mut file = file
        .try_clone()
        .map_err(|e| ParseError::Io(e.to_string()))?;
    file.rewind().map_err(|e| ParseError::Io(e.to_string()))?;

    let mut header = [0u8; 16];
    file.read_exact(&mut header)
        .map_err(|e| ParseError::Io(e.to_string()))?;
    if &header != SQLITE_HEADER_MAGIC {
        return Err(ParseError::InvalidData(
            "decoded .duc payload does not start with SQLite header".to_string(),
        ));
    }
    Ok(())
}

fn copy_with_buffer<R: Read, W: Write>(
    reader: &mut R,
    writer: &mut W,
    buffer_size: usize,
) -> io::Result<u64> {
    let mut buffer = vec![0u8; buffer_size];
    let mut total = 0u64;
    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        writer.write_all(&buffer[..bytes_read])?;
        total = total.checked_add(bytes_read as u64).ok_or_else(|| {
            io::Error::new(io::ErrorKind::InvalidData, "streamed byte count overflow")
        })?;
    }
    Ok(total)
}

fn ensure_revision_exists(conn: &Connection, revision_id: &str) -> ParseResult<()> {
    let exists = conn
        .query_row(
            "SELECT 1 FROM external_file_revisions WHERE id = ?1",
            params![revision_id],
            |_| Ok(()),
        )
        .optional()?
        .is_some();
    if !exists {
        return Err(ParseError::InvalidData(format!(
            "external file revision {revision_id} was not found"
        )));
    }
    Ok(())
}

fn ensure_checkpoint_exists(conn: &Connection, checkpoint_id: &str) -> ParseResult<()> {
    let exists = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM checkpoints WHERE id = ?1)",
        params![checkpoint_id],
        |row| row.get::<_, i32>(0),
    )? != 0;
    if exists {
        Ok(())
    } else {
        Err(ParseError::InvalidData(format!(
            "checkpoint {checkpoint_id} does not exist"
        )))
    }
}

fn ensure_delta_exists(conn: &Connection, delta_id: &str) -> ParseResult<()> {
    let exists = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM deltas WHERE id = ?1)",
        params![delta_id],
        |row| row.get::<_, i32>(0),
    )? != 0;
    if exists {
        Ok(())
    } else {
        Err(ParseError::InvalidData(format!(
            "delta {delta_id} does not exist"
        )))
    }
}

fn read_legacy_revision_data(conn: &Connection, revision_id: &str) -> ParseResult<Option<Vec<u8>>> {
    if external_file_chunks::table_exists(conn, "external_file_revision_data")? {
        let data = conn
            .query_row(
                "SELECT data FROM external_file_revision_data WHERE revision_id = ?1",
                params![revision_id],
                |row| row.get::<_, Vec<u8>>(0),
            )
            .optional()?;
        return Ok(data);
    }

    let data = conn
        .query_row(
            "SELECT data FROM external_file_revisions WHERE id = ?1",
            params![revision_id],
            |row| row.get::<_, Vec<u8>>(0),
        )
        .optional()?;
    Ok(data)
}

fn remove_sqlite_temp_files(path: &Path) {
    let _ = fs::remove_file(path);
    if let Some(path_str) = path.to_str() {
        for suffix in ["-wal", "-shm", "-journal"] {
            let _ = fs::remove_file(format!("{path_str}{suffix}"));
        }
    }
}
