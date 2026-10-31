use clap::{Parser, ValueEnum};
use ducdxf::{
    convert_file_to_duc, ColorMode, ConversionMode, ConversionOptions,
};
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(
    name = "ducdxf",
    author,
    version,
    about = "High-performance CAD (DXF, DWG, DWF) to DUC converter in Rust",
    long_about = None
)]
struct Cli {
    /// Input CAD file (.dxf, .dwg, .dwf)
    #[arg(value_name = "INPUT")]
    input: PathBuf,

    /// Output DUC file (defaults to input with .duc extension)
    #[arg(short, long, value_name = "OUTPUT")]
    output: Option<PathBuf>,

    /// Color mode
    #[arg(long, value_enum, default_value_t = CliColorMode::Normal)]
    color: CliColorMode,

    /// Explicit scale (e.g. 1.0 or 0.02)
    #[arg(long)]
    scale: Option<f64>,

    /// Vertical spacing between stacked plot elements (default: 100.0)
    #[arg(long, default_value_t = 100.0)]
    spacing: f64,

    /// Margin inside plot elements (default: 20.0)
    #[arg(long, default_value_t = 20.0)]
    margin: f64,

    /// Background color in hex (e.g. #ffffff)
    #[arg(long, default_value = "#ffffff")]
    background: String,

    /// Target specific layout by name (e.g. "Model" or "Layout1")
    #[arg(long)]
    layout: Option<String>,

    /// Enable CAD entity and layer lineweights (by default lines are rendered as uniform thin hairlines)
    #[arg(long, default_value_t = false)]
    use_lineweights: bool,

    /// Line width scale factor
    #[arg(long, default_value_t = 1.0)]
    line_width_scale: f64,

    /// Minimum / uniform line width (default: 0.2)
    #[arg(long, default_value_t = 0.2)]
    min_line_width: f64,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ValueEnum, Debug)]
enum CliColorMode {
    Normal,
    Monochrome,
    Grayscale,
    Invert,
}

impl From<CliColorMode> for ColorMode {
    fn from(c: CliColorMode) -> Self {
        match c {
            CliColorMode::Normal => ColorMode::Normal,
            CliColorMode::Monochrome => ColorMode::Monochrome,
            CliColorMode::Grayscale => ColorMode::Grayscale,
            CliColorMode::Invert => ColorMode::Invert,
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    let output_path = cli.output.unwrap_or_else(|| {
        let mut p = cli.input.clone();
        p.set_extension("duc");
        p
    });

    let options = ConversionOptions {
        color_mode: cli.color.into(),
        scale: cli.scale,
        vertical_spacing: cli.spacing,
        margin: cli.margin,
        background_color: Some(cli.background),
        mode: ConversionMode::Plot,
        layout: cli.layout,
        use_lineweights: cli.use_lineweights,
        line_width_scale: cli.line_width_scale,
        min_line_width: cli.min_line_width,
        ..Default::default()
    };

    println!(
        "Converting {} -> {}...",
        cli.input.display(),
        output_path.display()
    );
    let duc_bytes = convert_file_to_duc(&cli.input, &options)?;
    std::fs::write(&output_path, &duc_bytes)?;
    println!(
        "Successfully generated DUC file ({} bytes)",
        duc_bytes.len()
    );

    Ok(())
}
