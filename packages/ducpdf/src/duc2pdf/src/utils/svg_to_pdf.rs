use crate::{ConversionResult, ConversionError};
use duc::types::DucExternalFileEntry;
use hipdf::lopdf::{Document, Object, Dictionary, Stream};
use svg2pdf::usvg;

/// SVG to PDF conversion utilities
pub struct SvgToPdfConverter;

impl SvgToPdfConverter {
    /// Convert SVG data to PDF XObject
    pub fn convert_svg_to_xobject(
        document: &mut Document,
        svg_data: &[u8],
        _file_entry: &DucExternalFileEntry,
    ) -> ConversionResult<u32> {
        // Parse SVG using usvg
        let svg_tree = usvg::Tree::from_data(svg_data, &usvg::Options::default())
            .map_err(|e| ConversionError::ResourceLoadError(format!("Failed to parse SVG: {}", e)))?;
        
        // Convert SVG to PDF operations with proper parameters  
        let pdf_content = svg2pdf::to_pdf(&svg_tree, svg2pdf::ConversionOptions::default(), svg2pdf::PageOptions::default())
            .map_err(|e| ConversionError::ResourceLoadError(format!("SVG to PDF conversion failed: {}", e)))?;
        
        // Create XObject from PDF content
        let mut xobject_dict = Dictionary::new();
        xobject_dict.set("Type", Object::Name("XObject".as_bytes().to_vec()));
        xobject_dict.set("Subtype", Object::Name("Form".as_bytes().to_vec()));
        
        // Set bounding box based on SVG size
        let svg_size = svg_tree.size();
        xobject_dict.set("BBox", Object::Array(vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(svg_size.width() as f32),
            Object::Real(svg_size.height() as f32),
        ]));
        
        // Create stream with PDF content
        let stream = Stream::new(xobject_dict, pdf_content);
        let (xobject_id, _) = document.add_object(Object::Stream(stream));
        
        Ok(xobject_id)
    }
    
    /// Convert SVG file entry to PDF XObject
    pub fn convert_file_entry_to_xobject(
        document: &mut Document,
        file_entry: &DucExternalFileEntry,
    ) -> ConversionResult<u32> {
        let svg_data = &file_entry.value.data;
        Self::convert_svg_to_xobject(document, svg_data, file_entry)
    }
    
    /// Validate SVG data
    pub fn validate_svg_data(svg_data: &[u8]) -> ConversionResult<()> {
        usvg::Tree::from_data(svg_data, &usvg::Options::default())
            .map_err(|e| ConversionError::ResourceLoadError(format!("Invalid SVG data: {}", e)))?;
        Ok(())
    }
}
