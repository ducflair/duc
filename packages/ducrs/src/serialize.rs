//! Serializes an [`ExportedDataState`] into a `.duc` SQLite binary (byte vector).
//!
//! Flow: ExportedDataState → in-memory SQLite DB → raw bytes
//!
//! The schema is applied via [`crate::db::open_memory`] so every output is a
//! valid `.duc` file that can be opened again with [`crate::parse::parse`].

use rusqlite::{params, Connection, Transaction};
use std::os::raw::c_char;

use crate::db;
use crate::types::*;

#[derive(Debug)]
pub enum SerializeError {
    Db(db::DbError),
    Sqlite(rusqlite::Error),
    Io(String),
}

impl std::fmt::Display for SerializeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SerializeError::Db(e) => write!(f, "db: {e}"),
            SerializeError::Sqlite(e) => write!(f, "sqlite: {e}"),
            SerializeError::Io(e) => write!(f, "io: {e}"),
        }
    }
}

impl std::error::Error for SerializeError {}

impl From<db::DbError> for SerializeError {
    fn from(e: db::DbError) -> Self { SerializeError::Db(e) }
}
impl From<rusqlite::Error> for SerializeError {
    fn from(e: rusqlite::Error) -> Self { SerializeError::Sqlite(e) }
}
impl From<std::io::Error> for SerializeError {
    fn from(e: std::io::Error) -> Self { SerializeError::Io(e.to_string()) }
}

pub type SerializeResult<T> = Result<T, SerializeError>;

// ─── Public entry point ──────────────────────────────────────────────────────

/// Serialize an [`ExportedDataState`] into a compressed `.duc` file (raw bytes).
///
/// Uses `page_size = 1024` and zlib compression for minimal output size.
/// The result can be parsed back with [`crate::parse::parse`].
pub fn serialize(state: &ExportedDataState) -> SerializeResult<Vec<u8>> {
    let conn = db::open_memory_compact()?;
    let mut inner = conn.into_inner();

    {
        // Temporarily disable FK checks during bulk insert so that
        // partially-consistent app state (e.g. elements referencing
        // groups/layers that weren't exported) doesn't abort the write.
        // FKs are re-enabled after the transaction so the resulting
        // file is still a valid database that enforces FKs on open.
        inner.execute_batch("PRAGMA foreign_keys = OFF;")?;

        let tx = inner.transaction()?;
        write_document(&tx, state)?;
        write_global_state(&tx, &state.duc_global_state)?;
        write_local_state(&tx, &state.duc_local_state)?;
        write_dictionary(&tx, &state.dictionary)?;
        write_stack_and_containers(&tx, state)?;
        write_blocks(&tx, state)?;
        write_elements(&tx, state)?;
        write_external_files(&tx, &state.external_files)?;
        write_version_graph(&tx, &state.version_graph)?;
        tx.commit()?;

        inner.execute_batch("PRAGMA foreign_keys = ON;")?;
    }

    // Reclaim any wasted pages before exporting.
    inner.execute_batch("VACUUM;")?;

    let raw = export_db_bytes(&inner)?;
    compress_duc_bytes(&raw)
}

// ─── Database export ─────────────────────────────────────────────────────────

fn export_db_bytes(conn: &Connection) -> SerializeResult<Vec<u8>> {
    // Use SQLite's in-memory serializer instead of filesystem temp files.
    // This works on native and wasm targets.
    let schema = b"main\0";

    let mut size: rusqlite::ffi::sqlite3_int64 = 0;
    let ptr = unsafe {
        rusqlite::ffi::sqlite3_serialize(
            conn.handle(),
            schema.as_ptr() as *const c_char,
            &mut size,
            0,
        )
    };

    if ptr.is_null() || size < 0 {
        return Err(SerializeError::Io(
            "sqlite3_serialize failed to export database bytes".into(),
        ));
    }

    let bytes = unsafe {
        let slice = std::slice::from_raw_parts(ptr as *const u8, size as usize);
        let out = slice.to_vec();
        rusqlite::ffi::sqlite3_free(ptr as *mut std::ffi::c_void);
        out
    };

    Ok(bytes)
}

/// Compress raw SQLite bytes using a zlib/deflate stream.
fn compress_duc_bytes(raw: &[u8]) -> SerializeResult<Vec<u8>> {
    use flate2::write::DeflateEncoder;
    use flate2::Compression;
    use std::io::Write;

    let mut encoder = DeflateEncoder::new(Vec::with_capacity(raw.len() / 4), Compression::default());
    encoder.write_all(raw)?;
    Ok(encoder.finish()?)
}

// ─── duc_document ────────────────────────────────────────────────────────────

fn write_document(tx: &Transaction, state: &ExportedDataState) -> SerializeResult<()> {
    tx.execute(
        "INSERT OR REPLACE INTO duc_document (id, version, source, data_type, thumbnail)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            state.id.as_deref().unwrap_or(""),
            state.version,
            state.source,
            state.data_type,
            state.thumbnail.as_deref(),
        ],
    )?;
    Ok(())
}

// ─── duc_global_state ────────────────────────────────────────────────────────

fn write_global_state(tx: &Transaction, gs: &Option<DucGlobalState>) -> SerializeResult<()> {
    let Some(gs) = gs else { return Ok(()) };
    tx.execute(
        "INSERT OR REPLACE INTO duc_global_state
            (id, name, view_background_color, main_scope, scope_exponent_threshold, pruning_level)
         VALUES (1, ?1, ?2, ?3, ?4, ?5)",
        params![
            gs.name,
            gs.view_background_color,
            gs.main_scope,
            gs.scope_exponent_threshold,
            gs.pruning_level as i32,
        ],
    )?;
    Ok(())
}

// ─── duc_local_state ─────────────────────────────────────────────────────────

fn write_local_state(tx: &Transaction, ls: &Option<DucLocalState>) -> SerializeResult<()> {
    let Some(ls) = ls else { return Ok(()) };
    tx.execute(
        "INSERT OR REPLACE INTO duc_local_state (
            id, scope, scroll_x, scroll_y, zoom,
            is_binding_enabled,
            current_item_opacity, current_item_font_family, current_item_font_size,
            current_item_text_align, current_item_roundness,
            start_head_type, start_head_block_id, start_head_size,
            end_head_type, end_head_block_id, end_head_size,
            pen_mode, view_mode_enabled, objects_snap_mode_enabled,
            grid_mode_enabled, outline_mode_enabled, manual_save_mode,
            decimal_places
        ) VALUES (
            1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
            ?11, ?12, ?13, ?14, ?15, ?16,
            ?17, ?18, ?19, ?20, ?21, ?22, ?23
        )",
        params![
            ls.scope,
            ls.scroll_x,
            ls.scroll_y,
            ls.zoom,
            ls.is_binding_enabled as i32,
            ls.current_item_opacity,
            ls.current_item_font_family,
            ls.current_item_font_size,
            ls.current_item_text_align as i32,
            ls.current_item_roundness,
            ls.current_item_start_line_head.as_ref().and_then(|h| h.head_type.map(|t| t as i32)),
            ls.current_item_start_line_head.as_ref().and_then(|h| h.block_id.clone()),
            ls.current_item_start_line_head.as_ref().map(|h| h.size),
            ls.current_item_end_line_head.as_ref().and_then(|h| h.head_type.map(|t| t as i32)),
            ls.current_item_end_line_head.as_ref().and_then(|h| h.block_id.clone()),
            ls.current_item_end_line_head.as_ref().map(|h| h.size),
            ls.pen_mode as i32,
            ls.view_mode_enabled as i32,
            ls.objects_snap_mode_enabled as i32,
            ls.grid_mode_enabled as i32,
            ls.outline_mode_enabled as i32,
            ls.manual_save_mode as i32,
            ls.decimal_places,
        ],
    )?;

    if let Some(ref stroke) = ls.current_item_stroke {
        write_stroke(tx, "local_state", "1", 0, stroke)?;
    }
    if let Some(ref bg) = ls.current_item_background {
        write_background(tx, "local_state", "1", 0, bg)?;
    }

    Ok(())
}

// ─── dictionary ──────────────────────────────────────────────────────────────

fn write_dictionary(tx: &Transaction, dict: &Option<std::collections::HashMap<String, String>>) -> SerializeResult<()> {
    let Some(dict) = dict else { return Ok(()) };
    let mut stmt = tx.prepare_cached(
        "INSERT OR REPLACE INTO document_dictionary (key, value) VALUES (?1, ?2)"
    )?;
    for (key, value) in dict {
        stmt.execute(params![key, value])?;
    }
    Ok(())
}

// ─── stack_properties, layers, groups, regions ───────────────────────────────

fn write_stack_base(tx: &Transaction, id: &str, sb: &DucStackBase) -> SerializeResult<()> {
    tx.execute(
        "INSERT OR REPLACE INTO stack_properties
            (id, label, description, is_collapsed, is_plot, is_visible, locked, opacity)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            id,
            sb.label,
            sb.description,
            sb.is_collapsed as i32,
            sb.is_plot as i32,
            sb.is_visible as i32,
            sb.locked as i32,
            sb.styles.opacity,
        ],
    )?;
    Ok(())
}

fn write_stack_and_containers(tx: &Transaction, state: &ExportedDataState) -> SerializeResult<()> {
    for layer in &state.layers {
        write_stack_base(tx, &layer.id, &layer.stack_base)?;
        tx.execute(
            "INSERT OR REPLACE INTO layers (id, readonly) VALUES (?1, ?2)",
            params![layer.id, layer.readonly as i32],
        )?;
        if let Some(ref ov) = layer.overrides {
            write_stroke(tx, "layer", &layer.id, 0, &ov.stroke)?;
            write_background(tx, "layer", &layer.id, 0, &ov.background)?;
        }
    }
    for group in &state.groups {
        write_stack_base(tx, &group.id, &group.stack_base)?;
        tx.execute(
            "INSERT OR REPLACE INTO groups (id) VALUES (?1)",
            params![group.id],
        )?;
    }
    for region in &state.regions {
        write_stack_base(tx, &region.id, &region.stack_base)?;
        tx.execute(
            "INSERT OR REPLACE INTO regions (id, boolean_operation) VALUES (?1, ?2)",
            params![region.id, region.boolean_operation as i32],
        )?;
    }
    Ok(())
}

// ─── blocks ──────────────────────────────────────────────────────────────────

fn write_blocks(tx: &Transaction, state: &ExportedDataState) -> SerializeResult<()> {
    for block in &state.blocks {
        tx.execute(
            "INSERT OR REPLACE INTO blocks (id, label, description, version)
             VALUES (?1, ?2, ?3, ?4)",
            params![block.id, block.label, block.description, block.version],
        )?;
        if let Some(ref meta) = block.metadata {
            write_block_metadata(tx, "block", &block.id, meta, block.thumbnail.as_deref())?;
        }
    }

    for inst in &state.block_instances {
        let (dup_rows, dup_cols, dup_row_sp, dup_col_sp) = match &inst.duplication_array {
            Some(da) => (Some(da.rows), Some(da.cols), Some(da.row_spacing), Some(da.col_spacing)),
            None => (None, None, None, None),
        };
        tx.execute(
            "INSERT OR REPLACE INTO block_instances
                (id, block_id, version, dup_rows, dup_cols, dup_row_spacing, dup_col_spacing)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![inst.id, inst.block_id, inst.version, dup_rows, dup_cols, dup_row_sp, dup_col_sp],
        )?;
        if let Some(ref overrides) = inst.element_overrides {
            let mut stmt = tx.prepare_cached(
                "INSERT OR REPLACE INTO block_instance_overrides (instance_id, key, value)
                 VALUES (?1, ?2, ?3)"
            )?;
            for ov in overrides {
                stmt.execute(params![inst.id, ov.key, ov.value])?;
            }
        }
    }

    for col in &state.block_collections {
        tx.execute(
            "INSERT OR REPLACE INTO block_collections (id, label) VALUES (?1, ?2)",
            params![col.id, col.label],
        )?;
        if let Some(ref meta) = col.metadata {
            write_block_metadata(tx, "collection", &col.id, meta, col.thumbnail.as_deref())?;
        }
        let mut stmt = tx.prepare_cached(
            "INSERT OR REPLACE INTO block_collection_entries (collection_id, child_id, is_collection)
             VALUES (?1, ?2, ?3)"
        )?;
        for child in &col.children {
            stmt.execute(params![col.id, child.id, child.is_collection as i32])?;
        }
    }

    Ok(())
}

fn write_block_metadata(
    tx: &Transaction,
    owner_type: &str,
    owner_id: &str,
    meta: &DucBlockMetadata,
    thumbnail: Option<&[u8]>,
) -> SerializeResult<()> {
    tx.execute(
        "INSERT OR REPLACE INTO block_metadata
            (owner_type, owner_id, source, usage_count, created_at, updated_at, localization, thumbnail)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            owner_type,
            owner_id,
            meta.source,
            meta.usage_count,
            meta.created_at,
            meta.updated_at,
            meta.localization,
            thumbnail,
        ],
    )?;
    Ok(())
}

// ─── elements ────────────────────────────────────────────────────────────────

fn write_elements(tx: &Transaction, state: &ExportedDataState) -> SerializeResult<()> {
    for wrapper in &state.elements {
        write_element_wrapper(tx, wrapper)?;
    }
    Ok(())
}

fn write_element_wrapper(tx: &Transaction, wrapper: &ElementWrapper) -> SerializeResult<()> {
    match &wrapper.element {
        DucElementEnum::DucRectangleElement(e) => {
            write_base_element(tx, "rectangle", &e.base)?;
        }
        DucElementEnum::DucPolygonElement(e) => {
            write_base_element(tx, "polygon", &e.base)?;
            tx.execute(
                "INSERT INTO element_polygon (element_id, sides) VALUES (?1, ?2)",
                params![e.base.id, e.sides],
            )?;
        }
        DucElementEnum::DucEllipseElement(e) => {
            write_base_element(tx, "ellipse", &e.base)?;
            tx.execute(
                "INSERT INTO element_ellipse (element_id, ratio, start_angle, end_angle, show_aux_crosshair)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![e.base.id, e.ratio, e.start_angle, e.end_angle, e.show_aux_crosshair as i32],
            )?;
        }
        DucElementEnum::DucEmbeddableElement(e) => {
            write_base_element(tx, "embeddable", &e.base)?;
            tx.execute(
                "INSERT INTO element_embeddable (element_id) VALUES (?1)",
                params![e.base.id],
            )?;
        }
        DucElementEnum::DucTextElement(e) => {
            write_base_element(tx, "text", &e.base)?;
            write_text_element(tx, e)?;
        }
        DucElementEnum::DucImageElement(e) => {
            write_base_element(tx, "image", &e.base)?;
            write_image_element(tx, e)?;
        }
        DucElementEnum::DucFreeDrawElement(e) => {
            write_base_element(tx, "freedraw", &e.base)?;
            write_freedraw_element(tx, e)?;
        }
        DucElementEnum::DucLinearElement(e) => {
            write_base_element(tx, "line", &e.linear_base.base)?;
            write_linear_element(tx, &e.linear_base, e.wipeout_below, false)?;
        }
        DucElementEnum::DucArrowElement(e) => {
            write_base_element(tx, "arrow", &e.linear_base.base)?;
            write_linear_element(tx, &e.linear_base, false, e.elbowed)?;
        }
        DucElementEnum::DucFrameElement(e) => {
            write_base_element(tx, "frame", &e.stack_element_base.base)?;
            write_stack_element_base(tx, &e.stack_element_base)?;
            tx.execute(
                "INSERT INTO element_frame (element_id) VALUES (?1)",
                params![e.stack_element_base.base.id],
            )?;
        }
        DucElementEnum::DucPlotElement(e) => {
            write_base_element(tx, "plot", &e.stack_element_base.base)?;
            write_stack_element_base(tx, &e.stack_element_base)?;
            tx.execute(
                "INSERT INTO element_plot (element_id, margin_top, margin_right, margin_bottom, margin_left)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    e.stack_element_base.base.id,
                    e.layout.margins.top,
                    e.layout.margins.right,
                    e.layout.margins.bottom,
                    e.layout.margins.left,
                ],
            )?;
        }
        DucElementEnum::DucPdfElement(e) => {
            write_base_element(tx, "pdf", &e.base)?;
            write_document_grid_config(tx, &e.base.id, e.file_id.as_deref(), &e.grid_config)?;
            tx.execute(
                "INSERT INTO element_pdf (element_id) VALUES (?1)",
                params![e.base.id],
            )?;
        }
        DucElementEnum::DucDocElement(e) => {
            write_base_element(tx, "doc", &e.base)?;
            write_document_grid_config(tx, &e.base.id, e.file_id.as_deref(), &e.grid_config)?;
            tx.execute(
                "INSERT INTO element_doc (element_id, text) VALUES (?1, ?2)",
                params![e.base.id, e.text],
            )?;
        }
        DucElementEnum::DucTableElement(e) => {
            write_base_element(tx, "table", &e.base)?;
            tx.execute(
                "INSERT INTO element_table (element_id, file_id) VALUES (?1, ?2)",
                params![e.base.id, e.file_id],
            )?;
        }
        DucElementEnum::DucModelElement(e) => {
            write_base_element(tx, "model", &e.base)?;
            write_model_element(tx, e)?;
        }
    }
    Ok(())
}

// ─── base element ────────────────────────────────────────────────────────────

fn write_base_element(tx: &Transaction, element_type: &str, base: &DucElementBase) -> SerializeResult<()> {
    tx.execute(
        "INSERT INTO elements (
            id, element_type,
            x, y, width, height, angle,
            scope, label, description, is_visible,
            seed, version, version_nonce, updated, \"index\",
            is_plot, is_deleted,
            roundness, blending, opacity,
            instance_id, layer_id, frame_id,
            z_index, link, locked, custom_data
        ) VALUES (
            ?1, ?2,
            ?3, ?4, ?5, ?6, ?7,
            ?8, ?9, ?10, ?11,
            ?12, ?13, ?14, ?15, ?16,
            ?17, ?18,
            ?19, ?20, ?21,
            ?22, ?23, ?24,
            ?25, ?26, ?27, ?28
        )",
        params![
            base.id, element_type,
            base.x, base.y, base.width, base.height, base.angle,
            base.scope, base.label, base.description, base.is_visible as i32,
            base.seed, base.version, base.version_nonce, base.updated, base.index,
            base.is_plot as i32, base.is_deleted as i32,
            base.styles.roundness, base.styles.blending.map(|b| b as i32), base.styles.opacity,
            base.instance_id, base.layer_id, base.frame_id,
            base.z_index, base.link, base.locked as i32, base.custom_data,
        ],
    )?;

    for (i, bg) in base.styles.background.iter().enumerate() {
        write_background(tx, "element", &base.id, i as i32, bg)?;
    }
    for (i, st) in base.styles.stroke.iter().enumerate() {
        write_stroke(tx, "element", &base.id, i as i32, st)?;
    }

    if let Some(ref bound) = base.bound_elements {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO element_bound_elements (element_id, bound_element_id, bound_type, sort_order)
             VALUES (?1, ?2, ?3, ?4)"
        )?;
        for (i, be) in bound.iter().enumerate() {
            stmt.execute(params![base.id, be.id, be.element_type, i as i32])?;
        }
    }

    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO element_group_memberships (element_id, group_id, sort_order) VALUES (?1, ?2, ?3)"
        )?;
        for (i, gid) in base.group_ids.iter().enumerate() {
            stmt.execute(params![base.id, gid, i as i32])?;
        }
    }

    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO element_block_memberships (element_id, block_id, sort_order) VALUES (?1, ?2, ?3)"
        )?;
        for (i, bid) in base.block_ids.iter().enumerate() {
            stmt.execute(params![base.id, bid, i as i32])?;
        }
    }

    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO element_region_memberships (element_id, region_id, sort_order) VALUES (?1, ?2, ?3)"
        )?;
        for (i, rid) in base.region_ids.iter().enumerate() {
            stmt.execute(params![base.id, rid, i as i32])?;
        }
    }

    Ok(())
}

// ─── element_stack_properties ────────────────────────────────────────────────

fn write_stack_element_base(tx: &Transaction, seb: &DucStackElementBase) -> SerializeResult<()> {
    tx.execute(
        "INSERT INTO element_stack_properties
            (element_id, label, description, is_collapsed, is_plot, is_visible, locked, opacity, clip, label_visible)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            seb.base.id,
            seb.stack_base.label,
            seb.stack_base.description,
            seb.stack_base.is_collapsed as i32,
            seb.stack_base.is_plot as i32,
            seb.stack_base.is_visible as i32,
            seb.stack_base.locked as i32,
            seb.stack_base.styles.opacity,
            seb.clip as i32,
            seb.label_visible as i32,
        ],
    )?;
    Ok(())
}

// ─── element_text ────────────────────────────────────────────────────────────

fn write_text_element(tx: &Transaction, e: &DucTextElement) -> SerializeResult<()> {
    tx.execute(
        "INSERT INTO element_text (
            element_id, text, original_text, auto_resize, container_id,
            is_ltr, font_family, big_font_family, text_align, vertical_align,
            line_height, line_spacing_value, line_spacing_type,
            oblique_angle, font_size, width_factor,
            is_upside_down, is_backwards
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
        params![
            e.base.id,
            e.text,
            e.original_text,
            e.auto_resize as i32,
            e.container_id,
            e.style.is_ltr as i32,
            e.style.font_family,
            e.style.big_font_family,
            e.style.text_align as i32,
            e.style.vertical_align as i32,
            e.style.line_height,
            e.style.line_spacing.value,
            e.style.line_spacing.line_type.map(|t| t as i32),
            e.style.oblique_angle,
            e.style.font_size,
            e.style.width_factor,
            e.style.is_upside_down as i32,
            e.style.is_backwards as i32,
        ],
    )?;
    Ok(())
}

// ─── element_image ───────────────────────────────────────────────────────────

fn write_image_element(tx: &Transaction, e: &DucImageElement) -> SerializeResult<()> {
    let scale_x = e.scale.first().copied().unwrap_or(1.0);
    let scale_y = e.scale.get(1).copied().unwrap_or(1.0);
    tx.execute(
        "INSERT INTO element_image (
            element_id, file_id, status, scale_x, scale_y,
            crop_x, crop_y, crop_width, crop_height, crop_natural_width, crop_natural_height,
            filter_brightness, filter_contrast
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            e.base.id,
            e.file_id,
            e.status as i32,
            scale_x,
            scale_y,
            e.crop.as_ref().map(|c| c.x),
            e.crop.as_ref().map(|c| c.y),
            e.crop.as_ref().map(|c| c.width),
            e.crop.as_ref().map(|c| c.height),
            e.crop.as_ref().map(|c| c.natural_width),
            e.crop.as_ref().map(|c| c.natural_height),
            e.filter.as_ref().map(|f| f.brightness),
            e.filter.as_ref().map(|f| f.contrast),
        ],
    )?;
    Ok(())
}

// ─── element_freedraw ────────────────────────────────────────────────────────

fn write_freedraw_element(tx: &Transaction, e: &DucFreeDrawElement) -> SerializeResult<()> {
    let pressures_blob: Option<Vec<u8>> = if e.pressures.is_empty() {
        None
    } else {
        Some(e.pressures.iter().flat_map(|p| p.to_le_bytes()).collect())
    };

    tx.execute(
        "INSERT INTO element_freedraw (
            element_id, size, thinning, smoothing, streamline, easing,
            start_cap, start_taper, start_easing,
            end_cap, end_taper, end_easing,
            pressures, simulate_pressure,
            last_committed_point_x, last_committed_point_y, last_committed_point_mirror,
            svg_path
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
        params![
            e.base.id,
            e.size,
            e.thinning,
            e.smoothing,
            e.streamline,
            e.easing,
            e.start.as_ref().map(|s| s.cap as i32),
            e.start.as_ref().map(|s| s.taper),
            e.start.as_ref().map(|s| s.easing.clone()),
            e.end.as_ref().map(|en| en.cap as i32),
            e.end.as_ref().map(|en| en.taper),
            e.end.as_ref().map(|en| en.easing.clone()),
            pressures_blob,
            e.simulate_pressure as i32,
            e.last_committed_point.as_ref().map(|p| p.x),
            e.last_committed_point.as_ref().map(|p| p.y),
            e.last_committed_point.as_ref().and_then(|p| p.mirroring.map(|m| m as i32)),
            e.svg_path,
        ],
    )?;

    let mut stmt = tx.prepare_cached(
        "INSERT INTO freedraw_element_points (element_id, sort_order, x, y, mirroring)
         VALUES (?1, ?2, ?3, ?4, ?5)"
    )?;
    for (i, pt) in e.points.iter().enumerate() {
        stmt.execute(params![e.base.id, i as i32, pt.x, pt.y, pt.mirroring.map(|m| m as i32)])?;
    }

    Ok(())
}

// ─── element_linear ──────────────────────────────────────────────────────────

fn write_linear_element(
    tx: &Transaction,
    lb: &DucLinearElementBase,
    wipeout_below: bool,
    elbowed: bool,
) -> SerializeResult<()> {
    let id = &lb.base.id;

    tx.execute(
        "INSERT INTO element_linear (
            element_id,
            last_committed_point_x, last_committed_point_y, last_committed_point_mirror,
            start_binding_element_id, start_binding_focus, start_binding_gap,
            start_binding_fixed_point_x, start_binding_fixed_point_y,
            start_binding_point_index, start_binding_point_offset,
            start_binding_head_type, start_binding_head_block_id, start_binding_head_size,
            end_binding_element_id, end_binding_focus, end_binding_gap,
            end_binding_fixed_point_x, end_binding_fixed_point_y,
            end_binding_point_index, end_binding_point_offset,
            end_binding_head_type, end_binding_head_block_id, end_binding_head_size,
            wipeout_below, elbowed
        ) VALUES (
            ?1,
            ?2, ?3, ?4,
            ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
            ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24,
            ?25, ?26
        )",
        params![
            id,
            lb.last_committed_point.as_ref().map(|p| p.x),
            lb.last_committed_point.as_ref().map(|p| p.y),
            lb.last_committed_point.as_ref().and_then(|p| p.mirroring.map(|m| m as i32)),
            lb.start_binding.as_ref().map(|b| b.element_id.clone()),
            lb.start_binding.as_ref().map(|b| b.focus),
            lb.start_binding.as_ref().map(|b| b.gap),
            lb.start_binding.as_ref().and_then(|b| b.fixed_point.as_ref().map(|fp| fp.x)),
            lb.start_binding.as_ref().and_then(|b| b.fixed_point.as_ref().map(|fp| fp.y)),
            lb.start_binding.as_ref().and_then(|b| b.point.as_ref().map(|p| p.index)),
            lb.start_binding.as_ref().and_then(|b| b.point.as_ref().map(|p| p.offset)),
            lb.start_binding.as_ref().and_then(|b| b.head.as_ref().and_then(|h| h.head_type.map(|t| t as i32))),
            lb.start_binding.as_ref().and_then(|b| b.head.as_ref().and_then(|h| h.block_id.clone())),
            lb.start_binding.as_ref().and_then(|b| b.head.as_ref().map(|h| h.size)),
            lb.end_binding.as_ref().map(|b| b.element_id.clone()),
            lb.end_binding.as_ref().map(|b| b.focus),
            lb.end_binding.as_ref().map(|b| b.gap),
            lb.end_binding.as_ref().and_then(|b| b.fixed_point.as_ref().map(|fp| fp.x)),
            lb.end_binding.as_ref().and_then(|b| b.fixed_point.as_ref().map(|fp| fp.y)),
            lb.end_binding.as_ref().and_then(|b| b.point.as_ref().map(|p| p.index)),
            lb.end_binding.as_ref().and_then(|b| b.point.as_ref().map(|p| p.offset)),
            lb.end_binding.as_ref().and_then(|b| b.head.as_ref().and_then(|h| h.head_type.map(|t| t as i32))),
            lb.end_binding.as_ref().and_then(|b| b.head.as_ref().and_then(|h| h.block_id.clone())),
            lb.end_binding.as_ref().and_then(|b| b.head.as_ref().map(|h| h.size)),
            wipeout_below as i32,
            elbowed as i32,
        ],
    )?;

    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO linear_element_points (element_id, sort_order, x, y, mirroring)
             VALUES (?1, ?2, ?3, ?4, ?5)"
        )?;
        for (i, pt) in lb.points.iter().enumerate() {
            stmt.execute(params![id, i as i32, pt.x, pt.y, pt.mirroring.map(|m| m as i32)])?;
        }
    }

    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO linear_element_lines (element_id, sort_order, start_index, start_handle_x, start_handle_y, end_index, end_handle_x, end_handle_y)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )?;
        for (i, line) in lb.lines.iter().enumerate() {
            stmt.execute(params![
                id,
                i as i32,
                line.start.index,
                line.start.handle.as_ref().map(|h| h.x),
                line.start.handle.as_ref().map(|h| h.y),
                line.end.index,
                line.end.handle.as_ref().map(|h| h.x),
                line.end.handle.as_ref().map(|h| h.y),
            ])?;
        }
    }

    for (i, path) in lb.path_overrides.iter().enumerate() {
        let path_id: i64 = tx.query_row(
            "INSERT INTO linear_path_overrides (element_id, sort_order) VALUES (?1, ?2) RETURNING id",
            params![id, i as i32],
            |row| row.get(0),
        )?;

        let mut idx_stmt = tx.prepare_cached(
            "INSERT INTO linear_path_override_indices (path_override_id, sort_order, line_index)
             VALUES (?1, ?2, ?3)"
        )?;
        for (j, &line_idx) in path.line_indices.iter().enumerate() {
            idx_stmt.execute(params![path_id, j as i32, line_idx])?;
        }

        if let Some(ref bg) = path.background {
            write_background(tx, "path_override", &path_id.to_string(), 0, bg)?;
        }
        if let Some(ref st) = path.stroke {
            write_stroke(tx, "path_override", &path_id.to_string(), 0, st)?;
        }
    }

    Ok(())
}

// ─── document_grid_config ────────────────────────────────────────────────────

fn write_document_grid_config(
    tx: &Transaction,
    element_id: &str,
    file_id: Option<&str>,
    gc: &DocumentGridConfig,
) -> SerializeResult<()> {
    tx.execute(
        "INSERT INTO document_grid_config
            (element_id, file_id, grid_columns, grid_gap_x, grid_gap_y, grid_first_page_alone, grid_scale)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![element_id, file_id, gc.columns, gc.gap_x, gc.gap_y, gc.first_page_alone as i32, gc.scale],
    )?;
    Ok(())
}

// ─── element_model ───────────────────────────────────────────────────────────

fn write_model_element(tx: &Transaction, e: &DucModelElement) -> SerializeResult<()> {
    tx.execute(
        "INSERT INTO element_model (element_id, model_type, code, svg_path)
         VALUES (?1, ?2, ?3, ?4)",
        params![e.base.id, e.model_type, e.code, e.svg_path],
    )?;

    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO model_element_files (element_id, file_id, sort_order) VALUES (?1, ?2, ?3)"
        )?;
        for (i, fid) in e.file_ids.iter().enumerate() {
            stmt.execute(params![e.base.id, fid, i as i32])?;
        }
    }

    if let Some(ref vs) = e.viewer_state {
        write_model_viewer_state(tx, &e.base.id, vs)?;
    }

    Ok(())
}

fn write_model_viewer_state(tx: &Transaction, element_id: &str, vs: &Viewer3DState) -> SerializeResult<()> {
    let cam = &vs.camera;
    let disp = &vs.display;
    let mat = &vs.material;
    let clip = &vs.clipping;
    let expl = &vs.explode;
    let zeb = &vs.zebra;

    let (grid_uniform, grid_xy, grid_xz, grid_yz) = match &disp.grid {
        Viewer3DGrid::Uniform(v) => (Some(*v as i32), 0i32, 0i32, 0i32),
        Viewer3DGrid::PerPlane(p) => (None, p.xy as i32, p.xz as i32, p.yz as i32),
    };

    tx.execute(
        "INSERT INTO model_viewer_state (
            element_id,
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
        ) VALUES (
            ?1,
            ?2, ?3, ?4,
            ?5, ?6, ?7,
            ?8, ?9, ?10, ?11,
            ?12, ?13, ?14,
            ?15, ?16, ?17, ?18, ?19,
            ?20, ?21, ?22,
            ?23, ?24, ?25, ?26,
            ?27, ?28,
            ?29, ?30, ?31,
            ?32, ?33, ?34,
            ?35, ?36, ?37, ?38, ?39,
            ?40, ?41, ?42, ?43, ?44,
            ?45, ?46, ?47, ?48, ?49,
            ?50, ?51, ?52,
            ?53, ?54,
            ?55, ?56, ?57,
            ?58, ?59, ?60
        )",
        params![
            element_id,
            cam.control, cam.ortho as i32, cam.up,
            cam.position[0], cam.position[1], cam.position[2],
            cam.quaternion[0], cam.quaternion[1], cam.quaternion[2], cam.quaternion[3],
            cam.target[0], cam.target[1], cam.target[2],
            cam.zoom, cam.pan_speed, cam.rotate_speed, cam.zoom_speed, cam.holroyd as i32,
            disp.wireframe as i32, disp.transparent as i32, disp.black_edges as i32,
            grid_uniform, grid_xy, grid_xz, grid_yz,
            disp.axes_visible as i32, disp.axes_at_origin as i32,
            mat.metalness, mat.roughness, mat.default_opacity,
            mat.edge_color, mat.ambient_intensity, mat.direct_intensity,
            clip.x.enabled as i32, clip.x.value,
            clip.x.normal.as_ref().map(|n| n[0]),
            clip.x.normal.as_ref().map(|n| n[1]),
            clip.x.normal.as_ref().map(|n| n[2]),
            clip.y.enabled as i32, clip.y.value,
            clip.y.normal.as_ref().map(|n| n[0]),
            clip.y.normal.as_ref().map(|n| n[1]),
            clip.y.normal.as_ref().map(|n| n[2]),
            clip.z.enabled as i32, clip.z.value,
            clip.z.normal.as_ref().map(|n| n[0]),
            clip.z.normal.as_ref().map(|n| n[1]),
            clip.z.normal.as_ref().map(|n| n[2]),
            clip.intersection as i32, clip.show_planes as i32, clip.object_color_caps as i32,
            expl.active as i32, expl.value,
            zeb.active as i32, zeb.stripe_count, zeb.stripe_direction,
            zeb.color_scheme, zeb.opacity, zeb.mapping_mode,
        ],
    )?;
    Ok(())
}

// ─── backgrounds & strokes (polymorphic) ─────────────────────────────────────

fn write_background(
    tx: &Transaction,
    owner_type: &str,
    owner_id: &str,
    sort_order: i32,
    bg: &ElementBackground,
) -> SerializeResult<()> {
    let c = &bg.content;
    tx.execute(
        "INSERT INTO backgrounds (
            owner_type, owner_id, sort_order,
            preference, src, visible, opacity,
            tiling_size_in_percent, tiling_angle, tiling_spacing, tiling_offset_x, tiling_offset_y,
            hatch_style, hatch_pattern_name, hatch_pattern_scale, hatch_pattern_angle,
            hatch_pattern_origin_x, hatch_pattern_origin_y, hatch_pattern_origin_mirror,
            hatch_pattern_double,
            hatch_custom_pattern_name, hatch_custom_pattern_desc,
            image_filter_brightness, image_filter_contrast
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7,
            ?8, ?9, ?10, ?11, ?12,
            ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24
        )",
        params![
            owner_type, owner_id, sort_order,
            c.preference.map(|p| p as i32), c.src, c.visible as i32, c.opacity,
            c.tiling.as_ref().map(|t| t.size_in_percent),
            c.tiling.as_ref().map(|t| t.angle),
            c.tiling.as_ref().and_then(|t| t.spacing),
            c.tiling.as_ref().and_then(|t| t.offset_x),
            c.tiling.as_ref().and_then(|t| t.offset_y),
            c.hatch.as_ref().map(|h| h.hatch_style as i32),
            c.hatch.as_ref().map(|h| h.pattern_name.clone()),
            c.hatch.as_ref().map(|h| h.pattern_scale),
            c.hatch.as_ref().map(|h| h.pattern_angle),
            c.hatch.as_ref().map(|h| h.pattern_origin.x),
            c.hatch.as_ref().map(|h| h.pattern_origin.y),
            c.hatch.as_ref().and_then(|h| h.pattern_origin.mirroring.map(|m| m as i32)),
            c.hatch.as_ref().map(|h| h.pattern_double as i32),
            c.hatch.as_ref().and_then(|h| h.custom_pattern.as_ref().map(|cp| cp.name.clone())),
            c.hatch.as_ref().and_then(|h| h.custom_pattern.as_ref().and_then(|cp| cp.description.clone())),
            c.image_filter.as_ref().map(|f| f.brightness),
            c.image_filter.as_ref().map(|f| f.contrast),
        ],
    )?;

    if let Some(ref hatch) = c.hatch {
        if let Some(ref cp) = hatch.custom_pattern {
            let bg_id: i64 = tx.query_row(
                "SELECT last_insert_rowid()", [], |row| row.get(0),
            )?;
            write_hatch_pattern_lines(tx, "background", bg_id, &cp.lines)?;
        }
    }

    Ok(())
}

fn write_stroke(
    tx: &Transaction,
    owner_type: &str,
    owner_id: &str,
    sort_order: i32,
    st: &ElementStroke,
) -> SerializeResult<()> {
    let c = &st.content;
    let dash_blob: Option<Vec<u8>> = st.style.dash.as_ref().map(|d| {
        d.iter().flat_map(|v| v.to_le_bytes()).collect()
    });
    let sides_blob: Option<Vec<u8>> = st.stroke_sides.as_ref().and_then(|s| {
        s.values.as_ref().map(|v| v.iter().flat_map(|val| val.to_le_bytes()).collect())
    });

    tx.execute(
        "INSERT INTO strokes (
            owner_type, owner_id, sort_order,
            preference, src, visible, opacity,
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
        ) VALUES (
            ?1, ?2, ?3,
            ?4, ?5, ?6, ?7,
            ?8, ?9, ?10, ?11, ?12,
            ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24,
            ?25,
            ?26, ?27, ?28, ?29, ?30, ?31, ?32,
            ?33,
            ?34, ?35
        )",
        params![
            owner_type, owner_id, sort_order,
            c.preference.map(|p| p as i32), c.src, c.visible as i32, c.opacity,
            c.tiling.as_ref().map(|t| t.size_in_percent),
            c.tiling.as_ref().map(|t| t.angle),
            c.tiling.as_ref().and_then(|t| t.spacing),
            c.tiling.as_ref().and_then(|t| t.offset_x),
            c.tiling.as_ref().and_then(|t| t.offset_y),
            c.hatch.as_ref().map(|h| h.hatch_style as i32),
            c.hatch.as_ref().map(|h| h.pattern_name.clone()),
            c.hatch.as_ref().map(|h| h.pattern_scale),
            c.hatch.as_ref().map(|h| h.pattern_angle),
            c.hatch.as_ref().map(|h| h.pattern_origin.x),
            c.hatch.as_ref().map(|h| h.pattern_origin.y),
            c.hatch.as_ref().and_then(|h| h.pattern_origin.mirroring.map(|m| m as i32)),
            c.hatch.as_ref().map(|h| h.pattern_double as i32),
            c.hatch.as_ref().and_then(|h| h.custom_pattern.as_ref().map(|cp| cp.name.clone())),
            c.hatch.as_ref().and_then(|h| h.custom_pattern.as_ref().and_then(|cp| cp.description.clone())),
            c.image_filter.as_ref().map(|f| f.brightness),
            c.image_filter.as_ref().map(|f| f.contrast),
            st.width,
            st.style.preference.map(|p| p as i32),
            st.style.cap.map(|p| p as i32),
            st.style.join.map(|p| p as i32),
            dash_blob,
            st.style.dash_line_override,
            st.style.dash_cap.map(|p| p as i32),
            st.style.miter_limit,
            st.placement.map(|p| p as i32),
            st.stroke_sides.as_ref().and_then(|s| s.preference.map(|p| p as i32)),
            sides_blob,
        ],
    )?;

    if let Some(ref hatch) = c.hatch {
        if let Some(ref cp) = hatch.custom_pattern {
            let st_id: i64 = tx.query_row(
                "SELECT last_insert_rowid()", [], |row| row.get(0),
            )?;
            write_hatch_pattern_lines(tx, "stroke", st_id, &cp.lines)?;
        }
    }

    Ok(())
}

fn write_hatch_pattern_lines(
    tx: &Transaction,
    owner_type: &str,
    owner_id: i64,
    lines: &[HatchPatternLine],
) -> SerializeResult<()> {
    let mut stmt = tx.prepare_cached(
        "INSERT INTO hatch_pattern_lines (
            owner_type, owner_id, sort_order,
            angle, origin_x, origin_y, origin_mirroring,
            offset_x, offset_y, dash_pattern
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )?;
    for (i, line) in lines.iter().enumerate() {
        let offset_x = line.offset.first().copied().unwrap_or(0.0);
        let offset_y = line.offset.get(1).copied().unwrap_or(0.0);
        let dash_blob: Option<Vec<u8>> = if line.dash_pattern.is_empty() {
            None
        } else {
            Some(line.dash_pattern.iter().flat_map(|v| v.to_le_bytes()).collect())
        };
        stmt.execute(params![
            owner_type,
            owner_id,
            i as i32,
            line.angle,
            line.origin.x,
            line.origin.y,
            line.origin.mirroring.map(|m| m as i32),
            offset_x,
            offset_y,
            dash_blob,
        ])?;
    }
    Ok(())
}

// ─── external_files ──────────────────────────────────────────────────────────

fn write_external_files(
    tx: &Transaction,
    files: &Option<std::collections::HashMap<String, DucExternalFileData>>,
) -> SerializeResult<()> {
    let Some(files) = files else { return Ok(()) };
    let mut stmt = tx.prepare_cached(
        "INSERT OR REPLACE INTO external_files (id, mime_type, data, created, last_retrieved, version)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )?;
    for (_key, data) in files {
        stmt.execute(params![data.id, data.mime_type, data.data, data.created, data.last_retrieved, data.version])?;
    }
    Ok(())
}

// ─── version_graph ───────────────────────────────────────────────────────────

fn write_version_graph(tx: &Transaction, vg: &Option<VersionGraph>) -> SerializeResult<()> {
    let Some(vg) = vg else { return Ok(()) };

    tx.execute(
        "UPDATE version_graph SET
            current_version = ?1,
            current_schema_version = ?2,
            user_checkpoint_version_id = ?3,
            latest_version_id = ?4,
            chain_count = ?5,
            last_pruned = ?6,
            total_size = ?7
         WHERE id = 1",
        params![
            vg.metadata.current_version,
            vg.metadata.current_schema_version,
            vg.user_checkpoint_version_id,
            vg.latest_version_id,
            vg.metadata.chain_count,
            vg.metadata.last_pruned,
            vg.metadata.total_size,
        ],
    )?;

    {
        let mut stmt = tx.prepare_cached(
            "INSERT OR REPLACE INTO version_chains
                (id, schema_version, start_version, end_version, migration_id, root_checkpoint_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
        )?;
        for chain in &vg.chains {
            let migration_id: Option<i64> = if let Some(ref mig) = chain.migration {
                let mid: i64 = tx.query_row(
                    "INSERT INTO schema_migrations
                        (from_schema_version, to_schema_version, migration_name, migration_checksum, applied_at, boundary_checkpoint_id)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                     RETURNING id",
                    params![
                        mig.from_schema_version,
                        mig.to_schema_version,
                        mig.migration_name,
                        mig.migration_checksum,
                        mig.applied_at,
                        mig.boundary_checkpoint_id,
                    ],
                    |row| row.get(0),
                )?;
                Some(mid)
            } else {
                None
            };

            stmt.execute(params![
                chain.id,
                chain.schema_version,
                chain.start_version,
                chain.end_version,
                migration_id,
                chain.root_checkpoint_id,
            ])?;
        }
    }

    {
        let mut cp_stmt = tx.prepare_cached(
            "INSERT OR REPLACE INTO checkpoints
                (id, parent_id, chain_id, version_number, schema_version, timestamp,
                 description, is_manual_save, is_schema_boundary, user_id, data, size_bytes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)"
        )?;
        for cp in &vg.checkpoints {
            let chain_id = vg.chains.iter()
                .find(|c| c.schema_version == cp.schema_version)
                .map(|c| c.id.as_str())
                .unwrap_or("");
            cp_stmt.execute(params![
                cp.base.id,
                cp.base.parent_id,
                chain_id,
                cp.version_number,
                cp.schema_version,
                cp.base.timestamp,
                cp.base.description,
                cp.base.is_manual_save as i32,
                cp.is_schema_boundary as i32,
                cp.base.user_id,
                cp.data,
                cp.size_bytes,
            ])?;
        }
    }

    {
        let mut d_stmt = tx.prepare_cached(
            "INSERT OR REPLACE INTO deltas
                (id, parent_id, base_checkpoint_id, chain_id, delta_sequence, version_number,
                 schema_version, timestamp, description, is_manual_save, user_id, changeset, size_bytes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
        )?;
        for (i, delta) in vg.deltas.iter().enumerate() {
            let chain_id = vg.chains.iter()
                .find(|c| c.schema_version == delta.schema_version)
                .map(|c| c.id.as_str())
                .unwrap_or("");
            d_stmt.execute(params![
                delta.base.id,
                delta.base.parent_id,
                delta.base_checkpoint_id,
                chain_id,
                (i + 1) as i64,
                delta.version_number,
                delta.schema_version,
                delta.base.timestamp,
                delta.base.description,
                delta.base.is_manual_save as i32,
                delta.base.user_id,
                delta.payload,
                delta.size_bytes,
            ])?;
        }
    }

    Ok(())
}
