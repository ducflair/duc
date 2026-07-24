#[cfg(all(target_family = "wasm", target_os = "unknown"))]
use serde::Serialize;

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
use std::borrow::Cow;

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
use wasm_bindgen::prelude::*;

/// Serialize a value to JsValue using serde-wasm-bindgen with
/// `serialize_maps_as_objects(true)` so that internally-tagged enums
/// and `#[serde(flatten)]` produce plain JS objects (not `Map`s).
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
fn to_js<T: Serialize>(value: &T) -> Result<JsValue, JsError> {
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    value
        .serialize(&serializer)
        .map_err(|e| JsError::new(&format!("{e}")))
}

// ── OPFS Document Session ──────────────────────────────────────────────────

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "DucOpfsDocument")]
pub struct DucOpfsDocument {
    inner: duc::api::DucDocument,
    /// The filename used when opening the document (for OPFS export).
    filename: String,
    pool_namespace: Option<String>,
}

/// Incrementally replaces one OPFS database without retaining the imported
/// SQLite payload in WASM memory.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "DucOpfsImporter")]
pub struct DucOpfsImporter {
    util: sqlite_wasm_vfs::sahpool::OpfsSAHPoolUtil,
    filename: String,
    offset: usize,
    header: Vec<u8>,
    finished: bool,
}

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_class = "DucOpfsImporter")]
impl DucOpfsImporter {
    /// Begin replacing `name`. Any prior database with the same closed name is
    /// released back to the SAH pool before the new import claims a slot.
    #[wasm_bindgen(js_name = "begin")]
    pub async fn begin(name: &str) -> Result<DucOpfsImporter, JsError> {
        Self::begin_in_pool_internal(name, None).await
    }

    #[wasm_bindgen(js_name = "beginInPool")]
    pub async fn begin_in_pool(name: &str, namespace: &str) -> Result<DucOpfsImporter, JsError> {
        Self::begin_in_pool_internal(name, Some(namespace)).await
    }

    async fn begin_in_pool_internal(
        name: &str,
        namespace: Option<&str>,
    ) -> Result<DucOpfsImporter, JsError> {
        let util = opfs_sahpool_util(namespace).await?;
        util.begin_import_db(name)
            .map_err(|e| JsError::new(&format!("{e:?}")))?;
        Ok(Self {
            util,
            filename: name.to_string(),
            offset: 0,
            header: Vec::with_capacity(16),
            finished: false,
        })
    }

    /// Write the next decompressed SQLite chunk.
    #[wasm_bindgen(js_name = "writeChunk")]
    pub fn write_chunk(&mut self, data: &[u8]) -> Result<(), JsError> {
        if self.finished {
            return Err(JsError::new("OPFS import is already finished"));
        }
        if data.is_empty() {
            return Ok(());
        }

        if self.header.len() < 16 {
            let needed = 16 - self.header.len();
            self.header
                .extend_from_slice(&data[..needed.min(data.len())]);
            if self.header.len() == 16 && self.header.as_slice() != b"SQLite format 3\0" {
                return Err(JsError::new("Imported payload is not an SQLite database"));
            }
        }

        let mut standalone_data = Cow::Borrowed(data);
        if self.header.as_slice() == b"SQLite format 3\0" {
            for header_offset in [18_usize, 19_usize] {
                let Some(chunk_offset) = header_offset.checked_sub(self.offset) else {
                    continue;
                };
                if chunk_offset < data.len() && data[chunk_offset] == 2 {
                    standalone_data.to_mut()[chunk_offset] = 1;
                }
            }
        }

        self.util
            .import_db_chunk(&self.filename, self.offset, standalone_data.as_ref())
            .map_err(|e| JsError::new(&format!("{e:?}")))?;
        self.offset = self
            .offset
            .checked_add(data.len())
            .ok_or_else(|| JsError::new("OPFS import size overflow"))?;
        Ok(())
    }

    /// Flush the imported database and make it ready for SQLite to open.
    #[wasm_bindgen(js_name = "finish")]
    pub fn finish(&mut self) -> Result<f64, JsError> {
        if self.finished {
            return Err(JsError::new("OPFS import is already finished"));
        }
        if self.header.as_slice() != b"SQLite format 3\0" {
            return Err(JsError::new("Imported payload is not an SQLite database"));
        }

        self.util
            .finish_import_db(&self.filename, self.offset)
            .map_err(|e| JsError::new(&format!("{e:?}")))?;
        self.finished = true;
        Ok(self.offset as f64)
    }

    /// Delete a partial import. Safe to call after a failed stream read.
    #[wasm_bindgen(js_name = "abort")]
    pub fn abort(&mut self) -> Result<bool, JsError> {
        if self.finished {
            return Ok(false);
        }
        let deleted = self
            .util
            .delete_db(&self.filename)
            .map_err(|e| JsError::new(&format!("{e:?}")))?;
        self.finished = true;
        Ok(deleted)
    }

    #[wasm_bindgen(js_name = "getBytesWritten")]
    pub fn get_bytes_written(&self) -> f64 {
        self.offset as f64
    }
}

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
impl Drop for DucOpfsImporter {
    fn drop(&mut self) {
        if !self.finished {
            let _ = self.util.delete_db(&self.filename);
        }
    }
}

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_class = "DucOpfsDocument")]
impl DucOpfsDocument {
    /// Open or create a persistent OPFS-backed DUC SQLite document.
    ///
    /// This must run from a Dedicated Worker because the OPFS SAH-pool VFS uses
    /// FileSystemSyncAccessHandle.
    #[wasm_bindgen(js_name = "open")]
    pub async fn open(name: &str) -> Result<DucOpfsDocument, JsError> {
        let inner = duc::api::DucDocument::open_opfs(name)
            .await
            .map_err(|e| JsError::new(&format!("{e}")))?;
        Ok(Self {
            inner,
            filename: name.to_string(),
            pool_namespace: None,
        })
    }

    #[wasm_bindgen(js_name = "openInPool")]
    pub async fn open_in_pool(name: &str, namespace: &str) -> Result<DucOpfsDocument, JsError> {
        let inner = duc::api::DucDocument::open_opfs_in_namespace(name, namespace)
            .await
            .map_err(|e| JsError::new(&format!("{e}")))?;
        Ok(Self {
            inner,
            filename: name.to_string(),
            pool_namespace: Some(namespace.to_string()),
        })
    }

    #[wasm_bindgen(js_name = "listOpfsDatabases")]
    pub async fn list_opfs_databases() -> Result<JsValue, JsError> {
        let util = opfs_sahpool_util(None).await?;
        to_js(&util.list())
    }

    #[wasm_bindgen(js_name = "listOpfsDatabasesInPool")]
    pub async fn list_opfs_databases_in_pool(namespace: &str) -> Result<JsValue, JsError> {
        let util = opfs_sahpool_util(Some(namespace)).await?;
        to_js(&util.list())
    }

    #[wasm_bindgen(js_name = "deleteOpfsDatabase")]
    pub async fn delete_opfs_database(name: &str) -> Result<bool, JsError> {
        let util = opfs_sahpool_util(None).await?;
        util.delete_db(name)
            .map_err(|e| JsError::new(&format!("{e:?}")))
    }

    #[wasm_bindgen(js_name = "deleteOpfsDatabaseInPool")]
    pub async fn delete_opfs_database_in_pool(
        name: &str,
        namespace: &str,
    ) -> Result<bool, JsError> {
        let util = opfs_sahpool_util(Some(namespace)).await?;
        util.delete_db(name)
            .map_err(|e| JsError::new(&format!("{e:?}")))
    }

    /// Return the filename used to open this document.
    #[wasm_bindgen(js_name = "getFilename")]
    pub fn get_filename(&self) -> String {
        self.filename.clone()
    }

    #[wasm_bindgen(js_name = "readDocumentState")]
    pub fn read_document_state(&self) -> Result<JsValue, JsError> {
        let state = self
            .inner
            .read_document_state()
            .map_err(|e| JsError::new(&format!("{e}")))?;
        to_js(&state)
    }

    #[wasm_bindgen(js_name = "writeDocumentState")]
    pub fn write_document_state(&mut self, data: JsValue) -> Result<(), JsError> {
        let state: duc::types::ExportedDataState =
            serde_wasm_bindgen::from_value(data).map_err(|e| JsError::new(&format!("{e}")))?;
        self.inner
            .write_document_state(&state)
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    #[wasm_bindgen(js_name = "listExternalFiles")]
    pub fn list_external_files(&self) -> Result<JsValue, JsError> {
        let meta = self
            .inner
            .list_external_files()
            .map_err(|e| JsError::new(&format!("{e}")))?;
        to_js(&meta)
    }

    #[wasm_bindgen(js_name = "readExternalFileRevisionChunk")]
    pub fn read_external_file_revision_chunk(
        &self,
        revision_id: &str,
        chunk_index: f64,
    ) -> Result<JsValue, JsError> {
        optional_bytes_to_js(
            self.inner
                .read_external_file_revision_chunk(revision_id, chunk_index as i64)
                .map_err(|e| JsError::new(&format!("{e}")))?,
        )
    }

    /// Read a bounded batch of external-file chunks with one SQL query and one
    /// JS/WASM call. Batches are capped at 4 chunks to bound peak memory.
    #[wasm_bindgen(js_name = "readExternalFileRevisionChunks")]
    pub fn read_external_file_revision_chunks(
        &self,
        revision_id: &str,
        start_chunk_index: f64,
        max_chunks: f64,
    ) -> Result<js_sys::Array, JsError> {
        let chunks = self
            .inner
            .read_external_file_revision_chunks(
                revision_id,
                start_chunk_index as i64,
                max_chunks as i64,
            )
            .map_err(|e| JsError::new(&format!("{e}")))?;
        let result = js_sys::Array::new_with_length(chunks.len() as u32);
        for (index, chunk) in chunks.iter().enumerate() {
            result.set(
                index as u32,
                js_sys::Uint8Array::from(chunk.as_slice()).into(),
            );
        }
        Ok(result)
    }

    /// Read a bounded byte range, including from legacy one-row BLOB revisions.
    #[wasm_bindgen(js_name = "readExternalFileRevisionRange")]
    pub fn read_external_file_revision_range(
        &self,
        revision_id: &str,
        offset_bytes: f64,
        length_bytes: f64,
    ) -> Result<JsValue, JsError> {
        optional_bytes_to_js(
            self.inner
                .read_external_file_revision_range(
                    revision_id,
                    offset_bytes as i64,
                    length_bytes as i64,
                )
                .map_err(|e| JsError::new(&format!("{e}")))?,
        )
    }

    #[wasm_bindgen(js_name = "clearExternalFileRevisionChunks")]
    pub fn clear_external_file_revision_chunks(
        &mut self,
        revision_id: &str,
    ) -> Result<(), JsError> {
        self.inner
            .clear_external_file_revision_chunks(revision_id)
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    #[wasm_bindgen(js_name = "writeExternalFileRevisionChunk")]
    pub fn write_external_file_revision_chunk(
        &mut self,
        revision_id: &str,
        chunk_index: f64,
        offset_bytes: f64,
        data: &[u8],
    ) -> Result<(), JsError> {
        self.inner
            .write_external_file_revision_chunk(
                revision_id,
                chunk_index as i64,
                offset_bytes as i64,
                data,
            )
            .map_err(|e| {
                let db_size = self.inner.db_size_bytes().unwrap_or(-1);
                JsError::new(&format!("{e} (db_size={db_size}, rev={revision_id}, chunk={chunk_index}, offset={offset_bytes}, data_len={})", data.len()))
            })
    }

    #[wasm_bindgen(js_name = "readCheckpointDataChunk")]
    pub fn read_checkpoint_data_chunk(
        &self,
        checkpoint_id: &str,
        chunk_index: f64,
    ) -> Result<JsValue, JsError> {
        optional_bytes_to_js(
            self.inner
                .read_checkpoint_data_chunk(checkpoint_id, chunk_index as i64)
                .map_err(|e| JsError::new(&format!("{e}")))?,
        )
    }

    #[wasm_bindgen(js_name = "clearCheckpointDataChunks")]
    pub fn clear_checkpoint_data_chunks(&mut self, checkpoint_id: &str) -> Result<(), JsError> {
        self.inner
            .clear_checkpoint_data_chunks(checkpoint_id)
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    #[wasm_bindgen(js_name = "writeCheckpointDataChunk")]
    pub fn write_checkpoint_data_chunk(
        &mut self,
        checkpoint_id: &str,
        chunk_index: f64,
        offset_bytes: f64,
        data: &[u8],
    ) -> Result<(), JsError> {
        self.inner
            .write_checkpoint_data_chunk(
                checkpoint_id,
                chunk_index as i64,
                offset_bytes as i64,
                data,
            )
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    #[wasm_bindgen(js_name = "readDeltaChangesetChunk")]
    pub fn read_delta_changeset_chunk(
        &self,
        delta_id: &str,
        chunk_index: f64,
    ) -> Result<JsValue, JsError> {
        optional_bytes_to_js(
            self.inner
                .read_delta_changeset_chunk(delta_id, chunk_index as i64)
                .map_err(|e| JsError::new(&format!("{e}")))?,
        )
    }

    #[wasm_bindgen(js_name = "clearDeltaChangesetChunks")]
    pub fn clear_delta_changeset_chunks(&mut self, delta_id: &str) -> Result<(), JsError> {
        self.inner
            .clear_delta_changeset_chunks(delta_id)
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    #[wasm_bindgen(js_name = "writeDeltaChangesetChunk")]
    pub fn write_delta_changeset_chunk(
        &mut self,
        delta_id: &str,
        chunk_index: f64,
        offset_bytes: f64,
        data: &[u8],
    ) -> Result<(), JsError> {
        self.inner
            .write_delta_changeset_chunk(delta_id, chunk_index as i64, offset_bytes as i64, data)
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    #[wasm_bindgen(js_name = "listVersions")]
    pub fn list_versions(&self) -> Result<JsValue, JsError> {
        let entries = self
            .inner
            .version_control()
            .list_versions()
            .map_err(|e| JsError::new(&format!("{e}")))?;
        to_js(&entries)
    }

    #[wasm_bindgen(js_name = "readVersionGraph")]
    pub fn read_version_graph(&self) -> Result<JsValue, JsError> {
        let vg = self
            .inner
            .version_control()
            .read_version_graph()
            .map_err(|e| JsError::new(&format!("{e}")))?;
        match vg {
            Some(graph) => to_js(&graph),
            None => Ok(JsValue::UNDEFINED),
        }
    }

    // ── Export utilities (streaming-friendly) ──────────────────────────────

    /// Flush the WAL journal into the main database file.
    ///
    /// After calling this, the OPFS file backing this document contains
    /// all committed data.  JavaScript can then read the file directly
    /// from OPFS in chunks and gzip-compress it.
    #[wasm_bindgen(js_name = "checkpointWal")]
    pub fn checkpoint_wal(&self) -> Result<(), JsError> {
        self.inner
            .checkpoint_wal()
            .map_err(|e| JsError::new(&format!("{e}")))
    }

    /// Return the estimated database file size in bytes
    /// (`page_count × page_size`).  Call [`checkpoint_wal`] first for
    /// an accurate value.
    #[wasm_bindgen(js_name = "getDbSizeBytes")]
    pub fn get_db_size_bytes(&self) -> Result<f64, JsError> {
        let size = self
            .inner
            .db_size_bytes()
            .map_err(|e| JsError::new(&format!("{e}")))?;
        Ok(size as f64)
    }

    /// Read a chunk from the SQLite database backing this OPFS document.
    ///
    /// Call [`checkpointWal`] first so the main database file contains all
    /// committed data. JavaScript can gzip successive chunks without loading
    /// the whole database into WASM memory.
    #[wasm_bindgen(js_name = "exportDbChunk")]
    pub async fn export_db_chunk(&self, offset_bytes: f64, length: u32) -> Result<Vec<u8>, JsError> {
        if !offset_bytes.is_finite()
            || offset_bytes < 0.0
            || offset_bytes.fract() != 0.0
            || offset_bytes > usize::MAX as f64
        {
            return Err(JsError::new(
                "OPFS export offset exceeds the browser WASM file limit",
            ));
        }
        let util = opfs_sahpool_util(self.pool_namespace.as_deref()).await?;
        util.export_db_chunk(&self.filename, offset_bytes as usize, length as usize)
            .map_err(|e| JsError::new(&format!("{e:?}")))
    }

    /// Execute an arbitrary SQL batch (e.g. `VACUUM INTO 'export.sqlite'`).
    #[wasm_bindgen(js_name = "executeBatch")]
    pub fn execute_batch(&self, sql: &str) -> Result<(), JsError> {
        self.inner
            .execute_batch(sql)
            .map_err(|e| JsError::new(&format!("{e}")))
    }
}

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
async fn opfs_sahpool_util(
    namespace: Option<&str>,
) -> Result<sqlite_wasm_vfs::sahpool::OpfsSAHPoolUtil, JsError> {
    use sqlite_wasm_vfs::sahpool::{install as install_opfs_sahpool, OpfsSAHPoolCfgBuilder};

    let mut builder = OpfsSAHPoolCfgBuilder::new().initial_capacity(12);
    if let Some(namespace) = namespace {
        if namespace.is_empty()
            || !namespace
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_')
        {
            return Err(JsError::new("invalid OPFS pool namespace"));
        }
        let vfs_name = format!("opfs-sahpool-{namespace}");
        let directory = format!(".opfs-sahpool-{namespace}");
        builder = builder.vfs_name(&vfs_name).directory(&directory);
    }
    let cfg = builder.build();
    install_opfs_sahpool::<rusqlite::ffi::WasmOsCallback>(&cfg, true)
        .await
        .map_err(|e| JsError::new(&format!("{e:?}")))
}

#[cfg(all(target_family = "wasm", target_os = "unknown"))]
fn optional_bytes_to_js(data: Option<Vec<u8>>) -> Result<JsValue, JsError> {
    match data {
        Some(bytes) => Ok(js_sys::Uint8Array::from(bytes.as_slice()).into()),
        None => Ok(JsValue::UNDEFINED),
    }
}

// ── Version Control ────────────────────────────────────────────────────────

// ── Byte-buffer compatibility API ──────────────────────────────────────────
//
// These functions provide backward compatibility with the old byte-array API.
// They use the in-memory database internally (not OPFS streaming), so they're
// limited by WASM memory (~2-3GB practical). For unlimited file sizes, use
// DucOpfsDocument (browser) or the WASI binary (Node.js) instead.

/// Parse a `.duc` file (Uint8Array) into a JS object (ExportedDataState).
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "parseDuc")]
pub fn parse_duc(buf: &[u8]) -> Result<JsValue, JsError> {
    let state = duc::parse::parse_duc_bytes(buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&state)
}

/// Parse a `.duc` file lazily — returns everything EXCEPT external file data blobs.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "parseDucLazy")]
pub fn parse_duc_lazy(buf: &[u8]) -> Result<JsValue, JsError> {
    let state = duc::parse::parse_duc_bytes_lazy(buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&state)
}

/// Serialize a JS object (ExportedDataState) into `.duc` bytes (Uint8Array).
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "serializeDuc")]
pub fn serialize_duc(data: JsValue) -> Result<Vec<u8>, JsError> {
    let state: duc::types::ExportedDataState =
        serde_wasm_bindgen::from_value(data)
            .map_err(|e| JsError::new(&format!("{e}")))?;
    duc::serialize::serialize_duc_to_bytes(&state)
        .map_err(|e| JsError::new(&format!("{e}")))
}

/// Fetch a single external file from a `.duc` buffer by file ID.
///
/// Returns the file's binary data as a Uint8Array, or `undefined` if not found.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "getExternalFile")]
pub fn get_external_file(buf: &[u8], file_id: &str) -> Result<JsValue, JsError> {
    let entry = duc::parse::get_external_file_from_bytes(buf, file_id)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    match entry {
        Some(data) => Ok(js_sys::Uint8Array::from(data.as_slice()).into()),
        None => Ok(JsValue::UNDEFINED),
    }
}

/// List metadata for all external files (without loading the heavy data blobs).
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "listExternalFiles")]
pub fn list_external_files(buf: &[u8]) -> Result<JsValue, JsError> {
    let meta = duc::parse::list_external_files_from_bytes(buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&meta)
}

/// Restore the document state at `version_number` from a `.duc` file buffer.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "restoreVersion")]
pub fn restore_version(duc_buf: &[u8], version_number: f64) -> Result<JsValue, JsError> {
    let conn = duc::parse::open_duc_bytes_connection(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let duc_conn = duc::db::DucConnection::from_inner(conn);
    let vc = duc::api::version_control::VersionControl::from_connection(&duc_conn);
    let restored = vc
        .restore_version(version_number as i64)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_restored_js(&restored)
}

/// Restore a specific checkpoint by its ID from a `.duc` file buffer.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "restoreCheckpoint")]
pub fn restore_checkpoint(duc_buf: &[u8], checkpoint_id: &str) -> Result<JsValue, JsError> {
    let conn = duc::parse::open_duc_bytes_connection(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let duc_conn = duc::db::DucConnection::from_inner(conn);
    let vc = duc::api::version_control::VersionControl::from_connection(&duc_conn);
    let restored = vc
        .restore_checkpoint(checkpoint_id)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_restored_js(&restored)
}

/// List all versions (checkpoints + deltas) from a `.duc` file buffer.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "listVersions")]
pub fn list_versions(duc_buf: &[u8]) -> Result<JsValue, JsError> {
    let conn = duc::parse::open_duc_bytes_connection(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let duc_conn = duc::db::DucConnection::from_inner(conn);
    let vc = duc::api::version_control::VersionControl::from_connection(&duc_conn);
    let entries = vc
        .list_versions()
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_js(&entries)
}

/// Read the full VersionGraph from a `.duc` file buffer.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "readVersionGraph")]
pub fn read_version_graph(duc_buf: &[u8]) -> Result<JsValue, JsError> {
    let conn = duc::parse::open_duc_bytes_connection(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let duc_conn = duc::db::DucConnection::from_inner(conn);
    let vc = duc::api::version_control::VersionControl::from_connection(&duc_conn);
    let vg = vc
        .read_version_graph()
        .map_err(|e| JsError::new(&format!("{e}")))?;
    match vg {
        Some(graph) => to_js(&graph),
        None => Ok(JsValue::UNDEFINED),
    }
}

/// Revert the document to a specific version, removing all newer versions.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "revertToVersion")]
pub fn revert_to_version(duc_buf: &[u8], target_version: f64) -> Result<JsValue, JsError> {
    let conn = duc::parse::open_duc_bytes_connection(duc_buf)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    let duc_conn = duc::db::DucConnection::from_inner(conn);
    let vc = duc::api::version_control::VersionControl::from_connection(&duc_conn);
    let restored = vc
        .revert_to_version(target_version as i64)
        .map_err(|e| JsError::new(&format!("{e}")))?;
    to_restored_js(&restored)
}

/// Helper: convert a `RestoredVersion` to a JS value.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
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

// ── Schema Version ─────────────────────────────────────────────────────────

/// Returns the current version-control schema version defined in Rust.
///
/// TypeScript should use this as the source of truth instead of hardcoding
/// its own constant. When this value is bumped in Rust, the version control
/// system will automatically handle migration bookkeeping (closing old chains,
/// recording migrations) the next time a checkpoint or delta is created.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "getCurrentSchemaVersion")]
pub fn get_current_schema_version() -> i32 {
    duc::api::version_control::CURRENT_SCHEMA_VERSION
}

// ── Delta Encoding (bsdiff Binary Diff) ───────────────────────────────────

/// Compute a checkpoint-relative binary diff changeset using bsdiff.
///
/// `base_state` is the checkpoint's full data blob.
/// `current_state` is the full document state at the new version.
///
/// Returns an encoded changeset (`Uint8Array`) ready for storage in a
/// `Delta.payload`. bsdiff finds matching blocks even when they shift
/// offsets, which is critical for SQLite databases.
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "createDeltaChangeset")]
pub fn create_delta_changeset(base_state: &[u8], current_state: &[u8]) -> Result<Vec<u8>, JsError> {
    duc::api::version_control::create_bsdiff_changeset(base_state, current_state)
        .map_err(|e| JsError::new(&format!("{e}")))
}

/// Apply a changeset to reconstruct document state.
///
/// `base_state` must be the exact checkpoint data used when the changeset
/// was created. Returns the full document state as `Uint8Array`.
///
/// Handles all changeset formats transparently:
///   - v3 (bsdiff), v2 (XOR diff), v1 (gzip full snapshot)
#[cfg(all(target_family = "wasm", target_os = "unknown"))]
#[wasm_bindgen(js_name = "applyDeltaChangeset")]
pub fn apply_delta_changeset(base_state: &[u8], changeset: &[u8]) -> Result<Vec<u8>, JsError> {
    duc::api::version_control::apply_delta_changeset(base_state, changeset)
        .map_err(|e| JsError::new(&format!("{e}")))
}
