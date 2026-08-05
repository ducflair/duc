use pyo3::prelude::*;
use std::fs::File;

/// Parse a `.duc` file path into a Python dict (ExportedDataState).
#[pyfunction]
fn parse_duc(py: Python<'_>, path: &str) -> PyResult<PyObject> {
    let session = duc::session::DucSession::open_path(path)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let state = session
        .read_document_state()
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    pythonize::pythonize(py, &state)
        .map(|b| b.unbind())
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

/// Serialize a Python dict (ExportedDataState) directly to a `.duc` output path.
#[pyfunction]
fn serialize_duc(data: &Bound<'_, pyo3::types::PyAny>, output_path: &str) -> PyResult<()> {
    let state: duc::types::ExportedDataState = pythonize::depythonize(data)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let mut session = duc::session::DucSession::create_export_session()
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    session
        .write_document_state(&state)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    session
        .finish_to_path(output_path)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

/// List metadata for all external files without loading data blobs.
#[pyfunction]
fn list_external_files(py: Python<'_>, path: &str) -> PyResult<PyObject> {
    let session = duc::session::DucSession::open_path(path)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let meta = session
        .list_external_files()
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    pythonize::pythonize(py, &meta)
        .map(|b| b.unbind())
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

#[pyfunction]
fn stream_external_file_revision_to_path(
    path: &str,
    revision_id: &str,
    output_path: &str,
) -> PyResult<u64> {
    let session = duc::session::DucSession::open_path(path)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let mut out = File::create(output_path)
        .map_err(|e| pyo3::exceptions::PyOSError::new_err(format!("{e}")))?;
    session
        .stream_external_file_revision_to_writer(revision_id, &mut out)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

#[pyfunction]
fn stream_checkpoint_data_to_path(
    path: &str,
    checkpoint_id: &str,
    output_path: &str,
) -> PyResult<u64> {
    let session = duc::session::DucSession::open_path(path)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let mut out = File::create(output_path)
        .map_err(|e| pyo3::exceptions::PyOSError::new_err(format!("{e}")))?;
    session
        .stream_checkpoint_data_to_writer(checkpoint_id, &mut out)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))
}

#[pyfunction]
fn stream_delta_changeset_to_path(path: &str, delta_id: &str, output_path: &str) -> PyResult<u64> {
    let session = duc::session::DucSession::open_path(path)
        .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("{e}")))?;
    let mut out = File::create(output_path)
        .map_err(|e| pyo3::exceptions::PyOSError::new_err(format!("{e}")))?;
    session
        .stream_delta_changeset_to_writer(delta_id, &mut out)
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
    m.add_function(wrap_pyfunction!(serialize_duc, m)?)?;
    m.add_function(wrap_pyfunction!(list_external_files, m)?)?;
    m.add_function(wrap_pyfunction!(stream_external_file_revision_to_path, m)?)?;
    m.add_function(wrap_pyfunction!(stream_checkpoint_data_to_path, m)?)?;
    m.add_function(wrap_pyfunction!(stream_delta_changeset_to_path, m)?)?;
    m.add_function(wrap_pyfunction!(get_schema_version, m)?)?;
    m.add_function(wrap_pyfunction!(get_schema_version_int, m)?)?;
    m.add_function(wrap_pyfunction!(get_duc_schema_sql, m)?)?;
    m.add_function(wrap_pyfunction!(get_version_control_schema_sql, m)?)?;
    m.add_function(wrap_pyfunction!(get_search_schema_sql, m)?)?;
    m.add_function(wrap_pyfunction!(get_migrations, m)?)?;
    Ok(())
}
