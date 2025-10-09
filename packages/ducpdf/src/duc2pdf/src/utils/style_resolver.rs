use crate::ConversionResult;
use duc::generated::duc::{
    ELEMENT_CONTENT_PREFERENCE, HATCH_STYLE, STROKE_CAP, STROKE_JOIN, STROKE_PREFERENCE,
};
use duc::types::{
    DucElementEnum, DucElementStylesBase, DucHatchStyle, ElementBackground, ElementStroke, Standard,
};
use hipdf::hatching::{HatchStyle, HatchingManager};
use hipdf::lopdf::{content::Operation, Object};
use std::collections::HashMap;

/// Style resolution context for resolving element styles
pub struct StyleResolver {
    active_standard: Option<Standard>,
    standard_overrides: HashMap<String, Standard>,
    parent_overrides: HashMap<String, DucElementStylesBase>,
}

impl StyleResolver {
    /// Create a new style resolver with active standard
    pub fn new(active_standard: Option<Standard>) -> Self {
        Self {
            active_standard,
            standard_overrides: HashMap::new(),
            parent_overrides: HashMap::new(),
        }
    }

    /// Add a standard override
    pub fn add_standard_override(&mut self, id: String, standard: Standard) {
        self.standard_overrides.insert(id, standard);
    }

    /// Add parent override (from frames, viewports, plots)
    pub fn add_parent_override(&mut self, element_id: String, styles: DucElementStylesBase) {
        self.parent_overrides.insert(element_id, styles);
    }

    /// Resolve final styles for an element
    /// Order of precedence (highest to lowest):
    /// 1. Plot Element's Standard override
    /// 2. Standard override
    /// 3. Element parent overrides (from frames, viewports, plots)
    /// 4. Element styles
    pub fn resolve_styles(
        &self,
        element: &DucElementEnum,
        plot_standard_override: Option<&String>,
    ) -> ResolvedStyles {
        let base = crate::builder::DucToPdfBuilder::get_element_base(element);
        let mut resolved = {
            let mut r = ResolvedStyles::from_base_styles(&base.styles);
            r.apply_base_styles(&base.styles);
            r
        };

        // Apply parent overrides if any
        if let Some(parent_styles) = self.parent_overrides.get(&base.id) {
            resolved.apply_base_styles(parent_styles);
        }

        // Apply standard override if specified
        if let Some(standard) = &self.active_standard {
            resolved.apply_standard_styles(standard);
        }

        // Apply plot element's standard override (highest precedence)
        if let Some(override_id) = plot_standard_override {
            if let Some(standard) = self.standard_overrides.get(override_id) {
                resolved.apply_standard_styles(standard);
            }
        }

        resolved
    }

    /// Resolve dynamic fields in text elements
    pub fn resolve_dynamic_fields(&self, text: &str, _element: &DucElementEnum) -> String {
        // This would implement dynamic field resolution
        // For now, return the text as-is
        text.to_string()
    }
}

/// Resolved styles for rendering
#[derive(Debug, Clone)]
pub struct ResolvedStyles {
    pub background: Vec<ResolvedBackground>,
    pub stroke: Vec<ResolvedStroke>,
    pub opacity: f64,
    pub roundness: f64,
}

#[derive(Debug, Clone)]
pub struct ResolvedBackground {
    pub preference: ELEMENT_CONTENT_PREFERENCE,
    pub color: String,
    pub opacity: f64,
    pub visible: bool,
    pub hatch: Option<DucHatchStyle>,
}

#[derive(Debug, Clone)]
pub struct ResolvedStroke {
    pub preference: STROKE_PREFERENCE,
    pub color: String,
    pub width: f64,
    pub opacity: f64,
    pub cap: STROKE_CAP,
    pub join: STROKE_JOIN,
    pub dash_pattern: Option<Vec<f64>>,
    pub visible: bool,
}

impl ResolvedStyles {
    /// Create from base element styles
    pub fn from_base_styles(styles: &DucElementStylesBase) -> Self {
        let mut resolved = Self {
            background: Vec::new(),
            stroke: Vec::new(),
            opacity: styles.opacity,
            roundness: styles.roundness,
        };

        // Convert backgrounds
        for bg in &styles.background {
            resolved
                .background
                .push(ResolvedBackground::from_element_background(bg));
        }

        // Convert strokes
        for stroke in &styles.stroke {
            resolved
                .stroke
                .push(ResolvedStroke::from_element_stroke(stroke));
        }

        resolved
    }

    /// Get combined fill opacity (element opacity × first visible background opacity)
    pub fn get_combined_fill_opacity(&self) -> f64 {
        let element_opacity = self.opacity.clamp(0.0, 1.0);

        if let Some(bg) = self.background.iter().find(|b| b.visible) {
            (element_opacity * bg.effective_opacity()).clamp(0.0, 1.0)
        } else {
            element_opacity
        }
    }

    /// Get combined stroke opacity (element opacity × first visible stroke opacity)
    pub fn get_combined_stroke_opacity(&self) -> f64 {
        let element_opacity = self.opacity.clamp(0.0, 1.0);

        if let Some(stroke) = self.stroke.iter().find(|s| s.visible) {
            (element_opacity * stroke.effective_opacity()).clamp(0.0, 1.0)
        } else {
            element_opacity
        }
    }

    /// Apply base styles (merging/overriding existing)
    pub fn apply_base_styles(&mut self, styles: &DucElementStylesBase) {
        // Override opacity and roundness
        self.opacity = styles.opacity;
        self.roundness = styles.roundness;

        // Merge backgrounds (later ones override earlier ones)
        for bg in &styles.background {
            self.background
                .push(ResolvedBackground::from_element_background(bg));
        }

        // Merge strokes
        for stroke in &styles.stroke {
            self.stroke
                .push(ResolvedStroke::from_element_stroke(stroke));
        }
    }

    /// Apply standard styles (simplified implementation)
    pub fn apply_standard_styles(&mut self, standard: &Standard) {
        // Apply styles from standard if available
        if let Some(_standard_styles) = &standard.styles {
            // This would implement comprehensive standard style application
            // For now, this is a placeholder for future enhancement
            // TODO: Implement proper style inheritance based on:
            // - common_styles: Basic element styles
            // - text_styles: Text-specific formatting
            // - table_styles: Table layout and cell styles
            // - dimension_styles: Measurement annotation styles
            // - leader_styles: Leader line and callout styles
            // - feature_control_frame_styles: GD&T frame styles
            // - viewport_styles: Viewport display styles
            // - hatch_styles: Pattern fill styles
            // - xray_styles: Transparency and overlay styles
        }
    }

    /// Apply element styles base (helper method)
    fn apply_element_styles_base(&mut self, styles: &DucElementStylesBase) {
        // Apply opacity and roundness
        self.opacity = styles.opacity;
        self.roundness = styles.roundness;

        // Merge backgrounds (later ones override earlier ones)
        for bg in &styles.background {
            self.background
                .push(ResolvedBackground::from_element_background(bg));
        }

        // Merge strokes
        for stroke in &styles.stroke {
            self.stroke
                .push(ResolvedStroke::from_element_stroke(stroke));
        }
    }

    /// Resolve dynamic fields in text elements with comprehensive field support
    pub fn resolve_dynamic_fields(&self, text: &str, element: &DucElementEnum) -> String {
        let mut result = text.to_string();

        // Get element base for context
        let base = crate::builder::DucToPdfBuilder::get_element_base(element);

        // Replace common dynamic fields
        result = result.replace("{width}", &base.width.to_string());
        result = result.replace("{height}", &base.height.to_string());
        result = result.replace("{x}", &base.x.to_string());
        result = result.replace("{y}", &base.y.to_string());
        result = result.replace("{angle}", &base.angle.to_string());
        result = result.replace("{id}", &base.id);

        // Replace date/time fields
        let now = chrono::Utc::now();
        result = result.replace("{date}", &now.format("%Y-%m-%d").to_string());
        result = result.replace("{time}", &now.format("%H:%M:%S").to_string());
        result = result.replace("{datetime}", &now.format("%Y-%m-%d %H:%M:%S").to_string());

        // Handle text element specific dynamic parts
        if let DucElementEnum::DucTextElement(text_elem) = element {
            for dynamic_part in &text_elem.dynamic {
                // Use cached value for now
                result = result.replace(
                    &format!("{{{}}}", dynamic_part.tag),
                    &dynamic_part.cached_value,
                );
            }
        }

        result
    }
}

impl ResolvedBackground {
    fn from_element_background(bg: &ElementBackground) -> Self {
        Self {
            preference: bg
                .content
                .preference
                .unwrap_or(ELEMENT_CONTENT_PREFERENCE::SOLID),
            color: bg.content.src.clone(),
            opacity: bg.content.opacity,
            visible: bg.content.visible,
            hatch: bg.content.hatch.clone(),
        }
    }

    /// Get effective opacity (background opacity, not yet combined with element opacity)
    pub fn effective_opacity(&self) -> f64 {
        self.opacity.clamp(0.0, 1.0)
    }
}

impl StyleResolver {
    /// Resolve a single background element
    pub fn resolve_background(&self, bg: &ElementBackground) -> Option<ResolvedBackground> {
        Some(ResolvedBackground::from_element_background(bg))
    }
}

impl ResolvedStroke {
    fn from_element_stroke(stroke: &ElementStroke) -> Self {
        Self {
            preference: stroke.style.preference.unwrap_or(STROKE_PREFERENCE::SOLID),
            color: stroke.content.src.clone(),
            width: stroke.width,
            opacity: stroke.content.opacity,
            cap: stroke.style.cap.unwrap_or(STROKE_CAP::BUTT),
            join: stroke.style.join.unwrap_or(STROKE_JOIN::MITER),
            dash_pattern: stroke.style.dash.clone(),
            visible: stroke.content.visible,
        }
    }

    /// Get effective opacity (stroke opacity, not yet combined with element opacity)
    pub fn effective_opacity(&self) -> f64 {
        self.opacity.clamp(0.0, 1.0)
    }
}

// Hatching pattern management
impl StyleResolver {
    /// Apply hatching pattern to element with dimensions
    pub fn apply_hatching_pattern_with_dims(
        &self,
        backgrounds: &[ElementBackground],
        hatching_manager: &mut HatchingManager,
        ops: &mut Vec<Operation>,
        width: f64,
        height: f64,
    ) -> ConversionResult<()> {
        for background in backgrounds {
            if let Some(resolved_bg) = self.resolve_background(background) {
                if let Some(hatch_style) = resolved_bg.hatch {
                    // Use hipdf::hatching::CustomPattern for custom hatching
                    let _pattern_id = self.create_custom_hatching_pattern(
                        &hatch_style,
                        hatching_manager,
                        width,
                        height,
                    )?;

                    // Apply the hatching pattern
                    ops.push(Operation::new("% Custom hatching pattern applied", vec![]));
                    ops.push(Operation::new("% Hatching pattern info", vec![]));
                    ops.push(Operation::new(
                        &format!(
                            "% Pattern: {}, Scale: {}, Angle: {}",
                            hatch_style.pattern_name,
                            hatch_style.pattern_scale,
                            hatch_style.pattern_angle
                        ),
                        vec![],
                    ));

                    // Create rectangle for the hatched area
                    ops.push(Operation::new(
                        "re",
                        vec![
                            Object::Real(0.0),
                            Object::Real(-(height as f32)),
                            Object::Real(width as f32),
                            Object::Real(height as f32),
                        ],
                    ));
                    ops.push(Operation::new("f", vec![])); // Fill with hatching pattern
                }
            }
        }
        Ok(())
    }

    /// Create custom hatching pattern using hipdf::hatching::CustomPattern
    fn create_custom_hatching_pattern(
        &self,
        hatch_style: &DucHatchStyle,
        _hatching_manager: &mut HatchingManager,
        width: f64,
        height: f64,
    ) -> ConversionResult<String> {
        if let Some(_custom_pattern) = &hatch_style.custom_pattern {
            // TODO: Implement custom pattern creation using hipdf::hatching::CustomPattern
            // For now, fall back to predefined pattern
            return self.create_predefined_hatch_pattern(hatch_style, width, height);
        }

        // Use predefined hatch style
        self.create_predefined_hatch_pattern(hatch_style, width, height)
    }

    /// Create predefined hatch pattern
    fn create_predefined_hatch_pattern(
        &self,
        hatch_style: &DucHatchStyle,
        width: f64,
        height: f64,
    ) -> ConversionResult<String> {
        use hipdf::hatching::HatchStyle as HipdfHatchStyle;

        let _scaled_width = width * hatch_style.pattern_scale as f64;
        let _scaled_height = height * hatch_style.pattern_scale as f64;

        // Convert DucHatchStyle to hipdf HatchStyle
        let hipdf_style = match hatch_style.hatch_style {
            HATCH_STYLE::NORMAL => HipdfHatchStyle::DiagonalRight,
            HATCH_STYLE::OUTER => HipdfHatchStyle::Cross,
            HATCH_STYLE::IGNORE => {
                // No hatching pattern for ignore
                return Ok("no_hatch".to_string());
            }
            _ => HipdfHatchStyle::DiagonalRight, // Default fallback
        };

        let pattern_id = format!(
            "{:?}_{}_{}",
            hipdf_style, hatch_style.pattern_scale, hatch_style.pattern_angle
        );

        // TODO: Use hipdf hatching manager to create the actual pattern
        // For now, return the pattern ID
        Ok(pattern_id)
    }

    /// Convert DucHatchStyle to hipdf HatchStyle
    pub fn convert_duc_hatch_to_hipdf(
        &self,
        duc_hatch: &DucHatchStyle,
    ) -> ConversionResult<HatchStyle> {
        match duc_hatch.hatch_style {
            HATCH_STYLE::NORMAL => Ok(HatchStyle::DiagonalRight), // Use diagonal as default for normal
            HATCH_STYLE::OUTER => Ok(HatchStyle::DiagonalLeft),   // Use different pattern for outer
            HATCH_STYLE::IGNORE => {
                // Check if there's a custom pattern
                if duc_hatch.custom_pattern.is_some() {
                    Ok(HatchStyle::Cross)
                } else {
                    Ok(HatchStyle::DiagonalRight) // Default fallback
                }
            }
            _ => Ok(HatchStyle::DiagonalRight), // Default fallback for any other values
        }
    }

    /// Check if backgrounds contain hatching patterns
    pub fn has_hatching(&self, backgrounds: &[ElementBackground]) -> bool {
        backgrounds.iter().any(|bg| {
            if let Some(resolved_bg) = self.resolve_background(bg) {
                resolved_bg.hatch.is_some()
            } else {
                false
            }
        })
    }
}
