use duc::types::STROKE_PREFERENCE;

/// Standard CAD LineType to DUC Stroke Preference & Dash pattern mapping.
#[derive(Debug, Clone, PartialEq)]
pub struct LineDashPattern {
    pub preference: STROKE_PREFERENCE,
    pub dash_array: Vec<f64>,
}

impl LineDashPattern {
    pub fn solid() -> Self {
        Self {
            preference: STROKE_PREFERENCE::SOLID,
            dash_array: Vec::new(),
        }
    }

    pub fn is_solid(&self) -> bool {
        self.dash_array.is_empty()
    }

    /// Converts line type name (e.g. "DASHED", "CENTER", "HIDDEN", "CONTINUOUS")
    /// to DUC dash pattern.
    pub fn from_name(name: &str, scale: f64) -> Self {
        let upper = name.to_uppercase();
        let s = scale.max(0.1);

        if upper.contains("CONTINUOUS") || upper.is_empty() || upper == "BYLAYER" || upper == "BYBLOCK" {
            Self::solid()
        } else if upper.contains("DASHDOT") {
            Self {
                preference: STROKE_PREFERENCE::DASHED,
                dash_array: vec![10.0 * s, 3.0 * s, 2.0 * s, 3.0 * s],
            }
        } else if upper.contains("DASHED") {
            Self {
                preference: STROKE_PREFERENCE::DASHED,
                dash_array: vec![8.0 * s, 4.0 * s],
            }
        } else if upper.contains("DOT") {
            Self {
                preference: STROKE_PREFERENCE::DOTTED,
                dash_array: vec![2.0 * s, 3.0 * s],
            }
        } else if upper.contains("HIDDEN") {
            Self {
                preference: STROKE_PREFERENCE::DASHED,
                dash_array: vec![4.0 * s, 2.0 * s],
            }
        } else if upper.contains("CENTER") {
            Self {
                preference: STROKE_PREFERENCE::DASHED,
                dash_array: vec![12.0 * s, 3.0 * s, 3.0 * s, 3.0 * s],
            }
        } else if upper.contains("PHANTOM") {
            Self {
                preference: STROKE_PREFERENCE::DASHED,
                dash_array: vec![12.0 * s, 3.0 * s, 3.0 * s, 3.0 * s, 3.0 * s, 3.0 * s],
            }
        } else {
            Self::solid()
        }
    }
}
