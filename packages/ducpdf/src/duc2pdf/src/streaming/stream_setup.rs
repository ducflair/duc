use crate::{ConversionResult, validate_coordinates};
use duc::types::{ExportedDataState, Standard, DucGlobalState};
use hipdf::lopdf::{Document, Object, Dictionary};
use std::collections::HashMap;

/// PDF coordinate system setup context
pub struct CoordinateSystem {
    pub user_unit: f64,       // 1 unit = 1mm
    pub origin_x: f64,        // Origin offset X
    pub origin_y: f64,        // Origin offset Y
    pub scale_factor: f64,    // Additional scaling if needed
}

impl Default for CoordinateSystem {
    fn default() -> Self {
        Self {
            user_unit: 25.4 / 72.0,  // 1mm in PDF points
            origin_x: 0.0,
            origin_y: 0.0,
            scale_factor: 1.0,
        }
    }
}

/// Stream setup context for PDF generation
pub struct StreamSetupContext {
    pub coordinate_system: CoordinateSystem,
    pub active_standard: Option<Standard>,
    pub dictionary_values: HashMap<String, String>,
    pub unit_system: Option<String>,
}

impl StreamSetupContext {
    /// Create new stream setup context from DUC data
    pub fn new(exported_data: &ExportedDataState, active_standard: Option<Standard>) -> ConversionResult<Self> {
        let coordinate_system = CoordinateSystem::default();
        
        // Process dictionary from DUC file
        let mut dictionary_values = HashMap::new();
        if let Some(dictionary) = &exported_data.dictionary {
            for entry in dictionary {
                dictionary_values.insert(entry.key.clone(), entry.value.clone());
            }
        }
        
        // Extract unit system from global state
        let unit_system = Self::extract_unit_system(exported_data.duc_global_state.as_ref());
        
        Ok(Self {
            coordinate_system,
            active_standard,
            dictionary_values,
            unit_system,
        })
    }
    
    /// Extract unit system information from global state
    fn extract_unit_system(global_state: Option<&DucGlobalState>) -> Option<String> {
        if global_state.is_some() {
            // For now, we'll use a placeholder implementation
            // This would be expanded to properly extract unit system information
            // from the global state and standards
            Some("mm".to_string())
        } else {
            Some("mm".to_string()) // Default
        }
    }
    
    /// Validate coordinate bounds for the entire document
    pub fn validate_document_bounds(&self, exported_data: &ExportedDataState) -> ConversionResult<()> {
        for element_wrapper in &exported_data.elements {
            let base = crate::builder::DucToPdfBuilder::get_element_base(&element_wrapper.element);
            validate_coordinates(base.x, base.y)?;
            
            // Also validate the element bounds
            let max_x = base.x + base.width;
            let max_y = base.y + base.height;
            validate_coordinates(max_x, max_y)?;
        }
        Ok(())
    }
    
    /// Setup document metadata from DUC data
    pub fn setup_document_metadata(&self, doc: &mut Document, exported_data: &ExportedDataState) -> ConversionResult<()> {
        let mut info = Dictionary::new();
        
        // Set title from global state name if available
        if let Some(global_state) = &exported_data.duc_global_state {
            if let Some(name) = &global_state.name {
                if !name.is_empty() {
                    info.set("Title", Object::string_literal(name.as_str()));
                }
            }
        }
        
        // Set creator and producer
        info.set("Creator", Object::string_literal("DUC to PDF Converter"));
        info.set("Producer", Object::string_literal("ducpdf v1.0"));
        
        // Set version and source info
        let keywords = format!(
            "DUC version: {}, Source: {}, Type: {}",
            exported_data.version,
            exported_data.source,
            exported_data.data_type
        );
        info.set("Keywords", Object::string_literal(keywords.as_str()));
        
        // Set creation date (current time)
        let creation_date = chrono::Utc::now().format("D:%Y%m%d%H%M%S+00'00'").to_string();
        info.set("CreationDate", Object::string_literal(creation_date.as_str()));
        info.set("ModDate", Object::string_literal(creation_date.as_str()));
        
        // Add info dictionary to document
        let info_id = doc.add_object(Object::Dictionary(info));
        doc.trailer.set("Info", Object::Reference(info_id));
        
        Ok(())
    }
    
    /// Create transformation matrix for coordinate system
    pub fn create_transformation_matrix(&self, bounds: (f64, f64, f64, f64)) -> [f64; 6] {
        let (offset_x, offset_y, _width, _height) = bounds;
        
        // Create transformation matrix: [a b c d e f]
        // where the transformation is: [x'] = [a c e] [x]
        //                               [y']   [b d f] [y]
        //                               [1 ]           [1]
        
        // Scale by coordinate system scale factor
        let scale = self.coordinate_system.scale_factor;
        
        // Translation to handle coordinate system origin and bounds offset
        let tx = self.coordinate_system.origin_x - offset_x;
        let ty = self.coordinate_system.origin_y - offset_y;
        
        // Matrix: scale_x, skew_y, skew_x, scale_y, translate_x, translate_y
        [scale, 0.0, 0.0, scale, tx, ty]
    }
    
    /// Setup coordinate system for a page
    pub fn setup_page_coordinate_system(&self, page_dict: &mut Dictionary, _bounds: (f64, f64, f64, f64)) -> ConversionResult<()> {
        // Set UserUnit to make 1 unit = 1mm
        page_dict.set("UserUnit", Object::Real(self.coordinate_system.user_unit as f32));
        
        // Additional coordinate system setup could be added here
        // such as setting up a default CTM (Current Transformation Matrix)
        
        Ok(())
    }
}