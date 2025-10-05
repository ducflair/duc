use std::collections::HashMap;
use std::fmt;

// Assuming you have a UNIT_SYSTEM type from your flatbuffers
// You'll need to adjust this based on your actual flatbuffers implementation
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum UnitSystem {
    Metric,
    Imperial,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ZoomDirection {
    Up,
    Down,
    Neutral,
}

// Constants
pub const MIN_ZOOM: f64 = 1e-32;
pub const MAX_ZOOM: f64 = 1e32;
pub const NEUTRAL_SCOPE: SupportedMeasures = SupportedMeasures::Metric(MetricMeasure::M);

// Metric measures enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum MetricMeasure {
    Qm,  // Quectometer
    Rm,  // Rontometer
    Ym,  // Yoctometer
    Zm,  // Zeptometer
    Am,  // Attometer
    Fm,  // Femtometer
    Pm,  // Picometer
    A,   // Angstrom
    Nm,  // Nanometer
    Um,  // Micrometer (using Um instead of µm for simplicity)
    Mm,  // Millimeter
    Cm,  // Centimeter
    Dm,  // Decimeter
    M,   // Meter
    Dam, // Decameter
    Hm,  // Hectometer
    Km,  // Kilometer
    MMm, // Megameter (using MMm to avoid confusion with Millimeter)
    Gm,  // Gigameter
    Tm,  // Terameter
    PPm, // Petameter (using PPm to avoid confusion with Picometer)
    Em,  // Exameter
    ZZm, // Zettameter (using ZZm to avoid confusion with Zeptometer)
    YYm, // Yottameter (using YYm to avoid confusion with Yoctometer)
    RRm, // Ronnameter (using RRm to avoid confusion with Rontometer)
    QQm, // Quettameter (using QQm to avoid confusion with Quectometer)
}

// Imperial measures enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ImperialMeasure {
    Uin,  // Microinches
    Th,   // Thou
    Mil,  // Mils
    Ln,   // Line
    InUs, // US Survey Inch
    In,   // Inches
    H,    // Hand
    FtUs, // US Survey Feet
    Ft,   // Feet
    YdUs, // US Survey Yard
    Yd,   // Yards
    Rd,   // Rods
    Ch,   // Chains
    Fur,  // Furlongs
    MiUs, // US Survey Mile
    Mi,   // Miles
    Lea,  // Leagues
    Au,   // Astronomical Unit
    Ly,   // Light Year
    Pc,   // Parsec
}

// Combined measure enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SupportedMeasures {
    Metric(MetricMeasure),
    Imperial(ImperialMeasure),
}

impl fmt::Display for MetricMeasure {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MetricMeasure::Qm => write!(f, "qm"),
            MetricMeasure::Rm => write!(f, "rm"),
            MetricMeasure::Ym => write!(f, "ym"),
            MetricMeasure::Zm => write!(f, "zm"),
            MetricMeasure::Am => write!(f, "am"),
            MetricMeasure::Fm => write!(f, "fm"),
            MetricMeasure::Pm => write!(f, "pm"),
            MetricMeasure::A => write!(f, "Å"),
            MetricMeasure::Nm => write!(f, "nm"),
            MetricMeasure::Um => write!(f, "µm"),
            MetricMeasure::Mm => write!(f, "mm"),
            MetricMeasure::Cm => write!(f, "cm"),
            MetricMeasure::Dm => write!(f, "dm"),
            MetricMeasure::M => write!(f, "m"),
            MetricMeasure::Dam => write!(f, "dam"),
            MetricMeasure::Hm => write!(f, "hm"),
            MetricMeasure::Km => write!(f, "km"),
            MetricMeasure::MMm => write!(f, "Mm"),
            MetricMeasure::Gm => write!(f, "Gm"),
            MetricMeasure::Tm => write!(f, "Tm"),
            MetricMeasure::PPm => write!(f, "Pm"),
            MetricMeasure::Em => write!(f, "Em"),
            MetricMeasure::ZZm => write!(f, "Zm"),
            MetricMeasure::YYm => write!(f, "Ym"),
            MetricMeasure::RRm => write!(f, "Rm"),
            MetricMeasure::QQm => write!(f, "Qm"),
        }
    }
}

impl fmt::Display for ImperialMeasure {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ImperialMeasure::Uin => write!(f, "µin"),
            ImperialMeasure::Th => write!(f, "th"),
            ImperialMeasure::Mil => write!(f, "mil"),
            ImperialMeasure::Ln => write!(f, "ln"),
            ImperialMeasure::InUs => write!(f, "in-us"),
            ImperialMeasure::In => write!(f, "in"),
            ImperialMeasure::H => write!(f, "h"),
            ImperialMeasure::FtUs => write!(f, "ft-us"),
            ImperialMeasure::Ft => write!(f, "ft"),
            ImperialMeasure::YdUs => write!(f, "yd-us"),
            ImperialMeasure::Yd => write!(f, "yd"),
            ImperialMeasure::Rd => write!(f, "rd"),
            ImperialMeasure::Ch => write!(f, "ch"),
            ImperialMeasure::Fur => write!(f, "fur"),
            ImperialMeasure::MiUs => write!(f, "mi-us"),
            ImperialMeasure::Mi => write!(f, "mi"),
            ImperialMeasure::Lea => write!(f, "lea"),
            ImperialMeasure::Au => write!(f, "au"),
            ImperialMeasure::Ly => write!(f, "ly"),
            ImperialMeasure::Pc => write!(f, "pc"),
        }
    }
}

impl fmt::Display for SupportedMeasures {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SupportedMeasures::Metric(m) => write!(f, "{}", m),
            SupportedMeasures::Imperial(i) => write!(f, "{}", i),
        }
    }
}

// Create scale factors HashMap
lazy_static::lazy_static! {
    pub static ref SCALE_FACTORS: HashMap<SupportedMeasures, f64> = {
        let mut m = HashMap::new();
        
        // Metric scales
        m.insert(SupportedMeasures::Metric(MetricMeasure::Qm), 1e-30);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Rm), 1e-27);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Ym), 1e-24);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Zm), 1e-21);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Am), 1e-18);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Fm), 1e-15);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Pm), 1e-12);
        m.insert(SupportedMeasures::Metric(MetricMeasure::A), 1e-10);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Nm), 1e-9);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Um), 1e-6);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Mm), 1e-3);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Cm), 1e-2);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Dm), 1e-1);
        m.insert(SupportedMeasures::Metric(MetricMeasure::M), 1.0);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Dam), 1e1);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Hm), 1e2);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Km), 1e3);
        m.insert(SupportedMeasures::Metric(MetricMeasure::MMm), 1e6);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Gm), 1e9);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Tm), 1e12);
        m.insert(SupportedMeasures::Metric(MetricMeasure::PPm), 1e15);
        m.insert(SupportedMeasures::Metric(MetricMeasure::Em), 1e18);
        m.insert(SupportedMeasures::Metric(MetricMeasure::ZZm), 1e21);
        m.insert(SupportedMeasures::Metric(MetricMeasure::YYm), 1e24);
        m.insert(SupportedMeasures::Metric(MetricMeasure::RRm), 1e27);
        m.insert(SupportedMeasures::Metric(MetricMeasure::QQm), 1e30);
        
        // Imperial scales
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Uin), 2.54e-8);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Th), 0.0000254);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Mil), 0.0000254);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Ln), 0.00211667);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::InUs), 0.0254000508);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::In), 0.0254);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::H), 0.1016);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::FtUs), 0.3048006096);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Ft), 0.3048);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::YdUs), 0.9144018288);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Yd), 0.9144);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Rd), 5.0292);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Ch), 20.1168);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Fur), 201.168);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::MiUs), 1609.34721869);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Mi), 1609.344);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Lea), 4828.032);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Au), 149597870700.0);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Ly), 9460730472580800.0);
        m.insert(SupportedMeasures::Imperial(ImperialMeasure::Pc), 30856775814913670.0);
        
        m
    };
}

/// Get translation factor between two measures (unit scopes).
/// Calculates the multiplicative factor needed to convert a value from `from_measure` to `to_measure`.
pub fn get_translation_factor(
    from_measure: SupportedMeasures,
    to_measure: SupportedMeasures,
) -> Result<f64, String> {
    let from_factor = SCALE_FACTORS
        .get(&from_measure)
        .ok_or_else(|| format!("Unknown measure: {}", from_measure))?;
    
    let to_factor = SCALE_FACTORS
        .get(&to_measure)
        .ok_or_else(|| format!("Unknown measure: {}", to_measure))?;
    
    // Handle potential division by zero
    if *to_factor == 0.0 {
        return Err(format!(
            "Attempted to divide by zero scale factor for unit: {}",
            to_measure
        ));
    }
    
    Ok(from_factor / to_factor)
}

/// Parse a unit string into a SupportedMeasures enum
pub fn parse_unit_string(unit: &str) -> Result<SupportedMeasures, String> {
    match unit {
        // Metric units
        "qm" => Ok(SupportedMeasures::Metric(MetricMeasure::Qm)),
        "rm" => Ok(SupportedMeasures::Metric(MetricMeasure::Rm)),
        "ym" => Ok(SupportedMeasures::Metric(MetricMeasure::Ym)),
        "zm" => Ok(SupportedMeasures::Metric(MetricMeasure::Zm)),
        "am" => Ok(SupportedMeasures::Metric(MetricMeasure::Am)),
        "fm" => Ok(SupportedMeasures::Metric(MetricMeasure::Fm)),
        "pm" => Ok(SupportedMeasures::Metric(MetricMeasure::Pm)),
        "Å" => Ok(SupportedMeasures::Metric(MetricMeasure::A)),
        "nm" => Ok(SupportedMeasures::Metric(MetricMeasure::Nm)),
        "µm" | "um" => Ok(SupportedMeasures::Metric(MetricMeasure::Um)),
        "mm" => Ok(SupportedMeasures::Metric(MetricMeasure::Mm)),
        "cm" => Ok(SupportedMeasures::Metric(MetricMeasure::Cm)),
        "dm" => Ok(SupportedMeasures::Metric(MetricMeasure::Dm)),
        "m" => Ok(SupportedMeasures::Metric(MetricMeasure::M)),
        "dam" => Ok(SupportedMeasures::Metric(MetricMeasure::Dam)),
        "hm" => Ok(SupportedMeasures::Metric(MetricMeasure::Hm)),
        "km" => Ok(SupportedMeasures::Metric(MetricMeasure::Km)),
        "Mm" => Ok(SupportedMeasures::Metric(MetricMeasure::MMm)),
        "Gm" => Ok(SupportedMeasures::Metric(MetricMeasure::Gm)),
        "Tm" => Ok(SupportedMeasures::Metric(MetricMeasure::Tm)),
        "Pm" => Ok(SupportedMeasures::Metric(MetricMeasure::PPm)),
        "Em" => Ok(SupportedMeasures::Metric(MetricMeasure::Em)),
        "Zm" => Ok(SupportedMeasures::Metric(MetricMeasure::ZZm)),
        "Ym" => Ok(SupportedMeasures::Metric(MetricMeasure::YYm)),
        "Rm" => Ok(SupportedMeasures::Metric(MetricMeasure::RRm)),
        "Qm" => Ok(SupportedMeasures::Metric(MetricMeasure::QQm)),
        
        // Imperial units
        "µin" | "uin" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Uin)),
        "th" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Th)),
        "mil" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Mil)),
        "ln" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Ln)),
        "in-us" => Ok(SupportedMeasures::Imperial(ImperialMeasure::InUs)),
        "in" => Ok(SupportedMeasures::Imperial(ImperialMeasure::In)),
        "h" => Ok(SupportedMeasures::Imperial(ImperialMeasure::H)),
        "ft-us" => Ok(SupportedMeasures::Imperial(ImperialMeasure::FtUs)),
        "ft" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Ft)),
        "yd-us" => Ok(SupportedMeasures::Imperial(ImperialMeasure::YdUs)),
        "yd" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Yd)),
        "rd" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Rd)),
        "ch" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Ch)),
        "fur" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Fur)),
        "mi-us" => Ok(SupportedMeasures::Imperial(ImperialMeasure::MiUs)),
        "mi" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Mi)),
        "lea" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Lea)),
        "au" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Au)),
        "ly" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Ly)),
        "pc" => Ok(SupportedMeasures::Imperial(ImperialMeasure::Pc)),
        
        _ => Err(format!("Unknown unit: {}", unit)),
    }
}

// Arrays for iteration if needed
pub const METRIC_MEASURES: [MetricMeasure; 26] = [
    MetricMeasure::Qm,
    MetricMeasure::Rm,
    MetricMeasure::Ym,
    MetricMeasure::Zm,
    MetricMeasure::Am,
    MetricMeasure::Fm,
    MetricMeasure::Pm,
    MetricMeasure::A,
    MetricMeasure::Nm,
    MetricMeasure::Um,
    MetricMeasure::Mm,
    MetricMeasure::Cm,
    MetricMeasure::Dm,
    MetricMeasure::M,
    MetricMeasure::Dam,
    MetricMeasure::Hm,
    MetricMeasure::Km,
    MetricMeasure::MMm,
    MetricMeasure::Gm,
    MetricMeasure::Tm,
    MetricMeasure::PPm,
    MetricMeasure::Em,
    MetricMeasure::ZZm,
    MetricMeasure::YYm,
    MetricMeasure::RRm,
    MetricMeasure::QQm,
];

pub const IMPERIAL_MEASURES: [ImperialMeasure; 20] = [
    ImperialMeasure::Uin,
    ImperialMeasure::Th,
    ImperialMeasure::Mil,
    ImperialMeasure::Ln,
    ImperialMeasure::InUs,
    ImperialMeasure::In,
    ImperialMeasure::H,
    ImperialMeasure::FtUs,
    ImperialMeasure::Ft,
    ImperialMeasure::YdUs,
    ImperialMeasure::Yd,
    ImperialMeasure::Rd,
    ImperialMeasure::Ch,
    ImperialMeasure::Fur,
    ImperialMeasure::MiUs,
    ImperialMeasure::Mi,
    ImperialMeasure::Lea,
    ImperialMeasure::Au,
    ImperialMeasure::Ly,
    ImperialMeasure::Pc,
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_translation_factor() {
        // Test meter to kilometer
        let result = get_translation_factor(
            SupportedMeasures::Metric(MetricMeasure::M),
            SupportedMeasures::Metric(MetricMeasure::Km),
        );
        assert!(result.is_ok());
        assert!((result.unwrap() - 0.001).abs() < f64::EPSILON);

        // Test inch to foot
        let result = get_translation_factor(
            SupportedMeasures::Imperial(ImperialMeasure::In),
            SupportedMeasures::Imperial(ImperialMeasure::Ft),
        );
        assert!(result.is_ok());
        assert!((result.unwrap() - (0.0254 / 0.3048)).abs() < 1e-10);
    }
}