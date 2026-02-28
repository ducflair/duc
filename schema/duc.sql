-- "DUC_" in ASCII
-- Apply in order: duc.sql → version_control.sql → search.sql
PRAGMA application_id = 1146569567;
PRAGMA user_version = 3000000;
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;


-- ===========================================================================
-- ENUM REFERENCE (integer codes stored in columns)
-- ===========================================================================
-- VERTICAL_ALIGN:           TOP=10, MIDDLE=11, BOTTOM=12
-- TEXT_ALIGN:               LEFT=10, CENTER=11, RIGHT=12
-- LINE_SPACING_TYPE:        AT_LEAST=10, EXACTLY=11, MULTIPLE=12
-- STROKE_PLACEMENT:         INSIDE=10, CENTER=11, OUTSIDE=12
-- STROKE_PREFERENCE:        SOLID=10, DASHED=11, DOTTED=12, CUSTOM=13
-- STROKE_SIDE_PREFERENCE:   TOP=10, BOTTOM=11, LEFT=12, RIGHT=13, CUSTOM=14, ALL=15
-- STROKE_CAP:               BUTT=10, ROUND=11, SQUARE=12
-- STROKE_JOIN:              MITER=10, ROUND=11, BEVEL=12
-- LINE_HEAD:                ARROW=10, BAR=11, CIRCLE=12, CIRCLE_OUTLINED=13,
--                           TRIANGLE=14, TRIANGLE_OUTLINED=15, DIAMOND=16,
--                           DIAMOND_OUTLINED=17, CROSS=18, OPEN_ARROW=19,
--                           REVERSED_ARROW=20, REVERSED_TRIANGLE=21,
--                           REVERSED_TRIANGLE_OUTLINED=22, CONE=23, HALF_CONE=24
-- BEZIER_MIRRORING:         NONE=10, ANGLE=11, ANGLE_LENGTH=12
-- BLENDING:                 MULTIPLY=11, SCREEN=12, OVERLAY=13, DARKEN=14,
--                           LIGHTEN=15, DIFFERENCE=16, EXCLUSION=17
-- ELEMENT_CONTENT_PREF:     SOLID=12, FILL=14, FIT=15, TILE=16, STRETCH=17, HATCH=18
-- HATCH_STYLE:              NORMAL=10, OUTER=11, IGNORE=12
-- IMAGE_STATUS:             PENDING=10, SAVED=11, ERROR=12
-- PRUNING_LEVEL:            CONSERVATIVE=10, BALANCED=20, AGGRESSIVE=30
-- BOOLEAN_OPERATION:        UNION=10, SUBTRACT=11, INTERSECT=12, EXCLUDE=13
-- ELEMENT_TYPE (text):      rectangle, ellipse, polygon, table, text, line,
--                           arrow, freedraw, image, frame, plot, doc, model,
--                           embeddable, pdf


-- ===========================================================================
-- DOCUMENT STATE
-- ===========================================================================

-- Project-wide settings shared by all users, saved with the document.
CREATE TABLE duc_global_state (
    id                                          INTEGER PRIMARY KEY CHECK (id = 1),
    name                                        TEXT,            -- drawing name
    view_background_color                       TEXT    NOT NULL, -- drawing background color
    main_scope                                  TEXT    NOT NULL, -- master unit (mm, cm, m, in, ft…)
    scope_exponent_threshold                    INTEGER NOT NULL DEFAULT 3,   -- +/- tolerance for scope switching
    pruning_level                               INTEGER NOT NULL DEFAULT 20   -- PRUNING_LEVEL enum
);

-- Per-user session state (not shared). DucHead fields flattened inline.
-- Current item stroke/background stored in backgrounds/strokes tables with owner_type='local_state'.
CREATE TABLE duc_local_state (
    id                              INTEGER PRIMARY KEY CHECK (id = 1),
    scope                           TEXT    NOT NULL DEFAULT 'mm',     -- current unit scope (mm, cm, m, in, ft…)
    scroll_x                        REAL    NOT NULL DEFAULT 0.0,
    scroll_y                        REAL    NOT NULL DEFAULT 0.0,
    zoom                            REAL    NOT NULL DEFAULT 1.0,
    is_binding_enabled              INTEGER NOT NULL DEFAULT 1,
    current_item_opacity            REAL    NOT NULL DEFAULT 1.0,
    current_item_font_family        TEXT    NOT NULL DEFAULT 'Roboto Mono',
    current_item_font_size          REAL    NOT NULL DEFAULT 20.0,
    current_item_text_align         INTEGER NOT NULL DEFAULT 10,  -- TEXT_ALIGN
    current_item_roundness          REAL    NOT NULL DEFAULT 0.0,
    -- DucHead for start_line_head (flattened, all NULL = no head)
    start_head_type                 INTEGER, -- LINE_HEAD enum
    start_head_block_id             TEXT,    -- block id if head is a block
    start_head_size                 REAL,
    -- DucHead for end_line_head (flattened)
    end_head_type                   INTEGER,
    end_head_block_id               TEXT,
    end_head_size                   REAL,
    -- Mode flags
    pen_mode                        INTEGER NOT NULL DEFAULT 0,   -- better pen input
    view_mode_enabled               INTEGER NOT NULL DEFAULT 0,   -- read-only canvas
    objects_snap_mode_enabled       INTEGER NOT NULL DEFAULT 1,   -- object snapping
    grid_mode_enabled               INTEGER NOT NULL DEFAULT 1,   -- grid visibility
    outline_mode_enabled            INTEGER NOT NULL DEFAULT 0,   -- disable fill on all shapes
    manual_save_mode                INTEGER NOT NULL DEFAULT 0,   -- manual version graph updates
    decimal_places                  INTEGER NOT NULL DEFAULT 2
);


-- ===========================================================================
-- DOCUMENT METADATA
-- ===========================================================================

-- Root document metadata (ExportedDataState top-level fields).
CREATE TABLE duc_document (
    id          TEXT PRIMARY KEY,  -- actual file id
    version     TEXT NOT NULL,     -- format version string
    source      TEXT NOT NULL,     -- originating application
    data_type   TEXT NOT NULL,     -- file data type identifier
    thumbnail   BLOB               -- binary thumbnail image
) WITHOUT ROWID;

-- Key-value string dictionary for the document.
CREATE TABLE document_dictionary (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
) WITHOUT ROWID;


-- ===========================================================================
-- STACK-LIKE PROPERTIES (shared base for layers, groups, regions)
-- ===========================================================================
-- Class-table inheritance: each container stores its shared display/visibility
-- properties here; type-specific columns live in the child table.
-- To delete a container, DELETE FROM stack_properties WHERE id = ?;
-- this cascades to the child table (layers/groups/regions).

CREATE TABLE stack_properties (
    id           TEXT    PRIMARY KEY,
    label        TEXT    NOT NULL DEFAULT '',
    description  TEXT,
    is_collapsed INTEGER NOT NULL DEFAULT 0,
    is_plot      INTEGER NOT NULL DEFAULT 0,
    is_visible   INTEGER NOT NULL DEFAULT 1,
    locked       INTEGER NOT NULL DEFAULT 0,
    opacity      REAL    NOT NULL DEFAULT 1.0
) WITHOUT ROWID;

CREATE INDEX idx_stack_properties_label ON stack_properties(label);


-- ===========================================================================
-- LAYERS
-- ===========================================================================

-- Drawing layers. Elements reference their layer via layer_id.
-- Override stroke/background stored in backgrounds/strokes tables with owner_type='layer'.
-- Shared display properties (label, visibility, opacity …) in stack_properties (same id).
CREATE TABLE layers (
    id       TEXT    PRIMARY KEY REFERENCES stack_properties(id) ON DELETE CASCADE,
    readonly INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;


-- ===========================================================================
-- GROUPS & REGIONS
-- ===========================================================================

-- Groups: logical grouping of elements. Elements reference via element_group_memberships.
-- Shared display properties in stack_properties (same id).
CREATE TABLE groups (
    id TEXT PRIMARY KEY REFERENCES stack_properties(id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Regions: boolean-operation grouping. Elements reference via element_region_memberships.
-- Shared display properties in stack_properties (same id).
CREATE TABLE regions (
    id                TEXT    PRIMARY KEY REFERENCES stack_properties(id) ON DELETE CASCADE,
    boolean_operation INTEGER NOT NULL  -- BOOLEAN_OPERATION: UNION=10, SUBTRACT=11, INTERSECT=12, EXCLUDE=13
) WITHOUT ROWID;


-- ===========================================================================
-- BLOCKS (reusable component definitions, instances, collections)
-- ===========================================================================

-- DucBlockMetadata: shared metadata for blocks and block collections.
-- Uses polymorphic owner pattern (consistent with backgrounds/strokes).
-- owner_type: 'block'      → owner_id = blocks.id
--             'collection' → owner_id = block_collections.id
CREATE TABLE block_metadata (
    owner_type   TEXT    NOT NULL,
    owner_id     TEXT    NOT NULL,
    source       TEXT,                  -- origin source
    usage_count  INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,      -- epoch ms
    updated_at   INTEGER NOT NULL,      -- epoch ms
    localization JSONB,                 -- JSON string: Record<BCP47, {title, description?}>
    thumbnail    BLOB,                  -- binary thumbnail
    PRIMARY KEY (owner_type, owner_id)
) WITHOUT ROWID;

-- Block definitions (reusable components).
-- Metadata (source, timestamps, localization, thumbnail) in block_metadata with owner_type='block'.
CREATE TABLE blocks (
    id          TEXT    PRIMARY KEY,
    label       TEXT    NOT NULL DEFAULT '',
    description TEXT,
    version     INTEGER NOT NULL DEFAULT 1
);  -- no WITHOUT ROWID: implicit integer rowid needed for FTS5 content sync

CREATE INDEX idx_blocks_label ON blocks(label);

-- Block instances placed on the canvas.
CREATE TABLE block_instances (
    id                  TEXT    PRIMARY KEY,
    block_id            TEXT    NOT NULL REFERENCES blocks(id),
    version             INTEGER NOT NULL DEFAULT 1, -- should match block's version
    -- DucBlockDuplicationArray flattened (NULL if no array):
    dup_rows            INTEGER,
    dup_cols            INTEGER,
    dup_row_spacing     REAL,
    dup_col_spacing     REAL
) WITHOUT ROWID;

CREATE INDEX idx_block_instances_block ON block_instances(block_id);

-- Per-instance element overrides (Vec<StringValueEntry>).
CREATE TABLE block_instance_overrides (
    instance_id TEXT    NOT NULL REFERENCES block_instances(id) ON DELETE CASCADE,
    key         TEXT    NOT NULL,
    value       TEXT    NOT NULL,
    PRIMARY KEY (instance_id, key)
) WITHOUT ROWID;

-- Hierarchical block collections (folders of blocks or nested collections).
-- Metadata (source, timestamps, localization, thumbnail) in block_metadata with owner_type='collection'.
CREATE TABLE block_collections (
    id    TEXT PRIMARY KEY,
    label TEXT NOT NULL DEFAULT ''
) WITHOUT ROWID;

CREATE INDEX idx_block_collections_label ON block_collections(label);

-- Children of a block collection (block or nested collection reference).
CREATE TABLE block_collection_entries (
    collection_id TEXT    NOT NULL REFERENCES block_collections(id),
    child_id      TEXT    NOT NULL, -- id of block or sub-collection
    is_collection INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, child_id)
) WITHOUT ROWID;

CREATE INDEX idx_block_collection_entries_child ON block_collection_entries(child_id);


-- ===========================================================================
-- CONTENT STYLING: BACKGROUNDS & STROKES (polymorphic owner pattern)
-- ===========================================================================
-- These two tables hold ALL background and stroke content across the schema.
-- owner_type identifies the parent context; owner_id is the PK of the owning row.
--
-- owner_type values:
--   'element'        → owner_id = elements.id           (many per element, ordered by sort_order)
--   'path_override'  → owner_id = linear_path_overrides.id (at most one per path override)
--   'layer'          → owner_id = layers.id             (at most one per layer, for override)
--   'local_state'    → owner_id = '1'                   (at most one, current item default)

-- ElementBackground: wraps ElementContentBase.
CREATE TABLE backgrounds (
    id                           INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type                   TEXT    NOT NULL,
    owner_id                     TEXT    NOT NULL,
    sort_order                   INTEGER NOT NULL DEFAULT 0,
    -- ElementContentBase
    preference                   INTEGER, -- ELEMENT_CONTENT_PREFERENCE
    src                          TEXT    NOT NULL DEFAULT '', -- color, gradient, image, fileId, url, @el/${id}
    visible                      INTEGER NOT NULL DEFAULT 1,
    opacity                      REAL    NOT NULL DEFAULT 1.0,
    -- TilingProperties (all NULL = no tiling)
    tiling_size_in_percent       REAL,
    tiling_angle                 REAL,
    tiling_spacing               REAL,
    tiling_offset_x              REAL,
    tiling_offset_y              REAL,
    -- DucHatchStyle (hatch_style NULL = no hatch)
    hatch_style                  INTEGER, -- HATCH_STYLE
    hatch_pattern_name           TEXT,
    hatch_pattern_scale          REAL,
    hatch_pattern_angle          REAL,
    hatch_pattern_origin_x       REAL,
    hatch_pattern_origin_y       REAL,
    hatch_pattern_origin_mirror  INTEGER, -- BEZIER_MIRRORING
    hatch_pattern_double         INTEGER,
    hatch_custom_pattern_name    TEXT,    -- CustomHatchPattern.name (NULL = predefined)
    hatch_custom_pattern_desc    TEXT,    -- CustomHatchPattern.description
    -- DucImageFilter (all NULL = no filter)
    image_filter_brightness      REAL,
    image_filter_contrast        REAL
);

CREATE INDEX idx_backgrounds_owner ON backgrounds(owner_type, owner_id);
CREATE INDEX idx_backgrounds_src   ON backgrounds(src) WHERE src != '';

-- ElementStroke: wraps ElementContentBase + stroke-specific fields.
CREATE TABLE strokes (
    id                           INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type                   TEXT    NOT NULL,
    owner_id                     TEXT    NOT NULL,
    sort_order                   INTEGER NOT NULL DEFAULT 0,
    -- ElementContentBase (same as backgrounds)
    preference                   INTEGER, -- ELEMENT_CONTENT_PREFERENCE
    src                          TEXT    NOT NULL DEFAULT '',
    visible                      INTEGER NOT NULL DEFAULT 1,
    opacity                      REAL    NOT NULL DEFAULT 1.0,
    tiling_size_in_percent       REAL,
    tiling_angle                 REAL,
    tiling_spacing               REAL,
    tiling_offset_x              REAL,
    tiling_offset_y              REAL,
    hatch_style                  INTEGER,
    hatch_pattern_name           TEXT,
    hatch_pattern_scale          REAL,
    hatch_pattern_angle          REAL,
    hatch_pattern_origin_x       REAL,
    hatch_pattern_origin_y       REAL,
    hatch_pattern_origin_mirror  INTEGER,
    hatch_pattern_double         INTEGER,
    hatch_custom_pattern_name    TEXT,
    hatch_custom_pattern_desc    TEXT,
    image_filter_brightness      REAL,
    image_filter_contrast        REAL,
    -- Stroke-specific
    width                        REAL    NOT NULL DEFAULT 1.0,
    -- StrokeStyle
    style_preference             INTEGER, -- STROKE_PREFERENCE
    style_cap                    INTEGER, -- STROKE_CAP
    style_join                   INTEGER, -- STROKE_JOIN
    style_dash                   BLOB,    -- packed f64 array (dash pattern)
    style_dash_line_override     TEXT,    -- DucBlockInstance id to override dash shape
    style_dash_cap               INTEGER, -- STROKE_CAP for dash ends
    style_miter_limit            REAL,
    -- Placement
    placement                    INTEGER, -- STROKE_PLACEMENT
    -- StrokeSides
    sides_preference             INTEGER, -- STROKE_SIDE_PREFERENCE
    sides_values                 BLOB     -- packed f64 array: [x,y] or [top,bottom,left,right]
);

CREATE INDEX idx_strokes_owner ON strokes(owner_type, owner_id);
CREATE INDEX idx_strokes_src   ON strokes(src) WHERE src != '';

-- Lines within a CustomHatchPattern (belongs to a background or stroke row).
-- owner_type: 'background' → owner_id = backgrounds.id
--             'stroke'     → owner_id = strokes.id
CREATE TABLE hatch_pattern_lines (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type           TEXT    NOT NULL, -- 'background' or 'stroke'
    owner_id             INTEGER NOT NULL, -- backgrounds.id or strokes.id
    sort_order           INTEGER NOT NULL DEFAULT 0,
    angle                REAL    NOT NULL DEFAULT 0.0,   -- line angle in radians
    origin_x             REAL    NOT NULL DEFAULT 0.0,   -- line origin point
    origin_y             REAL    NOT NULL DEFAULT 0.0,
    origin_mirroring     INTEGER,                        -- BEZIER_MIRRORING
    offset_x             REAL    NOT NULL DEFAULT 0.0,   -- offset between parallel lines
    offset_y             REAL    NOT NULL DEFAULT 0.0,
    dash_pattern         BLOB                            -- packed f64 array; NULL/empty = solid
);

CREATE INDEX idx_hatch_lines_owner ON hatch_pattern_lines(owner_type, owner_id);


-- ===========================================================================
-- ELEMENTS (the core scene graph)
-- ===========================================================================

-- Base table for ALL scene elements. Type-specific data in satellite tables.
-- Backgrounds and strokes stored in backgrounds/strokes tables with owner_type='element'.
CREATE TABLE elements (
    id              TEXT    PRIMARY KEY,
    element_type    TEXT    NOT NULL, -- rectangle, ellipse, polygon, text, line, arrow,
                                     -- freedraw, image, frame, plot, doc, model, embeddable, pdf

    -- Transform
    x               REAL    NOT NULL DEFAULT 0.0,
    y               REAL    NOT NULL DEFAULT 0.0,
    width           REAL    NOT NULL DEFAULT 0.0,
    height          REAL    NOT NULL DEFAULT 0.0,
    angle           REAL    NOT NULL DEFAULT 0.0,

    -- Metadata
    scope           TEXT    NOT NULL DEFAULT 'mm', -- unit scope (mm, cm, m, in, ft…)
    label           TEXT    NOT NULL DEFAULT '',
    description     TEXT,
    is_visible      INTEGER NOT NULL DEFAULT 1,
    seed            INTEGER NOT NULL DEFAULT 0,    -- random seed for shape generation (stable across renders)
    version         INTEGER NOT NULL DEFAULT 1,    -- incremented on each change, for collaboration reconciliation
    version_nonce   INTEGER NOT NULL DEFAULT 0,    -- random nonce for deterministic reconciliation when versions match
    updated         INTEGER NOT NULL DEFAULT 0,    -- epoch ms of last update
    "index"         TEXT,                           -- fractional index (rocicorp/fractional-indexing) for multiplayer ordering

    -- Flags
    is_plot         INTEGER NOT NULL DEFAULT 1,    -- visible on plotting
    is_deleted      INTEGER NOT NULL DEFAULT 0,

    -- Styles (DucElementStylesBase) — backgrounds/strokes in their own tables
    roundness       REAL    NOT NULL DEFAULT 0.0,
    blending        INTEGER,                       -- BLENDING enum (NULL = normal)
    opacity         REAL    NOT NULL DEFAULT 1.0,

    -- Relationships
    instance_id     TEXT    REFERENCES block_instances(id),
    layer_id        TEXT    REFERENCES layers(id),
    frame_id        TEXT,                           -- frame or plot the element belongs to

    -- Rendering
    z_index         REAL    NOT NULL DEFAULT 0.0,   -- stacking order (higher = on top)
    link            TEXT,
    locked          INTEGER NOT NULL DEFAULT 0,
    custom_data     JSONB                            -- JSON string: arbitrary key-value data
);  -- no WITHOUT ROWID: implicit integer rowid needed for FTS5 content sync

CREATE INDEX idx_elements_type        ON elements(element_type);
CREATE INDEX idx_elements_layer       ON elements(layer_id);
CREATE INDEX idx_elements_frame       ON elements(frame_id);
CREATE INDEX idx_elements_instance    ON elements(instance_id);
CREATE INDEX idx_elements_deleted     ON elements(is_deleted);
CREATE INDEX idx_elements_updated     ON elements(updated);
CREATE INDEX idx_elements_z_index     ON elements(z_index);
CREATE INDEX idx_elements_label       ON elements(label) WHERE label != '';
CREATE INDEX idx_elements_scope       ON elements(scope);
-- Spatial bounding-box index for rectangle-range queries on non-deleted elements
CREATE INDEX idx_elements_spatial     ON elements(x, y, width, height) WHERE is_deleted = 0;


-- ===========================================================================
-- ELEMENT RELATIONSHIP TABLES
-- ===========================================================================

-- Groups the element belongs to (Vec<String> group_ids, deepest→shallowest).
CREATE TABLE element_group_memberships (
    element_id TEXT    NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    group_id   TEXT    NOT NULL REFERENCES groups(id),
    sort_order INTEGER NOT NULL DEFAULT 0, -- 0 = deepest
    PRIMARY KEY (element_id, group_id)
) WITHOUT ROWID;

CREATE INDEX idx_elem_groups_group ON element_group_memberships(group_id);

-- Blocks this element helps define (Vec<String> block_ids).
-- Mutually exclusive with instance_id on the element.
CREATE TABLE element_block_memberships (
    element_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    block_id   TEXT NOT NULL REFERENCES blocks(id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (element_id, block_id)
) WITHOUT ROWID;

CREATE INDEX idx_elem_blocks_block ON element_block_memberships(block_id);

-- Regions the element belongs to (Vec<String> region_ids, deepest→shallowest).
CREATE TABLE element_region_memberships (
    element_id TEXT    NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    region_id  TEXT    NOT NULL REFERENCES regions(id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (element_id, region_id)
) WITHOUT ROWID;

CREATE INDEX idx_elem_regions_region ON element_region_memberships(region_id);

-- Other elements bound to this element (auto-updated on transform mutations).
CREATE TABLE element_bound_elements (
    element_id       TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    bound_element_id TEXT NOT NULL, -- id of the bound element
    bound_type       TEXT NOT NULL, -- element_type of the bound element
    sort_order       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (element_id, bound_element_id)
) WITHOUT ROWID;

CREATE INDEX idx_bound_elements_bound ON element_bound_elements(bound_element_id);


-- ===========================================================================
-- ELEMENT TYPE EXTENSIONS (satellite tables)
-- ===========================================================================

-- Polygon-specific fields.
CREATE TABLE element_polygon (
    element_id TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    sides      INTEGER NOT NULL DEFAULT 5  -- number of polygon sides
) WITHOUT ROWID;

-- Ellipse-specific fields.
CREATE TABLE element_ellipse (
    element_id         TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    ratio              REAL    NOT NULL DEFAULT 1.0,        -- aspect ratio
    start_angle        REAL    NOT NULL DEFAULT 0.0,        -- arc start (radians)
    end_angle          REAL    NOT NULL DEFAULT 6.283185307, -- arc end (2π)
    show_aux_crosshair INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;

-- Text element (DucTextElement + DucTextStyle flattened).
CREATE TABLE element_text (
    element_id       TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    -- Content
    text             TEXT    NOT NULL DEFAULT '',   -- display text, may contain {{tag}} placeholders
    original_text    TEXT    NOT NULL DEFAULT '',   -- pre-edit version
    auto_resize      INTEGER NOT NULL DEFAULT 1,   -- 1=width adjusts to content, 0=wraps to fixed width
    container_id     TEXT,                          -- parent element (e.g. label on shape)
    -- DucTextStyle
    is_ltr           INTEGER NOT NULL DEFAULT 1,   -- 1=left-to-right, 0=right-to-left
    font_family      TEXT    NOT NULL DEFAULT 'Roboto Mono',
    big_font_family  TEXT    NOT NULL DEFAULT 'sans-serif',   -- fallback for emoji/non-latin
    text_align       INTEGER NOT NULL DEFAULT 10,  -- TEXT_ALIGN
    vertical_align   INTEGER NOT NULL DEFAULT 10,  -- VERTICAL_ALIGN
    line_height      REAL    NOT NULL DEFAULT 1.2, -- unitless multiplier: px = fontSize × lineHeight
    line_spacing_value REAL  NOT NULL DEFAULT 1.2,  -- LineSpacing.value (interpretation depends on type)
    line_spacing_type  INTEGER,                     -- LINE_SPACING_TYPE (NULL = default)
    oblique_angle    REAL    NOT NULL DEFAULT 0.0,  -- italic angle (radians, +right/-left)
    font_size        REAL    NOT NULL DEFAULT 20.0, -- text height in drawing units (capital letter height)
    width_factor     REAL    NOT NULL DEFAULT 1.0,  -- char width as ratio of text height
    is_upside_down   INTEGER NOT NULL DEFAULT 0,
    is_backwards     INTEGER NOT NULL DEFAULT 0     -- render mirrored
);  -- no WITHOUT ROWID: implicit integer rowid needed for FTS5 content sync

CREATE INDEX idx_element_text_container   ON element_text(container_id);
CREATE INDEX idx_element_text_font_family ON element_text(font_family);

-- Linear element (shared by line + arrow). Points, lines, paths in child tables.
-- Bindings and last_committed_point flattened inline.
CREATE TABLE element_linear (
    element_id                    TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    -- Last committed point (flattened DucPoint, all NULL = none)
    last_committed_point_x        REAL,
    last_committed_point_y        REAL,
    last_committed_point_mirror   INTEGER, -- BEZIER_MIRRORING
    -- Start binding (flattened DucPointBinding, element_id NULL = no binding)
    start_binding_element_id      TEXT,    -- bound element
    start_binding_focus           REAL,    -- -1..1: position along bound edge
    start_binding_gap             REAL,    -- gap distance
    start_binding_fixed_point_x   REAL,    -- normalized [0..1] override for focus
    start_binding_fixed_point_y   REAL,
    start_binding_point_index     INTEGER, -- PointBindingPoint.index
    start_binding_point_offset    REAL,    -- PointBindingPoint.offset (-1..1)
    start_binding_head_type       INTEGER, -- LINE_HEAD
    start_binding_head_block_id   TEXT,    -- block id if head is a block
    start_binding_head_size       REAL,
    -- End binding (same structure)
    end_binding_element_id        TEXT,
    end_binding_focus             REAL,
    end_binding_gap               REAL,
    end_binding_fixed_point_x     REAL,
    end_binding_fixed_point_y     REAL,
    end_binding_point_index       INTEGER,
    end_binding_point_offset      REAL,
    end_binding_head_type         INTEGER,
    end_binding_head_block_id     TEXT,
    end_binding_head_size         REAL,
    -- Line-specific
    wipeout_below                 INTEGER NOT NULL DEFAULT 0, -- wipe content below (line only)
    -- Arrow-specific
    elbowed                       INTEGER NOT NULL DEFAULT 0  -- right-angle routing (arrow only)
) WITHOUT ROWID;

CREATE INDEX idx_linear_start_binding ON element_linear(start_binding_element_id)
    WHERE start_binding_element_id IS NOT NULL;
CREATE INDEX idx_linear_end_binding   ON element_linear(end_binding_element_id)
    WHERE end_binding_element_id IS NOT NULL;

-- Points on a linear element (Vec<DucPoint>).
CREATE TABLE linear_element_points (
    element_id TEXT    NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL, -- preserves array ordering
    x          REAL    NOT NULL,
    y          REAL    NOT NULL,
    mirroring  INTEGER,          -- BEZIER_MIRRORING (only meaningful if point at junction of 2 lines)
    PRIMARY KEY (element_id, sort_order)
) WITHOUT ROWID;

-- Line segments between points on a linear element (Vec<DucLine>).
CREATE TABLE linear_element_lines (
    element_id     TEXT    NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    sort_order     INTEGER NOT NULL,
    start_index    INTEGER NOT NULL, -- index into linear_element_points
    start_handle_x REAL,             -- bezier handle (NULL = no handle)
    start_handle_y REAL,
    end_index      INTEGER NOT NULL,
    end_handle_x   REAL,
    end_handle_y   REAL,
    PRIMARY KEY (element_id, sort_order)
) WITHOUT ROWID;

-- Path overrides on a linear element (Vec<DucPath>).
-- Background/stroke overrides stored in backgrounds/strokes tables with owner_type='path_override'.
CREATE TABLE linear_path_overrides (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    element_id TEXT    NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL
);

CREATE INDEX idx_path_overrides_element ON linear_path_overrides(element_id);

-- Line indices belonging to each path override.
CREATE TABLE linear_path_override_indices (
    path_override_id INTEGER NOT NULL REFERENCES linear_path_overrides(id) ON DELETE CASCADE,
    sort_order       INTEGER NOT NULL,
    line_index       INTEGER NOT NULL, -- index into linear_element_lines
    PRIMARY KEY (path_override_id, sort_order)
) WITHOUT ROWID;

-- Image element (DucImageElement). Scale, crop, filter flattened.
CREATE TABLE element_image (
    element_id          TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    file_id             TEXT,                          -- reference to external_files
    status              INTEGER NOT NULL DEFAULT 10,   -- IMAGE_STATUS: PENDING=10, SAVED=11, ERROR=12
    -- Scale (Vec<f64> of length 2, used for axis flipping)
    scale_x             REAL    NOT NULL DEFAULT 1.0,
    scale_y             REAL    NOT NULL DEFAULT 1.0,
    -- ImageCrop (all NULL = no crop)
    crop_x              REAL,
    crop_y              REAL,
    crop_width          REAL,
    crop_height         REAL,
    crop_natural_width  REAL,
    crop_natural_height REAL,
    -- DucImageFilter (all NULL = no filter)
    filter_brightness   REAL,
    filter_contrast     REAL
) WITHOUT ROWID;

CREATE INDEX idx_element_image_file   ON element_image(file_id);
CREATE INDEX idx_element_image_status ON element_image(status);

-- FreeDraw element (DucFreeDrawElement). Points in child table.
-- Start/end/last_committed_point flattened. Pressures stored as binary BLOB.
CREATE TABLE element_freedraw (
    element_id                    TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    size                          REAL    NOT NULL DEFAULT 2.0,
    thinning                      REAL    NOT NULL DEFAULT 0.6,
    smoothing                     REAL    NOT NULL DEFAULT 0.5,
    streamline                    REAL    NOT NULL DEFAULT 0.5,
    easing                        TEXT    NOT NULL DEFAULT 'easeOutSine',    -- key mapping to easing fn
    -- DucFreeDrawEnds start (all NULL = no start config)
    start_cap                     INTEGER,
    start_taper                   REAL,
    start_easing                  TEXT,
    -- DucFreeDrawEnds end
    end_cap                       INTEGER,
    end_taper                     REAL,
    end_easing                    TEXT,
    -- Pressure data
    pressures                     BLOB,    -- packed f32 array (binary pressure readings)
    simulate_pressure             INTEGER NOT NULL DEFAULT 1,
    -- Last committed point (flattened DucPoint)
    last_committed_point_x        REAL,
    last_committed_point_y        REAL,
    last_committed_point_mirror   INTEGER, -- BEZIER_MIRRORING
    -- Cached rendering
    svg_path                      TEXT     -- cached SVG path string
) WITHOUT ROWID;

-- Points on a freedraw element (Vec<DucPoint>).
CREATE TABLE freedraw_element_points (
    element_id TEXT    NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    x          REAL    NOT NULL,
    y          REAL    NOT NULL,
    mirroring  INTEGER,          -- BEZIER_MIRRORING
    PRIMARY KEY (element_id, sort_order)
) WITHOUT ROWID;

-- Shared DucStackElementBase for element-based containers (frames, plots, viewports).
-- Each stack-like element gets one row here; type-specific columns live in child tables.
CREATE TABLE element_stack_properties (
    element_id    TEXT    PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    label         TEXT    NOT NULL DEFAULT '',
    description   TEXT,
    is_collapsed  INTEGER NOT NULL DEFAULT 0,
    is_plot       INTEGER NOT NULL DEFAULT 1,
    is_visible    INTEGER NOT NULL DEFAULT 1,
    locked        INTEGER NOT NULL DEFAULT 0,
    opacity       REAL    NOT NULL DEFAULT 1.0,
    clip          INTEGER NOT NULL DEFAULT 0,
    label_visible INTEGER NOT NULL DEFAULT 1
) WITHOUT ROWID;

-- Frame element (DucFrameElement).
-- All shared stack fields live in element_stack_properties.
-- This table reserves a place for future frame-only columns.
CREATE TABLE element_frame (
    element_id TEXT PRIMARY KEY REFERENCES element_stack_properties(element_id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Plot element (DucPlotElement).
-- Shared stack fields in element_stack_properties; only margins here.
CREATE TABLE element_plot (
    element_id    TEXT    PRIMARY KEY REFERENCES element_stack_properties(element_id) ON DELETE CASCADE,
    margin_top    REAL    NOT NULL DEFAULT 0.0,
    margin_right  REAL    NOT NULL DEFAULT 0.0,
    margin_bottom REAL    NOT NULL DEFAULT 0.0,
    margin_left   REAL    NOT NULL DEFAULT 0.0
) WITHOUT ROWID;

-- Shared DocumentGridConfig for document-like elements (PDF, doc).
-- One row per element that needs grid layout + file reference.
CREATE TABLE document_grid_config (
    element_id            TEXT    PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    file_id               TEXT,
    grid_columns          INTEGER NOT NULL DEFAULT 1,   -- 1=single, 2=two-up, n=grid
    grid_gap_x            REAL    NOT NULL DEFAULT 0.0, -- horizontal spacing (px)
    grid_gap_y            REAL    NOT NULL DEFAULT 0.0, -- vertical spacing (px)
    grid_first_page_alone INTEGER NOT NULL DEFAULT 0,   -- cover page behavior for 2+ cols
    grid_scale            REAL    NOT NULL DEFAULT 1.0  -- DU/real ratio (1:300→0.00333, 1:1→1, 5:1→5)
) WITHOUT ROWID;

CREATE INDEX idx_doc_grid_config_file ON document_grid_config(file_id);

-- PDF element (DucPdfElement).
-- Grid config and file reference stored in document_grid_config.
-- This table reserves a place for future PDF-only columns.
CREATE TABLE element_pdf (
    element_id TEXT PRIMARY KEY REFERENCES document_grid_config(element_id) ON DELETE CASCADE
) WITHOUT ROWID;

-- Doc element (DucDocElement).
-- Grid config and file reference stored in document_grid_config.
CREATE TABLE element_doc (
    element_id TEXT PRIMARY KEY REFERENCES document_grid_config(element_id) ON DELETE CASCADE,
    text       TEXT NOT NULL DEFAULT ''
);  -- no WITHOUT ROWID: implicit integer rowid needed for FTS5 content sync

-- Table element. Source of truth is the linked xlsx file.
CREATE TABLE element_table (
    element_id TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    file_id    TEXT  -- reference to external xlsx file
) WITHOUT ROWID;

CREATE INDEX idx_element_table_file ON element_table(file_id);

-- Model element (3D parametric, DucModelElement). file_ids in child table.
-- Viewer state stored in model_viewer_state table.
CREATE TABLE element_model (
    element_id TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    model_type TEXT,                      -- e.g. PYTHON, DXF, IFC, STL, OBJ, STEP
    code       TEXT,                      -- build123d python source code
    svg_path   TEXT                       -- cached SVG for canvas rendering
);  -- no WITHOUT ROWID: implicit integer rowid needed for FTS5 content sync

CREATE INDEX idx_element_model_type ON element_model(model_type);

-- 3D viewer state for a model element (Viewer3DState, all sub-structs flattened).
-- At most one row per model element.
CREATE TABLE model_viewer_state (
    element_id                 TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE,
    -- Viewer3DCamera
    camera_control             TEXT    NOT NULL DEFAULT 'orbit',    -- 'orbit' | 'trackball'
    camera_ortho               INTEGER NOT NULL DEFAULT 0,
    camera_up                  TEXT    NOT NULL DEFAULT 'Z',        -- 'Z' | 'Y'
    camera_position_x          REAL    NOT NULL DEFAULT 0.0,
    camera_position_y          REAL    NOT NULL DEFAULT 0.0,
    camera_position_z          REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_x        REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_y        REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_z        REAL    NOT NULL DEFAULT 0.0,
    camera_quaternion_w        REAL    NOT NULL DEFAULT 1.0,
    camera_target_x            REAL    NOT NULL DEFAULT 0.0,
    camera_target_y            REAL    NOT NULL DEFAULT 0.0,
    camera_target_z            REAL    NOT NULL DEFAULT 0.0,
    camera_zoom                REAL    NOT NULL DEFAULT 1.0,
    camera_pan_speed           REAL    NOT NULL DEFAULT 1.0,
    camera_rotate_speed        REAL    NOT NULL DEFAULT 1.0,
    camera_zoom_speed          REAL    NOT NULL DEFAULT 1.0,
    camera_holroyd             INTEGER NOT NULL DEFAULT 0,
    -- Viewer3DDisplay
    display_wireframe          INTEGER NOT NULL DEFAULT 0,
    display_transparent        INTEGER NOT NULL DEFAULT 0,
    display_black_edges        INTEGER NOT NULL DEFAULT 0,
    display_grid_uniform       INTEGER,                              -- NULL = per-plane mode
    display_grid_xy            INTEGER NOT NULL DEFAULT 0,            -- per-plane: XY visible
    display_grid_xz            INTEGER NOT NULL DEFAULT 0,            -- per-plane: XZ visible
    display_grid_yz            INTEGER NOT NULL DEFAULT 0,            -- per-plane: YZ visible
    display_axes_visible       INTEGER NOT NULL DEFAULT 0,
    display_axes_at_origin     INTEGER NOT NULL DEFAULT 0,
    -- Viewer3DMaterial
    material_metalness         REAL    NOT NULL DEFAULT 0.0,
    material_roughness         REAL    NOT NULL DEFAULT 0.5,
    material_default_opacity   REAL    NOT NULL DEFAULT 1.0,
    material_edge_color        INTEGER NOT NULL DEFAULT 0,            -- packed RGB (e.g. 0xFFFFFF)
    material_ambient_intensity REAL    NOT NULL DEFAULT 0.5,
    material_direct_intensity  REAL    NOT NULL DEFAULT 0.5,
    -- Viewer3DClipping (x/y/z clip planes)
    clip_x_enabled             INTEGER NOT NULL DEFAULT 0,
    clip_x_value               REAL    NOT NULL DEFAULT 0.0,
    clip_x_normal_x            REAL,                                  -- NULL = no custom normal
    clip_x_normal_y            REAL,
    clip_x_normal_z            REAL,
    clip_y_enabled             INTEGER NOT NULL DEFAULT 0,
    clip_y_value               REAL    NOT NULL DEFAULT 0.0,
    clip_y_normal_x            REAL,
    clip_y_normal_y            REAL,
    clip_y_normal_z            REAL,
    clip_z_enabled             INTEGER NOT NULL DEFAULT 0,
    clip_z_value               REAL    NOT NULL DEFAULT 0.0,
    clip_z_normal_x            REAL,
    clip_z_normal_y            REAL,
    clip_z_normal_z            REAL,
    clip_intersection          INTEGER NOT NULL DEFAULT 0,
    clip_show_planes           INTEGER NOT NULL DEFAULT 0,
    clip_object_color_caps     INTEGER NOT NULL DEFAULT 0,
    -- Viewer3DExplode
    explode_active             INTEGER NOT NULL DEFAULT 0,
    explode_value              REAL    NOT NULL DEFAULT 0.0,
    -- Viewer3DZebra
    zebra_active               INTEGER NOT NULL DEFAULT 0,
    zebra_stripe_count         INTEGER NOT NULL DEFAULT 10,
    zebra_stripe_direction     REAL    NOT NULL DEFAULT 0.0,
    zebra_color_scheme         TEXT    NOT NULL DEFAULT 'blackwhite', -- 'blackwhite' | 'colorful' | 'grayscale'
    zebra_opacity              REAL    NOT NULL DEFAULT 1.0,
    zebra_mapping_mode         TEXT    NOT NULL DEFAULT 'reflection'  -- 'reflection' | 'normal'
) WITHOUT ROWID;

-- External files connected to a model element (STEP, STL, DXF, etc.).
CREATE TABLE model_element_files (
    element_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    file_id    TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (element_id, file_id)
) WITHOUT ROWID;

CREATE INDEX idx_model_files_file ON model_element_files(file_id);

-- Embeddable element (no extra fields beyond base).
CREATE TABLE element_embeddable (
    element_id TEXT PRIMARY KEY REFERENCES elements(id) ON DELETE CASCADE
) WITHOUT ROWID;


-- ===========================================================================
-- EXTERNAL FILES
-- ===========================================================================

-- Binary files referenced by elements (images, PDFs, xlsx, STEP, etc.).
CREATE TABLE external_files (
    id             TEXT    PRIMARY KEY,
    mime_type      TEXT    NOT NULL,
    data           BLOB    NOT NULL,   -- actual file content bytes
    created        INTEGER NOT NULL,   -- epoch ms
    last_retrieved INTEGER,            -- epoch ms; NULL if never loaded onto scene
    version        INTEGER
) WITHOUT ROWID;

CREATE INDEX idx_external_files_mime ON external_files(mime_type);