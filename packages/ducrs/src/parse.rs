//! Parses a `.duc` SQLite binary (byte vector) into an [`ExportedDataState`].
//!
//! Flow: raw bytes → in-memory SQLite DB → ExportedDataState
//!
//! The inverse of [`crate::serialize::serialize`].

use rusqlite::{params, Connection};
use std::os::raw::c_char;
use std::collections::HashMap;

use crate::db;
use crate::types::*;

#[derive(Debug)]
pub enum ParseError {
    Db(db::DbError),
    Sqlite(rusqlite::Error),
    Io(String),
    InvalidData(String),
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::Db(e) => write!(f, "db: {e}"),
            ParseError::Sqlite(e) => write!(f, "sqlite: {e}"),
            ParseError::Io(e) => write!(f, "io: {e}"),
            ParseError::InvalidData(e) => write!(f, "invalid data: {e}"),
        }
    }
}

impl std::error::Error for ParseError {}

impl From<db::DbError> for ParseError {
    fn from(e: db::DbError) -> Self { ParseError::Db(e) }
}
impl From<rusqlite::Error> for ParseError {
    fn from(e: rusqlite::Error) -> Self { ParseError::Sqlite(e) }
}

pub type ParseResult<T> = Result<T, ParseError>;
const SQLITE_HEADER_MAGIC: &[u8; 16] = b"SQLite format 3\0";

// ─── Public entry point ──────────────────────────────────────────────────────

/// Parse a `.duc` file (raw bytes) into an [`ExportedDataState`].
pub fn parse(buf: &[u8]) -> ParseResult<ExportedDataState> {
    let conn = load_db_bytes(buf)?;

    let (id, version, source, data_type, thumbnail) = read_document(&conn)?;
    let duc_global_state = read_global_state(&conn)?;
    let duc_local_state = read_local_state(&conn)?;
    let dictionary = read_dictionary(&conn)?;
    let layers = read_layers(&conn)?;
    let groups = read_groups(&conn)?;
    let regions = read_regions(&conn)?;
    let (blocks, block_instances, block_collections) = read_blocks(&conn)?;
    let elements = read_elements(&conn)?;
    let external_files = read_external_files(&conn)?;
    let version_graph = read_version_graph(&conn)?;

    Ok(ExportedDataState {
        id,
        version,
        source,
        data_type,
        dictionary,
        thumbnail,
        elements,
        blocks,
        block_instances,
        block_collections,
        groups,
        regions,
        layers,
        duc_local_state,
        duc_global_state,
        version_graph,
        external_files,
    })
}

/// Parse a `.duc` file but skip the heavy external-file data blobs.
///
/// Returns `external_files: None` — callers can fetch individual files
/// later via [`get_external_file`].
pub fn parse_lazy(buf: &[u8]) -> ParseResult<ExportedDataState> {
    let conn = load_db_bytes(buf)?;

    let (id, version, source, data_type, thumbnail) = read_document(&conn)?;
    let duc_global_state = read_global_state(&conn)?;
    let duc_local_state = read_local_state(&conn)?;
    let dictionary = read_dictionary(&conn)?;
    let layers = read_layers(&conn)?;
    let groups = read_groups(&conn)?;
    let regions = read_regions(&conn)?;
    let (blocks, block_instances, block_collections) = read_blocks(&conn)?;
    let elements = read_elements(&conn)?;
    let version_graph = read_version_graph(&conn)?;

    Ok(ExportedDataState {
        id,
        version,
        source,
        data_type,
        dictionary,
        thumbnail,
        elements,
        blocks,
        block_instances,
        block_collections,
        groups,
        regions,
        layers,
        duc_local_state,
        duc_global_state,
        version_graph,
        external_files: None,
    })
}

/// Fetch a single external file from a `.duc` buffer by file ID.
pub fn get_external_file(buf: &[u8], file_id: &str) -> ParseResult<Option<DucExternalFileEntry>> {
    let conn = load_db_bytes(buf)?;
    let mut stmt = conn.prepare(
        "SELECT id, mime_type, data, created, last_retrieved, version FROM external_files WHERE id = ?1"
    )?;
    let result = stmt.query_row(params![file_id], |row| {
        let id: String = row.get(0)?;
        Ok(DucExternalFileEntry {
            key: id.clone(),
            value: DucExternalFileData {
                id,
                mime_type: row.get(1)?,
                data: row.get(2)?,
                created: row.get(3)?,
                last_retrieved: row.get(4)?,
                version: row.get(5)?,
            },
        })
    });
    match result {
        Ok(entry) => Ok(Some(entry)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// List metadata for all external files (without the heavy data blobs).
pub fn list_external_files(buf: &[u8]) -> ParseResult<Vec<ExternalFileMetadata>> {
    let conn = load_db_bytes(buf)?;
    let mut stmt = conn.prepare(
        "SELECT id, mime_type, created, last_retrieved, version FROM external_files"
    )?;
    let files: Vec<ExternalFileMetadata> = stmt.query_map([], |row| {
        Ok(ExternalFileMetadata {
            id: row.get(0)?,
            mime_type: row.get(1)?,
            created: row.get(2)?,
            last_retrieved: row.get(3)?,
            version: row.get(4)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    Ok(files)
}

// ─── Database import ─────────────────────────────────────────────────────────

fn load_db_bytes(buf: &[u8]) -> ParseResult<Connection> {
    if buf.is_empty() {
        return Err(ParseError::InvalidData("empty .duc buffer".into()));
    }

    // New format: compressed by default (no custom header).
    // Backward compatibility: accept legacy raw SQLite bytes as-is.
    let decompressed;
    let raw = if is_sqlite_header(buf) {
        buf
    } else {
        decompressed = decompress_duc_bytes(buf).map_err(|e| {
            ParseError::InvalidData(format!(
                "input is neither raw SQLite nor valid compressed SQLite stream: {e}"
            ))
        })?;
        if !is_sqlite_header(&decompressed) {
            return Err(ParseError::InvalidData(
                "decompressed payload does not start with SQLite header".into(),
            ));
        }
        &decompressed
    };

    let info = parse_sqlite_header(raw)?;

    let mut candidates: Vec<(&str, &[u8])> = vec![("full", raw)];
    if info.expected_size <= raw.len() && info.expected_size > 0 && info.expected_size != raw.len() {
        candidates.push(("header-expected", &raw[..info.expected_size]));
    }
    let page_aligned = (raw.len() / info.page_size) * info.page_size;
    if page_aligned > 0 && page_aligned != raw.len() && page_aligned != info.expected_size {
        candidates.push(("page-aligned", &raw[..page_aligned]));
    }

    let mut errors = Vec::new();
    for (label, candidate) in candidates {
        match deserialize_image(candidate) {
            Ok(conn) => return Ok(conn),
            Err(err) => {
                errors.push(format!("{label}({} bytes): {err}", candidate.len()));
            }
        }
    }

    Err(ParseError::InvalidData(format!(
        "failed to deserialize/read sqlite image (input={} bytes, page_size={}, page_count={}, expected={}): {}",
        raw.len(),
        info.page_size,
        info.page_count,
        info.expected_size,
        errors.join(" | ")
    )))
}

#[inline]
fn is_sqlite_header(buf: &[u8]) -> bool {
    buf.len() >= SQLITE_HEADER_MAGIC.len() && &buf[..SQLITE_HEADER_MAGIC.len()] == SQLITE_HEADER_MAGIC
}

/// Inflate a compressed deflate payload.
fn decompress_duc_bytes(compressed: &[u8]) -> ParseResult<Vec<u8>> {
    use flate2::read::DeflateDecoder;
    use std::io::Read;

    let mut decoder = DeflateDecoder::new(compressed);
    let mut out = Vec::new();
    decoder
        .read_to_end(&mut out)
        .map_err(|e| ParseError::Io(format!("DUCz decompression failed: {e}")))?;
    Ok(out)
}

fn deserialize_image(buf: &[u8]) -> ParseResult<Connection> {
    let conn = Connection::open_in_memory().map_err(ParseError::Sqlite)?;
    let mut image = buf.to_vec();

    // Header bytes 18/19 are read/write format versions:
    // 1 = rollback journal, 2 = WAL.
    // For standalone deserialized images in wasm (no sidecar files), WAL mode
    // can lead SQLite to attempt journal/wal handling that surfaces CANTOPEN.
    // Normalize to rollback mode for read-only parsing.
    if image.len() > 19 {
        if image[18] == 2 {
            image[18] = 1;
        }
        if image[19] == 2 {
            image[19] = 1;
        }
    }

    let n = image.len();
    let db_name = b"main\0";

    let mem = unsafe { rusqlite::ffi::sqlite3_malloc64(n as u64) as *mut u8 };
    if mem.is_null() {
        return Err(ParseError::Io("sqlite3_malloc64 failed".into()));
    }

    unsafe {
        std::ptr::copy_nonoverlapping(image.as_ptr(), mem, n);
    }

    // Allow SQLite to manage deserialized pages in-memory without touching files.
    let flags = (rusqlite::ffi::SQLITE_DESERIALIZE_FREEONCLOSE
        | rusqlite::ffi::SQLITE_DESERIALIZE_RESIZEABLE) as u32;
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
        return Err(ParseError::InvalidData(format!(
            "sqlite3_deserialize failed with code {rc}"
        )));
    }

    // Read-only parse path. Avoid journal transitions.
    conn.execute_batch("PRAGMA query_only = ON;")
        .map_err(|e| ParseError::InvalidData(format!(
            "failed to enable query_only after deserialize: {e}"
        )))?;

    conn.query_row("SELECT count(*) FROM sqlite_master", [], |_row| Ok(()))
        .map_err(|e| ParseError::InvalidData(format!(
            "deserialized database is not readable: {e}"
        )))?;

    Ok(conn)
}

struct SqliteHeaderInfo {
    page_size: usize,
    page_count: usize,
    expected_size: usize,
}

fn parse_sqlite_header(buf: &[u8]) -> ParseResult<SqliteHeaderInfo> {
    if buf.len() < 100 {
        return Err(ParseError::InvalidData(
            "buffer too small for SQLite header".into(),
        ));
    }

    let magic = b"SQLite format 3\0";
    if &buf[..16] != magic {
        return Err(ParseError::InvalidData(
            "missing SQLite header magic".into(),
        ));
    }

    let page_size_raw = u16::from_be_bytes([buf[16], buf[17]]) as usize;
    let page_size = if page_size_raw == 1 { 65_536 } else { page_size_raw };
    if page_size < 512 || page_size > 65_536 || (page_size & (page_size - 1)) != 0 {
        return Err(ParseError::InvalidData(format!(
            "invalid SQLite page_size in header: {page_size}"
        )));
    }

    let page_count = u32::from_be_bytes([buf[28], buf[29], buf[30], buf[31]]) as usize;
    if page_count == 0 {
        return Err(ParseError::InvalidData(
            "invalid SQLite page_count=0 in header".into(),
        ));
    }

    let expected_size = page_size
        .checked_mul(page_count)
        .ok_or_else(|| ParseError::InvalidData("SQLite size overflow".into()))?;

    if buf.len() < expected_size {
        return Err(ParseError::InvalidData(format!(
            "truncated SQLite image: have {} bytes, expected at least {}",
            buf.len(),
            expected_size
        )));
    }

    Ok(SqliteHeaderInfo {
        page_size,
        page_count,
        expected_size,
    })
}

// ─── Enum helpers ────────────────────────────────────────────────────────────

fn int_to_vertical_align(v: i32) -> VERTICAL_ALIGN {
    match v {
        10 => VERTICAL_ALIGN::TOP,
        11 => VERTICAL_ALIGN::MIDDLE,
        12 => VERTICAL_ALIGN::BOTTOM,
        _ => VERTICAL_ALIGN::TOP,
    }
}
fn int_to_text_align(v: i32) -> TEXT_ALIGN {
    match v {
        10 => TEXT_ALIGN::LEFT,
        11 => TEXT_ALIGN::CENTER,
        12 => TEXT_ALIGN::RIGHT,
        _ => TEXT_ALIGN::LEFT,
    }
}
fn int_to_line_spacing_type(v: i32) -> LINE_SPACING_TYPE {
    match v {
        10 => LINE_SPACING_TYPE::AT_LEAST,
        11 => LINE_SPACING_TYPE::EXACTLY,
        12 => LINE_SPACING_TYPE::MULTIPLE,
        _ => LINE_SPACING_TYPE::AT_LEAST,
    }
}
fn int_to_stroke_placement(v: i32) -> STROKE_PLACEMENT {
    match v {
        10 => STROKE_PLACEMENT::INSIDE,
        11 => STROKE_PLACEMENT::CENTER,
        12 => STROKE_PLACEMENT::OUTSIDE,
        _ => STROKE_PLACEMENT::CENTER,
    }
}
fn int_to_stroke_preference(v: i32) -> STROKE_PREFERENCE {
    match v {
        10 => STROKE_PREFERENCE::SOLID,
        11 => STROKE_PREFERENCE::DASHED,
        12 => STROKE_PREFERENCE::DOTTED,
        13 => STROKE_PREFERENCE::CUSTOM,
        _ => STROKE_PREFERENCE::SOLID,
    }
}
fn int_to_stroke_side_preference(v: i32) -> STROKE_SIDE_PREFERENCE {
    match v {
        10 => STROKE_SIDE_PREFERENCE::TOP,
        11 => STROKE_SIDE_PREFERENCE::BOTTOM,
        12 => STROKE_SIDE_PREFERENCE::LEFT,
        13 => STROKE_SIDE_PREFERENCE::RIGHT,
        14 => STROKE_SIDE_PREFERENCE::CUSTOM,
        15 => STROKE_SIDE_PREFERENCE::ALL,
        _ => STROKE_SIDE_PREFERENCE::ALL,
    }
}
fn int_to_stroke_cap(v: i32) -> STROKE_CAP {
    match v {
        10 => STROKE_CAP::BUTT,
        11 => STROKE_CAP::ROUND,
        12 => STROKE_CAP::SQUARE,
        _ => STROKE_CAP::ROUND,
    }
}
fn int_to_stroke_join(v: i32) -> STROKE_JOIN {
    match v {
        10 => STROKE_JOIN::MITER,
        11 => STROKE_JOIN::ROUND,
        12 => STROKE_JOIN::BEVEL,
        _ => STROKE_JOIN::ROUND,
    }
}
fn int_to_line_head(v: i32) -> LINE_HEAD {
    match v {
        10 => LINE_HEAD::ARROW,
        11 => LINE_HEAD::BAR,
        12 => LINE_HEAD::CIRCLE,
        13 => LINE_HEAD::CIRCLE_OUTLINED,
        14 => LINE_HEAD::TRIANGLE,
        15 => LINE_HEAD::TRIANGLE_OUTLINED,
        16 => LINE_HEAD::DIAMOND,
        17 => LINE_HEAD::DIAMOND_OUTLINED,
        18 => LINE_HEAD::CROSS,
        19 => LINE_HEAD::OPEN_ARROW,
        20 => LINE_HEAD::REVERSED_ARROW,
        21 => LINE_HEAD::REVERSED_TRIANGLE,
        22 => LINE_HEAD::REVERSED_TRIANGLE_OUTLINED,
        23 => LINE_HEAD::CONE,
        24 => LINE_HEAD::HALF_CONE,
        _ => LINE_HEAD::ARROW,
    }
}
fn int_to_bezier_mirroring(v: i32) -> BEZIER_MIRRORING {
    match v {
        10 => BEZIER_MIRRORING::NONE,
        11 => BEZIER_MIRRORING::ANGLE,
        12 => BEZIER_MIRRORING::ANGLE_LENGTH,
        _ => BEZIER_MIRRORING::NONE,
    }
}
fn int_to_blending(v: i32) -> BLENDING {
    match v {
        11 => BLENDING::MULTIPLY,
        12 => BLENDING::SCREEN,
        13 => BLENDING::OVERLAY,
        14 => BLENDING::DARKEN,
        15 => BLENDING::LIGHTEN,
        16 => BLENDING::DIFFERENCE,
        17 => BLENDING::EXCLUSION,
        _ => BLENDING::MULTIPLY,
    }
}
fn int_to_content_preference(v: i32) -> ELEMENT_CONTENT_PREFERENCE {
    match v {
        12 => ELEMENT_CONTENT_PREFERENCE::SOLID,
        14 => ELEMENT_CONTENT_PREFERENCE::FILL,
        15 => ELEMENT_CONTENT_PREFERENCE::FIT,
        16 => ELEMENT_CONTENT_PREFERENCE::TILE,
        17 => ELEMENT_CONTENT_PREFERENCE::STRETCH,
        18 => ELEMENT_CONTENT_PREFERENCE::HATCH,
        _ => ELEMENT_CONTENT_PREFERENCE::SOLID,
    }
}
fn int_to_hatch_style(v: i32) -> HATCH_STYLE {
    match v {
        10 => HATCH_STYLE::NORMAL,
        11 => HATCH_STYLE::OUTER,
        12 => HATCH_STYLE::IGNORE,
        _ => HATCH_STYLE::NORMAL,
    }
}
fn int_to_image_status(v: i32) -> IMAGE_STATUS {
    match v {
        10 => IMAGE_STATUS::PENDING,
        11 => IMAGE_STATUS::SAVED,
        12 => IMAGE_STATUS::ERROR,
        _ => IMAGE_STATUS::PENDING,
    }
}
fn int_to_pruning_level(v: i32) -> PRUNING_LEVEL {
    match v {
        10 => PRUNING_LEVEL::CONSERVATIVE,
        20 => PRUNING_LEVEL::BALANCED,
        30 => PRUNING_LEVEL::AGGRESSIVE,
        _ => PRUNING_LEVEL::BALANCED,
    }
}
fn int_to_boolean_operation(v: i32) -> BOOLEAN_OPERATION {
    match v {
        10 => BOOLEAN_OPERATION::UNION,
        11 => BOOLEAN_OPERATION::SUBTRACT,
        12 => BOOLEAN_OPERATION::INTERSECT,
        13 => BOOLEAN_OPERATION::EXCLUDE,
        _ => BOOLEAN_OPERATION::UNION,
    }
}

/// Unpack a BLOB of little-endian f64 values.
fn blob_to_f64_vec(blob: &[u8]) -> Vec<f64> {
    blob.chunks_exact(8)
        .map(|c| f64::from_le_bytes(c.try_into().unwrap()))
        .collect()
}

/// Unpack a BLOB of little-endian f32 values.
fn blob_to_f32_vec(blob: &[u8]) -> Vec<f32> {
    blob.chunks_exact(4)
        .map(|c| f32::from_le_bytes(c.try_into().unwrap()))
        .collect()
}

// ─── duc_document ────────────────────────────────────────────────────────────

fn read_document(conn: &Connection) -> ParseResult<(Option<String>, String, String, String, Option<Vec<u8>>)> {
    let mut stmt = conn.prepare("SELECT id, version, source, data_type, thumbnail FROM duc_document LIMIT 1")?;
    let result = stmt.query_row([], |row| {
        let id: String = row.get(0)?;
        let version: String = row.get(1)?;
        let source: String = row.get(2)?;
        let data_type: String = row.get(3)?;
        let thumbnail: Option<Vec<u8>> = row.get(4)?;
        let id_opt = if id.is_empty() { None } else { Some(id) };
        Ok((id_opt, version, source, data_type, thumbnail))
    });

    match result {
        Ok(v) => Ok(v),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok((None, String::new(), String::new(), String::new(), None)),
        Err(e) => Err(e.into()),
    }
}

// ─── duc_global_state ────────────────────────────────────────────────────────

fn read_global_state(conn: &Connection) -> ParseResult<Option<DucGlobalState>> {
    let mut stmt = conn.prepare(
        "SELECT name, view_background_color, main_scope, scope_exponent_threshold, pruning_level
         FROM duc_global_state WHERE id = 1"
    )?;
    let result = stmt.query_row([], |row| {
        Ok(DucGlobalState {
            name: row.get(0)?,
            view_background_color: row.get(1)?,
            main_scope: row.get(2)?,
            scope_exponent_threshold: row.get(3)?,
            pruning_level: int_to_pruning_level(row.get(4)?),
        })
    });

    match result {
        Ok(gs) => Ok(Some(gs)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

// ─── duc_local_state ─────────────────────────────────────────────────────────

fn read_local_state(conn: &Connection) -> ParseResult<Option<DucLocalState>> {
    let mut stmt = conn.prepare(
        "SELECT scope, scroll_x, scroll_y, zoom, is_binding_enabled,
                current_item_opacity, current_item_font_family, current_item_font_size,
                current_item_text_align, current_item_roundness,
                start_head_type, start_head_block_id, start_head_size,
                end_head_type, end_head_block_id, end_head_size,
                pen_mode, view_mode_enabled, objects_snap_mode_enabled,
                grid_mode_enabled, outline_mode_enabled, manual_save_mode,
                decimal_places
         FROM duc_local_state WHERE id = 1"
    )?;
    let result = stmt.query_row([], |row| {
        let start_head_type: Option<i32> = row.get(10)?;
        let start_head = match start_head_type {
            Some(_) => Some(DucHead {
                head_type: row.get::<_, Option<i32>>(10)?.map(int_to_line_head),
                block_id: row.get(11)?,
                size: row.get::<_, Option<f64>>(12)?.unwrap_or(1.0),
            }),
            None => None,
        };

        let end_head_type: Option<i32> = row.get(13)?;
        let end_head = match end_head_type {
            Some(_) => Some(DucHead {
                head_type: row.get::<_, Option<i32>>(13)?.map(int_to_line_head),
                block_id: row.get(14)?,
                size: row.get::<_, Option<f64>>(15)?.unwrap_or(1.0),
            }),
            None => None,
        };

        Ok(DucLocalState {
            scope: row.get(0)?,
            scroll_x: row.get(1)?,
            scroll_y: row.get(2)?,
            zoom: row.get(3)?,
            is_binding_enabled: row.get::<_, i32>(4)? != 0,
            current_item_stroke: None, // loaded below
            current_item_background: None, // loaded below
            current_item_opacity: row.get(5)?,
            current_item_font_family: row.get(6)?,
            current_item_font_size: row.get(7)?,
            current_item_text_align: int_to_text_align(row.get(8)?),
            current_item_start_line_head: start_head,
            current_item_end_line_head: end_head,
            current_item_roundness: row.get(9)?,
            pen_mode: row.get::<_, i32>(16)? != 0,
            view_mode_enabled: row.get::<_, i32>(17)? != 0,
            objects_snap_mode_enabled: row.get::<_, i32>(18)? != 0,
            grid_mode_enabled: row.get::<_, i32>(19)? != 0,
            outline_mode_enabled: row.get::<_, i32>(20)? != 0,
            manual_save_mode: row.get::<_, i32>(21)? != 0,
            decimal_places: row.get(22)?,
        })
    });

    match result {
        Ok(mut ls) => {
            let strokes = read_strokes(conn, "local_state", "1")?;
            ls.current_item_stroke = strokes.into_iter().next();
            let bgs = read_backgrounds(conn, "local_state", "1")?;
            ls.current_item_background = bgs.into_iter().next();
            Ok(Some(ls))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

// ─── dictionary ──────────────────────────────────────────────────────────────

fn read_dictionary(conn: &Connection) -> ParseResult<Option<HashMap<String, String>>> {
    let mut stmt = conn.prepare("SELECT key, value FROM document_dictionary")?;
    let mut map = HashMap::new();
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    for row in rows {
        let (k, v) = row?;
        map.insert(k, v);
    }

    if map.is_empty() { Ok(None) } else { Ok(Some(map)) }
}

// ─── layers, groups, regions ─────────────────────────────────────────────────

fn read_stack_base(conn: &Connection, id: &str) -> ParseResult<DucStackBase> {
    let mut stmt = conn.prepare_cached(
        "SELECT label, description, is_collapsed, is_plot, is_visible, locked, opacity
         FROM stack_properties WHERE id = ?1"
    )?;
    Ok(stmt.query_row(params![id], |row| {
        Ok(DucStackBase {
            label: row.get(0)?,
            description: row.get(1)?,
            is_collapsed: row.get::<_, i32>(2)? != 0,
            is_plot: row.get::<_, i32>(3)? != 0,
            is_visible: row.get::<_, i32>(4)? != 0,
            locked: row.get::<_, i32>(5)? != 0,
            styles: DucStackLikeStyles { opacity: row.get(6)? },
        })
    })?)
}

fn read_layers(conn: &Connection) -> ParseResult<Vec<DucLayer>> {
    let mut stmt = conn.prepare("SELECT id, readonly FROM layers")?;
    let rows: Vec<(String, i32)> = stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut layers = Vec::with_capacity(rows.len());
    for (id, readonly) in rows {
        let stack_base = read_stack_base(conn, &id)?;

        let strokes = read_strokes(conn, "layer", &id)?;
        let bgs = read_backgrounds(conn, "layer", &id)?;
        let overrides = if !strokes.is_empty() || !bgs.is_empty() {
            Some(DucLayerOverrides {
                stroke: strokes.into_iter().next().unwrap_or_else(default_stroke),
                background: bgs.into_iter().next().unwrap_or_else(default_background),
            })
        } else {
            None
        };

        layers.push(DucLayer {
            id,
            stack_base,
            readonly: readonly != 0,
            overrides,
        });
    }
    Ok(layers)
}

fn read_groups(conn: &Connection) -> ParseResult<Vec<DucGroup>> {
    let mut stmt = conn.prepare("SELECT id FROM groups")?;
    let ids: Vec<String> = stmt.query_map([], |row| row.get(0))?.collect::<Result<Vec<_>, _>>()?;

    let mut groups = Vec::with_capacity(ids.len());
    for id in ids {
        let stack_base = read_stack_base(conn, &id)?;
        groups.push(DucGroup { id, stack_base });
    }
    Ok(groups)
}

fn read_regions(conn: &Connection) -> ParseResult<Vec<DucRegion>> {
    let mut stmt = conn.prepare("SELECT id, boolean_operation FROM regions")?;
    let rows: Vec<(String, i32)> = stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut regions = Vec::with_capacity(rows.len());
    for (id, bool_op) in rows {
        let stack_base = read_stack_base(conn, &id)?;
        regions.push(DucRegion {
            id,
            stack_base,
            boolean_operation: int_to_boolean_operation(bool_op),
        });
    }
    Ok(regions)
}

// ─── blocks ──────────────────────────────────────────────────────────────────

fn read_blocks(conn: &Connection) -> ParseResult<(Vec<DucBlock>, Vec<DucBlockInstance>, Vec<DucBlockCollection>)> {
    // Blocks
    let mut b_stmt = conn.prepare(
        "SELECT id, label, description, version FROM blocks"
    )?;
    let blocks: Vec<DucBlock> = b_stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        Ok((id, row.get(1)?, row.get(2)?, row.get(3)?))
    })?.collect::<Result<Vec<(String, String, Option<String>, i32)>, _>>()?
    .into_iter()
    .map(|(id, label, description, version)| {
        let (metadata, thumbnail) = read_block_metadata(conn, "block", &id).unwrap_or((None, None));
        DucBlock { id, label, description, version, metadata, thumbnail }
    }).collect();

    // Block instances
    let mut i_stmt = conn.prepare(
        "SELECT id, block_id, version, dup_rows, dup_cols, dup_row_spacing, dup_col_spacing
         FROM block_instances"
    )?;
    let instances: Vec<DucBlockInstance> = i_stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let dup_rows: Option<i32> = row.get(3)?;
        let duplication_array = dup_rows.map(|rows| DucBlockDuplicationArray {
            rows,
            cols: row.get::<_, i32>(4).unwrap_or(1),
            row_spacing: row.get::<_, f64>(5).unwrap_or(0.0),
            col_spacing: row.get::<_, f64>(6).unwrap_or(0.0),
        });
        Ok(DucBlockInstance {
            id: id.clone(),
            block_id: row.get(1)?,
            version: row.get(2)?,
            element_overrides: None, // loaded below
            duplication_array,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    let instances: Vec<DucBlockInstance> = instances.into_iter().map(|mut inst| {
        let mut ov_stmt = conn.prepare_cached(
            "SELECT key, value FROM block_instance_overrides WHERE instance_id = ?1"
        ).unwrap();
        let overrides: Vec<StringValueEntry> = ov_stmt.query_map(params![inst.id], |row| {
            Ok(StringValueEntry { key: row.get(0)?, value: row.get(1)? })
        }).unwrap().collect::<Result<Vec<_>, _>>().unwrap_or_default();
        inst.element_overrides = if overrides.is_empty() { None } else { Some(overrides) };
        inst
    }).collect();

    // Block collections
    let mut c_stmt = conn.prepare("SELECT id, label FROM block_collections")?;
    let collections: Vec<DucBlockCollection> = c_stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        Ok((id, row.get(1)?))
    })?.collect::<Result<Vec<(String, String)>, _>>()?
    .into_iter()
    .map(|(id, label)| {
        let (metadata, thumbnail) = read_block_metadata(conn, "collection", &id).unwrap_or((None, None));
        let mut e_stmt = conn.prepare_cached(
            "SELECT child_id, is_collection FROM block_collection_entries WHERE collection_id = ?1"
        ).unwrap();
        let children: Vec<DucBlockCollectionEntry> = e_stmt.query_map(params![id], |row| {
            Ok(DucBlockCollectionEntry {
                id: row.get(0)?,
                is_collection: row.get::<_, i32>(1)? != 0,
            })
        }).unwrap().collect::<Result<Vec<_>, _>>().unwrap_or_default();
        DucBlockCollection { id, label, children, metadata, thumbnail }
    }).collect();

    Ok((blocks, instances, collections))
}

fn read_block_metadata(conn: &Connection, owner_type: &str, owner_id: &str) -> ParseResult<(Option<DucBlockMetadata>, Option<Vec<u8>>)> {
    let mut stmt = conn.prepare_cached(
        "SELECT source, usage_count, created_at, updated_at, localization, thumbnail
         FROM block_metadata WHERE owner_type = ?1 AND owner_id = ?2"
    )?;
    let result = stmt.query_row(params![owner_type, owner_id], |row| {
        Ok((
            DucBlockMetadata {
                source: row.get(0)?,
                usage_count: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                localization: row.get(4)?,
            },
            row.get::<_, Option<Vec<u8>>>(5)?,
        ))
    });

    match result {
        Ok((meta, thumb)) => Ok((Some(meta), thumb)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok((None, None)),
        Err(e) => Err(e.into()),
    }
}

// ─── elements ────────────────────────────────────────────────────────────────

fn read_elements(conn: &Connection) -> ParseResult<Vec<ElementWrapper>> {
    let mut stmt = conn.prepare(
        "SELECT id, element_type,
                x, y, width, height, angle,
                scope, label, description, is_visible,
                seed, version, version_nonce, updated, \"index\",
                is_plot, is_deleted,
                roundness, blending, opacity,
                instance_id, layer_id, frame_id,
                z_index, link, locked, custom_data
         FROM elements ORDER BY z_index ASC"
    )?;

    let rows: Vec<(String, String, DucElementBase)> = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let element_type: String = row.get(1)?;

        let base = DucElementBase {
            id: id.clone(),
            x: row.get(2)?,
            y: row.get(3)?,
            width: row.get(4)?,
            height: row.get(5)?,
            angle: row.get(6)?,
            scope: row.get(7)?,
            label: row.get(8)?,
            description: row.get(9)?,
            is_visible: row.get::<_, i32>(10)? != 0,
            seed: row.get(11)?,
            version: row.get(12)?,
            version_nonce: row.get(13)?,
            updated: row.get(14)?,
            index: row.get(15)?,
            is_plot: row.get::<_, i32>(16)? != 0,
            is_deleted: row.get::<_, i32>(17)? != 0,
            styles: DucElementStylesBase {
                roundness: row.get(18)?,
                blending: row.get::<_, Option<i32>>(19)?.map(int_to_blending),
                opacity: row.get(20)?,
                background: Vec::new(), // loaded below
                stroke: Vec::new(),     // loaded below
            },
            instance_id: row.get(21)?,
            layer_id: row.get(22)?,
            frame_id: row.get(23)?,
            z_index: row.get(24)?,
            link: row.get(25)?,
            locked: row.get::<_, i32>(26)? != 0,
            custom_data: row.get(27)?,
            group_ids: Vec::new(),  // loaded below
            block_ids: Vec::new(),  // loaded below
            region_ids: Vec::new(), // loaded below
            bound_elements: None,   // loaded below
        };

        Ok((id, element_type, base))
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut elements = Vec::with_capacity(rows.len());
    for (id, element_type, mut base) in rows {
        // Load backgrounds & strokes
        base.styles.background = read_backgrounds(conn, "element", &id)?;
        base.styles.stroke = read_strokes(conn, "element", &id)?;

        // Load memberships
        base.group_ids = read_string_list(conn,
            "SELECT group_id FROM element_group_memberships WHERE element_id = ?1 ORDER BY sort_order", &id)?;
        base.block_ids = read_string_list(conn,
            "SELECT block_id FROM element_block_memberships WHERE element_id = ?1 ORDER BY sort_order", &id)?;
        base.region_ids = read_string_list(conn,
            "SELECT region_id FROM element_region_memberships WHERE element_id = ?1 ORDER BY sort_order", &id)?;

        // Bound elements
        base.bound_elements = read_bound_elements(conn, &id)?;

        let element = match element_type.as_str() {
            "rectangle" => DucElementEnum::DucRectangleElement(DucRectangleElement { base }),
            "polygon" => read_polygon_element(conn, base)?,
            "ellipse" => read_ellipse_element(conn, base)?,
            "embeddable" => DucElementEnum::DucEmbeddableElement(DucEmbeddableElement { base }),
            "text" => read_text_element(conn, base)?,
            "image" => read_image_element(conn, base)?,
            "freedraw" => read_freedraw_element(conn, base)?,
            "line" => read_linear_element(conn, base, false)?,
            "arrow" => read_linear_element(conn, base, true)?,
            "frame" => read_frame_element(conn, base)?,
            "plot" => read_plot_element(conn, base)?,
            "pdf" => read_pdf_element(conn, base)?,
            "doc" => read_doc_element(conn, base)?,
            "table" => read_table_element(conn, base)?,
            "model" => read_model_element(conn, base)?,
            _ => return Err(ParseError::InvalidData(format!("unknown element type: {element_type}"))),
        };

        elements.push(ElementWrapper { element });
    }

    Ok(elements)
}

fn read_string_list(conn: &Connection, sql: &str, id: &str) -> ParseResult<Vec<String>> {
    let mut stmt = conn.prepare_cached(sql)?;
    let list: Vec<String> = stmt.query_map(params![id], |row| row.get(0))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(list)
}

fn read_bound_elements(conn: &Connection, element_id: &str) -> ParseResult<Option<Vec<BoundElement>>> {
    let mut stmt = conn.prepare_cached(
        "SELECT bound_element_id, bound_type FROM element_bound_elements
         WHERE element_id = ?1 ORDER BY sort_order"
    )?;
    let bound: Vec<BoundElement> = stmt.query_map(params![element_id], |row| {
        Ok(BoundElement {
            id: row.get(0)?,
            element_type: row.get(1)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    if bound.is_empty() { Ok(None) } else { Ok(Some(bound)) }
}

// ─── element type readers ────────────────────────────────────────────────────

fn read_polygon_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let mut stmt = conn.prepare_cached("SELECT sides FROM element_polygon WHERE element_id = ?1")?;
    let sides: i32 = stmt.query_row(params![base.id], |row| row.get(0))?;
    Ok(DucElementEnum::DucPolygonElement(DucPolygonElement { base, sides }))
}

fn read_ellipse_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT ratio, start_angle, end_angle, show_aux_crosshair FROM element_ellipse WHERE element_id = ?1"
    )?;
    let e = stmt.query_row(params![id], |row| {
        Ok(DucEllipseElement {
            base,
            ratio: row.get(0)?,
            start_angle: row.get(1)?,
            end_angle: row.get(2)?,
            show_aux_crosshair: row.get::<_, i32>(3)? != 0,
        })
    })?;
    Ok(DucElementEnum::DucEllipseElement(e))
}

fn read_text_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT text, original_text, auto_resize, container_id,
                is_ltr, font_family, big_font_family, text_align, vertical_align,
                line_height, line_spacing_value, line_spacing_type,
                oblique_angle, font_size, width_factor,
                is_upside_down, is_backwards
         FROM element_text WHERE element_id = ?1"
    )?;
    let e = stmt.query_row(params![id], |row| {
        Ok(DucTextElement {
            base,
            text: row.get(0)?,
            original_text: row.get(1)?,
            auto_resize: row.get::<_, i32>(2)? != 0,
            container_id: row.get(3)?,
            style: DucTextStyle {
                is_ltr: row.get::<_, i32>(4)? != 0,
                font_family: row.get(5)?,
                big_font_family: row.get(6)?,
                text_align: int_to_text_align(row.get(7)?),
                vertical_align: int_to_vertical_align(row.get(8)?),
                line_height: row.get(9)?,
                line_spacing: LineSpacing {
                    value: row.get(10)?,
                    line_type: row.get::<_, Option<i32>>(11)?.map(int_to_line_spacing_type),
                },
                oblique_angle: row.get(12)?,
                font_size: row.get(13)?,
                width_factor: row.get(14)?,
                is_upside_down: row.get::<_, i32>(15)? != 0,
                is_backwards: row.get::<_, i32>(16)? != 0,
            },
        })
    })?;
    Ok(DucElementEnum::DucTextElement(e))
}

fn read_image_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT file_id, status, scale_x, scale_y,
                crop_x, crop_y, crop_width, crop_height, crop_natural_width, crop_natural_height,
                filter_brightness, filter_contrast
         FROM element_image WHERE element_id = ?1"
    )?;
    let e = stmt.query_row(params![id], |row| {
        let crop_x: Option<f64> = row.get(4)?;
        let crop = crop_x.map(|x| ImageCrop {
            x,
            y: row.get::<_, f64>(5).unwrap_or(0.0),
            width: row.get::<_, f64>(6).unwrap_or(0.0),
            height: row.get::<_, f64>(7).unwrap_or(0.0),
            natural_width: row.get::<_, f64>(8).unwrap_or(0.0),
            natural_height: row.get::<_, f64>(9).unwrap_or(0.0),
        });
        let brightness: Option<f32> = row.get(10)?;
        let filter = brightness.map(|b| DucImageFilter {
            brightness: b,
            contrast: row.get::<_, f32>(11).unwrap_or(1.0),
        });

        Ok(DucImageElement {
            base,
            file_id: row.get(0)?,
            status: int_to_image_status(row.get(1)?),
            scale: vec![row.get(2)?, row.get(3)?],
            crop,
            filter,
        })
    })?;
    Ok(DucElementEnum::DucImageElement(e))
}

fn read_freedraw_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT size, thinning, smoothing, streamline, easing,
                start_cap, start_taper, start_easing,
                end_cap, end_taper, end_easing,
                pressures, simulate_pressure,
                last_committed_point_x, last_committed_point_y, last_committed_point_mirror,
                svg_path
         FROM element_freedraw WHERE element_id = ?1"
    )?;
    let mut e = stmt.query_row(params![id], |row| {
        let start_cap: Option<i32> = row.get(5)?;
        let start = start_cap.map(|cap| DucFreeDrawEnds {
            cap: cap != 0,
            taper: row.get::<_, f32>(6).unwrap_or(0.0),
            easing: row.get::<_, String>(7).unwrap_or_default(),
        });
        let end_cap: Option<i32> = row.get(8)?;
        let end = end_cap.map(|cap| DucFreeDrawEnds {
            cap: cap != 0,
            taper: row.get::<_, f32>(9).unwrap_or(0.0),
            easing: row.get::<_, String>(10).unwrap_or_default(),
        });

        let pressures_blob: Option<Vec<u8>> = row.get(11)?;
        let pressures = pressures_blob.map(|b| blob_to_f32_vec(&b)).unwrap_or_default();

        let lcp_x: Option<f64> = row.get(13)?;
        let last_committed_point = lcp_x.map(|x| DucPoint {
            x,
            y: row.get::<_, f64>(14).unwrap_or(0.0),
            mirroring: row.get::<_, Option<i32>>(15).ok().flatten().map(int_to_bezier_mirroring),
        });

        Ok(DucFreeDrawElement {
            base,
            points: Vec::new(), // loaded below
            size: row.get(0)?,
            thinning: row.get(1)?,
            smoothing: row.get(2)?,
            streamline: row.get(3)?,
            easing: row.get(4)?,
            start,
            end,
            pressures,
            simulate_pressure: row.get::<_, i32>(12)? != 0,
            last_committed_point,
            svg_path: row.get(16)?,
        })
    })?;

    e.points = read_duc_points(conn,
        "SELECT x, y, mirroring FROM freedraw_element_points WHERE element_id = ?1 ORDER BY sort_order",
        &id)?;

    Ok(DucElementEnum::DucFreeDrawElement(e))
}

fn read_linear_element(conn: &Connection, base: DucElementBase, is_arrow: bool) -> ParseResult<DucElementEnum> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT last_committed_point_x, last_committed_point_y, last_committed_point_mirror,
                start_binding_element_id, start_binding_focus, start_binding_gap,
                start_binding_fixed_point_x, start_binding_fixed_point_y,
                start_binding_point_index, start_binding_point_offset,
                start_binding_head_type, start_binding_head_block_id, start_binding_head_size,
                end_binding_element_id, end_binding_focus, end_binding_gap,
                end_binding_fixed_point_x, end_binding_fixed_point_y,
                end_binding_point_index, end_binding_point_offset,
                end_binding_head_type, end_binding_head_block_id, end_binding_head_size,
                wipeout_below, elbowed
         FROM element_linear WHERE element_id = ?1"
    )?;

    let (mut linear_base, wipeout_below, elbowed) = stmt.query_row(params![id], |row| {
        let lcp_x: Option<f64> = row.get(0)?;
        let last_committed_point = lcp_x.map(|x| DucPoint {
            x,
            y: row.get::<_, f64>(1).unwrap_or(0.0),
            mirroring: row.get::<_, Option<i32>>(2).ok().flatten().map(int_to_bezier_mirroring),
        });

        let start_binding = read_binding_from_row(row, 3)?;
        let end_binding = read_binding_from_row(row, 13)?;

        let wipeout: i32 = row.get(23)?;
        let elbowed_val: i32 = row.get(24)?;

        Ok((
            DucLinearElementBase {
                base,
                points: Vec::new(),
                lines: Vec::new(),
                path_overrides: Vec::new(),
                last_committed_point,
                start_binding,
                end_binding,
            },
            wipeout != 0,
            elbowed_val != 0,
        ))
    })?;

    // Points
    linear_base.points = read_duc_points(conn,
        "SELECT x, y, mirroring FROM linear_element_points WHERE element_id = ?1 ORDER BY sort_order",
        &id)?;

    // Lines
    {
        let mut l_stmt = conn.prepare_cached(
            "SELECT start_index, start_handle_x, start_handle_y, end_index, end_handle_x, end_handle_y
             FROM linear_element_lines WHERE element_id = ?1 ORDER BY sort_order"
        )?;
        linear_base.lines = l_stmt.query_map(params![id], |row| {
            Ok(DucLine {
                start: DucLineReference {
                    index: row.get(0)?,
                    handle: match row.get::<_, Option<f64>>(1)? {
                        Some(x) => Some(GeometricPoint { x, y: row.get::<_, f64>(2).unwrap_or(0.0) }),
                        None => None,
                    },
                },
                end: DucLineReference {
                    index: row.get(3)?,
                    handle: match row.get::<_, Option<f64>>(4)? {
                        Some(x) => Some(GeometricPoint { x, y: row.get::<_, f64>(5).unwrap_or(0.0) }),
                        None => None,
                    },
                },
            })
        })?.collect::<Result<Vec<_>, _>>()?;
    }

    // Path overrides
    {
        let mut po_stmt = conn.prepare_cached(
            "SELECT id, sort_order FROM linear_path_overrides WHERE element_id = ?1 ORDER BY sort_order"
        )?;
        let path_rows: Vec<(i64, i32)> = po_stmt.query_map(params![id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>, _>>()?;

        for (path_id, _sort) in path_rows {
            let mut idx_stmt = conn.prepare_cached(
                "SELECT line_index FROM linear_path_override_indices
                 WHERE path_override_id = ?1 ORDER BY sort_order"
            )?;
            let line_indices: Vec<i32> = idx_stmt.query_map(params![path_id], |row| row.get(0))?
                .collect::<Result<Vec<_>, _>>()?;

            let pid_str = path_id.to_string();
            let bgs = read_backgrounds(conn, "path_override", &pid_str)?;
            let sts = read_strokes(conn, "path_override", &pid_str)?;

            linear_base.path_overrides.push(DucPath {
                line_indices,
                background: bgs.into_iter().next(),
                stroke: sts.into_iter().next(),
            });
        }
    }

    if is_arrow {
        Ok(DucElementEnum::DucArrowElement(DucArrowElement { linear_base, elbowed }))
    } else {
        Ok(DucElementEnum::DucLinearElement(DucLinearElement { linear_base, wipeout_below }))
    }
}

fn read_binding_from_row(row: &rusqlite::Row, offset: usize) -> rusqlite::Result<Option<DucPointBinding>> {
    let elem_id: Option<String> = row.get(offset)?;
    let Some(element_id) = elem_id else { return Ok(None) };

    let fixed_x: Option<f64> = row.get(offset + 4)?;
    let fixed_point = fixed_x.map(|x| GeometricPoint {
        x,
        y: row.get::<_, f64>(offset + 5).unwrap_or(0.0),
    });

    let pt_idx: Option<i32> = row.get(offset + 6)?;
    let point = pt_idx.map(|index| PointBindingPoint {
        index,
        offset: row.get::<_, f64>(offset + 7).unwrap_or(0.0),
    });

    let head_type: Option<i32> = row.get(offset + 8)?;
    let head = head_type.map(|ht| DucHead {
        head_type: Some(int_to_line_head(ht)),
        block_id: row.get::<_, Option<String>>(offset + 9).unwrap_or(None),
        size: row.get::<_, f64>(offset + 10).unwrap_or(1.0),
    });

    Ok(Some(DucPointBinding {
        element_id,
        focus: row.get(offset + 1)?,
        gap: row.get(offset + 2)?,
        fixed_point,
        point,
        head,
    }))
}

fn read_frame_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let stack_element_base = read_stack_element_base(conn, base)?;
    Ok(DucElementEnum::DucFrameElement(DucFrameElement { stack_element_base }))
}

fn read_plot_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let stack_element_base = read_stack_element_base(conn, base)?;
    let mut stmt = conn.prepare_cached(
        "SELECT margin_top, margin_right, margin_bottom, margin_left
         FROM element_plot WHERE element_id = ?1"
    )?;
    let margins = stmt.query_row(params![stack_element_base.base.id], |row| {
        Ok(Margins {
            top: row.get(0)?,
            right: row.get(1)?,
            bottom: row.get(2)?,
            left: row.get(3)?,
        })
    })?;

    Ok(DucElementEnum::DucPlotElement(DucPlotElement {
        stack_element_base,
        style: DucPlotStyle {},
        layout: PlotLayout { margins },
    }))
}

fn read_stack_element_base(conn: &Connection, base: DucElementBase) -> ParseResult<DucStackElementBase> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT label, description, is_collapsed, is_plot, is_visible, locked, opacity, clip, label_visible
         FROM element_stack_properties WHERE element_id = ?1"
    )?;
    Ok(stmt.query_row(params![id], |row| {
        Ok(DucStackElementBase {
            base,
            stack_base: DucStackBase {
                label: row.get(0)?,
                description: row.get(1)?,
                is_collapsed: row.get::<_, i32>(2)? != 0,
                is_plot: row.get::<_, i32>(3)? != 0,
                is_visible: row.get::<_, i32>(4)? != 0,
                locked: row.get::<_, i32>(5)? != 0,
                styles: DucStackLikeStyles { opacity: row.get(6)? },
            },
            clip: row.get::<_, i32>(7)? != 0,
            label_visible: row.get::<_, i32>(8)? != 0,
        })
    })?)
}

fn read_pdf_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let (file_id, grid_config) = read_document_grid_config(conn, &base.id)?;
    Ok(DucElementEnum::DucPdfElement(DucPdfElement { base, file_id, grid_config }))
}

fn read_doc_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let (file_id, grid_config) = read_document_grid_config(conn, &base.id)?;
    let mut stmt = conn.prepare_cached(
        "SELECT text FROM element_doc WHERE element_id = ?1"
    )?;
    let text: String = stmt.query_row(params![base.id], |row| row.get(0))?;
    Ok(DucElementEnum::DucDocElement(DucDocElement {
        base,
        style: DucDocStyle {},
        text,
        grid_config,
        file_id,
    }))
}

fn read_document_grid_config(conn: &Connection, element_id: &str) -> ParseResult<(Option<String>, DocumentGridConfig)> {
    let mut stmt = conn.prepare_cached(
        "SELECT file_id, grid_columns, grid_gap_x, grid_gap_y, grid_first_page_alone, grid_scale
         FROM document_grid_config WHERE element_id = ?1"
    )?;
    Ok(stmt.query_row(params![element_id], |row| {
        Ok((
            row.get(0)?,
            DocumentGridConfig {
                columns: row.get(1)?,
                gap_x: row.get(2)?,
                gap_y: row.get(3)?,
                first_page_alone: row.get::<_, i32>(4)? != 0,
                scale: row.get(5)?,
            },
        ))
    })?)
}

fn read_table_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let mut stmt = conn.prepare_cached("SELECT file_id FROM element_table WHERE element_id = ?1")?;
    let file_id: Option<String> = stmt.query_row(params![base.id], |row| row.get(0))?;
    Ok(DucElementEnum::DucTableElement(DucTableElement {
        base,
        style: DucTableStyle {},
        file_id,
    }))
}

fn read_model_element(conn: &Connection, base: DucElementBase) -> ParseResult<DucElementEnum> {
    let id = base.id.clone();
    let mut stmt = conn.prepare_cached(
        "SELECT model_type, code, svg_path FROM element_model WHERE element_id = ?1"
    )?;
    let (model_type, code, svg_path) = stmt.query_row(params![id], |row| {
        Ok((row.get::<_, Option<String>>(0)?, row.get::<_, Option<String>>(1)?, row.get::<_, Option<String>>(2)?))
    })?;

    let mut f_stmt = conn.prepare_cached(
        "SELECT file_id FROM model_element_files WHERE element_id = ?1 ORDER BY sort_order"
    )?;
    let file_ids: Vec<String> = f_stmt.query_map(params![id], |row| row.get(0))?
        .collect::<Result<Vec<_>, _>>()?;

    let viewer_state = read_model_viewer_state(conn, &id)?;

    Ok(DucElementEnum::DucModelElement(DucModelElement {
        base, model_type, code, svg_path, file_ids, viewer_state,
    }))
}

fn read_model_viewer_state(conn: &Connection, element_id: &str) -> ParseResult<Option<Viewer3DState>> {
    let mut stmt = conn.prepare_cached(
        "SELECT
            camera_control, camera_ortho, camera_up,
            camera_position_x, camera_position_y, camera_position_z,
            camera_quaternion_x, camera_quaternion_y, camera_quaternion_z, camera_quaternion_w,
            camera_target_x, camera_target_y, camera_target_z,
            camera_zoom, camera_pan_speed, camera_rotate_speed, camera_zoom_speed, camera_holroyd,
            display_wireframe, display_transparent, display_black_edges,
            display_grid_uniform, display_grid_xy, display_grid_xz, display_grid_yz,
            display_axes_visible, display_axes_at_origin,
            material_metalness, material_roughness, material_default_opacity,
            material_edge_color, material_ambient_intensity, material_direct_intensity,
            clip_x_enabled, clip_x_value, clip_x_normal_x, clip_x_normal_y, clip_x_normal_z,
            clip_y_enabled, clip_y_value, clip_y_normal_x, clip_y_normal_y, clip_y_normal_z,
            clip_z_enabled, clip_z_value, clip_z_normal_x, clip_z_normal_y, clip_z_normal_z,
            clip_intersection, clip_show_planes, clip_object_color_caps,
            explode_active, explode_value,
            zebra_active, zebra_stripe_count, zebra_stripe_direction,
            zebra_color_scheme, zebra_opacity, zebra_mapping_mode
         FROM model_viewer_state WHERE element_id = ?1"
    )?;

    let result = stmt.query_row(params![element_id], |row| {
        let grid_uniform: Option<i32> = row.get(21)?;
        let grid = match grid_uniform {
            Some(v) => Viewer3DGrid::Uniform(v != 0),
            None => Viewer3DGrid::PerPlane(Viewer3DGridPlanes {
                xy: row.get::<_, i32>(22)? != 0,
                xz: row.get::<_, i32>(23)? != 0,
                yz: row.get::<_, i32>(24)? != 0,
            }),
        };

        fn read_clip(row: &rusqlite::Row, offset: usize) -> rusqlite::Result<Viewer3DClipPlane> {
            let nx: Option<f64> = row.get(offset + 2)?;
            let normal = nx.map(|x| [
                x,
                row.get::<_, f64>(offset + 3).unwrap_or(0.0),
                row.get::<_, f64>(offset + 4).unwrap_or(0.0),
            ]);
            Ok(Viewer3DClipPlane {
                enabled: row.get::<_, i32>(offset)? != 0,
                value: row.get(offset + 1)?,
                normal,
            })
        }

        Ok(Viewer3DState {
            camera: Viewer3DCamera {
                control: row.get(0)?,
                ortho: row.get::<_, i32>(1)? != 0,
                up: row.get(2)?,
                position: [row.get(3)?, row.get(4)?, row.get(5)?],
                quaternion: [row.get(6)?, row.get(7)?, row.get(8)?, row.get(9)?],
                target: [row.get(10)?, row.get(11)?, row.get(12)?],
                zoom: row.get(13)?,
                pan_speed: row.get(14)?,
                rotate_speed: row.get(15)?,
                zoom_speed: row.get(16)?,
                holroyd: row.get::<_, i32>(17)? != 0,
            },
            display: Viewer3DDisplay {
                wireframe: row.get::<_, i32>(18)? != 0,
                transparent: row.get::<_, i32>(19)? != 0,
                black_edges: row.get::<_, i32>(20)? != 0,
                grid,
                axes_visible: row.get::<_, i32>(25)? != 0,
                axes_at_origin: row.get::<_, i32>(26)? != 0,
            },
            material: Viewer3DMaterial {
                metalness: row.get(27)?,
                roughness: row.get(28)?,
                default_opacity: row.get(29)?,
                edge_color: row.get(30)?,
                ambient_intensity: row.get(31)?,
                direct_intensity: row.get(32)?,
            },
            clipping: Viewer3DClipping {
                x: read_clip(row, 33)?,
                y: read_clip(row, 38)?,
                z: read_clip(row, 43)?,
                intersection: row.get::<_, i32>(48)? != 0,
                show_planes: row.get::<_, i32>(49)? != 0,
                object_color_caps: row.get::<_, i32>(50)? != 0,
            },
            explode: Viewer3DExplode {
                active: row.get::<_, i32>(51)? != 0,
                value: row.get(52)?,
            },
            zebra: Viewer3DZebra {
                active: row.get::<_, i32>(53)? != 0,
                stripe_count: row.get(54)?,
                stripe_direction: row.get(55)?,
                color_scheme: row.get(56)?,
                opacity: row.get(57)?,
                mapping_mode: row.get(58)?,
            },
        })
    });

    match result {
        Ok(vs) => Ok(Some(vs)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

// ─── shared point reader ─────────────────────────────────────────────────────

fn read_duc_points(conn: &Connection, sql: &str, id: &str) -> ParseResult<Vec<DucPoint>> {
    let mut stmt = conn.prepare_cached(sql)?;
    let points: Vec<DucPoint> = stmt.query_map(params![id], |row| {
        Ok(DucPoint {
            x: row.get(0)?,
            y: row.get(1)?,
            mirroring: row.get::<_, Option<i32>>(2)?.map(int_to_bezier_mirroring),
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    Ok(points)
}

// ─── backgrounds & strokes ───────────────────────────────────────────────────

fn read_backgrounds(conn: &Connection, owner_type: &str, owner_id: &str) -> ParseResult<Vec<ElementBackground>> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, preference, src, visible, opacity,
                tiling_size_in_percent, tiling_angle, tiling_spacing, tiling_offset_x, tiling_offset_y,
                hatch_style, hatch_pattern_name, hatch_pattern_scale, hatch_pattern_angle,
                hatch_pattern_origin_x, hatch_pattern_origin_y, hatch_pattern_origin_mirror,
                hatch_pattern_double,
                hatch_custom_pattern_name, hatch_custom_pattern_desc,
                image_filter_brightness, image_filter_contrast
         FROM backgrounds WHERE owner_type = ?1 AND owner_id = ?2 ORDER BY sort_order"
    )?;

    let rows: Vec<(i64, ElementBackground)> = stmt.query_map(params![owner_type, owner_id], |row| {
        let bg_id: i64 = row.get(0)?;
        let content = read_element_content_base(row, 1)?;
        Ok((bg_id, ElementBackground { content }))
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut bgs = Vec::with_capacity(rows.len());
    for (bg_id, mut bg) in rows {
        if let Some(ref mut hatch) = bg.content.hatch {
            if let Some(ref mut cp) = hatch.custom_pattern {
                cp.lines = read_hatch_pattern_lines(conn, "background", bg_id)?;
            }
        }
        bgs.push(bg);
    }
    Ok(bgs)
}

fn read_strokes(conn: &Connection, owner_type: &str, owner_id: &str) -> ParseResult<Vec<ElementStroke>> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, preference, src, visible, opacity,
                tiling_size_in_percent, tiling_angle, tiling_spacing, tiling_offset_x, tiling_offset_y,
                hatch_style, hatch_pattern_name, hatch_pattern_scale, hatch_pattern_angle,
                hatch_pattern_origin_x, hatch_pattern_origin_y, hatch_pattern_origin_mirror,
                hatch_pattern_double,
                hatch_custom_pattern_name, hatch_custom_pattern_desc,
                image_filter_brightness, image_filter_contrast,
                width,
                style_preference, style_cap, style_join, style_dash, style_dash_line_override, style_dash_cap, style_miter_limit,
                placement,
                sides_preference, sides_values
         FROM strokes WHERE owner_type = ?1 AND owner_id = ?2 ORDER BY sort_order"
    )?;

    let rows: Vec<(i64, ElementStroke)> = stmt.query_map(params![owner_type, owner_id], |row| {
        let st_id: i64 = row.get(0)?;
        let content = read_element_content_base(row, 1)?;

        let dash_blob: Option<Vec<u8>> = row.get(26)?;
        let dash = dash_blob.map(|b| blob_to_f64_vec(&b));

        let sides_blob: Option<Vec<u8>> = row.get(32)?;
        let sides_pref: Option<i32> = row.get(31)?;
        let stroke_sides = if sides_pref.is_some() || sides_blob.is_some() {
            Some(StrokeSides {
                preference: sides_pref.map(int_to_stroke_side_preference),
                values: sides_blob.map(|b| blob_to_f64_vec(&b)),
            })
        } else {
            None
        };

        Ok((st_id, ElementStroke {
            content,
            width: row.get(22)?,
            style: StrokeStyle {
                preference: row.get::<_, Option<i32>>(23)?.map(int_to_stroke_preference),
                cap: row.get::<_, Option<i32>>(24)?.map(int_to_stroke_cap),
                join: row.get::<_, Option<i32>>(25)?.map(int_to_stroke_join),
                dash,
                dash_line_override: row.get(27)?,
                dash_cap: row.get::<_, Option<i32>>(28)?.map(int_to_stroke_cap),
                miter_limit: row.get(29)?,
            },
            placement: row.get::<_, Option<i32>>(30)?.map(int_to_stroke_placement),
            stroke_sides,
        }))
    })?.collect::<Result<Vec<_>, _>>()?;

    let mut strokes = Vec::with_capacity(rows.len());
    for (st_id, mut st) in rows {
        if let Some(ref mut hatch) = st.content.hatch {
            if let Some(ref mut cp) = hatch.custom_pattern {
                cp.lines = read_hatch_pattern_lines(conn, "stroke", st_id)?;
            }
        }
        strokes.push(st);
    }
    Ok(strokes)
}

fn read_element_content_base(row: &rusqlite::Row, offset: usize) -> rusqlite::Result<ElementContentBase> {
    let tiling_size: Option<f32> = row.get(offset + 4)?;
    let tiling = tiling_size.map(|size_in_percent| TilingProperties {
        size_in_percent,
        angle: row.get::<_, f64>(offset + 5).unwrap_or(0.0),
        spacing: row.get(offset + 6).ok().flatten(),
        offset_x: row.get(offset + 7).ok().flatten(),
        offset_y: row.get(offset + 8).ok().flatten(),
    });

    let hatch_style_val: Option<i32> = row.get(offset + 9)?;
    let hatch = hatch_style_val.map(|hs| {
        let custom_name: Option<String> = row.get(offset + 17).ok().flatten();
        let custom_pattern = custom_name.map(|name| CustomHatchPattern {
            name,
            description: row.get(offset + 18).ok().flatten(),
            lines: Vec::new(), // loaded separately
        });

        DucHatchStyle {
            hatch_style: int_to_hatch_style(hs),
            pattern_name: row.get::<_, String>(offset + 10).unwrap_or_default(),
            pattern_scale: row.get::<_, f32>(offset + 11).unwrap_or(1.0),
            pattern_angle: row.get::<_, f64>(offset + 12).unwrap_or(0.0),
            pattern_origin: DucPoint {
                x: row.get::<_, f64>(offset + 13).unwrap_or(0.0),
                y: row.get::<_, f64>(offset + 14).unwrap_or(0.0),
                mirroring: row.get::<_, Option<i32>>(offset + 15).ok().flatten().map(int_to_bezier_mirroring),
            },
            pattern_double: row.get::<_, Option<i32>>(offset + 16).ok().flatten().unwrap_or(0) != 0,
            custom_pattern,
        }
    });

    let brightness: Option<f32> = row.get(offset + 19)?;
    let image_filter = brightness.map(|b| DucImageFilter {
        brightness: b,
        contrast: row.get::<_, f32>(offset + 20).unwrap_or(1.0),
    });

    Ok(ElementContentBase {
        preference: row.get::<_, Option<i32>>(offset)?.map(int_to_content_preference),
        src: row.get(offset + 1)?,
        visible: row.get::<_, i32>(offset + 2)? != 0,
        opacity: row.get(offset + 3)?,
        tiling,
        hatch,
        image_filter,
    })
}

fn read_hatch_pattern_lines(conn: &Connection, owner_type: &str, owner_id: i64) -> ParseResult<Vec<HatchPatternLine>> {
    let mut stmt = conn.prepare_cached(
        "SELECT angle, origin_x, origin_y, origin_mirroring, offset_x, offset_y, dash_pattern
         FROM hatch_pattern_lines WHERE owner_type = ?1 AND owner_id = ?2 ORDER BY sort_order"
    )?;
    let lines: Vec<HatchPatternLine> = stmt.query_map(params![owner_type, owner_id], |row| {
        let dash_blob: Option<Vec<u8>> = row.get(6)?;
        let dash_pattern = dash_blob.map(|b| blob_to_f64_vec(&b)).unwrap_or_default();
        Ok(HatchPatternLine {
            angle: row.get(0)?,
            origin: DucPoint {
                x: row.get(1)?,
                y: row.get(2)?,
                mirroring: row.get::<_, Option<i32>>(3)?.map(int_to_bezier_mirroring),
            },
            offset: vec![row.get(4)?, row.get(5)?],
            dash_pattern,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    Ok(lines)
}

// ─── external_files ──────────────────────────────────────────────────────────

fn read_external_files(conn: &Connection) -> ParseResult<Option<HashMap<String, DucExternalFileData>>> {
    let mut stmt = conn.prepare(
        "SELECT id, mime_type, data, created, last_retrieved, version FROM external_files"
    )?;
    let mut map = HashMap::new();
    let rows = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        Ok((id.clone(), DucExternalFileData {
            id,
            mime_type: row.get(1)?,
            data: row.get(2)?,
            created: row.get(3)?,
            last_retrieved: row.get(4)?,
            version: row.get(5)?,
        }))
    })?;
    for row in rows {
        let (k, v) = row?;
        map.insert(k, v);
    }

    if map.is_empty() { Ok(None) } else { Ok(Some(map)) }
}

// ─── version_graph ───────────────────────────────────────────────────────────

fn read_version_graph(conn: &Connection) -> ParseResult<Option<VersionGraph>> {
    // Check if version_graph table exists and has data
    let has_table: bool = conn.prepare(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='version_graph'"
    )?.query_row([], |row| row.get::<_, i32>(0)).unwrap_or(0) > 0;

    if !has_table {
        return Ok(None);
    }

    let mut vg_stmt = conn.prepare(
        "SELECT current_version, current_schema_version, user_checkpoint_version_id,
                latest_version_id, chain_count, last_pruned, total_size
         FROM version_graph WHERE id = 1"
    )?;
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
        Err(e) => return Err(e.into()),
    };

    // Read migrations keyed by id
    let mut m_stmt = conn.prepare(
        "SELECT id, from_schema_version, to_schema_version, migration_name,
                migration_checksum, applied_at, boundary_checkpoint_id
         FROM schema_migrations"
    )?;
    let migrations: HashMap<i64, SchemaMigration> = m_stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        Ok((id, SchemaMigration {
            from_schema_version: row.get(1)?,
            to_schema_version: row.get(2)?,
            migration_name: row.get(3)?,
            migration_checksum: row.get(4)?,
            applied_at: row.get(5)?,
            boundary_checkpoint_id: row.get(6)?,
        }))
    })?.collect::<Result<HashMap<_, _>, _>>().unwrap_or_default();

    // Version chains
    let mut ch_stmt = conn.prepare(
        "SELECT id, schema_version, start_version, end_version, migration_id, root_checkpoint_id
         FROM version_chains ORDER BY start_version"
    )?;
    let chains: Vec<VersionChain> = ch_stmt.query_map([], |row| {
        let mig_id: Option<i64> = row.get(4)?;
        Ok(VersionChain {
            id: row.get(0)?,
            schema_version: row.get(1)?,
            start_version: row.get(2)?,
            end_version: row.get(3)?,
            migration: mig_id.and_then(|mid| migrations.get(&mid).cloned()),
            root_checkpoint_id: row.get(5)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    // Checkpoints
    let mut cp_stmt = conn.prepare(
        "SELECT id, parent_id, version_number, schema_version, timestamp,
                description, is_manual_save, is_schema_boundary, user_id, data, size_bytes
         FROM checkpoints ORDER BY version_number"
    )?;
    let checkpoints: Vec<Checkpoint> = cp_stmt.query_map([], |row| {
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
    })?.collect::<Result<Vec<_>, _>>()?;

    // Deltas
    let mut d_stmt = conn.prepare(
        "SELECT id, parent_id, base_checkpoint_id, version_number, schema_version,
                timestamp, description, is_manual_save, user_id, changeset, size_bytes
         FROM deltas ORDER BY version_number"
    )?;
    let deltas: Vec<Delta> = d_stmt.query_map([], |row| {
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
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(Some(VersionGraph {
        user_checkpoint_version_id: user_cp_id,
        latest_version_id: latest_id,
        chains,
        checkpoints,
        deltas,
        metadata,
    }))
}

// ─── defaults ────────────────────────────────────────────────────────────────

fn default_stroke() -> ElementStroke {
    ElementStroke {
        content: ElementContentBase {
            preference: None,
            src: String::new(),
            visible: true,
            opacity: 1.0,
            tiling: None,
            hatch: None,
            image_filter: None,
        },
        width: 1.0,
        style: StrokeStyle {
            preference: None,
            cap: None,
            join: None,
            dash: None,
            dash_line_override: None,
            dash_cap: None,
            miter_limit: None,
        },
        placement: None,
        stroke_sides: None,
    }
}

fn default_background() -> ElementBackground {
    ElementBackground {
        content: ElementContentBase {
            preference: None,
            src: String::new(),
            visible: true,
            opacity: 1.0,
            tiling: None,
            hatch: None,
            image_filter: None,
        },
    }
}
