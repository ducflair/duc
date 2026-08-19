use super::*;
use crate::db::{self, DucConnection};
use flate2::write::{GzEncoder, ZlibEncoder};
use std::io::Write;

fn sqlite_state(seed: u8, len: usize) -> Vec<u8> {
    assert!(len >= SQLITE_HEADER_MAGIC.len());
    let mut bytes = vec![0; len];
    bytes[..SQLITE_HEADER_MAGIC.len()].copy_from_slice(SQLITE_HEADER_MAGIC);
    for (index, byte) in bytes[SQLITE_HEADER_MAGIC.len()..].iter_mut().enumerate() {
        *byte = seed.wrapping_add((index % 251) as u8);
    }
    bytes
}

fn gzip(bytes: &[u8]) -> Vec<u8> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(bytes).expect("write gzip input");
    encoder.finish().expect("finish gzip")
}

fn zlib(bytes: &[u8]) -> Vec<u8> {
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(bytes).expect("write zlib input");
    encoder.finish().expect("finish zlib")
}

fn checkpoint(
    id: &str,
    version_number: i64,
    schema_version: i32,
    data: Vec<u8>,
    is_schema_boundary: bool,
) -> Checkpoint {
    Checkpoint {
        base: VersionBase {
            id: id.to_owned(),
            parent_id: None,
            timestamp: version_number * 1_000,
            description: Some(format!("checkpoint {version_number}")),
            is_manual_save: true,
            user_id: Some("test-user".to_owned()),
        },
        version_number,
        schema_version,
        is_schema_boundary,
        size_bytes: -1,
        data,
    }
}

fn delta(
    id: &str,
    version_number: i64,
    schema_version: i32,
    base_checkpoint_id: &str,
    data: Vec<u8>,
) -> Delta {
    Delta {
        base: VersionBase {
            id: id.to_owned(),
            parent_id: Some(base_checkpoint_id.to_owned()),
            timestamp: version_number * 1_000,
            description: Some(format!("delta {version_number}")),
            is_manual_save: false,
            user_id: None,
        },
        version_number,
        schema_version,
        base_checkpoint_id: base_checkpoint_id.to_owned(),
        payload: data,
        size_bytes: -1,
    }
}

fn open_connection() -> DucConnection {
    db::open_memory().expect("open version-control test database")
}

#[test]
fn checkpoint_and_delta_roundtrip_keep_graph_metadata_consistent() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(11, 32 * 1024);
    let mut current = base.clone();
    current[4_096..4_112].fill(99);

    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base.clone(), false))
        .expect("create checkpoint");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", current.clone()))
        .expect("create delta");
    vc.set_user_checkpoint("checkpoint-1")
        .expect("set user checkpoint");

    let checkpoint_restore = vc
        .restore_checkpoint("checkpoint-1")
        .expect("restore checkpoint");
    assert_eq!(checkpoint_restore.data, base);
    assert!(checkpoint_restore.from_checkpoint);
    let delta_restore = vc.restore_version(2).expect("restore delta");
    assert_eq!(delta_restore.data, current);
    assert!(!delta_restore.from_checkpoint);

    let versions = vc.list_versions().expect("list versions");
    assert_eq!(
        versions
            .iter()
            .map(|version| (version.version_number, version.version_type.as_str()))
            .collect::<Vec<_>>(),
        vec![(1, "checkpoint"), (2, "delta")]
    );
    assert_eq!(versions[0].size_bytes, base.len() as i64);

    let graph = vc
        .read_version_graph()
        .expect("read version graph")
        .expect("version graph exists");
    assert_eq!(graph.user_checkpoint_version_id, "checkpoint-1");
    assert_eq!(graph.latest_version_id, "delta-2");
    assert_eq!(graph.metadata.current_version, 2);
    assert_eq!(graph.metadata.current_schema_version, 7);
    assert_eq!(graph.metadata.chain_count, 1);
    assert_eq!(
        graph.metadata.total_size,
        versions.iter().map(|version| version.size_bytes).sum()
    );
    assert_eq!(graph.chains.len(), 1);
    assert_eq!(graph.chains[0].start_version, 1);
    assert_eq!(
        graph.chains[0].root_checkpoint_id.as_deref(),
        Some("checkpoint-1")
    );
    assert!(graph.chains[0].migration.is_none());
    assert!(graph.checkpoints[0].data.is_empty());
    assert!(graph.deltas[0].payload.is_empty());
}

#[test]
fn schema_transition_closes_and_links_version_chains() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let schema_7 = sqlite_state(7, 16 * 1024);
    let mut schema_7_delta = schema_7.clone();
    schema_7_delta[2_000] = 42;
    let schema_8 = sqlite_state(8, 16 * 1024);
    let mut schema_8_delta = schema_8.clone();
    schema_8_delta[3_000] = 43;

    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, schema_7, false))
        .expect("create first checkpoint");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", schema_7_delta))
        .expect("create first delta");
    vc.create_checkpoint(&checkpoint("checkpoint-3", 3, 8, schema_8, true))
        .expect("create boundary checkpoint");
    vc.create_delta(&delta("delta-4", 4, 8, "checkpoint-3", schema_8_delta))
        .expect("create second delta");

    let graph = vc
        .read_version_graph()
        .expect("read graph")
        .expect("graph exists");
    assert_eq!(graph.metadata.chain_count, 2);
    assert_eq!(graph.metadata.current_schema_version, 8);
    assert_eq!(graph.chains.len(), 2);

    let old_chain = &graph.chains[0];
    assert_eq!(old_chain.schema_version, 7);
    assert_eq!(old_chain.start_version, 1);
    assert_eq!(old_chain.end_version, Some(2));
    assert_eq!(
        old_chain.root_checkpoint_id.as_deref(),
        Some("checkpoint-1")
    );

    let new_chain = &graph.chains[1];
    assert_eq!(new_chain.schema_version, 8);
    assert_eq!(new_chain.start_version, 3);
    assert_eq!(new_chain.end_version, None);
    assert_eq!(
        new_chain.root_checkpoint_id.as_deref(),
        Some("checkpoint-3")
    );
    let migration = new_chain.migration.as_ref().expect("linked migration");
    assert_eq!(migration.from_schema_version, 7);
    assert_eq!(migration.to_schema_version, 8);
    assert_eq!(
        migration.boundary_checkpoint_id.as_deref(),
        Some("checkpoint-3")
    );
}

#[test]
fn invalid_version_writes_fail_without_mutating_the_graph() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(1, 8 * 1024);

    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base.clone(), false))
        .expect("create checkpoint");

    let non_boundary = vc
        .create_checkpoint(&checkpoint("checkpoint-2", 2, 8, base.clone(), false))
        .expect_err("schema transition must require a boundary checkpoint");
    assert!(non_boundary
        .to_string()
        .contains("must be marked as a schema boundary"));

    let duplicate_number = vc
        .create_delta(&delta(
            "delta-duplicate",
            1,
            7,
            "checkpoint-1",
            base.clone(),
        ))
        .expect_err("version numbers are globally unique");
    assert!(duplicate_number
        .to_string()
        .contains("version number 1 already exists"));

    let duplicate_id = vc
        .create_checkpoint(&checkpoint("checkpoint-1", 2, 7, base.clone(), false))
        .expect_err("version ids are globally unique");
    assert!(duplicate_id
        .to_string()
        .contains("version id checkpoint-1 already exists"));

    let missing_base = vc
        .create_delta(&delta("delta-missing", 2, 7, "missing", base.clone()))
        .expect_err("delta base must exist");
    assert!(missing_base.to_string().contains("Query returned no rows"));

    let versions = vc.list_versions().expect("list versions after failures");
    assert_eq!(versions.len(), 1);
    let graph = vc
        .read_version_graph()
        .expect("read graph")
        .expect("graph exists");
    assert_eq!(graph.metadata.current_version, 1);
    assert_eq!(graph.metadata.current_schema_version, 7);
    assert_eq!(graph.metadata.chain_count, 1);
    assert!(graph.chains[0].migration.is_none());
}

#[test]
fn deltas_cannot_cross_or_reopen_schema_chains() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let schema_7 = sqlite_state(7, 8 * 1024);
    let schema_8 = sqlite_state(8, 8 * 1024);

    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, schema_7.clone(), false))
        .expect("create first checkpoint");
    vc.create_checkpoint(&checkpoint("checkpoint-2", 2, 8, schema_8.clone(), true))
        .expect("create boundary checkpoint");

    let schema_mismatch = vc
        .create_delta(&delta("delta-3", 3, 8, "checkpoint-1", schema_8))
        .expect_err("delta schema must match its base checkpoint");
    assert!(schema_mismatch
        .to_string()
        .contains("does not match base checkpoint"));

    let closed_chain = vc
        .create_delta(&delta("delta-3b", 3, 7, "checkpoint-1", schema_7))
        .expect_err("delta cannot append to a closed schema chain");
    assert!(closed_chain
        .to_string()
        .contains("not the active schema version"));

    let downgrade = vc
        .create_checkpoint(&checkpoint(
            "checkpoint-3",
            3,
            7,
            sqlite_state(9, 8 * 1024),
            true,
        ))
        .expect_err("schema cannot move backwards");
    assert!(downgrade.to_string().contains("cannot move backwards"));
    assert_eq!(vc.list_versions().expect("list versions").len(), 2);
}

#[test]
fn revert_across_schema_boundary_removes_future_payloads_and_reopens_chain() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(4, 16 * 1024);
    let mut version_2 = base.clone();
    version_2[100] = 5;
    let boundary = sqlite_state(8, 16 * 1024);
    let mut version_4 = boundary.clone();
    version_4[200] = 9;

    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base, false))
        .expect("create checkpoint 1");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", version_2.clone()))
        .expect("create delta 2");
    vc.create_checkpoint(&checkpoint("checkpoint-3", 3, 8, boundary, true))
        .expect("create checkpoint 3");
    vc.create_delta(&delta("delta-4", 4, 8, "checkpoint-3", version_4))
        .expect("create delta 4");
    vc.set_user_checkpoint("checkpoint-3")
        .expect("set future user checkpoint");

    let restored = vc.revert_to_version(2).expect("revert to delta 2");
    assert_eq!(restored.data, version_2);

    let versions = vc.list_versions().expect("list retained versions");
    assert_eq!(
        versions
            .iter()
            .map(|version| version.version_number)
            .collect::<Vec<_>>(),
        vec![1, 2]
    );
    let graph = vc
        .read_version_graph()
        .expect("read reverted graph")
        .expect("graph exists");
    assert_eq!(graph.latest_version_id, "delta-2");
    assert_eq!(graph.user_checkpoint_version_id, "");
    assert_eq!(graph.metadata.current_version, 2);
    assert_eq!(graph.metadata.current_schema_version, 7);
    assert_eq!(graph.metadata.chain_count, 1);
    assert_eq!(graph.chains.len(), 1);
    assert_eq!(graph.chains[0].end_version, None);
    assert!(graph.chains[0].migration.is_none());

    conn.with(|raw| {
        let future_chunks: i64 = raw
            .query_row(
                "SELECT (SELECT COUNT(*) FROM checkpoint_data_chunks WHERE checkpoint_id = 'checkpoint-3') +
                        (SELECT COUNT(*) FROM delta_changeset_chunks WHERE delta_id = 'delta-4')",
                [],
                |row| row.get(0),
            )
            .expect("count future chunks");
        assert_eq!(future_chunks, 0);
    });

    vc.create_checkpoint(&checkpoint(
        "checkpoint-3b",
        3,
        7,
        sqlite_state(10, 8 * 1024),
        false,
    ))
    .expect("append to reopened chain");
}

#[test]
fn user_checkpoint_must_reference_a_checkpoint() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(3, 8 * 1024);
    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base.clone(), false))
        .expect("create checkpoint");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", base))
        .expect("create delta");

    assert!(vc.set_user_checkpoint("missing").is_err());
    assert!(vc.set_user_checkpoint("delta-2").is_err());
    vc.set_user_checkpoint("checkpoint-1")
        .expect("set valid checkpoint");
}

#[test]
fn restore_rejects_corrupt_checkpoint_and_delta_chunk_layouts() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(5, 8 * 1024);
    let mut current = base.clone();
    current[500] = 6;
    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base, false))
        .expect("create checkpoint");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", current))
        .expect("create delta");

    conn.with(|raw| {
        raw.execute(
            "UPDATE checkpoint_data_chunks SET offset_bytes = 1
             WHERE checkpoint_id = 'checkpoint-1' AND chunk_index = 0",
            [],
        )
        .expect("corrupt checkpoint offset");
    });
    let checkpoint_error = vc
        .restore_checkpoint("checkpoint-1")
        .expect_err("corrupt checkpoint must fail");
    assert!(checkpoint_error
        .to_string()
        .contains("expected chunk offset 0, found 1"));

    conn.with(|raw| {
        raw.execute(
            "UPDATE checkpoint_data_chunks SET offset_bytes = 0
             WHERE checkpoint_id = 'checkpoint-1' AND chunk_index = 0",
            [],
        )
        .expect("repair checkpoint offset");
        raw.execute(
            "UPDATE delta_changeset_chunks SET size_bytes = size_bytes + 1
             WHERE delta_id = 'delta-2' AND chunk_index = 0",
            [],
        )
        .expect("corrupt delta size");
    });
    let delta_error = vc.restore_version(2).expect_err("corrupt delta must fail");
    assert!(delta_error.to_string().contains("declares"));
    assert!(delta_error.to_string().contains("but stores"));
}

#[test]
fn restore_rejects_missing_local_payload_bytes() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(12, 8 * 1024);
    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base, false))
        .expect("create checkpoint");
    conn.with(|raw| {
        raw.execute(
            "DELETE FROM checkpoint_data_chunks WHERE checkpoint_id = 'checkpoint-1'",
            [],
        )
        .expect("delete checkpoint payload");
    });

    let error = vc
        .restore_checkpoint("checkpoint-1")
        .expect_err("missing payload must fail");
    assert!(error
        .to_string()
        .contains("declares 8192 payload bytes but stores 0"));
}

#[test]
fn graph_read_rejects_relational_and_pointer_corruption() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(14, 8 * 1024);
    let mut current = base.clone();
    current[700] = 15;
    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base, false))
        .expect("create checkpoint");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", current))
        .expect("create delta");

    conn.with(|raw| {
        raw.execute(
            "UPDATE deltas SET schema_version = 8 WHERE id = 'delta-2'",
            [],
        )
        .expect("corrupt delta schema");
    });
    let relation_error = vc
        .read_version_graph()
        .expect_err("cross-schema delta must be rejected");
    assert!(relation_error
        .to_string()
        .contains("deltas violate their base checkpoint or version chain"));

    conn.with(|raw| {
        raw.execute(
            "UPDATE deltas SET schema_version = 7 WHERE id = 'delta-2'",
            [],
        )
        .expect("repair delta schema");
        raw.execute(
            "UPDATE version_graph SET latest_version_id = 'checkpoint-1' WHERE id = 1",
            [],
        )
        .expect("corrupt latest pointer");
    });
    let pointer_error = vc
        .read_version_graph()
        .expect_err("stale latest pointer must be rejected");
    assert!(pointer_error
        .to_string()
        .contains("latest pointer does not match stored version 2"));
}

#[test]
fn graph_read_rejects_delta_sequence_gaps() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    let base = sqlite_state(16, 8 * 1024);
    let mut version_2 = base.clone();
    version_2[800] = 17;
    let mut version_3 = base.clone();
    version_3[900] = 18;
    vc.create_checkpoint(&checkpoint("checkpoint-1", 1, 7, base, false))
        .expect("create checkpoint");
    vc.create_delta(&delta("delta-2", 2, 7, "checkpoint-1", version_2))
        .expect("create delta 2");
    vc.create_delta(&delta("delta-3", 3, 7, "checkpoint-1", version_3))
        .expect("create delta 3");

    conn.with(|raw| {
        raw.execute(
            "UPDATE deltas SET delta_sequence = 4 WHERE id = 'delta-3'",
            [],
        )
        .expect("create sequence gap");
    });
    let error = vc
        .read_version_graph()
        .expect_err("sequence gap must be rejected");
    assert!(error
        .to_string()
        .contains("delta sequences contain gaps or duplicates"));
}

#[test]
fn fossil_and_snapshot_changesets_roundtrip_compressed_and_raw_states() {
    let base = sqlite_state(21, 64 * 1024);
    let mut current = base.clone();
    current[8_000..8_050].fill(77);

    for (base_input, current_input) in [
        (base.clone(), current.clone()),
        (gzip(&base), gzip(&current)),
    ] {
        let changeset = create_bsdiff_changeset(&base_input, &current_input)
            .expect("create checkpoint-relative changeset");
        assert_eq!(
            apply_delta_changeset(&base_input, &changeset).expect("apply changeset"),
            current
        );
    }

    let legacy_snapshot = zlib(&current);
    assert_eq!(
        apply_delta_changeset(&base, &legacy_snapshot).expect("apply legacy snapshot"),
        current
    );
}

#[test]
fn changeset_integrity_checks_reject_tampering_and_invalid_snapshots() {
    let base = sqlite_state(30, 64 * 1024);
    let mut current = base.clone();
    current[32_000] ^= 0xff;
    let mut changeset = create_bsdiff_changeset(&base, &current).expect("create changeset");
    assert!(
        is_fossil_format(&changeset),
        "test requires fossil encoding"
    );

    let wrong_len = (current.len() as u32 - 1).to_le_bytes();
    changeset[3..FOSSIL_HEADER_SIZE].copy_from_slice(&wrong_len);
    let length_error =
        apply_delta_changeset(&base, &changeset).expect_err("tampered output length must fail");
    assert!(length_error.to_string().contains("declared"));
    assert!(length_error.to_string().contains("reconstructed"));

    let unknown_version = vec![DELTA_MAGIC_FOSSIL[0], DELTA_MAGIC_FOSSIL[1], 99, 0, 0, 0, 0];
    let version_error = apply_delta_changeset(&base, &unknown_version)
        .expect_err("unknown fossil version must fail");
    assert!(version_error
        .to_string()
        .contains("unsupported fossil delta format version 99"));

    let invalid_snapshot = gzip(b"not a SQLite database");
    let snapshot_error = apply_delta_changeset(&base, &invalid_snapshot)
        .expect_err("invalid full snapshot must fail");
    assert!(snapshot_error.to_string().contains("non-SQLite payload"));
}

#[test]
fn failed_delta_encoding_is_atomic() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    vc.create_checkpoint(&checkpoint(
        "checkpoint-1",
        1,
        7,
        b"invalid checkpoint bytes".to_vec(),
        false,
    ))
    .expect("store legacy invalid checkpoint for failure test");

    let error = vc
        .create_delta(&delta(
            "delta-2",
            2,
            7,
            "checkpoint-1",
            sqlite_state(1, 8 * 1024),
        ))
        .expect_err("invalid base cannot produce a delta");
    assert!(error.to_string().contains("decompression failed"));

    assert_eq!(vc.list_versions().expect("list versions").len(), 1);
    let metadata = vc
        .get_metadata()
        .expect("read metadata")
        .expect("metadata exists");
    assert_eq!(metadata.current_version, 1);
}

#[test]
fn restore_missing_version_is_non_mutating() {
    let conn = open_connection();
    let vc = VersionControl::from_connection(&conn);
    vc.create_checkpoint(&checkpoint(
        "checkpoint-1",
        1,
        7,
        sqlite_state(4, 8 * 1024),
        false,
    ))
    .expect("create checkpoint");

    assert!(vc.restore_version(99).is_err());
    assert!(vc.revert_to_version(99).is_err());
    let graph = vc
        .read_version_graph()
        .expect("read graph")
        .expect("graph exists");
    assert_eq!(graph.metadata.current_version, 1);
    assert_eq!(graph.latest_version_id, "checkpoint-1");
}
