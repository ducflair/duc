#[allow(unused_imports)]
#[allow(non_camel_case_types)]
#[allow(non_snake_case)]
#[allow(non_upper_case_globals)]
pub mod parse;
pub mod serde_utils;
pub mod serialize;
pub mod types;

// SQLite storage layer and high-level document API
pub mod db;
pub mod api;

#[cfg(test)]
mod tests {
    use std::collections::HashSet;
    use std::fs;
    use std::path::{Path, PathBuf};

    use crate::parse;
    use crate::serialize;
    use crate::types::*;

    fn assets_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../assets/testing/duc-files")
    }

    fn all_duc_files() -> Vec<PathBuf> {
        let dir = assets_dir();
        assert!(dir.exists(), "assets dir missing: {}", dir.display());
        let mut files: Vec<PathBuf> = fs::read_dir(&dir)
            .expect("read assets dir")
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|ext| ext == "duc"))
            .collect();
        files.sort();
        assert!(!files.is_empty(), "no .duc files in {}", dir.display());
        files
    }

    fn load(path: &Path) -> Vec<u8> {
        fs::read(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()))
    }

    // ── Parse every asset ────────────────────────────────────────────────────

    #[test]
    fn parse_all_assets() {
        for path in all_duc_files() {
            let buf = load(&path);
            let state = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));

            assert!(!state.version.is_empty(), "{}: version must not be empty", path.display());
            assert!(!state.source.is_empty(), "{}: source must not be empty", path.display());
            assert!(!state.elements.is_empty() || !state.layers.is_empty(),
                "{}: must have elements or layers", path.display());
        }
    }

    // ── Round-trip: parse → serialize → re-parse preserves data ──────────────

    #[test]
    fn roundtrip_all_assets() {
        for path in all_duc_files() {
            let original = load(&path);
            let parsed = parse::parse(&original)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));

            let serialized = serialize::serialize(&parsed)
                .unwrap_or_else(|e| panic!("serialize {} failed: {e}", path.display()));
            assert!(!serialized.is_empty(), "{}: serialized must not be empty", path.display());

            let reparsed = parse::parse(&serialized)
                .unwrap_or_else(|e| panic!("re-parse {} failed: {e}", path.display()));

            assert_eq!(
                parsed.elements.len(), reparsed.elements.len(),
                "{}: element count mismatch", path.display()
            );
            assert_eq!(
                parsed.layers.len(), reparsed.layers.len(),
                "{}: layer count mismatch", path.display()
            );
            assert_eq!(
                parsed.blocks.len(), reparsed.blocks.len(),
                "{}: block count mismatch", path.display()
            );
            assert_eq!(
                parsed.block_instances.len(), reparsed.block_instances.len(),
                "{}: block instance count mismatch", path.display()
            );
            assert_eq!(
                parsed.groups.len(), reparsed.groups.len(),
                "{}: group count mismatch", path.display()
            );
            assert_eq!(
                parsed.regions.len(), reparsed.regions.len(),
                "{}: region count mismatch", path.display()
            );
        }
    }

    // ── Lazy parse skips external files ──────────────────────────────────────

    #[test]
    fn lazy_parse_skips_external_files() {
        for path in all_duc_files() {
            let buf = load(&path);
            let full = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));
            let lazy = parse::parse_lazy(&buf)
                .unwrap_or_else(|e| panic!("parse_lazy {} failed: {e}", path.display()));

            assert!(lazy.external_files.is_none(), "{}: lazy parse must omit external_files", path.display());
            assert_eq!(full.elements.len(), lazy.elements.len(), "{}: element count diverged", path.display());
            assert_eq!(full.layers.len(), lazy.layers.len(), "{}: layer count diverged", path.display());
        }
    }

    // ── Element IDs are unique within each file ──────────────────────────────

    #[test]
    fn element_ids_unique() {
        for path in all_duc_files() {
            let buf = load(&path);
            let state = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));

            let mut seen = HashSet::new();
            for wrapper in &state.elements {
                let id = element_id(&wrapper.element);
                assert!(seen.insert(id.clone()), "{}: duplicate element id '{id}'", path.display());
            }
        }
    }

    // ── Every element references a valid layer ───────────────────────────────

    #[test]
    fn element_layer_refs_valid() {
        for path in all_duc_files() {
            let buf = load(&path);
            let state = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));

            let layer_ids: HashSet<String> = state.layers.iter().map(|l| l.id.clone()).collect();

            for wrapper in &state.elements {
                let base = element_base(&wrapper.element);
                if let Some(ref lid) = base.layer_id {
                    assert!(
                        layer_ids.contains(lid),
                        "{}: element '{}' references non-existent layer '{lid}'",
                        path.display(), base.id
                    );
                }
            }
        }
    }

    // ── Block instances reference valid blocks ───────────────────────────────

    #[test]
    fn block_instance_refs_valid() {
        for path in all_duc_files() {
            let buf = load(&path);
            let state = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));

            let block_ids: HashSet<String> = state.blocks.iter().map(|b| b.id.clone()).collect();

            for inst in &state.block_instances {
                assert!(
                    block_ids.contains(&inst.block_id),
                    "{}: block instance '{}' references non-existent block '{}'",
                    path.display(), inst.id, inst.block_id
                );
            }
        }
    }

    // ── External files: list ↔ get round-trip ────────────────────────────────

    #[test]
    fn external_files_list_get_consistent() {
        for path in all_duc_files() {
            let buf = load(&path);
            let listing = parse::list_external_files(&buf)
                .unwrap_or_else(|e| panic!("list_external_files {} failed: {e}", path.display()));

            for meta in &listing {
                let file = parse::get_external_file(&buf, &meta.id)
                    .unwrap_or_else(|e| panic!("get_external_file {} id={} failed: {e}", path.display(), meta.id));
                assert!(file.is_some(), "{}: listed file '{}' not found via get", path.display(), meta.id);
                let file = file.unwrap();
                assert_eq!(file.id, meta.id);
                assert!(!file.revisions.is_empty(), "{}: file '{}' has no revisions", path.display(), meta.id);
            }
        }
    }

    // ── DB layer: open in-memory, schema bootstraps correctly ────────────────

    #[test]
    fn db_open_memory_and_schema() {
        use crate::api::DucDocument;

        let doc = DucDocument::open_memory().expect("open_memory");
        let version = doc.schema_version().expect("schema_version");
        assert!(version > 0, "schema version must be positive, got {version}");
    }

    // ── Compression: serialized output is smaller than raw SQLite ────────────

    #[test]
    fn serialized_is_compressed() {
        for path in all_duc_files() {
            let buf = load(&path);
            assert!(!parse::is_sqlite_header(&buf), "{}: assets should be compressed, not raw SQLite", path.display());

            let raw = parse::decompress_duc_bytes(&buf)
                .unwrap_or_else(|e| panic!("decompress {} failed: {e}", path.display()));

            let state = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));
            let recompressed = serialize::serialize(&state)
                .unwrap_or_else(|e| panic!("serialize {} failed: {e}", path.display()));

            assert!(
                recompressed.len() < raw.len(),
                "{}: compressed ({} B) should be smaller than raw SQLite ({} B)",
                path.display(), recompressed.len(), raw.len()
            );
        }
    }

    // ── Global state invariants ──────────────────────────────────────────────

    #[test]
    fn global_state_valid() {
        for path in all_duc_files() {
            let buf = load(&path);
            let state = parse::parse(&buf)
                .unwrap_or_else(|e| panic!("parse {} failed: {e}", path.display()));

            if let Some(ref gs) = state.duc_global_state {
                assert!(!gs.view_background_color.is_empty(), "{}: background color must not be empty", path.display());
                assert!(!gs.main_scope.is_empty(), "{}: main_scope must not be empty", path.display());
            }
        }
    }

    // ── Error handling: garbage input produces a clear error ──────────────────

    #[test]
    fn parse_rejects_garbage() {
        let cases: &[(&str, &[u8])] = &[
            ("empty", &[]),
            ("random", &[0xFF; 64]),
            ("text", b"Not a DUC file"),
        ];
        for (label, data) in cases {
            assert!(
                parse::parse(data).is_err(),
                "parse should reject {label} input"
            );
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    fn element_id(el: &DucElementEnum) -> String {
        element_base(el).id.clone()
    }

    fn element_base(el: &DucElementEnum) -> &DucElementBase {
        match el {
            DucElementEnum::DucRectangleElement(e) => &e.base,
            DucElementEnum::DucPolygonElement(e) => &e.base,
            DucElementEnum::DucEllipseElement(e) => &e.base,
            DucElementEnum::DucEmbeddableElement(e) => &e.base,
            DucElementEnum::DucPdfElement(e) => &e.base,
            DucElementEnum::DucTableElement(e) => &e.base,
            DucElementEnum::DucImageElement(e) => &e.base,
            DucElementEnum::DucTextElement(e) => &e.base,
            DucElementEnum::DucLinearElement(e) => &e.linear_base.base,
            DucElementEnum::DucArrowElement(e) => &e.linear_base.base,
            DucElementEnum::DucFreeDrawElement(e) => &e.base,
            DucElementEnum::DucFrameElement(e) => &e.stack_element_base.base,
            DucElementEnum::DucPlotElement(e) => &e.stack_element_base.base,
            DucElementEnum::DucDocElement(e) => &e.base,
            DucElementEnum::DucModelElement(e) => &e.base,
        }
    }
}
