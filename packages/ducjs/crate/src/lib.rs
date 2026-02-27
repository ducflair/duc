use wasm_bindgen::prelude::*;
use serde::Serialize;

/// Serialize a value to JsValue using serde-wasm-bindgen with
/// `serialize_maps_as_objects(true)` so that internally-tagged enums
/// and `#[serde(flatten)]` produce plain JS objects (not `Map`s).
fn to_js<T: Serialize>(value: &T) -> Result<JsValue, JsError> {
    let serializer = serde_wasm_bindgen::Serializer::new()
        .serialize_maps_as_objects(true);
    value.serialize(&serializer)
        .map_err(|e| JsError::new(&format!("{e}")))
}

// ── Parse / Serialize ──────────────────────────────────────────────────────

/// Parse a `.duc` file (Uint8Array) into a JS object (ExportedDataState).
#[wasm_bindgen(js_name = "parseDuc")]
pub fn parse_duc(buf: &[u8]) -> Result<JsValue, JsError> {
    let state = duc::parse::parse(buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&state)
}

/// Parse a `.duc` file lazily — returns everything EXCEPT external file data blobs.
///
/// Use `getExternalFile()` or `listExternalFiles()` for on-demand access.
#[wasm_bindgen(js_name = "parseDucLazy")]
pub fn parse_duc_lazy(buf: &[u8]) -> Result<JsValue, JsError> {
    let state = duc::parse::parse_lazy(buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&state)
}

/// Serialize a JS object (ExportedDataState) into `.duc` bytes (Uint8Array).
#[wasm_bindgen(js_name = "serializeDuc")]
pub fn serialize_duc(data: JsValue) -> Result<Vec<u8>, JsError> {
    let state: duc::types::ExportedDataState =
        serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsError::new(&format!("{e}")))?;
    duc::serialize::serialize(&state)
        .map_err(|e| JsError::new(&format!("{e}")))
}

/// Fetch a single external file from a `.duc` buffer by file ID.
///
/// Returns the file entry as a JS object, or `undefined` if not found.
#[wasm_bindgen(js_name = "getExternalFile")]
pub fn get_external_file(buf: &[u8], file_id: &str) -> Result<JsValue, JsError> {
    let entry = duc::parse::get_external_file(buf, file_id)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    match entry {
        Some(e) => to_js(&e),
        None => Ok(JsValue::UNDEFINED),
    }
}

/// List metadata for all external files (without loading the heavy data blobs).
#[wasm_bindgen(js_name = "listExternalFiles")]
pub fn list_external_files(buf: &[u8]) -> Result<JsValue, JsError> {
    let meta = duc::parse::list_external_files(buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&meta)
}

// ── Version Control ────────────────────────────────────────────────────────

/// Returns the current version-control schema version defined in Rust.
///
/// TypeScript should use this as the source of truth instead of hardcoding
/// its own constant. When this value is bumped in Rust, the version control
/// system will automatically handle migration bookkeeping (closing old chains,
/// recording migrations) the next time a checkpoint or delta is created.
#[wasm_bindgen(js_name = "getCurrentSchemaVersion")]
pub fn get_current_schema_version() -> i32 {
    duc::api::version_control::CURRENT_SCHEMA_VERSION
}

/// Restore the document state at `version_number` from a `.duc` file buffer.
///
/// The `.duc` file is a SQLite database — this function opens it and queries
/// the `checkpoints` / `deltas` tables directly for version restoration.
///
/// Returns a JS object `{ versionNumber, schemaVersion, data, fromCheckpoint }`.
#[wasm_bindgen(js_name = "restoreVersion")]
pub fn restore_version(duc_buf: &[u8], version_number: f64) -> Result<JsValue, JsError> {
    let conn = duc::api::version_control::open_duc_bytes(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let vc = duc::api::version_control::VersionControl::from_connection(&conn);
    let restored = vc
        .restore_version(version_number as i64)
        .map_err(|e| JsError::new(&format!("{e}")))?;

    to_restored_js(&restored)
}

/// Restore a specific checkpoint by its ID from a `.duc` file buffer.
///
/// Returns a JS object `{ versionNumber, schemaVersion, data, fromCheckpoint }`.
#[wasm_bindgen(js_name = "restoreCheckpoint")]
pub fn restore_checkpoint(duc_buf: &[u8], checkpoint_id: &str) -> Result<JsValue, JsError> {
    let conn = duc::api::version_control::open_duc_bytes(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let vc = duc::api::version_control::VersionControl::from_connection(&conn);
    let restored = vc
        .restore_checkpoint(checkpoint_id)
        .map_err(|e| JsError::new(&format!("{e}")))?;

    to_restored_js(&restored)
}

/// List all versions (checkpoints + deltas) from a `.duc` file buffer.
///
/// Returns a JS array of `VersionEntry` objects (no heavy data blobs).
#[wasm_bindgen(js_name = "listVersions")]
pub fn list_versions(duc_buf: &[u8]) -> Result<JsValue, JsError> {
    let conn = duc::api::version_control::open_duc_bytes(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let vc = duc::api::version_control::VersionControl::from_connection(&conn);
    let entries = vc
        .list_versions()
        .map_err(|e| JsError::new(&format!("{e}")))?;

    to_js(&entries)
}

/// Read the full VersionGraph from a `.duc` file buffer.
///
/// Returns a JS object matching the `VersionGraph` TypeScript interface,
/// or `undefined` if no version graph exists.
#[wasm_bindgen(js_name = "readVersionGraph")]
pub fn read_version_graph(duc_buf: &[u8]) -> Result<JsValue, JsError> {
    let conn = duc::api::version_control::open_duc_bytes(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let vc = duc::api::version_control::VersionControl::from_connection(&conn);
    let vg = vc
        .read_version_graph()
        .map_err(|e| JsError::new(&format!("{e}")))?;

    match vg {
        Some(graph) => to_js(&graph),
        None => Ok(JsValue::UNDEFINED),
    }
}

/// Revert the document to a specific version, removing all newer versions.
///
/// Returns a JS object `{ versionNumber, schemaVersion, data, fromCheckpoint }`.
#[wasm_bindgen(js_name = "revertToVersion")]
pub fn revert_to_version(duc_buf: &[u8], target_version: f64) -> Result<JsValue, JsError> {
    let conn = duc::api::version_control::open_duc_bytes(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let vc = duc::api::version_control::VersionControl::from_connection(&conn);
    let restored = vc
        .revert_to_version(target_version as i64)
        .map_err(|e| JsError::new(&format!("{e}")))?;

    to_restored_js(&restored)
}

/// Helper: convert a `RestoredVersion` to a JS value.
fn to_restored_js(r: &duc::api::version_control::RestoredVersion) -> Result<JsValue, JsError> {
    let obj = js_sys::Object::new();
    js_sys::Reflect::set(
        &obj,
        &"versionNumber".into(),
        &JsValue::from(r.version_number as f64),
    )
    .map_err(|_| JsError::new("reflect set failed"))?;
    js_sys::Reflect::set(
        &obj,
        &"schemaVersion".into(),
        &JsValue::from(r.schema_version as f64),
    )
    .map_err(|_| JsError::new("reflect set failed"))?;
    js_sys::Reflect::set(
        &obj,
        &"fromCheckpoint".into(),
        &JsValue::from(r.from_checkpoint),
    )
    .map_err(|_| JsError::new("reflect set failed"))?;

    let data_array = js_sys::Uint8Array::from(r.data.as_slice());
    js_sys::Reflect::set(&obj, &"data".into(), &data_array.into())
        .map_err(|_| JsError::new("reflect set failed"))?;

    Ok(obj.into())
}
