use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum ColorMode {
    #[default]
    Normal,
    Monochrome,
    Grayscale,
    Invert,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub enum ConversionMode {
    #[default]
    Plot,
    Crop {
        offset_x: f64,
        offset_y: f64,
        width: Option<f64>,
        height: Option<f64>,
    },
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Metadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub creator: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub mode: ConversionMode,
    pub color_mode: ColorMode,
    pub margin: f64,
    pub vertical_spacing: f64,
    pub scale: Option<f64>,
    pub use_lineweights: bool,
    pub line_width_scale: f64,
    pub min_line_width: f64,
    pub background_color: Option<String>,
    pub default_draw_color: Option<String>,
    pub export_layers: bool,
    pub layout: Option<String>,
    pub metadata: Metadata,
}

impl Default for ConversionOptions {
    fn default() -> Self {
        Self {
            mode: ConversionMode::Plot,
            color_mode: ColorMode::Normal,
            margin: 20.0,
            vertical_spacing: 100.0,
            scale: None,
            use_lineweights: false,
            line_width_scale: 1.0,
            min_line_width: 0.2,
            background_color: Some("#ffffff".to_string()),
            default_draw_color: Some("#000000".to_string()),
            export_layers: true,
            layout: None,
            metadata: Metadata {
                creator: Some("ducdxf (powered by duc & acadrust)".to_string()),
                ..Default::default()
            },
        }
    }
}
