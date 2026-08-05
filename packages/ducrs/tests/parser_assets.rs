mod common;

use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{Cursor, Read};
use std::path::Path;

use duc::api::DucDocument;
use duc::session::DucSession;
use duc::types::ExportedDataState;

fn read_state(path: &Path) -> ExportedDataState {
    DucSession::open_path(path)
        .unwrap_or_else(|e| panic!("open {}: {e}", path.display()))
        .read_document_state()
        .unwrap_or_else(|e| panic!("read state {}: {e}", path.display()))
}

fn copy_external_revisions(
    source: &DucSession,
    target: &mut DucSession,
    state: &ExportedDataState,
    label: &str,
) {
    let Some(files) = state.external_files.as_ref() else {
        return;
    };

    for file in files.values() {
        for revision_id in file.revisions.keys() {
            let tmp_path = common::temp_path("external-revision", "bin");
            let streamed_len;
            {
                let mut tmp = File::create(&tmp_path)
                    .unwrap_or_else(|e| panic!("create {}: {e}", tmp_path.display()));
                streamed_len = source
                    .stream_external_file_revision_to_writer(revision_id, &mut tmp)
                    .unwrap_or_else(|e| {
                        panic!("stream external revision {revision_id} from {label}: {e}")
                    });
            }
            if streamed_len == 0 {
                let _ = fs::remove_file(tmp_path);
                continue;
            }
            let mut reader = File::open(&tmp_path)
                .unwrap_or_else(|e| panic!("open {}: {e}", tmp_path.display()));
            let mut revision = file
                .revisions
                .get(revision_id)
                .expect("revision metadata")
                .clone();
            revision.size_bytes = streamed_len as i64;
            target
                .write_external_file_revision_with_metadata(file, &revision, &mut reader)
                .unwrap_or_else(|e| {
                    panic!("write external revision {revision_id} for {label}: {e}")
                });
            let _ = fs::remove_file(tmp_path);
        }
    }
}

fn copy_version_graph_payloads(
    source: &DucSession,
    target: &mut DucSession,
    state: &ExportedDataState,
    label: &str,
) {
    let Some(version_graph) = state.version_graph.as_ref() else {
        return;
    };

    for checkpoint in &version_graph.checkpoints {
        let tmp_path = common::temp_path("checkpoint-data", "bin");
        {
            let mut tmp = File::create(&tmp_path)
                .unwrap_or_else(|e| panic!("create {}: {e}", tmp_path.display()));
            source
                .stream_checkpoint_data_to_writer(&checkpoint.base.id, &mut tmp)
                .unwrap_or_else(|e| {
                    panic!("stream checkpoint {} from {label}: {e}", checkpoint.base.id)
                });
        }
        let mut reader =
            File::open(&tmp_path).unwrap_or_else(|e| panic!("open {}: {e}", tmp_path.display()));
        target
            .write_checkpoint_data(
                &checkpoint.base.id,
                &mut reader,
                Some(checkpoint.size_bytes),
            )
            .unwrap_or_else(|e| panic!("write checkpoint {} for {label}: {e}", checkpoint.base.id));
        let _ = fs::remove_file(tmp_path);
    }

    for delta in &version_graph.deltas {
        let tmp_path = common::temp_path("delta-changeset", "bin");
        {
            let mut tmp = File::create(&tmp_path)
                .unwrap_or_else(|e| panic!("create {}: {e}", tmp_path.display()));
            source
                .stream_delta_changeset_to_writer(&delta.base.id, &mut tmp)
                .unwrap_or_else(|e| panic!("stream delta {} from {label}: {e}", delta.base.id));
        }
        let mut reader =
            File::open(&tmp_path).unwrap_or_else(|e| panic!("open {}: {e}", tmp_path.display()));
        target
            .write_delta_changeset(&delta.base.id, &mut reader, Some(delta.size_bytes))
            .unwrap_or_else(|e| panic!("write delta {} for {label}: {e}", delta.base.id));
        let _ = fs::remove_file(tmp_path);
    }
}

fn export_state_to_path(source_path: &Path, state: &ExportedDataState) -> std::path::PathBuf {
    let source = DucSession::open_path(source_path)
        .unwrap_or_else(|e| panic!("open source {}: {e}", source_path.display()));
    let mut export = DucSession::create_export_session()
        .unwrap_or_else(|e| panic!("create export session {}: {e}", source_path.display()));
    export
        .write_document_state(state)
        .unwrap_or_else(|e| panic!("write state {}: {e}", source_path.display()));
    copy_external_revisions(
        &source,
        &mut export,
        state,
        &source_path.display().to_string(),
    );
    copy_version_graph_payloads(
        &source,
        &mut export,
        state,
        &source_path.display().to_string(),
    );

    let out_path = common::temp_path("roundtrip", "duc");
    export
        .finish_to_path(&out_path)
        .unwrap_or_else(|e| panic!("finish export {}: {e}", out_path.display()));
    out_path
}

#[test]
fn parse_all_assets() {
    for path in common::all_duc_files() {
        let parsed = read_state(&path);

        assert!(
            !parsed.version.is_empty(),
            "{}: version must not be empty",
            path.display()
        );
        assert!(
            !parsed.source.is_empty(),
            "{}: source must not be empty",
            path.display()
        );
        assert!(
            !parsed.elements.is_empty() || !parsed.layers.is_empty(),
            "{}: must have elements or layers",
            path.display()
        );
    }
}

#[test]
fn roundtrip_all_assets() {
    for path in common::all_duc_files() {
        let parsed = read_state(&path);
        let out_path = export_state_to_path(&path, &parsed);
        let reparsed = read_state(&out_path);

        assert_eq!(
            parsed.elements.len(),
            reparsed.elements.len(),
            "{}: element count mismatch",
            path.display()
        );
        assert_eq!(
            parsed.layers.len(),
            reparsed.layers.len(),
            "{}: layer count mismatch",
            path.display()
        );
        assert_eq!(
            parsed.blocks.len(),
            reparsed.blocks.len(),
            "{}: block count mismatch",
            path.display()
        );
        assert_eq!(
            parsed.block_instances.len(),
            reparsed.block_instances.len(),
            "{}: block instance count mismatch",
            path.display()
        );
        assert_eq!(
            parsed.groups.len(),
            reparsed.groups.len(),
            "{}: group count mismatch",
            path.display()
        );
        assert_eq!(
            parsed.regions.len(),
            reparsed.regions.len(),
            "{}: region count mismatch",
            path.display()
        );
        let _ = fs::remove_file(out_path);
    }
}

#[test]
fn document_read_keeps_external_file_metadata_without_data() {
    for path in common::all_duc_files() {
        let session =
            DucSession::open_path(&path).unwrap_or_else(|e| panic!("open {}: {e}", path.display()));
        let state = session
            .read_document_state()
            .unwrap_or_else(|e| panic!("read state {}: {e}", path.display()));
        let listed = session
            .list_external_files()
            .unwrap_or_else(|e| panic!("list external files {}: {e}", path.display()));

        assert!(
            state.external_files_data.is_none(),
            "{}: document reads must omit external_files_data",
            path.display()
        );
        if listed.is_empty() {
            assert!(
                state.external_files.is_none(),
                "{}: unexpected external file metadata",
                path.display()
            );
        } else {
            let files = state
                .external_files
                .as_ref()
                .expect("external file metadata");
            assert_eq!(
                listed.len(),
                files.len(),
                "{}: external file count diverged",
                path.display()
            );
        }
    }
}

#[test]
fn element_ids_unique() {
    for path in common::all_duc_files() {
        let parsed = read_state(&path);
        let mut seen = HashSet::new();
        for el in &parsed.elements {
            let id = common::element_id(&el.element);
            assert!(
                seen.insert(id.clone()),
                "duplicate element id {id} in {}",
                path.display()
            );
        }
    }
}

#[test]
fn element_layer_refs_valid() {
    for path in common::all_duc_files() {
        let parsed = read_state(&path);
        let layer_ids: HashSet<_> = parsed.layers.iter().map(|l| l.id.as_str()).collect();
        for el in &parsed.elements {
            if let Some(layer_id) = common::element_base(&el.element).layer_id.as_deref() {
                if !layer_id.is_empty() {
                    assert!(
                        layer_ids.contains(layer_id),
                        "missing layer ref {layer_id} in {}",
                        path.display()
                    );
                }
            }
        }
    }
}

#[test]
fn block_instance_refs_valid() {
    for path in common::all_duc_files() {
        let parsed = read_state(&path);
        let block_ids: HashSet<_> = parsed.blocks.iter().map(|b| b.id.as_str()).collect();
        for bi in &parsed.block_instances {
            assert!(
                block_ids.contains(bi.block_id.as_str()),
                "missing block ref {} in {}",
                bi.block_id,
                path.display()
            );
        }
    }
}

#[test]
fn external_files_list_get_consistent() {
    for path in common::all_duc_files() {
        let session =
            DucSession::open_path(&path).unwrap_or_else(|e| panic!("open {}: {e}", path.display()));
        let state = session
            .read_document_state()
            .unwrap_or_else(|e| panic!("read state {}: {e}", path.display()));
        let listed = session
            .list_external_files()
            .unwrap_or_else(|e| panic!("list_external_files {}: {e}", path.display()));
        let files = state.external_files.unwrap_or_default();
        for meta in &listed {
            let file = files.get(&meta.id).unwrap_or_else(|| {
                panic!("missing external file {} in {}", meta.id, path.display())
            });
            assert!(
                !file.revisions.is_empty(),
                "{}: file '{}' has no revisions",
                path.display(),
                meta.id
            );
            let revision = file
                .revisions
                .get(&file.active_revision_id)
                .unwrap_or_else(|| {
                    panic!(
                        "missing active revision {} in {}",
                        file.active_revision_id,
                        path.display()
                    )
                });
            let tmp_path = common::temp_path("external-read", "bin");
            let streamed_len = {
                let mut tmp = File::create(&tmp_path)
                    .unwrap_or_else(|e| panic!("create {}: {e}", tmp_path.display()));
                session
                    .stream_external_file_revision_to_writer(&revision.id, &mut tmp)
                    .unwrap_or_else(|e| {
                        panic!(
                            "stream revision {} from {}: {e}",
                            revision.id,
                            path.display()
                        )
                    })
            };
            if revision.size_bytes >= 0 && streamed_len != revision.size_bytes as u64 {
                assert!(
                    streamed_len > 0,
                    "{}: active revision {} has metadata size {} but no streamed bytes",
                    path.display(),
                    revision.id,
                    revision.size_bytes
                );
            }
            let _ = fs::remove_file(tmp_path);
        }
    }
}

#[test]
fn db_open_memory_and_schema() {
    let doc = DucDocument::open_memory().expect("open_memory");
    let version = doc.schema_version().expect("schema_version");
    assert!(
        version > 0,
        "schema version must be positive, got {version}"
    );
}

#[test]
fn serialized_is_compressed() {
    for path in common::all_duc_files() {
        let mut header = [0u8; 16];
        File::open(&path)
            .unwrap_or_else(|e| panic!("open {}: {e}", path.display()))
            .read_exact(&mut header)
            .unwrap_or_else(|e| panic!("read header {}: {e}", path.display()));
        assert_ne!(
            &header,
            b"SQLite format 3\0",
            "{}: assets should be compressed",
            path.display()
        );

        let parsed = read_state(&path);
        let out_path = export_state_to_path(&path, &parsed);
        let mut gzip_magic = [0u8; 2];
        File::open(&out_path)
            .unwrap_or_else(|e| panic!("open {}: {e}", out_path.display()))
            .read_exact(&mut gzip_magic)
            .unwrap_or_else(|e| panic!("read gzip magic {}: {e}", out_path.display()));
        assert_eq!(
            gzip_magic,
            [0x1f, 0x8b],
            "{}: export must be gzip compressed",
            out_path.display()
        );
        let _ = fs::remove_file(out_path);
    }
}

#[test]
fn global_state_valid() {
    for path in common::all_duc_files() {
        let parsed = read_state(&path);
        if let Some(gs) = parsed.duc_global_state.as_ref() {
            assert!(!gs.view_background_color.is_empty(), "{}", path.display());
            assert!(!gs.main_scope.is_empty(), "{}", path.display());
        }
    }
}

#[test]
fn parse_rejects_garbage() {
    let cases: &[(&str, &[u8])] = &[
        ("empty", &[]),
        ("random", &[0xFF; 64]),
        ("text", b"Not a DUC file"),
    ];

    for (label, data) in cases {
        assert!(
            DucSession::open_reader(Cursor::new(*data)).is_err(),
            "stream reader should reject {label} input"
        );
    }
}
