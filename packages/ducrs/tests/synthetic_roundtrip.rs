mod common;

use duc::{parse, serialize};

#[test]
fn synthetic_roundtrip_preserves_indexed_parser_fields() {
    let state = common::synthetic_roundtrip_state();
    let serialized = serialize::serialize(&state).expect("serialize synthetic state");
    let parsed = parse::parse(&serialized).expect("parse synthetic state");

    assert_eq!(
        common::canonicalize_roundtrip_state(state.clone()),
        common::canonicalize_roundtrip_state(parsed),
    );

    let lazy = parse::parse_lazy(&serialized).expect("parse lazy synthetic state");
    let mut expected_lazy = state;
    expected_lazy.external_files = None;
    expected_lazy.external_files_data = None;

    assert_eq!(
        common::canonicalize_roundtrip_state(expected_lazy),
        common::canonicalize_roundtrip_state(lazy),
    );
}
