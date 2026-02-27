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

/// Native duc file format operations.
#[pymodule]
fn ducpy_native(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(parse_duc, m)?)?;
    m.add_function(wrap_pyfunction!(parse_duc_lazy, m)?)?;
    m.add_function(wrap_pyfunction!(serialize_duc, m)?)?;
    m.add_function(wrap_pyfunction!(get_external_file, m)?)?;
    m.add_function(wrap_pyfunction!(list_external_files, m)?)?;
    Ok(())
}
