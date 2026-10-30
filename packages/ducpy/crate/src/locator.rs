use pyo3::prelude::*;

#[pyfunction]
fn normalize_host_path(path: &str) -> String { duc::locator::normalize_host_path(path) }
#[pyfunction]
fn normalize_path_segments(path: &str) -> String { duc::locator::normalize_path_segments(path) }
#[pyfunction]
fn get_owning_duc_directory(path: &str) -> String { duc::locator::get_owning_duc_directory(path) }

#[pyfunction]
#[pyo3(signature = (kind, path, owning_duc_path=None))]
fn resolve_locator_path(kind: &str, path: &str, owning_duc_path: Option<&str>) -> (Option<String>, Option<String>) {
    match duc::locator::paths::resolve_path(kind, path, owning_duc_path) {
        Ok(path) => (Some(path), None), Err(error) => (None, Some(error)),
    }
}

#[pyfunction]
#[pyo3(signature = (kind, path, original_path=None, owning_duc_path=None, check_exists=false))]
fn resolve_locator(py: Python<'_>, kind: &str, path: &str, original_path: Option<&str>, owning_duc_path: Option<&str>, check_exists: bool) -> PyResult<Py<PyAny>> {
    let kind = match kind {
        "absolute" => duc::types::ExternalFileLocatorKind::Absolute,
        "relative" => duc::types::ExternalFileLocatorKind::Relative,
        _ => return Err(pyo3::exceptions::PyValueError::new_err(format!("Unsupported locator kind: {kind}"))),
    };
    let locator = duc::types::ExternalFileLocator { kind, path: path.to_owned(), original_path: original_path.map(str::to_owned) };
    let result = duc::locator::resolve_locator(&locator, owning_duc_path, check_exists);
    pythonize::pythonize(py, &result).map(|result| result.unbind())
        .map_err(|error| pyo3::exceptions::PyValueError::new_err(error.to_string()))
}

pub fn register(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(normalize_host_path, m)?)?;
    m.add_function(wrap_pyfunction!(normalize_path_segments, m)?)?;
    m.add_function(wrap_pyfunction!(get_owning_duc_directory, m)?)?;
    m.add_function(wrap_pyfunction!(resolve_locator_path, m)?)?;
    m.add_function(wrap_pyfunction!(resolve_locator, m)?)?;
    Ok(())
}
