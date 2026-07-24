//! WASM (`wasm32-unknown-unknown`) storage backend.
//!
//! Two connection modes:
//!
//! * **OPFS SAH-pool** (`open_file_opfs`) — persistent, browser-only.
//!   Requires a Dedicated Worker context; uses `FileSystemSyncAccessHandle`.
//! * **In-memory** (`open_memory`) — synchronous, no persistence.

use rusqlite::Connection;
#[cfg(feature = "opfs")]
use sqlite_wasm_vfs::sahpool::install as install_opfs_sahpool;

#[cfg(feature = "opfs")]
use crate::db::DbError;
use crate::db::{bootstrap, DbResult, DucConnection};

/// Open (or reopen) a persistent OPFS-backed database.
///
/// # Worker requirement
/// `SyncAccessHandle` is not available on the main browser thread.
/// Spawn a `Worker` and call this from there, then communicate via
/// `postMessage` / `SharedArrayBuffer` or a `BroadcastChannel`.
#[cfg(feature = "opfs")]
pub(crate) async fn open_file_opfs(name: &str) -> DbResult<DucConnection> {
    open_file_opfs_in_namespace(name, None).await
}

#[cfg(feature = "opfs")]
pub(crate) async fn open_file_opfs_in_namespace(
    name: &str,
    namespace: Option<&str>,
) -> DbResult<DucConnection> {
    use sqlite_wasm_vfs::sahpool::OpfsSAHPoolCfgBuilder;

    let mut builder = OpfsSAHPoolCfgBuilder::new().initial_capacity(12);
    if let Some(namespace) = namespace {
        if namespace.is_empty()
            || !namespace
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_')
        {
            return Err(DbError::Opfs("invalid OPFS pool namespace".into()));
        }
        let vfs_name = format!("opfs-sahpool-{namespace}");
        let directory = format!(".opfs-sahpool-{namespace}");
        builder = builder.vfs_name(&vfs_name).directory(&directory);
    }
    let cfg = builder.build();

    // Install the OPFS SAH-pool VFS and make it the default for this Worker.
    install_opfs_sahpool::<rusqlite::ffi::WasmOsCallback>(&cfg, true)
        .await
        .map_err(|e| DbError::Opfs(format!("{e:?}")))?;

    // `Connection::open` will use the default VFS (opfs-sahpool) set above.
    let conn = Connection::open(name)?;
    bootstrap::bootstrap(&conn)?;
    Ok(DucConnection(conn))
}

/// Open an ephemeral in-memory database (synchronous, works on any thread).
pub(crate) fn open_memory() -> DbResult<DucConnection> {
    let conn = Connection::open_in_memory()?;
    bootstrap::bootstrap(&conn)?;
    Ok(DucConnection(conn))
}
