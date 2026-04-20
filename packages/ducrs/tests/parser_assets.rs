mod common;

use std::collections::HashSet;

use duc::api::DucDocument;
use duc::{parse, serialize};

#[test]
fn parse_all_assets() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));

        assert!(!parsed.version.is_empty(), "{}: version must not be empty", path.display());
        assert!(!parsed.source.is_empty(), "{}: source must not be empty", path.display());
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
        let bytes = common::load(&path);
        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
        let out = serialize::serialize(&parsed)
            .unwrap_or_else(|e| panic!("serialize {}: {e}", path.display()));
        let reparsed = parse::parse(&out)
            .unwrap_or_else(|e| panic!("reparse {}: {e}", path.display()));

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
    }
}

#[test]
fn lazy_parse_skips_external_files() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        let full = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
        let lazy = parse::parse_lazy(&bytes)
            .unwrap_or_else(|e| panic!("parse_lazy {}: {e}", path.display()));

        assert!(lazy.external_files.is_none(), "{}: lazy parse must omit external_files", path.display());
        assert!(
            lazy.external_files_data.is_none(),
            "{}: lazy parse must omit external_files_data",
            path.display()
        );
        assert_eq!(
            full.elements.len(),
            lazy.elements.len(),
            "{}: element count diverged",
            path.display()
        );
        assert_eq!(
            full.layers.len(),
            lazy.layers.len(),
            "{}: layer count diverged",
            path.display()
        );
    }
}

#[test]
fn element_ids_unique() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
        let mut seen = HashSet::new();
        for el in &parsed.elements {
            let id = common::element_id(&el.element);
            assert!(seen.insert(id.clone()), "duplicate element id {id} in {}", path.display());
        }
    }
}

#[test]
fn element_layer_refs_valid() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
        let layer_ids: HashSet<_> = parsed.layers.iter().map(|l| l.id.as_str()).collect();
        for el in &parsed.elements {
            if let Some(layer_id) = common::element_base(&el.element).layer_id.as_deref() {
                assert!(
                    layer_ids.contains(layer_id),
                    "missing layer ref {layer_id} in {}",
                    path.display()
                );
            }
        }
    }
}

#[test]
fn block_instance_refs_valid() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
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
        let bytes = common::load(&path);
        let listed = parse::list_external_files(&bytes)
            .unwrap_or_else(|e| panic!("list_external_files {}: {e}", path.display()));
        for meta in &listed {
            let got = parse::get_external_file(&bytes, &meta.id).unwrap_or_else(|e| {
                panic!("get_external_file {} {}: {e}", path.display(), meta.id)
            });
            assert!(got.is_some(), "missing external file {} in {}", meta.id, path.display());

            let loaded = got.unwrap();
            assert_eq!(loaded.file.id, meta.id);
            assert!(
                !loaded.file.revisions.is_empty(),
                "{}: file '{}' has no revisions",
                path.display(),
                meta.id
            );
        }
    }
}

#[test]
fn db_open_memory_and_schema() {
    let doc = DucDocument::open_memory().expect("open_memory");
    let version = doc.schema_version().expect("schema_version");
    assert!(version > 0, "schema version must be positive, got {version}");
}

#[test]
fn serialized_is_compressed() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        assert!(
            !parse::is_sqlite_header(&bytes),
            "{}: assets should be compressed, not raw SQLite",
            path.display()
        );

        let raw = parse::decompress_duc_bytes(&bytes)
            .unwrap_or_else(|e| panic!("decompress {}: {e}", path.display()));

        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
        let out = serialize::serialize(&parsed)
            .unwrap_or_else(|e| panic!("serialize {}: {e}", path.display()));

        assert!(
            out.len() < raw.len(),
            "{}: compressed ({} B) should be smaller than raw SQLite ({} B)",
            path.display(),
            out.len(),
            raw.len()
        );
    }
}

#[test]
fn global_state_valid() {
    for path in common::all_duc_files() {
        let bytes = common::load(&path);
        let parsed = parse::parse(&bytes).unwrap_or_else(|e| panic!("parse {}: {e}", path.display()));
        if let Some(gs) = parsed.duc_global_state.as_ref() {
            assert!(!gs.view_background_color.is_empty(), "{}", path.display());
            assert!(!gs.main_scope.is_empty(), "{}", path.display());
        }
    }
}

#[test]
fn parse_rejects_garbage() {
    let cases: &[(&str, &[u8])] = &[("empty", &[]), ("random", &[0xFF; 64]), ("text", b"Not a DUC file")];

    for (label, data) in cases {
        assert!(parse::parse(data).is_err(), "parse should reject {label} input");
    }
}
