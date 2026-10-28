use wasm_bindgen::prelude::*;

#[cfg(not(feature = "locator-only"))]
use duc::locator::paths;
#[cfg(feature = "locator-only")]
#[path = "../../../ducrs/src/locator/paths.rs"]
mod paths;

#[wasm_bindgen(js_name = normalizeHostPath)]
pub fn normalize_host_path(path: &str) -> String { paths::normalize_host_path(path) }
#[wasm_bindgen(js_name = normalizePathSegments)]
pub fn normalize_path_segments(path: &str) -> String { paths::normalize_path_segments(path) }
#[wasm_bindgen(js_name = getOwningDucDirectory)]
pub fn get_owning_duc_directory(path: &str) -> String { paths::get_owning_duc_directory(path) }
#[wasm_bindgen(js_name = resolveLocatorPath)]
pub fn resolve_locator_path(kind: &str, path: &str, owner: Option<String>) -> Result<String, JsError> {
    paths::resolve_path(kind, path, owner.as_deref()).map_err(|error| JsError::new(&error))
}
