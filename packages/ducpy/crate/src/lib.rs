use pyo3::prelude::*;
use pyo3::types::PyBytes;

/// Parse a `.duc` file (bytes) into a Python dict (ExportedDataState).
#[pyfunction]
fn parse_duc(py: Python<'_>, buf: &[u8]) -> PyResult<PyObject> {
    let state = duc::parse::parse(buf)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    pythonize::pythonize(py, &state)
        .map(|b| b.unbind())
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

/// Parse a `.duc` file lazily — returns everything EXCEPT external file data blobs.
///
/// Use `get_external_file()` or `list_external_files()` for on-demand access.
#[pyfunction]
fn parse_duc_lazy(py: Python<'_>, buf: &[u8]) -> PyResult<PyObject> {
    let state = duc::parse::parse_lazy(buf)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    pythonize::pythonize(py, &state)
        .map(|b| b.unbind())
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

/// Serialize a Python dict (ExportedDataState) into `.duc` bytes.
#[pyfunction]
fn serialize_duc(py: Python<'_>, data: &Bound<'_, pyo3::types::PyAny>) -> PyResult<PyObject> {
    let state: duc::types::ExportedDataState = pythonize::depythonize(data)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let bytes = duc::serialize::serialize(&state)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    Ok(PyBytes::new(py, &bytes).into())
}

/// Fetch a single external file from a `.duc` buffer by file ID.
///
/// Returns the file entry as a dict, or None if not found.
#[pyfunction]
fn get_external_file(py: Python<'_>, buf: &[u8], file_id: &str) -> PyResult<PyObject> {
    let entry = duc::parse::get_external_file(buf, file_id)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    match entry {
        Some(e) => pythonize::pythonize(py, &e)
            .map(|b| b.unbind())
            .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}"))),
        None => Ok(py.None()),
    }
}

/// List metadata for all external files (without loading the heavy data blobs).
#[pyfunction]
fn list_external_files(py: Python<'_>, buf: &[u8]) -> PyResult<PyObject> {
    let meta = duc::parse::list_external_files(buf)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    pythonize::pythonize(py, &meta)
        .map(|b| b.unbind())
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

/// Returns the current DUC schema version as a semver string (e.g. "3.0.0").
#[pyfunction]
fn get_schema_version() -> PyResult<String> {
    Ok(duc::db::bootstrap::CURRENT_SCHEMA_VERSION_SEMVER.into())
}

/// Returns the raw integer schema version (e.g. 3000000).
#[pyfunction]
fn get_schema_version_int() -> PyResult<i64> {
    Ok(duc::db::bootstrap::current_schema_version_int())
}

/// Returns the canonical `duc.sql` schema string.
#[pyfunction]
fn get_duc_schema_sql() -> PyResult<String> {
    Ok(duc::db::bootstrap::DUC_SCHEMA_SQL.into())
}

/// Returns the `version_control.sql` schema string.
#[pyfunction]
fn get_version_control_schema_sql() -> PyResult<String> {
    Ok(duc::db::bootstrap::VERSION_CONTROL_SCHEMA_SQL.into())
}

/// Returns the `search.sql` schema string.
#[pyfunction]
fn get_search_schema_sql() -> PyResult<String> {
    Ok(duc::db::bootstrap::SEARCH_SCHEMA_SQL.into())
}

/// Returns all migrations as a list of `(from_version, to_version, sql)` tuples.
#[pyfunction]
fn get_migrations(_py: Python<'_>) -> PyResult<Vec<(i64, i64, String)>> {
    Ok(duc::db::bootstrap::MIGRATIONS
        .iter()
        .map(|(f, t, sql)| (*f, *t, sql.to_string()))
        .collect())
}

/// Native duc file format operations.
#[pymodule]
fn ducpy_native(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(parse_duc, m)?)?;
    m.add_function(wrap_pyfunction!(parse_duc_lazy, m)?)?;
    m.add_function(wrap_pyfunction!(serialize_duc, m)?)?;
    m.add_function(wrap_pyfunction!(get_external_file, m)?)?;
    m.add_function(wrap_pyfunction!(list_external_files, m)?)?;
    m.add_function(wrap_pyfunction!(get_schema_version, m)?)?;
    m.add_function(wrap_pyfunction!(get_schema_version_int, m)?)?;
    m.add_function(wrap_pyfunction!(get_duc_schema_sql, m)?)?;
    m.add_function(wrap_pyfunction!(get_version_control_schema_sql, m)?)?;
    m.add_function(wrap_pyfunction!(get_search_schema_sql, m)?)?;
    m.add_function(wrap_pyfunction!(get_migrations, m)?)?;
    Ok(())
}
