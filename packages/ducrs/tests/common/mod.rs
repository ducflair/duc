#![allow(dead_code)]

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use duc::types::*;

pub fn assets_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../assets/testing/duc-files")
}

pub fn all_duc_files() -> Vec<PathBuf> {
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

pub fn load(path: &Path) -> Vec<u8> {
    fs::read(path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()))
}

pub fn element_id(el: &DucElementEnum) -> String {
    element_base(el).id.clone()
}

pub fn element_base(el: &DucElementEnum) -> &DucElementBase {
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

pub fn synthetic_roundtrip_state() -> ExportedDataState {
    let mut dictionary = HashMap::new();
    dictionary.insert("author".to_string(), "copilot".to_string());
    dictionary.insert("purpose".to_string(), "parser-audit".to_string());

    let layer_overrides = DucLayerOverrides {
        stroke: sample_stroke("layer-1-stroke"),
        background: sample_background("layer-1-background"),
    };

    let groups = vec![DucGroup {
        id: "group-1".to_string(),
        stack_base: sample_stack_base("group-1"),
    }];

    let regions = vec![DucRegion {
        id: "region-1".to_string(),
        stack_base: sample_stack_base("region-1"),
        boolean_operation: BOOLEAN_OPERATION::EXCLUDE,
    }];

    let layers = vec![
        DucLayer {
            id: "layer-1".to_string(),
            stack_base: sample_stack_base("layer-1"),
            readonly: false,
            overrides: Some(layer_overrides),
        },
        DucLayer {
            id: "layer-2".to_string(),
            stack_base: sample_stack_base("layer-2"),
            readonly: true,
            overrides: None,
        },
    ];

    let blocks = vec![
        DucBlock {
            id: "block-1".to_string(),
            label: "Primary Block".to_string(),
            description: Some("Used for parser auditing".to_string()),
            version: 7,
            metadata: Some(DucBlockMetadata {
                source: Some("synthetic".to_string()),
                usage_count: 3,
                created_at: 1_700_000_001,
                updated_at: 1_700_000_999,
                localization: Some("{\"en-US\":{\"title\":\"Primary Block\"}}".to_string()),
            }),
            thumbnail: Some(vec![1, 2, 3, 4]),
        },
        DucBlock {
            id: "block-2".to_string(),
            label: "Secondary Block".to_string(),
            description: None,
            version: 2,
            metadata: None,
            thumbnail: None,
        },
    ];

    let block_instances = vec![DucBlockInstance {
        id: "block-inst-1".to_string(),
        block_id: "block-1".to_string(),
        version: 5,
        element_overrides: Some(vec![StringValueEntry {
            key: "label".to_string(),
            value: "instance override".to_string(),
        }]),
        duplication_array: Some(DucBlockDuplicationArray {
            rows: 2,
            cols: 3,
            row_spacing: 12.5,
            col_spacing: 9.25,
        }),
    }];

    let block_collections = vec![
        DucBlockCollection {
            id: "collection-1".to_string(),
            label: "Collection Root".to_string(),
            children: vec![DucBlockCollectionEntry {
                id: "collection-2".to_string(),
                is_collection: true,
            }],
            metadata: Some(DucBlockMetadata {
                source: Some("library".to_string()),
                usage_count: 1,
                created_at: 1_700_000_111,
                updated_at: 1_700_000_222,
                localization: None,
            }),
            thumbnail: Some(vec![9, 9, 9]),
        },
        DucBlockCollection {
            id: "collection-2".to_string(),
            label: "Collection Leaf".to_string(),
            children: vec![],
            metadata: None,
            thumbnail: None,
        },
    ];

    let global_state = Some(DucGlobalState {
        name: Some("Synthetic Parser Audit".to_string()),
        view_background_color: "#101820".to_string(),
        main_scope: "mm".to_string(),
        scope_exponent_threshold: 3,
    });

    let local_state = Some(DucLocalState {
        scope: "mm".to_string(),
        scroll_x: 125.5,
        scroll_y: -42.25,
        zoom: 1.75,
        is_binding_enabled: true,
        current_item_stroke: Some(sample_stroke("local-state-stroke")),
        current_item_background: Some(sample_background("local-state-background")),
        current_item_opacity: 0.85,
        current_item_font_family: "Inter".to_string(),
        current_item_font_size: 18.0,
        current_item_text_align: TEXT_ALIGN::RIGHT,
        current_item_start_line_head: Some(DucHead {
            head_type: Some(LINE_HEAD::CONE),
            block_id: Some("block-1".to_string()),
            size: 1.4,
        }),
        current_item_end_line_head: Some(DucHead {
            head_type: Some(LINE_HEAD::HALF_CONE),
            block_id: Some("block-2".to_string()),
            size: 0.9,
        }),
        current_item_roundness: 6.0,
        pen_mode: true,
        view_mode_enabled: false,
        objects_snap_mode_enabled: true,
        grid_mode_enabled: true,
        outline_mode_enabled: false,
        manual_save_mode: true,
        decimal_places: 4,
    });

    let version_graph = Some(VersionGraph {
        user_checkpoint_version_id: "checkpoint-1".to_string(),
        latest_version_id: "delta-1".to_string(),
        chains: vec![VersionChain {
            id: "chain-1".to_string(),
            schema_version: 7,
            start_version: 1,
            end_version: Some(2),
            migration: Some(SchemaMigration {
                from_schema_version: 6,
                to_schema_version: 7,
                migration_name: "synthetic-migration".to_string(),
                migration_checksum: Some("abc123".to_string()),
                applied_at: 1_700_000_300,
                boundary_checkpoint_id: Some("checkpoint-1".to_string()),
            }),
            root_checkpoint_id: Some("checkpoint-1".to_string()),
        }],
        checkpoints: vec![Checkpoint {
            base: VersionBase {
                id: "checkpoint-1".to_string(),
                parent_id: None,
                timestamp: 1_700_000_400,
                description: Some("Initial checkpoint".to_string()),
                is_manual_save: true,
                user_id: Some("user-1".to_string()),
            },
            version_number: 1,
            schema_version: 7,
            is_schema_boundary: true,
            data: vec![1, 3, 3, 7],
            size_bytes: 4,
        }],
        deltas: vec![Delta {
            base: VersionBase {
                id: "delta-1".to_string(),
                parent_id: Some("checkpoint-1".to_string()),
                timestamp: 1_700_000_500,
                description: Some("Follow-up change".to_string()),
                is_manual_save: false,
                user_id: None,
            },
            version_number: 2,
            schema_version: 7,
            base_checkpoint_id: "checkpoint-1".to_string(),
            payload: vec![5, 8, 13],
            size_bytes: 3,
        }],
        metadata: VersionGraphMetadata {
            current_version: 2,
            current_schema_version: 7,
            chain_count: 1,
            total_size: 7,
        },
    });

    let external_files = Some(HashMap::from([
        (
            "file-image".to_string(),
            DucExternalFile {
                id: "file-image".to_string(),
                active_revision_id: "file-image-rev-2".to_string(),
                updated: 1_700_000_600,
                revisions: HashMap::from([
                    (
                        "file-image-rev-1".to_string(),
                        ExternalFileRevisionMeta {
                            id: "file-image-rev-1".to_string(),
                            size_bytes: 4,
                            checksum: Some("sum-1".to_string()),
                            source_name: Some("image-v1.png".to_string()),
                            mime_type: "image/png".to_string(),
                            message: Some("initial".to_string()),
                            created: 1_700_000_601,
                            last_retrieved: Some(1_700_000_602),
                        },
                    ),
                    (
                        "file-image-rev-2".to_string(),
                        ExternalFileRevisionMeta {
                            id: "file-image-rev-2".to_string(),
                            size_bytes: 5,
                            checksum: Some("sum-2".to_string()),
                            source_name: Some("image-v2.png".to_string()),
                            mime_type: "image/png".to_string(),
                            message: Some("updated".to_string()),
                            created: 1_700_000_603,
                            last_retrieved: None,
                        },
                    ),
                ]),
                version: Some(9),
            },
        ),
        (
            "file-model".to_string(),
            DucExternalFile {
                id: "file-model".to_string(),
                active_revision_id: "file-model-rev-1".to_string(),
                updated: 1_700_000_700,
                revisions: HashMap::from([(
                    "file-model-rev-1".to_string(),
                    ExternalFileRevisionMeta {
                        id: "file-model-rev-1".to_string(),
                        size_bytes: 6,
                        checksum: None,
                        source_name: Some("model.step".to_string()),
                        mime_type: "model/step".to_string(),
                        message: None,
                        created: 1_700_000_701,
                        last_retrieved: Some(1_700_000_702),
                    },
                )]),
                version: Some(4),
            },
        ),
    ]));

    let external_files_data = Some(HashMap::from([
        (
            "file-image-rev-1".to_string(),
            serde_bytes::ByteBuf::from(vec![1, 2, 3, 4]),
        ),
        (
            "file-image-rev-2".to_string(),
            serde_bytes::ByteBuf::from(vec![5, 6, 7, 8, 9]),
        ),
        (
            "file-model-rev-1".to_string(),
            serde_bytes::ByteBuf::from(vec![10, 11, 12, 13, 14, 15]),
        ),
    ]));

    let mut rect_base = sample_base("rect-1", 1.0);
    rect_base.group_ids = vec!["group-1".to_string()];
    rect_base.block_ids = vec!["block-1".to_string()];
    rect_base.region_ids = vec!["region-1".to_string()];
    rect_base.frame_id = Some("frame-1".to_string());
    rect_base.bound_elements = Some(vec![
        BoundElement {
            id: "line-1".to_string(),
            element_type: "line".to_string(),
        },
        BoundElement {
            id: "arrow-1".to_string(),
            element_type: "arrow".to_string(),
        },
    ]);

    let mut polygon_base = sample_base("polygon-1", 2.0);
    polygon_base.layer_id = Some("layer-2".to_string());

    let ellipse_base = sample_base("ellipse-1", 3.0);
    let embeddable_base = sample_base("embeddable-1", 4.0);

    let mut text_base = sample_base("text-1", 5.0);
    text_base.frame_id = Some("frame-1".to_string());

    let image_base = sample_base("image-1", 6.0);
    let freedraw_base = sample_base("freedraw-1", 7.0);
    let line_base = sample_base("line-1", 8.0);
    let arrow_base = sample_base("arrow-1", 9.0);

    let mut frame_element_base = sample_stack_element_base("frame-1", 10.0);
    frame_element_base.base.layer_id = Some("layer-1".to_string());

    let mut plot_element_base = sample_stack_element_base("plot-1", 11.0);
    plot_element_base.base.layer_id = Some("layer-2".to_string());

    let pdf_base = sample_base("pdf-1", 12.0);
    let doc_base = sample_base("doc-1", 13.0);
    let table_base = sample_base("table-1", 14.0);
    let model_base = sample_base("model-1", 15.0);
    let second_model_base = sample_base("model-2", 16.0);

    let elements = vec![
        ElementWrapper {
            element: DucElementEnum::DucRectangleElement(DucRectangleElement { base: rect_base }),
        },
        ElementWrapper {
            element: DucElementEnum::DucPolygonElement(DucPolygonElement {
                base: polygon_base,
                sides: 7,
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucEllipseElement(DucEllipseElement {
                base: ellipse_base,
                ratio: 1.5,
                start_angle: 0.25,
                end_angle: 1.25,
                show_aux_crosshair: true,
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucEmbeddableElement(DucEmbeddableElement { base: embeddable_base }),
        },
        ElementWrapper {
            element: DucElementEnum::DucTextElement(DucTextElement {
                base: text_base,
                style: DucTextStyle {
                    is_ltr: true,
                    font_family: "Inter".to_string(),
                    big_font_family: "Noto Sans".to_string(),
                    text_align: TEXT_ALIGN::CENTER,
                    vertical_align: VERTICAL_ALIGN::MIDDLE,
                    line_height: 1.2,
                    line_spacing: LineSpacing {
                        value: 1.5,
                        line_type: Some(LINE_SPACING_TYPE::MULTIPLE),
                    },
                    oblique_angle: 0.15,
                    font_size: 22.0,
                    width_factor: 0.95,
                    is_upside_down: true,
                    is_backwards: false,
                },
                text: "Audit {{field}}".to_string(),
                auto_resize: false,
                container_id: Some("rect-1".to_string()),
                original_text: "Audit raw".to_string(),
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucImageElement(DucImageElement {
                base: image_base,
                file_id: Some("file-image".to_string()),
                status: IMAGE_STATUS::SAVED,
                scale: vec![-1.0, 1.0],
                crop: Some(ImageCrop {
                    x: 4.0,
                    y: 5.0,
                    width: 120.0,
                    height: 80.0,
                    natural_width: 240.0,
                    natural_height: 160.0,
                }),
                filter: Some(DucImageFilter {
                    brightness: 0.9,
                    contrast: 1.1,
                }),
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucFreeDrawElement(DucFreeDrawElement {
                base: freedraw_base,
                points: vec![
                    DucPoint {
                        x: 0.0,
                        y: 0.0,
                        mirroring: Some(BEZIER_MIRRORING::NONE),
                    },
                    DucPoint {
                        x: 5.0,
                        y: 6.0,
                        mirroring: Some(BEZIER_MIRRORING::ANGLE),
                    },
                ],
                size: 3.0,
                thinning: 0.4,
                smoothing: 0.6,
                streamline: 0.7,
                easing: "ease-in-out".to_string(),
                start: Some(DucFreeDrawEnds {
                    cap: true,
                    taper: 0.15,
                    easing: "ease-in".to_string(),
                }),
                end: Some(DucFreeDrawEnds {
                    cap: false,
                    taper: 0.25,
                    easing: "ease-out".to_string(),
                }),
                pressures: vec![0.2, 0.8],
                simulate_pressure: true,
                last_committed_point: Some(DucPoint {
                    x: 7.0,
                    y: 8.0,
                    mirroring: Some(BEZIER_MIRRORING::ANGLE_LENGTH),
                }),
                svg_path: Some("M0 0L1 1".to_string()),
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucLinearElement(DucLinearElement {
                linear_base: DucLinearElementBase {
                    base: line_base,
                    points: vec![
                        DucPoint {
                            x: 0.0,
                            y: 0.0,
                            mirroring: Some(BEZIER_MIRRORING::ANGLE),
                        },
                        DucPoint {
                            x: 10.0,
                            y: 10.0,
                            mirroring: Some(BEZIER_MIRRORING::ANGLE_LENGTH),
                        },
                    ],
                    lines: vec![DucLine {
                        start: DucLineReference {
                            index: 0,
                            handle: Some(GeometricPoint { x: 1.0, y: 2.0 }),
                        },
                        end: DucLineReference {
                            index: 1,
                            handle: Some(GeometricPoint { x: 8.0, y: 9.0 }),
                        },
                    }],
                    path_overrides: vec![DucPath {
                        line_indices: vec![0],
                        background: Some(sample_background("line-path-background")),
                        stroke: Some(sample_stroke("line-path-stroke")),
                    }],
                    last_committed_point: Some(DucPoint {
                        x: 11.0,
                        y: 12.0,
                        mirroring: Some(BEZIER_MIRRORING::NONE),
                    }),
                    start_binding: Some(DucPointBinding {
                        element_id: "rect-1".to_string(),
                        focus: 0.25,
                        gap: 3.5,
                        fixed_point: Some(GeometricPoint { x: 0.2, y: 0.8 }),
                        point: Some(PointBindingPoint {
                            index: 1,
                            offset: -0.25,
                        }),
                        head: Some(DucHead {
                            head_type: Some(LINE_HEAD::OPEN_ARROW),
                            block_id: Some("block-1".to_string()),
                            size: 1.25,
                        }),
                    }),
                    end_binding: Some(DucPointBinding {
                        element_id: "ellipse-1".to_string(),
                        focus: -0.75,
                        gap: 1.5,
                        fixed_point: Some(GeometricPoint { x: 0.7, y: 0.1 }),
                        point: Some(PointBindingPoint {
                            index: 0,
                            offset: 0.5,
                        }),
                        head: Some(DucHead {
                            head_type: Some(LINE_HEAD::DIAMOND_OUTLINED),
                            block_id: Some("block-2".to_string()),
                            size: 0.8,
                        }),
                    }),
                },
                wipeout_below: true,
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucArrowElement(DucArrowElement {
                linear_base: DucLinearElementBase {
                    base: arrow_base,
                    points: vec![
                        DucPoint {
                            x: -1.0,
                            y: -2.0,
                            mirroring: Some(BEZIER_MIRRORING::ANGLE),
                        },
                        DucPoint {
                            x: 3.0,
                            y: 4.0,
                            mirroring: Some(BEZIER_MIRRORING::NONE),
                        },
                    ],
                    lines: vec![DucLine {
                        start: DucLineReference {
                            index: 0,
                            handle: None,
                        },
                        end: DucLineReference {
                            index: 1,
                            handle: Some(GeometricPoint { x: 2.5, y: 3.5 }),
                        },
                    }],
                    path_overrides: vec![DucPath {
                        line_indices: vec![0],
                        background: None,
                        stroke: Some(sample_stroke("arrow-path-stroke")),
                    }],
                    last_committed_point: Some(DucPoint {
                        x: 4.0,
                        y: 5.0,
                        mirroring: Some(BEZIER_MIRRORING::ANGLE_LENGTH),
                    }),
                    start_binding: Some(DucPointBinding {
                        element_id: "rect-1".to_string(),
                        focus: -0.5,
                        gap: 2.0,
                        fixed_point: None,
                        point: Some(PointBindingPoint {
                            index: 0,
                            offset: -1.0,
                        }),
                        head: Some(DucHead {
                            head_type: Some(LINE_HEAD::ARROW),
                            block_id: None,
                            size: 1.0,
                        }),
                    }),
                    end_binding: Some(DucPointBinding {
                        element_id: "text-1".to_string(),
                        focus: 1.0,
                        gap: 0.5,
                        fixed_point: Some(GeometricPoint { x: 0.9, y: 0.4 }),
                        point: None,
                        head: Some(DucHead {
                            head_type: Some(LINE_HEAD::TRIANGLE_OUTLINED),
                            block_id: Some("block-1".to_string()),
                            size: 1.8,
                        }),
                    }),
                },
                elbowed: true,
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucFrameElement(DucFrameElement {
                stack_element_base: frame_element_base,
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucPlotElement(DucPlotElement {
                stack_element_base: plot_element_base,
                style: DucPlotStyle {},
                layout: PlotLayout {
                    margins: Margins {
                        top: 12.0,
                        right: 13.0,
                        bottom: 14.0,
                        left: 15.0,
                    },
                },
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucPdfElement(DucPdfElement {
                base: pdf_base,
                file_id: Some("file-image".to_string()),
                grid_config: DocumentGridConfig {
                    columns: 3,
                    gap_x: 8.0,
                    gap_y: 9.0,
                    first_page_alone: true,
                    scale: 0.5,
                },
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucDocElement(DucDocElement {
                base: doc_base,
                style: DucDocStyle {},
                text: "Doc element".to_string(),
                grid_config: DocumentGridConfig {
                    columns: 2,
                    gap_x: 4.0,
                    gap_y: 6.0,
                    first_page_alone: false,
                    scale: 2.0,
                },
                file_id: Some("file-model".to_string()),
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucTableElement(DucTableElement {
                base: table_base,
                style: DucTableStyle {},
                file_id: Some("file-image".to_string()),
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucModelElement(DucModelElement {
                base: model_base,
                model_type: Some("STEP".to_string()),
                code: Some("from build123d import Box".to_string()),
                thumbnail: Some(vec![2, 4, 6, 8]),
                file_ids: vec!["file-model".to_string(), "file-image".to_string()],
                viewer_state: Some(sample_viewer_state_per_plane()),
            }),
        },
        ElementWrapper {
            element: DucElementEnum::DucModelElement(DucModelElement {
                base: second_model_base,
                model_type: Some("OBJ".to_string()),
                code: None,
                thumbnail: None,
                file_ids: vec!["file-model".to_string()],
                viewer_state: Some(sample_viewer_state_uniform()),
            }),
        },
    ];

    ExportedDataState {
        id: Some("synthetic-audit-doc".to_string()),
        version: "1.0.0".to_string(),
        source: "synthetic".to_string(),
        data_type: "drawing".to_string(),
        dictionary: Some(dictionary),
        thumbnail: Some(vec![7, 6, 5, 4]),
        elements,
        blocks,
        block_instances,
        block_collections,
        groups,
        regions,
        layers,
        duc_local_state: local_state,
        duc_global_state: global_state,
        version_graph,
        external_files,
        external_files_data,
    }
}

pub fn canonicalize_roundtrip_state(mut state: ExportedDataState) -> ExportedDataState {
    state.elements.sort_by(|a, b| element_id(&a.element).cmp(&element_id(&b.element)));
    state.blocks.sort_by(|a, b| a.id.cmp(&b.id));
    state.block_instances.sort_by(|a, b| a.id.cmp(&b.id));
    for instance in &mut state.block_instances {
        if let Some(overrides) = &mut instance.element_overrides {
            overrides.sort_by(|a, b| a.key.cmp(&b.key).then(a.value.cmp(&b.value)));
        }
    }

    state.block_collections.sort_by(|a, b| a.id.cmp(&b.id));
    for collection in &mut state.block_collections {
        // block_collection_entries does not persist a sort_order column today,
        // so canonicalize child order before round-trip comparisons.
        collection
            .children
            .sort_by(|a, b| a.id.cmp(&b.id).then(a.is_collection.cmp(&b.is_collection)));
    }

    state.groups.sort_by(|a, b| a.id.cmp(&b.id));
    state.regions.sort_by(|a, b| a.id.cmp(&b.id));
    state.layers.sort_by(|a, b| a.id.cmp(&b.id));
    state
}

fn sample_stack_base(id: &str) -> DucStackBase {
    DucStackBase {
        label: format!("Stack {id}"),
        description: Some(format!("Description for {id}")),
        is_collapsed: false,
        is_plot: true,
        is_visible: true,
        locked: false,
        styles: DucStackLikeStyles { opacity: 0.88 },
    }
}

fn sample_stack_element_base(id: &str, z_index: f32) -> DucStackElementBase {
    DucStackElementBase {
        base: sample_base(id, z_index),
        stack_base: sample_stack_base(id),
        clip: true,
        label_visible: false,
    }
}

fn sample_base(id: &str, z_index: f32) -> DucElementBase {
    DucElementBase {
        id: id.to_string(),
        styles: DucElementStylesBase {
            roundness: 4.25,
            blending: Some(BLENDING::OVERLAY),
            background: vec![sample_background(&format!("{id}-background"))],
            stroke: vec![sample_stroke(&format!("{id}-stroke"))],
            opacity: 0.72,
        },
        x: f64::from(z_index) * 10.0,
        y: -f64::from(z_index) * 3.0,
        width: 100.0 + f64::from(z_index),
        height: 50.0 + f64::from(z_index),
        angle: 0.25 * f64::from(z_index),
        scope: "mm".to_string(),
        label: format!("Element {id}"),
        description: Some(format!("Element description for {id}")),
        is_visible: true,
        seed: 1000 + z_index as i32,
        version: 10 + z_index as i32,
        version_nonce: 2000 + z_index as i32,
        updated: 1_700_000_800 + z_index as i64,
        index: Some(format!("index-{id}")),
        is_plot: false,
        is_deleted: false,
        group_ids: vec![],
        block_ids: vec![],
        region_ids: vec![],
        instance_id: None,
        layer_id: Some("layer-1".to_string()),
        frame_id: None,
        bound_elements: None,
        z_index,
        link: Some(format!("https://example.com/{id}")),
        locked: true,
        custom_data: Some(format!("{{\"id\":\"{id}\",\"z\":{z_index}}}")),
    }
}

fn sample_background(seed: &str) -> ElementBackground {
    ElementBackground {
        content: sample_content(seed),
    }
}

fn sample_stroke(seed: &str) -> ElementStroke {
    ElementStroke {
        content: sample_content(seed),
        width: 2.5,
        style: StrokeStyle {
            preference: Some(STROKE_PREFERENCE::CUSTOM),
            cap: Some(STROKE_CAP::ROUND),
            join: Some(STROKE_JOIN::BEVEL),
            dash: Some(vec![1.0, 2.0, 3.0]),
            dash_line_override: Some("block-inst-1".to_string()),
            dash_cap: Some(STROKE_CAP::SQUARE),
            miter_limit: Some(4.0),
        },
        placement: Some(STROKE_PLACEMENT::OUTSIDE),
        stroke_sides: Some(StrokeSides {
            preference: Some(STROKE_SIDE_PREFERENCE::CUSTOM),
            values: Some(vec![0.1, 0.9, 0.2, 0.8]),
        }),
    }
}

fn sample_content(seed: &str) -> ElementContentBase {
    ElementContentBase {
        preference: Some(ELEMENT_CONTENT_PREFERENCE::HATCH),
        src: format!("#{seed}"),
        visible: true,
        opacity: 0.64,
        tiling: Some(TilingProperties {
            size_in_percent: 75.0,
            angle: 0.75,
            spacing: Some(3.5),
            offset_x: Some(1.25),
            offset_y: Some(-2.25),
        }),
        hatch: Some(DucHatchStyle {
            hatch_style: HATCH_STYLE::OUTER,
            pattern_name: format!("pattern-{seed}"),
            pattern_scale: 1.15,
            pattern_angle: 0.35,
            pattern_origin: DucPoint {
                x: 8.0,
                y: 9.0,
                mirroring: Some(BEZIER_MIRRORING::ANGLE),
            },
            pattern_double: true,
            custom_pattern: Some(CustomHatchPattern {
                name: format!("custom-{seed}"),
                description: Some(format!("custom description for {seed}")),
                lines: vec![HatchPatternLine {
                    angle: 1.1,
                    origin: DucPoint {
                        x: 2.0,
                        y: 3.0,
                        mirroring: Some(BEZIER_MIRRORING::ANGLE_LENGTH),
                    },
                    offset: vec![4.0, 5.0],
                    dash_pattern: vec![1.0, 0.5, 2.5],
                }],
            }),
        }),
        image_filter: Some(DucImageFilter {
            brightness: 0.85,
            contrast: 1.25,
        }),
    }
}

fn sample_viewer_state_per_plane() -> Viewer3DState {
    Viewer3DState {
        camera: Viewer3DCamera {
            control: "orbit".to_string(),
            ortho: false,
            up: "Z".to_string(),
            position: [1.0, 2.0, 3.0],
            quaternion: [0.0, 0.0, 0.707, 0.707],
            target: [4.0, 5.0, 6.0],
            zoom: 1.5,
            pan_speed: 1.1,
            rotate_speed: 1.2,
            zoom_speed: 1.3,
            holroyd: true,
        },
        display: Viewer3DDisplay {
            wireframe: true,
            transparent: false,
            black_edges: true,
            grid: Viewer3DGrid::PerPlane(Viewer3DGridPlanes {
                xy: true,
                xz: false,
                yz: true,
            }),
            axes_visible: true,
            axes_at_origin: false,
        },
        material: Viewer3DMaterial {
            metalness: 0.2,
            roughness: 0.7,
            default_opacity: 0.9,
            edge_color: 0xABCDEF,
            ambient_intensity: 0.6,
            direct_intensity: 1.4,
        },
        clipping: Viewer3DClipping {
            x: Viewer3DClipPlane {
                enabled: true,
                value: 10.0,
                normal: Some([1.0, 0.0, 0.0]),
            },
            y: Viewer3DClipPlane {
                enabled: false,
                value: 20.0,
                normal: Some([0.0, 1.0, 0.0]),
            },
            z: Viewer3DClipPlane {
                enabled: true,
                value: 30.0,
                normal: Some([0.0, 0.0, 1.0]),
            },
            intersection: true,
            show_planes: false,
            object_color_caps: true,
        },
        explode: Viewer3DExplode {
            active: true,
            value: 0.45,
        },
        zebra: Viewer3DZebra {
            active: true,
            stripe_count: 8,
            stripe_direction: 0.75,
            color_scheme: "colorful".to_string(),
            opacity: 0.55,
            mapping_mode: "reflection".to_string(),
        },
    }
}

fn sample_viewer_state_uniform() -> Viewer3DState {
    Viewer3DState {
        camera: Viewer3DCamera {
            control: "trackball".to_string(),
            ortho: true,
            up: "Y".to_string(),
            position: [7.0, 8.0, 9.0],
            quaternion: [0.2, 0.3, 0.4, 0.5],
            target: [10.0, 11.0, 12.0],
            zoom: 2.5,
            pan_speed: 0.9,
            rotate_speed: 0.8,
            zoom_speed: 0.7,
            holroyd: false,
        },
        display: Viewer3DDisplay {
            wireframe: false,
            transparent: true,
            black_edges: false,
            grid: Viewer3DGrid::Uniform(true),
            axes_visible: false,
            axes_at_origin: true,
        },
        material: Viewer3DMaterial {
            metalness: 0.4,
            roughness: 0.3,
            default_opacity: 0.65,
            edge_color: 0x123456,
            ambient_intensity: 0.25,
            direct_intensity: 0.75,
        },
        clipping: Viewer3DClipping {
            x: Viewer3DClipPlane {
                enabled: false,
                value: 5.0,
                normal: Some([1.0, 1.0, 0.0]),
            },
            y: Viewer3DClipPlane {
                enabled: true,
                value: 6.0,
                normal: Some([0.0, 1.0, 1.0]),
            },
            z: Viewer3DClipPlane {
                enabled: false,
                value: 7.0,
                normal: Some([1.0, 0.0, 1.0]),
            },
            intersection: false,
            show_planes: true,
            object_color_caps: false,
        },
        explode: Viewer3DExplode {
            active: false,
            value: 0.0,
        },
        zebra: Viewer3DZebra {
            active: false,
            stripe_count: 4,
            stripe_direction: 1.25,
            color_scheme: "blackwhite".to_string(),
            opacity: 0.25,
            mapping_mode: "normal".to_string(),
        },
    }
}
