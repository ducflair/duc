mod common;

use std::fs::{self, File};

use duc::external_file_chunks::MIN_EXTERNAL_FILE_CHUNK_SIZE;
use duc::session::{DucSession, DucSessionOptions};

fn finish_session_to_temp_path(session: DucSession, label: &str) -> std::path::PathBuf {
    let path = common::temp_path(label, "duc");
    session
        .finish_to_path(&path)
        .unwrap_or_else(|e| panic!("finish {label} export: {e}"));
    path
}

fn clear_streamed_payloads(state: &mut duc::types::ExportedDataState) {
    state.external_files_data = None;
    if let Some(version_graph) = &mut state.version_graph {
        for checkpoint in &mut version_graph.checkpoints {
            checkpoint.data.clear();
        }
        for delta in &mut version_graph.deltas {
            delta.payload.clear();
        }
    }
}

#[test]
fn synthetic_roundtrip_preserves_indexed_parser_fields() {
    let state = common::synthetic_roundtrip_state();
    let mut export_session = DucSession::create_export_session().expect("create export session");
    export_session
        .write_document_state(&state)
        .expect("write synthetic state");
    let path = finish_session_to_temp_path(export_session, "synthetic-roundtrip");
    let read_session = DucSession::open_path(&path).expect("open synthetic state");
    let parsed = read_session
        .read_document_state()
        .expect("read synthetic state");
    let mut expected = state.clone();
    clear_streamed_payloads(&mut expected);

    assert_eq!(
        common::canonicalize_roundtrip_state(expected.clone()),
        common::canonicalize_roundtrip_state(parsed),
    );

    let revision_path = common::temp_path("synthetic-revision", "bin");
    {
        let mut revision_file = File::create(&revision_path).expect("create revision output");
        let len = read_session
            .stream_external_file_revision_to_writer("file-image-rev-1", &mut revision_file)
            .expect("stream synthetic revision");
        assert_eq!(len, 4);
    }
    let streamed_revision = fs::read(&revision_path).expect("read streamed revision");
    assert_eq!(streamed_revision, vec![1, 2, 3, 4]);
    let _ = fs::remove_file(revision_path);
    let _ = fs::remove_file(path);
}

#[test]
fn session_export_streams_external_file_revision_chunks() {
    let mut state = common::synthetic_roundtrip_state();
    let revision_id = "file-image-rev-2";
    let file_bytes: Vec<u8> = (0..(MIN_EXTERNAL_FILE_CHUNK_SIZE + 7))
        .map(|i| (i % 251) as u8)
        .collect();

    state
        .external_files_data
        .as_mut()
        .expect("synthetic files data")
        .insert(
            revision_id.to_string(),
            serde_bytes::ByteBuf::from(file_bytes.clone()),
        );
    state
        .external_files
        .as_mut()
        .and_then(|files| files.get_mut("file-image"))
        .and_then(|file| file.revisions.get_mut(revision_id))
        .expect("synthetic revision")
        .size_bytes = file_bytes.len() as i64;

    let options =
        DucSessionOptions::with_chunk_size(MIN_EXTERNAL_FILE_CHUNK_SIZE).expect("valid chunk size");
    let mut export_session =
        DucSession::create_export_session_with_options(options).expect("create export session");
    export_session
        .write_document_state(&state)
        .expect("write document state");

    let path = finish_session_to_temp_path(export_session, "external-chunks");

    let read_session = DucSession::open_path(&path).expect("open read session");
    let mut chunk_sizes = Vec::new();
    read_session
        .for_each_external_file_revision_chunk(revision_id, |chunk| {
            chunk_sizes.push(chunk.data.len());
            Ok(())
        })
        .expect("iterate chunks");
    assert_eq!(chunk_sizes, vec![MIN_EXTERNAL_FILE_CHUNK_SIZE, 7]);

    let mut streamed = Vec::new();
    let streamed_len = read_session
        .stream_external_file_revision_to_writer(revision_id, &mut streamed)
        .expect("stream revision");
    assert_eq!(streamed_len, file_bytes.len() as u64);
    assert_eq!(streamed, file_bytes);

    let mut streamed_again = Vec::new();
    read_session
        .stream_external_file_revision_to_writer(revision_id, &mut streamed_again)
        .expect("stream chunked revision again");
    assert_eq!(streamed_again.as_slice(), file_bytes.as_slice());
    let _ = fs::remove_file(path);
}

#[test]
fn session_export_streams_version_graph_payload_chunks() {
    let mut state = common::synthetic_roundtrip_state();
    let checkpoint_bytes: Vec<u8> = (0..(MIN_EXTERNAL_FILE_CHUNK_SIZE + 11))
        .map(|i| (i % 239) as u8)
        .collect();
    let delta_bytes: Vec<u8> = (0..(MIN_EXTERNAL_FILE_CHUNK_SIZE + 13))
        .map(|i| (i % 227) as u8)
        .collect();

    let version_graph = state.version_graph.as_mut().expect("version graph");
    let checkpoint = version_graph
        .checkpoints
        .iter_mut()
        .find(|checkpoint| checkpoint.base.id == "checkpoint-1")
        .expect("checkpoint");
    checkpoint.data = checkpoint_bytes.clone();
    checkpoint.size_bytes = checkpoint_bytes.len() as i64;

    let delta = version_graph
        .deltas
        .iter_mut()
        .find(|delta| delta.base.id == "delta-1")
        .expect("delta");
    delta.payload = delta_bytes.clone();
    delta.size_bytes = delta_bytes.len() as i64;

    let options =
        DucSessionOptions::with_chunk_size(MIN_EXTERNAL_FILE_CHUNK_SIZE).expect("valid chunk size");
    let mut export_session =
        DucSession::create_export_session_with_options(options).expect("create export session");
    export_session
        .write_document_state(&state)
        .expect("write document state");

    let path = finish_session_to_temp_path(export_session, "version-graph-chunks");

    let read_session = DucSession::open_path(&path).expect("open read session");

    let mut streamed_checkpoint = Vec::new();
    let checkpoint_len = read_session
        .stream_checkpoint_data_to_writer("checkpoint-1", &mut streamed_checkpoint)
        .expect("stream checkpoint");
    assert_eq!(checkpoint_len, checkpoint_bytes.len() as u64);
    assert_eq!(streamed_checkpoint, checkpoint_bytes);

    let mut streamed_delta = Vec::new();
    let delta_len = read_session
        .stream_delta_changeset_to_writer("delta-1", &mut streamed_delta)
        .expect("stream delta");
    assert_eq!(delta_len, delta_bytes.len() as u64);
    assert_eq!(streamed_delta, delta_bytes);

    let parsed = read_session
        .read_document_state()
        .expect("read document state");
    let parsed_graph = parsed.version_graph.as_ref().expect("parsed version graph");
    assert!(parsed_graph.checkpoints[0].data.is_empty());
    assert!(parsed_graph.deltas[0].payload.is_empty());
    let _ = fs::remove_file(path);
}
