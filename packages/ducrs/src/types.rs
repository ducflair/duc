/**
 * Aligns text vertically within its bounding box.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum VERTICAL_ALIGN {
    /** Aligns text to the top of its bounding box. */
    TOP = 10,
    /** Aligns text to the middle of its bounding box. */
    MIDDLE = 11,
    /** Aligns text to the bottom of its bounding box. */
    BOTTOM = 12,
}

/**
 * Aligns text horizontally within its bounding box.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum TEXT_ALIGN {
    /** Aligns text to the left of its bounding box. */
    LEFT = 10,
    /** Centers text horizontally within its bounding box. */
    CENTER = 11,
    /** Aligns text to the right of its bounding box. */
    RIGHT = 12,
}

/**
 * Determines how line spacing is interpreted.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum LINE_SPACING_TYPE {
    /**
     * The line spacing is the larger of the `value` or the tallest character's natural height.
     * This ensures text doesn't overlap but respects a minimum spacing.
     */
    AT_LEAST = 10,
    /**
     * Forces the line spacing to the specified `value`, even if characters
     * (especially tall ones like ascenders/descenders or special symbols) overlap.
     * Useful for precise layout control where overlapping might be acceptable or handled externally.
     */
    EXACTLY = 11,
    /**
     * The base line height (often derived from the font's intrinsic metrics and font size)
     * is multiplied by the `value` (e.g., a `value` of 1.5 would mean 150% of the base line height).
     * This is very common for relative spacing.
     */
    MULTIPLE = 12,
}

/**
 * Placement of stroke relative to the element boundary.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum STROKE_PLACEMENT {
    /** Places the stroke inside the element's boundary. */
    INSIDE = 10,
    /** Centers the stroke on the element's boundary. */
    CENTER = 11,
    /** Places the stroke outside the element's boundary. */
    OUTSIDE = 12,
}

/**
 * Preferred stroke rendering style.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum STROKE_PREFERENCE {
    /** Renders the stroke as a continuous solid line. */
    SOLID = 10,
    /** Renders the stroke as a series of dashes. */
    DASHED = 11,
    /** Renders the stroke as a series of dots. */
    DOTTED = 12,
    /** Renders the stroke using a custom pattern. */
    CUSTOM = 13,
}

/**
 * Applies stroke to specific sides of an element.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum STROKE_SIDE_PREFERENCE {
    /** Applies the stroke to the top side. */
    TOP = 10,
    /** Applies the stroke to the bottom side. */
    BOTTOM = 11,
    /** Applies the stroke to the left side. */
    LEFT = 12,
    /** Applies the stroke to the right side. */
    RIGHT = 13,
    /** Applies the stroke to custom-defined sides. */
    CUSTOM = 14,
    /** Applies the stroke to all sides. */
    ALL = 15,
}

/**
 * Shape used at the end of stroked segments.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum STROKE_CAP {
    /** A butt cap cuts off the line at the endpoint. */
    BUTT = 10,
    /** A round cap adds a rounded end to the line. */
    ROUND = 11,
    /** A square cap adds a square end to the line. */
    SQUARE = 12,
}

/**
 * Join style for adjacent stroked segments.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum STROKE_JOIN {
    /** A miter join creates a sharp corner. */
    MITER = 10,
    /** A round join creates a rounded corner. */
    ROUND = 11,
    /** A bevel join creates a flattened corner. */
    BEVEL = 12,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum LINE_HEAD {
    /** An arrow-shaped line end. */
    ARROW = 10,
    /** A bar-shaped line end. */
    BAR = 11,
    /** A circular line end. */
    CIRCLE = 12,
    /** An outlined circular line end. */
    CIRCLE_OUTLINED = 13,
    /** A triangle-shaped line end. */
    TRIANGLE = 14,
    /** An outlined triangle-shaped line end. */
    TRIANGLE_OUTLINED = 15,
    /** A diamond-shaped line end. */
    DIAMOND = 16,
    /** An outlined diamond-shaped line end. */
    DIAMOND_OUTLINED = 17,
    /** A cross-shaped line end. */
    CROSS = 18,
    /** An open arrow-shaped line end. */
    OPEN_ARROW = 19,
    /** A reversed arrow-shaped line end. */
    REVERSED_ARROW = 20,
    /** A reversed triangle-shaped line end. */
    REVERSED_TRIANGLE = 21,
    /** A reversed outlined triangle-shaped line end. */
    REVERSED_TRIANGLE_OUTLINED = 22,
    /** A cone-shaped line end. */
    CONE = 23,
    /** A half-cone shaped line end. */
    HALF_CONE = 24,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum BEZIER_MIRRORING {
    /** No mirroring of Bezier handles. */
    NONE = 10,
    /** Bezier handles mirror their angle. */
    ANGLE = 11,
    /** Bezier handles mirror both their angle and length. */
    ANGLE_LENGTH = 12,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum BLENDING {
    /** Multiplies the colors of overlapping elements. */
    MULTIPLY = 11,
    /** Screens the colors of overlapping elements. */
    SCREEN = 12,
    /** Overlays the colors of overlapping elements. */
    OVERLAY = 13,
    /** Darkens the colors of overlapping elements. */
    DARKEN = 14,
    /** Lightens the colors of overlapping elements. */
    LIGHTEN = 15,
    /** Calculates the difference between the colors of overlapping elements. */
    DIFFERENCE = 16,
    /** Calculates the exclusion of the colors of overlapping elements. */
    EXCLUSION = 17,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum ELEMENT_CONTENT_PREFERENCE {
    /** Fills the element with a solid color. */
    SOLID = 12,
    /** Fills the element with a solid color or gradient (similar to FILL). */
    FILL = 14,
    /** Scales the content to fit within the element's bounds, maintaining aspect ratio. */
    FIT = 15,
    /** Tiles the content within the element's bounds. */
    TILE = 16,
    /** Stretches the content to fill the element's bounds, potentially distorting aspect ratio. */
    STRETCH = 17,
    /** Fills the element with a hatch pattern. */
    HATCH = 18,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum HATCH_STYLE {
    /** Normal hatch, fills closed boundaries. */
    NORMAL = 10,
    /** Outermost boundary only, ignores internal islands. */
    OUTER = 11,
    /** Ignores internal structures when hatching. */
    IGNORE = 12,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum IMAGE_STATUS {
    /** Image is pending upload/saving. */
    PENDING = 10,
    /** Image is saved and available. */
    SAVED = 11,
    /** An error occurred with the image. */
    ERROR = 12,
}

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum PRUNING_LEVEL {
    /** Conservative pruning, retains more history. */
    CONSERVATIVE = 10,
    /** Balanced pruning, optimizes between history and size. */
    BALANCED = 20,
    /** Aggressive pruning, retains less history for smaller size. */
    AGGRESSIVE = 30,
}

/**
 * Defines the types of boolean operations that can be performed.
 */
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde_repr::Serialize_repr, serde_repr::Deserialize_repr)]
#[repr(i32)]
pub enum BOOLEAN_OPERATION {
    /** Combines all child shapes into a single shape. */
    UNION = 10,
    /** Subtracts all subsequent shapes from the first shape. Order is critical. */
    SUBTRACT = 11,
    /** Creates a shape from the overlapping areas of all child shapes. */
    INTERSECT = 12,
    /** Creates a shape from the non-overlapping areas (XOR). */
    EXCLUDE = 13,
}

// =============== UTILITY & GEOMETRY TYPES ===============

/** A generic key-value pair for string dictionaries. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DictionaryEntry {
    pub key: String,
    pub value: String,
}

/** A generic key-value pair for more complex structures like DucBlock attribute values. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StringValueEntry {
    pub key: String,
    pub value: String,
}

/** A high-precision 2D point in the World Coordinate System. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeometricPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPoint {
    pub x: f64,
    pub y: f64,
    /** Only meaningful if the point is referenced in exactly two lines */
    pub mirroring: Option<BEZIER_MIRRORING>,
}

/** Represents margins for layouts and cells. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Margins {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

// =============== 3D VIEWER STATE ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DClipPlane {
    pub enabled: bool,
    pub value: f64,
    pub normal: Option<[f64; 3]>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DMaterial {
    pub metalness: f32,
    pub roughness: f32,
    pub default_opacity: f32,
    /** Packed RGB color (e.g. 0xFFFFFF) */
    pub edge_color: u32,
    pub ambient_intensity: f32,
    pub direct_intensity: f32,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DZebra {
    pub active: bool,
    pub stripe_count: i32,
    pub stripe_direction: f64,
    /** Available: "blackwhite" | "colorful" | "grayscale" */
    pub color_scheme: String,
    pub opacity: f32,
    /** Available: "reflection" | "normal" */
    pub mapping_mode: String,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DCamera {
    /** Available: "orbit" | "trackball" */
    pub control: String,
    pub ortho: bool,
    /** Available: "Z" | "Y" */
    pub up: String,
    pub position: [f64; 3],
    /** Camera rotation as quaternion [x, y, z, w] — avoids gimbal lock, better for interpolation */
    pub quaternion: [f64; 4],
    /** The point the camera orbits around / looks at */
    pub target: [f64; 3],
    pub zoom: f64,
    pub pan_speed: f32,
    pub rotate_speed: f32,
    pub zoom_speed: f32,
    pub holroyd: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DGridPlanes {
    pub xy: bool,
    pub xz: bool,
    pub yz: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "value", rename_all = "camelCase")]
pub enum Viewer3DGrid {
    /** All planes share the same visibility flag */
    Uniform(bool),
    /** Per-plane visibility control */
    PerPlane(Viewer3DGridPlanes),
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DDisplay {
    pub wireframe: bool,
    pub transparent: bool,
    pub black_edges: bool,
    pub grid: Viewer3DGrid,
    /** Whether to show the XYZ axes indicator */
    pub axes_visible: bool,
    /** If true, axes are positioned at world origin (0,0,0); if false, at object center */
    pub axes_at_origin: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DClipping {
    pub x: Viewer3DClipPlane,
    pub y: Viewer3DClipPlane,
    pub z: Viewer3DClipPlane,
    pub intersection: bool,
    pub show_planes: bool,
    pub object_color_caps: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DExplode {
    pub active: bool,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewer3DState {
    pub camera: Viewer3DCamera,
    pub display: Viewer3DDisplay,
    pub material: Viewer3DMaterial,
    pub clipping: Viewer3DClipping,
    pub explode: Viewer3DExplode,
    pub zebra: Viewer3DZebra,
}

// =============== STYLING & CONTENT ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TilingProperties {
    pub size_in_percent: f32,
    pub angle: f64,
    pub spacing: Option<f64>,
    pub offset_x: Option<f64>,
    pub offset_y: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HatchPatternLine {
    /** Line angle in radians */
    pub angle: f64,
    /** Line origin point */
    pub origin: DucPoint,
    /** Offset between parallel lines [x, y] */
    pub offset: Vec<f64>,
    /** Dash pattern (empty array = solid line) */
    pub dash_pattern: Vec<f64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomHatchPattern {
    /** Pattern name */
    pub name: String,
    /** Pattern description */
    pub description: Option<String>,
    /** Pattern line definitions */
    pub lines: Vec<HatchPatternLine>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucHatchStyle {
    /** Default hatch style */
    pub hatch_style: HATCH_STYLE,
    /** Pattern name (for predefined) or reference to custom pattern */
    pub pattern_name: String,
    /** Pattern scale factor */
    pub pattern_scale: f32,
    /** Pattern rotation angle */
    pub pattern_angle: f64,
    /** Pattern origin point */
    pub pattern_origin: DucPoint,
    /** Double pattern (second pattern at 90 degrees) */
    pub pattern_double: bool,
    pub custom_pattern: Option<CustomHatchPattern>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucImageFilter {
    pub brightness: f32,
    pub contrast: f32,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementContentBase {
    pub preference: Option<ELEMENT_CONTENT_PREFERENCE>,
    /** Can be a color, gradient, image, DucBlock, (fileId or url), frame element's content `@el/${elementId}` */
    pub src: String,
    pub visible: bool,
    pub opacity: f64,
    pub tiling: Option<TilingProperties>,
    pub hatch: Option<DucHatchStyle>,
    pub image_filter: Option<DucImageFilter>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StrokeStyle {
    pub preference: Option<STROKE_PREFERENCE>,
    pub cap: Option<STROKE_CAP>,
    pub join: Option<STROKE_JOIN>,
    pub dash: Option<Vec<f64>>,
    /** Override the dash line into a custom shape (DucBlockInstance id) */
    pub dash_line_override: Option<String>,
    pub dash_cap: Option<STROKE_CAP>,
    pub miter_limit: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StrokeSides {
    pub preference: Option<STROKE_SIDE_PREFERENCE>,
    /** [0, 1] for x and y || [0, 1, 2, 3] for top, bottom, left, right */
    pub values: Option<Vec<f64>>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementStroke {
    pub content: ElementContentBase,
    pub width: f64,
    pub style: StrokeStyle,
    pub placement: Option<STROKE_PLACEMENT>,
    pub stroke_sides: Option<StrokeSides>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementBackground {
    pub content: ElementContentBase,
}

/** Base style properties shared by many elements. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucElementStylesBase {
    pub roundness: f64,
    pub blending: Option<BLENDING>,
    pub background: Vec<ElementBackground>,
    pub stroke: Vec<ElementStroke>,
    pub opacity: f64,
}

// =============== BASE ELEMENT & COMMON ELEMENT COMPONENTS ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoundElement {
    pub id: String,
    #[serde(rename = "type")]
    pub element_type: String,
}

/** The foundational table for all scene elements, containing common properties. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucElementBase {
    pub id: String,
    #[serde(flatten)]
    pub styles: DucElementStylesBase,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub angle: f64,
    /**
     * The scope where the element is currently.
     * mm, cm, m, in, ft, yd, mi, etc...
     */
    pub scope: String,
    pub label: String,
    pub description: Option<String>,
    pub is_visible: bool,
    /**
     * Random integer used to seed shape generation.
     * Doesn't differ across renders.
     */
    pub seed: i32,
    /**
     * Integer that is sequentially incremented on each change. Used to reconcile
     * elements during collaboration or when saving to server.
     */
    pub version: i32,
    /**
     * Random integer that is regenerated on each change.
     * Used for deterministic reconciliation of updates during collaboration,
     * in case the versions (see above) are identical.
     */
    pub version_nonce: i32,
    /** Epoch timestamp (ms) of last element update */
    pub updated: i64,
    /**
     * String in a fractional form defined by https://github.com/rocicorp/fractional-indexing.
     * Used for ordering in multiplayer scenarios, such as during reconciliation or undo / redo.
     * Could be null for new elements which were not yet assigned to the scene.
     */
    pub index: Option<String>,
    /** Whether the element is a plot (i.e. visible on plotting) */
    pub is_plot: bool,
    /** Whether the element is deleted */
    pub is_deleted: bool,
    /**
     * List of groups the element belongs to.
     * Ordered from deepest to shallowest.
     */
    pub group_ids: Vec<String>,
    /**
     * List of blocks this element helps *define*.
     * If this is populated, `instance_id` should be null.
     */
    pub block_ids: Vec<String>,
    /**
     * List of regions the element belongs to.
     * Used to define boolean operations between elements.
     * Ordered from deepest to shallowest.
     */
    pub region_ids: Vec<String>,
    /**
     * The ID of the `DucBlockInstance` this element belongs to.
     * If not null, `block_ids` is empty (the relationship to the Block is via the Instance).
     */
    pub instance_id: Option<String>,
    /** The layer the element belongs to */
    pub layer_id: Option<String>,
    /** The frame or plot the element belongs to */
    pub frame_id: Option<String>,
    /**
     * Other elements that are bound to this element.
     * If we mutate this element, the bound elements will be updated automatically
     * for transform properties like x, y, angle, etc.
     */
    pub bound_elements: Option<Vec<BoundElement>>,
    /**
     * z-index of the element in the scene.
     * Explicit stacking order, higher values are rendered on top.
     */
    pub z_index: f32,
    pub link: Option<String>,
    pub locked: bool,
    /** Contains a JSON of custom key-value data. */
    pub custom_data: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucHead {
    #[serde(rename = "type")]
    pub head_type: Option<LINE_HEAD>,
    /** If the head is a block, this is the id of the block */
    pub block_id: Option<String>,
    pub size: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PointBindingPoint {
    /** The index of the target point within the element. */
    pub index: i32,
    /**
     * The offset from the point. Ranges from -1 to 1: 0 corresponds to the actual point.
     * -1 and 1 represent the percentage of the distance between the point at `index`
     * and the previous or next point in the points array, respectively.
     */
    pub offset: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPointBinding {
    pub element_id: String,
    /**
     * Determines where along the edge of the bound element the arrow endpoint should attach.
     * This value ranges from -1 to 1: -1 → Attaches to the far left/top; 0 → Attaches to the center; 1 → Attaches to the far right/bottom.
     * Focus ensures that the arrow dynamically adjusts as the bound element moves, resizes, or rotates.
     */
    pub focus: f32,
    /** The gap distance between the bound element and the binding element. */
    pub gap: f64,
    /**
     * Represents a fixed point inside the bound element, defined as a normalized coordinate.
     * This value is an array [x, y], where: x (0.0 - 1.0) → Horizontal position; y (0.0 - 1.0) → Vertical position.
     * If null, focus is used. If set, it overrides focus.
     */
    pub fixed_point: Option<GeometricPoint>,
    pub point: Option<PointBindingPoint>,
    /** The head of the line. */
    pub head: Option<DucHead>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLineReference {
    /** Index of the point in the points array */
    pub index: i32,
    /** Bezier handle of the point on the line segment */
    pub handle: Option<GeometricPoint>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLine {
    pub start: DucLineReference,
    pub end: DucLineReference,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPath {
    pub line_indices: Vec<i32>,
    /** Override the background and stroke from the base if different than null */
    pub background: Option<ElementBackground>,
    /** Override the background and stroke from the base if different than null */
    pub stroke: Option<ElementStroke>,
}

/** The base for linear elements like lines and arrows. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLinearElementBase {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub points: Vec<DucPoint>,
    pub lines: Vec<DucLine>,
    pub path_overrides: Vec<DucPath>,
    pub last_committed_point: Option<DucPoint>,
    pub start_binding: Option<DucPointBinding>,
    pub end_binding: Option<DucPointBinding>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucStackLikeStyles {
    pub opacity: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucStackBase {
    pub label: String,
    pub description: Option<String>,
    pub is_collapsed: bool,
    pub is_plot: bool,
    pub is_visible: bool,
    pub locked: bool,
    #[serde(flatten)]
    pub styles: DucStackLikeStyles,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucStackElementBase {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub stack_base: DucStackBase,
    pub clip: bool,
    pub label_visible: bool,
}

// =============== ELEMENT-SPECIFIC STYLES ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineSpacing {
    /**
     * The numerical value for the line spacing. Its interpretation depends on the `type` property.
     * Can also be interpreted as ScaleFactor.
     */
    pub value: f64,
    /**
     * Determines how the line spacing factor is applied.
     */
    #[serde(rename = "type")]
    pub line_type: Option<LINE_SPACING_TYPE>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucTextStyle {
    /**
     * Whether the text is left-to-right or right-to-left.
     */
    pub is_ltr: bool,
    /** The primary font family to use for the text, in CSS font-family format */
    pub font_family: String,
    /**
     * Fallback font family, in CSS font-family format, for broader compatibility across all systems and languages.
     * Useful for emojis, non-latin characters, etc.
     */
    pub big_font_family: String,
    /** Horizontal alignment of the text within its bounding box */
    pub text_align: TEXT_ALIGN,
    /** Vertical alignment of the text within its bounding box */
    pub vertical_align: VERTICAL_ALIGN,
    /**
     * Unitless line height multiplier (follows W3C standard).
     * Actual line height in drawing units = fontSize x lineHeight.
     */
    pub line_height: f32,
    /** Defines the line spacing properties for text. */
    pub line_spacing: LineSpacing,
    /**
     * Italic angle in radians for oblique text rendering.
     * Positive values slant right, negative values slant left.
     */
    pub oblique_angle: f64,
    /**
     * Text height in drawing units (primary size parameter).
     * This determines the height of capital letters.
     */
    pub font_size: f64,
    /**
     * Character width as a ratio of text height.
     * Controls horizontal spacing and character proportions.
     */
    pub width_factor: f32,
    pub is_upside_down: bool,
    /** Render backwards/mirrored */
    pub is_backwards: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucTableStyle {}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucDocStyle {}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPlotStyle {}

// =============== ELEMENT DEFINITIONS ===============

#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ElementType {
    Rectangle,
    Ellipse,
    Polygon,
    Table,
    Text,
    Line,
    Arrow,
    FreeDraw,
    Image,
    Frame,
    Plot,
    Doc,
    Model,
    Embeddable,
    Pdf,
}

impl ElementType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ElementType::Rectangle => "rectangle",
            ElementType::Ellipse => "ellipse",
            ElementType::Polygon => "polygon",
            ElementType::Table => "table",
            ElementType::Text => "text",
            ElementType::Line => "line",
            ElementType::Arrow => "arrow",
            ElementType::FreeDraw => "freedraw",
            ElementType::Image => "image",
            ElementType::Frame => "frame",
            ElementType::Plot => "plot",
            ElementType::Doc => "doc",
            ElementType::Model => "model",
            ElementType::Embeddable => "embeddable",
            ElementType::Pdf => "pdf",
        }
    }
}

// Element variant enum that wraps all element types
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DucElementVariant {
    Rectangle(DucRectangleElement),
    Ellipse(DucEllipseElement),
    Polygon(DucPolygonElement),
    Linear(DucLinearElement),
    Arrow(DucArrowElement),
    Text(DucTextElement),
    Image(DucImageElement),
    Frame(DucFrameElement),
    FreeDraw(DucFreeDrawElement),
    Table(DucTableElement),
    Plot(DucPlotElement),
    Doc(DucDocElement),
    Model(DucModelElement),
    Embeddable(DucEmbeddableElement),
    Pdf(DucPdfElement),
}

impl DucElementVariant {
    pub fn get_base(&self) -> &DucElementBase {
        match self {
            DucElementVariant::Rectangle(elem) => &elem.base,
            DucElementVariant::Ellipse(elem) => &elem.base,
            DucElementVariant::Polygon(elem) => &elem.base,
            DucElementVariant::Linear(elem) => &elem.linear_base.base,
            DucElementVariant::Arrow(elem) => &elem.linear_base.base,
            DucElementVariant::Text(elem) => &elem.base,
            DucElementVariant::Image(elem) => &elem.base,
            DucElementVariant::Frame(elem) => &elem.stack_element_base.base,
            DucElementVariant::FreeDraw(elem) => &elem.base,
            DucElementVariant::Table(elem) => &elem.base,
            DucElementVariant::Plot(elem) => &elem.stack_element_base.base,
            DucElementVariant::Doc(elem) => &elem.base,
            DucElementVariant::Model(elem) => &elem.base,
            DucElementVariant::Embeddable(elem) => &elem.base,
            DucElementVariant::Pdf(elem) => &elem.base,
        }
    }
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
pub enum DucElementEnum {
    #[serde(rename = "rectangle")]
    DucRectangleElement(DucRectangleElement),
    #[serde(rename = "polygon")]
    DucPolygonElement(DucPolygonElement),
    #[serde(rename = "ellipse")]
    DucEllipseElement(DucEllipseElement),
    #[serde(rename = "embeddable")]
    DucEmbeddableElement(DucEmbeddableElement),
    #[serde(rename = "pdf")]
    DucPdfElement(DucPdfElement),
    #[serde(rename = "table")]
    DucTableElement(DucTableElement),
    #[serde(rename = "image")]
    DucImageElement(DucImageElement),
    #[serde(rename = "text")]
    DucTextElement(DucTextElement),
    #[serde(rename = "line")]
    DucLinearElement(DucLinearElement),
    #[serde(rename = "arrow")]
    DucArrowElement(DucArrowElement),
    #[serde(rename = "freedraw")]
    DucFreeDrawElement(DucFreeDrawElement),
    #[serde(rename = "frame")]
    DucFrameElement(DucFrameElement),
    #[serde(rename = "plot")]
    DucPlotElement(DucPlotElement),
    #[serde(rename = "doc")]
    DucDocElement(DucDocElement),
    #[serde(rename = "model")]
    DucModelElement(DucModelElement),
}

/** A wrapper to hold an element from the union. */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct ElementWrapper {
    pub element: DucElementEnum,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucRectangleElement {
    #[serde(flatten)]
    pub base: DucElementBase,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPolygonElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    /** Number of sides of the polygon */
    pub sides: i32,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucEllipseElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub ratio: f32,
    pub start_angle: f64,
    pub end_angle: f64,
    pub show_aux_crosshair: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucEmbeddableElement {
    #[serde(flatten)]
    pub base: DucElementBase,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentGridConfig {
    /** 1 = single, 2 = two-up, n = grid */
    pub columns: i32,
    /** Horizontal spacing (px) */
    pub gap_x: f64,
    /** Vertical spacing (px) */
    pub gap_y: f64,
    /** Cover page behavior for 2+ columns */
    pub first_page_alone: bool,
    /**
     * The scale factor of the element (Drawing Units / Real World Units).
     * The scale factor is strictly a ratio and is unitless.
     * Example: 1:300 => 0.00333, 1:1 => 1.0, 5:1 => 5.0
     */
    pub scale: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPdfElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub file_id: Option<String>,
    pub grid_config: DocumentGridConfig,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucDocElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub style: DucDocStyle,
    pub text: String,
    pub grid_config: DocumentGridConfig,
    pub file_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucTableElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub style: DucTableStyle,
    pub file_id: Option<String>, // Source of truth is the linked xlsx file
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageCrop {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub natural_width: f64,
    pub natural_height: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucImageElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub file_id: Option<String>,
    pub status: IMAGE_STATUS,
    /** X and Y scale factors, used for image axis flipping */
    #[serde(rename = "scaleFlip")]
    pub scale: Vec<f64>,
    pub crop: Option<ImageCrop>,
    pub filter: Option<DucImageFilter>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucTextElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub style: DucTextStyle,
    /**
     * The display text, which can contain zero or more placeholders in the
     * format `{{tag}}`. Each tag corresponds to an object in the `dynamic` array.
     */
    pub text: String,
    /**
     * Text sizing behavior:
     * - `true`: Width adjusts to fit text content (single line or natural wrapping)
     * - `false`: Text wraps to fit within the element's fixed width
     */
    pub auto_resize: bool,
    /** The ID of an element that this text is contained within (e.g., for labels on shapes) */
    pub container_id: Option<String>,
    /** A non-rendered, original version of the text, e.g., before finishing writing the text */
    pub original_text: String,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLinearElement {
    #[serde(flatten)]
    pub linear_base: DucLinearElementBase,
    /**
     * If true, the element's shape will wipe out the content below the element.
     */
    pub wipeout_below: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucArrowElement {
    #[serde(flatten)]
    pub linear_base: DucLinearElementBase,
    pub elbowed: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucFreeDrawEnds {
    pub cap: bool,
    pub taper: f32,
    pub easing: String,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucFreeDrawElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    pub points: Vec<DucPoint>,
    pub size: f64,
    pub thinning: f32,
    pub smoothing: f32,
    pub streamline: f32,
    /** Key that maps to an easing function */
    pub easing: String,
    pub start: Option<DucFreeDrawEnds>,
    pub end: Option<DucFreeDrawEnds>,
    pub pressures: Vec<f32>,
    pub simulate_pressure: bool,
    pub last_committed_point: Option<DucPoint>,
    /** Optional cached SVG string */
    pub svg_path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucFrameElement {
    #[serde(flatten)]
    pub stack_element_base: DucStackElementBase,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlotLayout {
    /** Margins inset from the edge of the paper. */
    pub margins: Margins,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucPlotElement {
    #[serde(flatten)]
    pub stack_element_base: DucStackElementBase,
    pub style: DucPlotStyle,
    /** The layout definition for this plot, including paper size and margins. */
    pub layout: PlotLayout,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucModelElement {
    #[serde(flatten)]
    pub base: DucElementBase,
    /* The specific type of 3D model, e.g., "PYTHON", "DXF", "IFC", "STL", "OBJ", "STEP", etc. */
    pub model_type: Option<String>,
    /** Defines the source code of the model using build123d python code */
    pub code: Option<String>,
    /** The last known SVG path representation of the 3D model for quick rendering on the canvas */
    pub svg_path: Option<String>,
    /** Possibly connected external files, such as STEP, STL, DXF, etc. */
    pub file_ids: Vec<String>,
    /** The last known 3D viewer state for the model */
    pub viewer_state: Option<Viewer3DState>,
}

// =============== BLOCK DEFINITIONS ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucBlockDuplicationArray {
    pub rows: i32,
    pub cols: i32,
    pub row_spacing: f64,
    pub col_spacing: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucBlockMetadata {
    pub source: Option<String>,
    pub usage_count: i32,
    /** Epoch timestamp (ms) of block creation */
    pub created_at: i64,
    /** Epoch timestamp (ms) of last block update */
    pub updated_at: i64,
    /**
     * JSON string to represent localization data.
     * Structure: Record<string, BlockLocalizationEntry>
     *
     * where key string is BCP 47 standard language tag (e.g., "en-US", "fr-FR")
     * where BlockLocalizationEntry is:
     *
     * {
     *   title: string;
     *   description?: string;
     * }
     */
    pub localization: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucBlock {
    pub id: String,
    pub label: String,
    pub description: Option<String>,
    pub version: i32,
    pub metadata: Option<DucBlockMetadata>,
    #[serde(with = "serde_bytes", default, skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<Vec<u8>>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucBlockInstance {
    pub id: String,
    /** The reference to the DucBlock definition this instance is based on */
    pub block_id: String,
    /** The version that should match the block_id's version, incremented on each change */
    pub version: i32,
    pub element_overrides: Option<Vec<StringValueEntry>>,
    pub duplication_array: Option<DucBlockDuplicationArray>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucBlockCollectionEntry {
    pub id: String,
    /**
     * True if pointing to another collection, False if pointing to a block.
     */
    pub is_collection: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucBlockCollection {
    pub id: String,
    pub label: String,
    pub children: Vec<DucBlockCollectionEntry>,
    pub metadata: Option<DucBlockMetadata>,
    #[serde(with = "serde_bytes", default, skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<Vec<u8>>,
}

// =============== GROUPS & REGIONS ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucGroup {
    pub id: String,
    #[serde(flatten)]
    pub stack_base: DucStackBase,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucRegion {
    pub id: String,
    #[serde(flatten)]
    pub stack_base: DucStackBase,
    /** The boolean operation to apply to all child elements. */
    pub boolean_operation: BOOLEAN_OPERATION,
}

// =============== APP & DOCUMENT STATE ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucGlobalState {
    /** The name of the drawing */
    pub name: Option<String>,
    /** The background color of the drawing */
    pub view_background_color: String,
    /** The master unit system for the entire drawing, used for block/file insertion scaling. */
    pub main_scope: String,
    /**
     * Exponent threshold for determining when to change measurement scope (up or down).
     * This value defines a +/- tolerance range around the exponent of the current scope.
     */
    pub scope_exponent_threshold: i8,
    /** The level of pruning to the versions from the version graph. */
    pub pruning_level: PRUNING_LEVEL,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLocalState {
    /**
     * The current scope of the design.
     * mm, cm, m, in, ft, yd, mi, etc...
     */
    pub scope: String,
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub zoom: f64,
    pub is_binding_enabled: bool,
    /** Current item is usually a quick access state to apply as default to certain things when drawing */
    pub current_item_stroke: Option<ElementStroke>,
    pub current_item_background: Option<ElementBackground>,
    pub current_item_opacity: f32,
    pub current_item_font_family: String,
    pub current_item_font_size: f64,
    pub current_item_text_align: TEXT_ALIGN,
    pub current_item_start_line_head: Option<DucHead>,
    pub current_item_end_line_head: Option<DucHead>,
    pub current_item_roundness: f64,
    /** Pen mode is enabled, creates a better experience for drawing with a pen */
    pub pen_mode: bool,
    /** In view mode the user is not allowed to edit the canvas. */
    pub view_mode_enabled: bool,
    /** Object snapping on the environment is enabled */
    pub objects_snap_mode_enabled: bool,
    /** Available grids are visible */
    pub grid_mode_enabled: bool,
    /** Whether to disable the fill on all shapes */
    pub outline_mode_enabled: bool,
    /**
     * When enabled, the version graph is not updated automatically.
     * The user needs to manually update the graph for new versions to be saved in version control.
     */
    pub manual_save_mode: bool,
    pub decimal_places: i32,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLayerOverrides {
    pub stroke: ElementStroke,
    pub background: ElementBackground,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucLayer {
    pub id: String,
    #[serde(flatten)]
    pub stack_base: DucStackBase,
    pub readonly: bool,
    /** A container for the default styling properties that elements on this layer will inherit */
    pub overrides: Option<DucLayerOverrides>,
}

// =============== VERSION CONTROL ===============

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionBase {
    pub id: String,
    pub parent_id: Option<String>,
    pub timestamp: i64,
    pub description: Option<String>,
    pub is_manual_save: bool,
    pub user_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Checkpoint {
    #[serde(flatten)]
    pub base: VersionBase,
    pub version_number: i64,
    pub schema_version: i32,
    pub is_schema_boundary: bool,
    #[serde(with = "serde_bytes")]
    pub data: Vec<u8>,
    pub size_bytes: i64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Delta {
    #[serde(flatten)]
    pub base: VersionBase,
    pub version_number: i64,
    pub schema_version: i32,
    pub base_checkpoint_id: String,
    /** Compressed binary data for the delta (zlib). When present, patch_string is ignored. */
    #[serde(with = "serde_bytes")]
    pub payload: Vec<u8>,
    pub size_bytes: i64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaMigration {
    pub from_schema_version: i32,
    pub to_schema_version: i32,
    pub migration_name: String,
    pub migration_checksum: Option<String>,
    pub applied_at: i64,
    pub boundary_checkpoint_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionChain {
    pub id: String,
    pub schema_version: i32,
    pub start_version: i64,
    pub end_version: Option<i64>,
    pub migration: Option<SchemaMigration>,
    pub root_checkpoint_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionGraphMetadata {
    pub current_version: i64,
    pub current_schema_version: i32,
    pub chain_count: i32,
    pub last_pruned: i64,
    pub total_size: i64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionGraph {
    /** The ID of the user-designated checkpoint version. */
    pub user_checkpoint_version_id: String,
    /** The ID of the latest version in the graph. */
    pub latest_version_id: String,
    pub chains: Vec<VersionChain>,
    /** An array of all checkpoint versions. */
    pub checkpoints: Vec<Checkpoint>,
    /** An array of all delta versions (patches). */
    pub deltas: Vec<Delta>,
    pub metadata: VersionGraphMetadata,
}

// =============== EXTERNAL FILES ===============

/// Lightweight metadata for an external file (no data blob).
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalFileMetadata {
    pub id: String,
    pub mime_type: String,
    pub created: i64,
    pub last_retrieved: Option<i64>,
    pub version: Option<i32>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucExternalFileData {
    pub mime_type: String,
    pub id: String,
    /** The actual file content bytes. */
    #[serde(with = "serde_bytes")]
    pub data: Vec<u8>,
    /** Epoch timestamp in milliseconds when the file was created. */
    pub created: i64,
    /**
     * Epoch timestamp in milliseconds when the file was last retrieved from storage to be loaded onto the scene.
     * Used to determine whether to delete unused files from storage.
     */
    pub last_retrieved: Option<i64>,
    pub version: Option<i32>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DucExternalFileEntry {
    pub key: String,
    pub value: DucExternalFileData,
}

// =============== ROOT TYPE ===============

/** Root data structure for the stored data state */
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportedDataState {
    /** Actual file id */
    pub id: Option<String>,
    pub version: String,
    pub source: String,
    #[serde(rename = "type")]
    pub data_type: String,
    pub dictionary: Option<std::collections::HashMap<String, String>>,
    #[serde(with = "serde_bytes", default, skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<Vec<u8>>,
    pub elements: Vec<ElementWrapper>,
    pub blocks: Vec<DucBlock>,
    pub block_instances: Vec<DucBlockInstance>,
    pub block_collections: Vec<DucBlockCollection>,
    pub groups: Vec<DucGroup>,
    pub regions: Vec<DucRegion>,
    pub layers: Vec<DucLayer>,
    /** The user's current session state for a specific project */
    #[serde(rename = "localState")]
    pub duc_local_state: Option<DucLocalState>,
    /** Project-wide settings that are saved with the document and shared by all users */
    #[serde(rename = "globalState")]
    pub duc_global_state: Option<DucGlobalState>,
    /** In case it is needed to embed the version control into the file format */
    pub version_graph: Option<VersionGraph>,
    #[serde(rename = "files")]
    pub external_files: Option<std::collections::HashMap<String, DucExternalFileData>>,
}
