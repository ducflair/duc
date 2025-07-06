use std::collections::HashMap;

// =============== ENUMS ===============

pub const NO_PEER_POINT: i32 = -1;

pub mod mime_types {
  pub const DUC: &str = "application/vnd.duc-cad";
  pub const DUCFIG: &str = "application/vnd.duc-config";
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum ElementContentPreference {
    Hachure = 10, // hachure
    CrossHatch = 11, // cross-hatch
    Solid = 12,
    ZigZag = 13,
    Fill = 14,
    Fit = 15,
    Tile = 16,
    Stretch = 17,
    Hatch = 18,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum StrokePreference {
    Solid = 10,
    Dashed = 11,
    Dotted = 12,
    Custom = 13,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum StrokeSidePreference {
    Top = 10,
    Bottom = 11,
    Left = 12,
    Right = 13,
    Custom = 14,
    All = 15,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum StrokePlacement {
    Outside = 12,
    Center = 11,
    Inside = 10,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum StrokeCap {
    Butt = 10,
    Round = 11,
    Square = 12,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum StrokeJoin {
    Miter = 10,
    Round = 11,
    Bevel = 12,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum BezierMirroring {
    None = 10,
    Angle = 11,
    AngleLength = 12, // ANGLE_LENGTH
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum LineHead {
    Arrow = 10,
    Bar = 11,
    Circle = 12,
    CircleOutlined = 13,
    Triangle = 14,
    TriangleOutlined = 15,
    Diamond = 16,
    DiamondOutlined = 17,
    Cross = 18,
    OpenArrow = 19,
    ReversedArrow = 20,
    ReversedTriangle = 21,
    ReversedTriangleOutlined = 22,
    Cone = 23,
    HalfCone = 24,
}


#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]  // Ensures the enum is represented as a i8
pub enum TextAlign {
    Left = 10,
    Center = 11,
    Right = 12,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ElementType {
    Rectangle,
    Ellipse,
    Diamond,
    Text,
    Line,
    Arrow,
    FreeDraw,
    Image,
    Frame,
    Group,
    MagicFrame,
    Selection,
}

impl ElementType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ElementType::Rectangle => "rectangle",
            ElementType::Ellipse => "ellipse",
            ElementType::Diamond => "diamond",
            ElementType::Text => "text",
            ElementType::Line => "line",
            ElementType::Arrow => "arrow",
            ElementType::FreeDraw => "freedraw",
            ElementType::Image => "image",
            ElementType::Frame => "frame",
            ElementType::Group => "group",
            ElementType::MagicFrame => "magicframe",
            ElementType::Selection => "selection",
        }
    }
}

#[derive(Debug, Clone)]
pub enum DucElementVariant {
    Base(DucElement),
    Linear(DucLinearElement),
    Arrow(DucArrowElement),
    FreeDraw(DucFreeDrawElement),
    Text(DucTextElement),
    Image(DucImageElement),
    Frame(DucFrameElement),
    Group(DucGroupElement),
    MagicFrame(DucMagicFrameElement),
    Selection(DucSelectionElement),
    Rectangle(DucRectangleElement),
    Diamond(DucDiamondElement),
    Ellipse(DucEllipseElement),
}

impl DucElementVariant {
    pub fn from_element(element: DucElement) -> Self {
        match element.element_type.as_str() {
            "line" => DucElementVariant::Linear(DucLinearElement {
                base: element,
                points: Vec::new(), // This will be populated from the state
                last_committed_point: None,
                start_binding: None,
                end_binding: None,
            }),
            "arrow" => DucElementVariant::Arrow(DucArrowElement {
                base: DucLinearElement {
                    base: element,
                    points: Vec::new(),
                    last_committed_point: None,
                    start_binding: None,
                    end_binding: None,
                },
                elbowed: false,
            }),
            "rectangle" => DucElementVariant::Rectangle(DucRectangleElement {
                base: element,
            }),
            "ellipse" => DucElementVariant::Ellipse(DucEllipseElement {
                base: element,
            }),
            "diamond" => DucElementVariant::Diamond(DucDiamondElement {
                base: element,
            }),
            "freedraw" => DucElementVariant::FreeDraw(DucFreeDrawElement {
                base: element,
                points: Vec::new(),
                pressures: Vec::new(),
                simulate_pressure: false,
                last_committed_point: None,
            }),
            "image" => DucElementVariant::Image(DucImageElement {
                base: element,
                file_id: None,
                status: ImageStatus::Pending,
                scale: (1.0, 1.0),
                crop: None,
            }),
            "frame" => DucElementVariant::Frame(DucFrameElement {
                base: element,
                is_collapsed: false,
                clip: false,
            }),
            "group" => DucElementVariant::Group(DucGroupElement {
                base: element,
                is_collapsed: false,
                clip: false,
                group_id_ref: "".to_string(),
            }),
            "magicframe" => DucElementVariant::MagicFrame(DucMagicFrameElement {
                base: element,
                is_collapsed: false,
                clip: false,
            }),
            "text" => DucElementVariant::Text(DucTextElement {
                base: element,
                font_size: 12.0,
                font_family: FontFamily::Virgil,
                text: "".to_string(),
                text_align: TextAlign::Left,
                vertical_align: VerticalAlign::Top,
                container_id: None,
                original_text: None,
                line_height: 1.0,
                auto_resize: false,
            }),
            

            _ => DucElementVariant::Base(element),
        }
    }

    pub fn get_base(&self) -> &DucElement {
        match self {
            DucElementVariant::Base(e) => e,
            DucElementVariant::Linear(e) => &e.base,
            DucElementVariant::Arrow(e) => &e.base.base,
            DucElementVariant::Text(e) => &e.base,
            DucElementVariant::Image(e) => &e.base,
            DucElementVariant::Frame(e) => &e.base,
            DucElementVariant::FreeDraw(e) => &e.base,
            DucElementVariant::Group(e) => &e.base,
            DucElementVariant::MagicFrame(e) => &e.base,
            DucElementVariant::Selection(e) => &e.base,
            DucElementVariant::Rectangle(e) => &e.base,
            DucElementVariant::Diamond(e) => &e.base,
            DucElementVariant::Ellipse(e) => &e.base,
        }
    }

    pub fn update_from(&mut self, new_element: DucElement) {
        match self {
            DucElementVariant::Base(e) => *e = new_element,
            DucElementVariant::Linear(e) => e.base = new_element,
            DucElementVariant::Arrow(e) => e.base.base = new_element,
            DucElementVariant::Text(e) => e.base = new_element,
            DucElementVariant::Image(e) => e.base = new_element,
            DucElementVariant::Frame(e) => e.base = new_element,
            DucElementVariant::FreeDraw(e) => e.base = new_element,
            DucElementVariant::Group(e) => e.base = new_element,
            DucElementVariant::MagicFrame(e) => e.base = new_element,
            DucElementVariant::Selection(e) => e.base = new_element,
            DucElementVariant::Rectangle(e) => e.base = new_element,
            DucElementVariant::Diamond(e) => e.base = new_element,
            DucElementVariant::Ellipse(e) => e.base = new_element,
        }
    }
}


#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum ElementSubset {
    AUX = 14, 
    COTA = 15,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum Blending {
    Multiply = 11,
    Screen = 12,
    Overlay = 13,
    Darken = 14,
    Lighten = 15,
    Difference = 16,
    Exclusion = 17,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum VerticalAlign {
    Top = 10,
    Middle = 11,
    Bottom = 12,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum FontFamily {
    Virgil = 1,
    Helvetica = 2,
    Arial = 3,
    Cascadia = 4,
    Excalifont = 5,
    Nunito = 6,
    LilitaOne = 7,
    ComicShanns = 8,
    LiberationSans = 9,
    RobotoMono = 10,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ImageStatus {
    Pending, // "pending"
    Loaded,  // "saved"
    Error,   // "error"
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum DesignStandard {
    DUC = 10,
    ABNT = 11,
    ANSI = 12,
    ISO = 13,
    DIN = 14,
    JIS = 15,
    GB = 16,
    BSI = 17,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum AntiAliasing {
    None = 10,
    Analytic = 11,
    Msaa8 = 8,
    Msaa16 = 16,
}


// =============== BASIC TYPES ===============

#[derive(Debug, Clone, PartialEq)]
pub struct SimplePoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
    pub is_curve: Option<bool>,
    pub mirroring: Option<BezierMirroring>,
    pub border_radius: Option<f64>,
    pub handle_in: Option<SimplePoint>,
    pub handle_out: Option<SimplePoint>,
    pub peer: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct TilingProperties {
    pub size_in_percent: f64,
    pub angle: f64,
    pub spacing: Option<f64>,
    pub offset_x: Option<f64>,
    pub offset_y: Option<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementContentBase {
    pub preference: ElementContentPreference,
    pub src: String,
    pub visible: bool,
    pub opacity: f64,
    pub tiling: Option<TilingProperties>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StrokeStyle {
    pub preference: StrokePreference,
    pub cap: Option<StrokeCap>,
    pub join: Option<StrokeJoin>,
    pub dash: Option<Vec<f64>>,
    pub dash_cap: Option<StrokeCap>,
    pub miter_limit: Option<f64>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StrokeSides {
    pub preference: StrokeSidePreference,
    pub values: Option<Vec<f64>>, // [0, 1] for x and y || [0, 1, 2, 3] for top, bottom, left, right
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementStroke {
    pub content: ElementContentBase,
    pub width: f64,
    pub style: StrokeStyle,
    pub placement: StrokePlacement,
    pub stroke_sides: Option<StrokeSides>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementBackground {
    pub content: ElementContentBase,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ImageCrop {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub natural_width: f64,
    pub natural_height: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct BindingPoint {
    pub index: i32,
    pub offset: f32,  // -1 to 1 range
}

#[derive(Debug, Clone, PartialEq)]
pub struct PointBinding {
    pub element_id: String,
    pub focus: f32,
    pub gap: f32,
    pub fixed_point: Option<SimplePoint>,
    pub point: Option<BindingPoint>,
    pub head: Option<LineHead>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i8)]
pub enum HandleType {
    HandleIn = 10,
    HandleOut = 11,
}

#[derive(Debug, Clone, PartialEq)]
pub struct BoundElement {
    pub id: String,
    pub element_type: String,  // Using element_type instead of type as type is a reserved keyword in Rust
}


// =============== LINEAR ELEMENT EDITOR ===============
#[derive(Debug, Clone, PartialEq)]
pub struct SegmentMidpointState {
    pub value: Option<Point>,
    pub index: i32,
    pub added: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PointerDownState {
    pub prev_selected_points_indices: Vec<i32>,
    pub last_clicked_point: i32,
    pub last_clicked_is_end_point: bool,
    pub origin: Option<SimplePoint>,
    pub segment_midpoint: SegmentMidpointState,
    pub handle_type: Option<HandleType>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LinearElementEditor {
    pub element_id: String,
    pub selected_points_indices: Vec<i32>,
    pub pointer_down_state: PointerDownState,
    pub is_dragging: bool,
    pub last_uncommitted_point: Option<Point>,
    pub pointer_offset: SimplePoint,
    pub start_binding_element: String,
    pub end_binding_element: String,
    pub hover_point_index: i32,
    pub segment_mid_point_hovered_coords: Option<Point>,
}


// =============== ELEMENT CLASSES ===============

#[derive(Debug, Clone, PartialEq)]
pub struct DucElement {
    pub id: String,
    pub element_type: String,  // Using element_type instead of type as type is a reserved keyword in Rust
    pub x: f64,
    pub y: f64,
    pub scope: String,
    pub subset: Option<ElementSubset>,
    pub label: String,
    pub is_visible: bool,
    pub roundness: f64,
    pub blending: Option<Blending>,
    pub stroke: Vec<ElementStroke>,
    pub background: Vec<ElementBackground>,
    pub opacity: f32,
    pub width: f64,
    pub height: f64,
    pub angle: f64,
    pub seed: Option<i32>,
    pub version: Option<i32>,
    pub version_nonce: Option<i32>,
    pub is_deleted: bool,
    pub group_ids: Vec<String>,
    pub frame_id: Option<String>,
    pub bound_elements: Option<Vec<BoundElement>>,
    pub updated: Option<i64>,  // epoch ms
    pub index: Option<String>,
    pub link: Option<String>,
    pub locked: bool,
    pub z_index: i32,
    pub custom_data: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucLinearElement {
    pub base: DucElement,
    pub points: Vec<Point>,
    pub last_committed_point: Option<Point>,
    pub start_binding: Option<PointBinding>,
    pub end_binding: Option<PointBinding>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucArrowElement {
    pub base: DucLinearElement,
    pub elbowed: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFreeDrawElement {
    pub base: DucElement,
    pub points: Vec<Point>,
    pub pressures: Vec<f64>,
    pub simulate_pressure: bool,
    pub last_committed_point: Option<Point>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucTextElement {
    pub base: DucElement,
    pub font_size: f64,
    pub font_family: FontFamily,
    pub text: String,
    pub text_align: TextAlign,
    pub vertical_align: VerticalAlign,
    pub container_id: Option<String>,
    pub original_text: Option<String>,
    pub line_height: f64,
    pub auto_resize: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucImageElement {
    pub base: DucElement,
    pub file_id: Option<String>,
    pub status: ImageStatus,
    pub scale: (f64, f64),
    pub crop: Option<ImageCrop>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucFrameElement {
    pub base: DucElement,
    pub is_collapsed: bool,
    pub clip: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucGroupElement {
    pub base: DucElement,
    pub is_collapsed: bool,
    pub clip: bool,
    pub group_id_ref: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucMagicFrameElement {
    pub base: DucElement,
    pub is_collapsed: bool,
    pub clip: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucSelectionElement {
    pub base: DucElement,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucRectangleElement {
    pub base: DucElement,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucDiamondElement {
    pub base: DucElement,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucEllipseElement {
    pub base: DucElement,
}

// =============== APP STATE ===============

#[derive(Debug, Clone, PartialEq)]
pub struct Zoom {
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FrameRendering {
    pub enabled: bool,
    pub name: bool,
    pub outline: bool,
    pub clip: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DucGroup {
    pub id: String,
    pub group_type: String,  // Using group_type instead of type as type is a reserved keyword in Rust
    pub is_collapsed: bool,
    pub label: String,
    pub scope: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AppState {
    pub active_embeddable_element: Option<Box<DucElement>>,
    pub active_embeddable_state: Option<String>,
    pub dragging_element: Option<Box<DucElement>>,
    pub resizing_element: Option<Box<DucElement>>,
    pub multi_element: Option<Box<DucElement>>,
    pub selection_element: Option<Box<DucElement>>,
    pub frame_to_highlight: Option<Box<DucElement>>,
    pub frame_rendering: FrameRendering,
    pub editing_frame: Option<String>,
    pub elements_to_highlight: Option<Vec<DucElement>>,
    pub editing_element: Option<Box<DucElement>>,
    pub current_item_stroke: Option<ElementStroke>,
    pub current_item_background: Option<ElementBackground>,
    pub current_item_opacity: f32,
    pub current_item_font_family: FontFamily,
    pub current_item_font_size: f64,
    pub current_item_text_align: TextAlign,
    pub current_item_start_line_head: Option<LineHead>,
    pub current_item_end_line_head: Option<LineHead>,
    pub current_item_roundness: f64,
    pub current_item_subset: Option<ElementSubset>,
    pub view_background_color: String,
    pub scope: String,
    pub main_scope: String,
    pub standard: DesignStandard,
    pub groups: Vec<DucGroup>,
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub cursor_button: Option<String>,
    pub scrolled_outside: bool,
    pub name: Option<String>,
    pub zoom: Zoom,
    pub last_pointer_down_with: Option<String>,
    pub selected_element_ids: HashMap<String, bool>,
    pub previous_selected_element_ids: Option<Vec<String>>,
    pub selected_elements_are_being_dragged: Option<bool>,
    pub should_cache_ignore_zoom: Option<bool>,
    pub grid_size: i32,
    pub grid_mode_enabled: bool,
    pub grid_step: i32,
    pub selected_group_ids: Option<Vec<String>>,
    pub editing_group_id: Option<String>,
    pub paste_dialog_shown: Option<bool>,
    pub paste_dialog_data: Option<String>,
    pub scale_ratio_locked: bool,
    pub display_all_point_distances: bool,
    pub display_distance_on_drawing: bool,
    pub display_all_point_coordinates: bool,
    pub display_all_point_info_selected: bool,
    pub display_root_axis: bool,
    pub coord_decimal_places: i8,
    pub scope_exponent_threshold: i8,
    pub line_bending_mode: bool,
    pub editing_linear_element: Option<LinearElementEditor>,
    pub anti_aliasing: AntiAliasing,
    pub v_sync: bool,
    pub debug_rendering: bool,
    pub zoom_step: f32,
}

// =============== BINARY FILES ===============

#[derive(Debug, Clone, PartialEq)]
pub struct BinaryFileData {
    pub id: String,
    pub mime_type: String,
    pub created: i64,  // epoch ms
    pub encoding: Option<String>,
    pub last_retrieved: Option<i64>,  // epoch ms
    pub pending: bool,
    pub status: String,  // "pending" | "saved" | "error"
    pub object_url: Option<String>,
    pub has_synced_to_server: bool,
    pub saved_to_file_system: bool,
    pub binary_data: Option<Vec<u8>>, // Actual binary content
}

// =============== DUC ===============

/// A struct representing the parsed contents of a Duc file
#[derive(Debug, Clone)]
pub struct DucFile {
    pub elements: Vec<DucElementVariant>,
    pub app_state: Option<AppState>,
    pub binary_files: HashMap<String, BinaryFileData>, // Changed from Vec<BinaryFiles> to match TypeScript
}
