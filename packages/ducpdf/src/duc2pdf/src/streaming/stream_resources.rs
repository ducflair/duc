use crate::{ConversionResult, ConversionError};
use crate::utils::svg_to_pdf::SvgToPdfConverter;
use duc::types::DucExternalFileEntry;
use hipdf::lopdf::{Document, Object, Dictionary, Stream, content::Operation};
use hipdf::embed_pdf::PdfEmbedder;
use hipdf::ocg::OCGManager;
use hipdf::blocks::BlockManager;
use hipdf::hatching::HatchingManager;
use std::collections::HashMap;

/// Error types for resource operations
#[derive(Debug)]
pub enum ResourceError {
    LoadError(String),
    ProcessError(String),
    UnsupportedFormat(String),
    EmbedError(String),
}

impl std::fmt::Display for ResourceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ResourceError::LoadError(msg) => write!(f, "Resource load error: {}", msg),
            ResourceError::ProcessError(msg) => write!(f, "Resource process error: {}", msg),
            ResourceError::UnsupportedFormat(msg) => write!(f, "Unsupported format: {}", msg),
            ResourceError::EmbedError(msg) => write!(f, "Resource embed error: {}", msg),
        }
    }
}

impl std::error::Error for ResourceError {}

/// Resource type enumeration
#[derive(Debug, Clone, PartialEq)]
pub enum ResourceType {
    Svg,
    Png,
    Jpeg,
    Pdf,
    Unsupported,
}

/// Resource information structure
#[derive(Debug, Clone)]
pub struct ResourceInfo {
    pub id: String,
    pub resource_type: ResourceType,
    pub object_id: Option<u32>,
    pub width: Option<f64>,
    pub height: Option<f64>,
}

/// Enhanced resource streaming implementation
pub struct ResourceStreamer {
    /// Cache for processed resources
    resource_cache: HashMap<String, ResourceInfo>,
    /// PDF document reference for embedding
    document: Option<Document>,
    /// SVG to PDF converter
    svg_converter: SvgToPdfConverter,
    /// PDF embedder
    pdf_embedder: Option<PdfEmbedder>,
    /// Block manager for reusable content
    block_manager: Option<BlockManager>,
    /// Hatching manager for patterns
    hatching_manager: Option<HatchingManager>,
    /// OCG manager for layers
    ocg_manager: Option<OCGManager>,
}

impl ResourceStreamer {
    /// Create new resource streamer
    pub fn new() -> Self {
        Self {
            resource_cache: HashMap::new(),
            document: None,
            svg_converter: SvgToPdfConverter,
            pdf_embedder: None,
            block_manager: None,
            hatching_manager: None,
            ocg_manager: None,
        }
    }
    
    /// Initialize with PDF document and managers
    pub fn initialize(
        &mut self,
        document: &mut Document,
        pdf_embedder: PdfEmbedder,
        block_manager: BlockManager,
        hatching_manager: HatchingManager,
        ocg_manager: OCGManager,
    ) {
        self.document = Some(document.clone());
        self.pdf_embedder = Some(pdf_embedder);
        self.block_manager = Some(block_manager);
        self.hatching_manager = Some(hatching_manager);
        self.ocg_manager = Some(ocg_manager);
    }
    
    /// Process and cache external files
    pub fn process_external_files(&mut self, external_files: &[DucExternalFileEntry]) -> ConversionResult<()> {
        for file_entry in external_files {
            let resource_info = self.process_single_file(file_entry)?;
            self.resource_cache.insert(file_entry.key.clone(), resource_info);
        }
        Ok(())
    }
    
    /// Process a single external file
    fn process_single_file(&mut self, file_entry: &DucExternalFileEntry) -> ConversionResult<ResourceInfo> {
        let resource_type = self.detect_resource_type(&file_entry.value.mime_type);
        
        match resource_type {
            ResourceType::Svg => self.process_svg_file(file_entry),
            ResourceType::Png | ResourceType::Jpeg => self.process_image_file(file_entry, &resource_type),
            ResourceType::Pdf => self.process_pdf_file(file_entry),
            ResourceType::Unsupported => Err(ConversionError::ResourceLoadError(
                format!("Unsupported resource type: {}", file_entry.value.mime_type)
            )),
        }
    }
    
    /// Detect resource type from MIME type
    fn detect_resource_type(&self, mime_type: &str) -> ResourceType {
        match mime_type.to_lowercase().as_str() {
            "image/svg+xml" => ResourceType::Svg,
            "image/png" => ResourceType::Png,
            "image/jpeg" | "image/jpg" => ResourceType::Jpeg,
            "application/pdf" => ResourceType::Pdf,
            _ => ResourceType::Unsupported,
        }
    }
    
    /// Process SVG file - convert to PDF and cache
    fn process_svg_file(&mut self, file_entry: &DucExternalFileEntry) -> ConversionResult<ResourceInfo> {
        let document = self.document.as_mut()
            .ok_or_else(|| ConversionError::ResourceLoadError("PDF document not initialized".to_string()))?;
        let xobject_id = SvgToPdfConverter::convert_file_entry_to_xobject(document, file_entry)?;
        
        // Get SVG dimensions from the converted XObject
        let (width, height) = self.get_svg_dimensions(file_entry);
        
        Ok(ResourceInfo {
            id: file_entry.key.clone(),
            resource_type: ResourceType::Svg,
            object_id: Some(xobject_id),
            width: Some(width),
            height: Some(height),
        })
    }
    
    /// Process image file (PNG/JPEG) - embed directly
    fn process_image_file(&mut self, file_entry: &DucExternalFileEntry, resource_type: &ResourceType) -> ConversionResult<ResourceInfo> {
        let image_data = &file_entry.value.data;
        let xobject_id = {
            let mut document = self.document.take()
                .ok_or_else(|| ConversionError::ResourceLoadError("PDF document not initialized".to_string()))?;
            let result = self.create_image_xobject(&mut document, image_data, resource_type)?;
            self.document = Some(document);
            result
        };
        
        // Use default dimensions for now
        let (width, height) = (100.0, 100.0);
        
        Ok(ResourceInfo {
            id: file_entry.key.clone(),
            resource_type: resource_type.clone(),
            object_id: Some(xobject_id),
            width: Some(width),
            height: Some(height),
        })
    }
    
    /// Process PDF file - embed using hipdf
    fn process_pdf_file(&mut self, file_entry: &DucExternalFileEntry) -> ConversionResult<ResourceInfo> {
        let pdf_embedder = self.pdf_embedder.as_mut()
            .ok_or_else(|| ConversionError::ResourceLoadError("PDF embedder not initialized".to_string()))?;
        
        let _document = self.document.as_mut()
            .ok_or_else(|| ConversionError::ResourceLoadError("PDF document not initialized".to_string()))?;
        
        // Load PDF data
        let pdf_data = &file_entry.value.data;
        let pdf_doc = Document::load_from(std::io::Cursor::new(pdf_data))
            .map_err(|e| ConversionError::ResourceLoadError(format!("Failed to load PDF: {}", e)))?;
        
        // Embed PDF using hipdf
        let embed_id = format!("pdf_{}", file_entry.key);
        pdf_embedder.load_pdf_from_bytes(pdf_data, &embed_id)
            .map_err(|e| ConversionError::ResourceLoadError(format!("Failed to embed PDF: {}", e)))?;
        
        // Get PDF dimensions from first page
        let (width, height) = self.get_pdf_dimensions(&pdf_doc)?;
        
        Ok(ResourceInfo {
            id: file_entry.key.clone(),
            resource_type: ResourceType::Pdf,
            object_id: None, // PDF embedder handles object IDs internally
            width: Some(width),
            height: Some(height),
        })
    }
    
    /// Get cached resource information
    pub fn get_resource_info(&self, resource_id: &str) -> Option<&ResourceInfo> {
        self.resource_cache.get(resource_id)
    }
    
    /// Get cached resource object ID
    pub fn get_resource_object_id(&self, resource_id: &str) -> Option<u32> {
        self.resource_cache.get(resource_id)
            .and_then(|info| info.object_id)
    }
    
    /// Create image XObject from raw data
    fn create_image_xobject(&mut self, document: &mut Document, image_data: &[u8], resource_type: &ResourceType) -> ConversionResult<u32> {
        // Create image dictionary
        let mut image_dict = Dictionary::new();
        image_dict.set("Type", Object::Name("XObject".as_bytes().to_vec()));
        image_dict.set("Subtype", Object::Name("Image".as_bytes().to_vec()));
        
        // Set image properties based on type
        match resource_type {
            ResourceType::Png => {
                image_dict.set("Filter", Object::Name("FlateDecode".as_bytes().to_vec()));
                image_dict.set("ColorSpace", Object::Name("DeviceRGB".as_bytes().to_vec()));
                image_dict.set("BitsPerComponent", Object::Integer(8));
            },
            ResourceType::Jpeg => {
                image_dict.set("Filter", Object::Name("DCTDecode".as_bytes().to_vec()));
                image_dict.set("ColorSpace", Object::Name("DeviceRGB".as_bytes().to_vec()));
                image_dict.set("BitsPerComponent", Object::Integer(8));
            },
            _ => return Err(ConversionError::ResourceLoadError("Unsupported image type".to_string())),
        }
        
        // Set image dimensions (these would be parsed from actual image data)
        image_dict.set("Width", Object::Integer(100)); // Placeholder
        image_dict.set("Height", Object::Integer(100)); // Placeholder
        
        // Create image stream
        let stream = Stream::new(image_dict, image_data.to_vec());
        let (object_id, _) = document.add_object(Object::Stream(stream));
        
        Ok(object_id)
    }
    
    /// Get SVG dimensions
    fn get_svg_dimensions(&self, _file_entry: &DucExternalFileEntry) -> (f64, f64) {
        // Parse SVG to get dimensions
        // For now, return default dimensions
        (100.0, 100.0)
    }
    
    /// Get image dimensions from raw data
    fn get_image_dimensions(&self, _image_data: &[u8], _resource_type: &ResourceType) -> ConversionResult<(f64, f64)> {
        // Parse image to get dimensions
        // For now, return default dimensions
        Ok((100.0, 100.0))
    }
    
    /// Get PDF dimensions from first page
    fn get_pdf_dimensions(&self, _pdf_doc: &Document) -> ConversionResult<(f64, f64)> {
        // Parse PDF to get page dimensions
        // For now, return default dimensions
        Ok((100.0, 100.0))
    }
    
    /// Stream SVG resource as PDF operations
    pub fn stream_svg_resource(&self, resource_id: &str, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<Vec<hipdf::lopdf::content::Operation>> {
        use hipdf::lopdf::content::Operation;
        
        // If resource is not found, return empty operations (graceful handling)
        let resource_info = match self.resource_cache.get(resource_id) {
            Some(info) => info,
            None => {
                // Resource not found - log comment and return empty operations
                let mut operations = Vec::new();
                operations.push(Operation::new(&format!("% SVG resource not found: {}", resource_id), vec![]));
                return Ok(operations);
            }
        };
        
        if resource_info.resource_type != ResourceType::Svg {
            // Wrong resource type - log comment and return empty operations
            let mut operations = Vec::new();
            operations.push(Operation::new(&format!("% Resource {} is not an SVG", resource_id), vec![]));
            return Ok(operations);
        }
        
        let object_id = match resource_info.object_id {
            Some(id) => id,
            None => {
                // No object ID - log comment and return empty operations
                let mut operations = Vec::new();
                operations.push(Operation::new(&format!("% SVG resource {} has no object ID", resource_id), vec![]));
                return Ok(operations);
            }
        };
        
        // Create PDF operations to place the SVG XObject
        let mut operations = Vec::new();
        
        // Save graphics state
        operations.push(Operation::new("q", vec![]));
        
        // Apply transformation matrix for positioning and scaling
        operations.push(Operation::new("cm", vec![
            Object::Real(width as f32), Object::Real(0.0), Object::Real(0.0),
            Object::Real(height as f32), Object::Real(x as f32), Object::Real(y as f32)
        ]));
        
        // Place the XObject
        operations.push(Operation::new("Do", vec![Object::Name(format!("XObject{}", object_id).into_bytes())]));
        
        // Restore graphics state
        operations.push(Operation::new("Q", vec![]));
        
        Ok(operations)
    }
    
    /// Stream image resource as PDF operations
    pub fn stream_image_resource(&self, resource_id: &str, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<Vec<hipdf::lopdf::content::Operation>> {
        use hipdf::lopdf::content::Operation;
        
        // If resource is not found, return empty operations (graceful handling)
        let resource_info = match self.resource_cache.get(resource_id) {
            Some(info) => info,
            None => {
                // Resource not found - log comment and return empty operations
                let mut operations = Vec::new();
                operations.push(Operation::new(&format!("% Image resource not found: {}", resource_id), vec![]));
                return Ok(operations);
            }
        };
        
        if !matches!(resource_info.resource_type, ResourceType::Png | ResourceType::Jpeg) {
            // Wrong resource type - log comment and return empty operations
            let mut operations = Vec::new();
            operations.push(Operation::new(&format!("% Resource {} is not an image", resource_id), vec![]));
            return Ok(operations);
        }
        
        let _object_id = match resource_info.object_id {
            Some(id) => id,
            None => {
                // No object ID - log comment and return empty operations
                let mut operations = Vec::new();
                operations.push(Operation::new(&format!("% Image resource {} has no object ID", resource_id), vec![]));
                return Ok(operations);
            }
        };
        
        // Create PDF operations to place the image XObject
        let mut operations = Vec::new();
        
        // Save graphics state
        operations.push(Operation::new("q", vec![]));
        
        // Apply transformation matrix for positioning and scaling
        operations.push(Operation::new("cm", vec![
            Object::Real(width as f32), Object::Real(0.0), Object::Real(0.0),
            Object::Real(height as f32), Object::Real(x as f32), Object::Real(y as f32)
        ]));
        
        // Place the image XObject using the resource ID as the name
        operations.push(Operation::new("Do", vec![Object::Name(format!("Img{}", resource_id).into_bytes())]));
        
        // Restore graphics state
        operations.push(Operation::new("Q", vec![]));
        
        Ok(operations)
    }
    
    /// Stream PDF resource as PDF operations
    pub fn stream_pdf_resource(&self, resource_id: &str, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<Vec<hipdf::lopdf::content::Operation>> {
        
        
        // If resource is not found, return empty operations (graceful handling)
        let resource_info = match self.resource_cache.get(resource_id) {
            Some(info) => info,
            None => {
                // Resource not found - log comment and return empty operations
                let mut operations = Vec::new();
                operations.push(Operation::new(&format!("% PDF resource not found: {}", resource_id), vec![]));
                return Ok(operations);
            }
        };
        
        if resource_info.resource_type != ResourceType::Pdf {
            // Wrong resource type - log comment and return empty operations
            let mut operations = Vec::new();
            operations.push(Operation::new(&format!("% Resource {} is not a PDF", resource_id), vec![]));
            return Ok(operations);
        }
        
        // Get the XObject ID from the resource cache
        let xobject_id = match resource_info.object_id {
            Some(id) => id,
            None => {
                // No object ID - log comment and return empty operations
                let mut operations = Vec::new();
                operations.push(Operation::new(&format!("% PDF resource {} has no object ID", resource_id), vec![]));
                return Ok(operations);
            }
        };
        
        // Create the PDF operations to place the XObject
        let mut operations = Vec::new();
        
        // Save graphics state
        operations.push(Operation::new("q", vec![]));
        
        // Apply transformation matrix for positioning and scaling
        operations.push(Operation::new("cm", vec![
            Object::Real(width as f32), Object::Real(0.0), Object::Real(0.0),
            Object::Real(height as f32), Object::Real(x as f32), Object::Real(y as f32)
        ]));
        
        // Place the PDF XObject
        operations.push(Operation::new("Do", vec![Object::Name(format!("XObject{}", xobject_id).into_bytes())]));
        
        // Restore graphics state
        operations.push(Operation::new("Q", vec![]));
        
        Ok(operations)
    }
    
    /// Clear resource cache
    pub fn clear_cache(&mut self) {
        self.resource_cache.clear();
    }
    
    /// Get number of cached resources
    pub fn cache_size(&self) -> usize {
        self.resource_cache.len()
    }
}

impl Default for ResourceStreamer {
    fn default() -> Self {
        Self::new()
    }
}