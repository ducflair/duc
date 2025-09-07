
use duc::types::{
    Standard, DucElementStylesBase, ElementBackground, ElementStroke, DucElementEnum
};
use duc::generated::duc::{
    ELEMENT_CONTENT_PREFERENCE, STROKE_PREFERENCE, STROKE_CAP, STROKE_JOIN
};
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
    pub fn resolve_styles(&self, element: &DucElementEnum, plot_standard_override: Option<&String>) -> ResolvedStyles {
        let base = crate::builder::DucToPdfBuilder::get_element_base(element);
        let mut resolved = if let Some(styles) = &base.styles {
            let mut r = ResolvedStyles::from_base_styles(styles);
            r.apply_base_styles(styles);
            r
        } else {
            ResolvedStyles {
                background: Vec::new(),
                stroke: Vec::new(),
                opacity: 1.0,
                roundness: 0.0,
            }
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
            resolved.background.push(ResolvedBackground::from_element_background(bg));
        }
        
        // Convert strokes
        for stroke in &styles.stroke {
            resolved.stroke.push(ResolvedStroke::from_element_stroke(stroke));
        }
        
        resolved
    }
    
    /// Apply base styles (merging/overriding existing)
    pub fn apply_base_styles(&mut self, styles: &DucElementStylesBase) {
        // Override opacity and roundness
        self.opacity = styles.opacity;
        self.roundness = styles.roundness;
        
        // Merge backgrounds (later ones override earlier ones)
        for bg in &styles.background {
            self.background.push(ResolvedBackground::from_element_background(bg));
        }
        
        // Merge strokes
        for stroke in &styles.stroke {
            self.stroke.push(ResolvedStroke::from_element_stroke(stroke));
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
            self.background.push(ResolvedBackground::from_element_background(bg));
        }
        
        // Merge strokes
        for stroke in &styles.stroke {
            self.stroke.push(ResolvedStroke::from_element_stroke(stroke));
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
                result = result.replace(&format!("{{{}}}", dynamic_part.tag), &dynamic_part.cached_value);
            }
        }
        
        result
    }
}

impl ResolvedBackground {
    fn from_element_background(bg: &ElementBackground) -> Self {
        Self {
            preference: bg.content.preference.unwrap_or(ELEMENT_CONTENT_PREFERENCE::SOLID),
            color: bg.content.src.clone(),
            opacity: bg.content.opacity,
            visible: bg.content.visible,
        }
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
}