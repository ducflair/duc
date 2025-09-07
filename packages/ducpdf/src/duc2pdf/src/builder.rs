use crate::{ConversionOptions, ConversionResult, ConversionError, ConversionMode, 
          validate_coordinates, validate_coordinates_with_scale, calculate_required_scale, MM_TO_PDF_UNITS};
use duc::types::{ExportedDataState, DucBlock, DucExternalFileEntry, Standard, DucPlotElement, DucElementEnum};
use hipdf::lopdf::{Document, Object, Dictionary, Stream};
use hipdf::ocg::{OCGManager, Layer};
use hipdf::blocks::BlockManager;
use hipdf::hatching::HatchingManager;
use hipdf::embed_pdf::PdfEmbedder;
use std::collections::HashMap;

/// Resource cache for storing PDF object IDs
#[derive(Default)]
pub struct ResourceCache {
    pub images: HashMap<String, u32>,
    pub fonts: HashMap<String, u32>,
    pub embedded_pdfs: HashMap<String, u32>,
    pub svg_objects: HashMap<String, u32>,
}

/// Context for PDF conversion
pub struct ConversionContext {
    pub exported_data: ExportedDataState,
    pub options: ConversionOptions,
    pub scale: f64, // Actual scale being used (calculated or provided)
    pub resource_cache: ResourceCache,
    pub active_standard: Option<Standard>,
}

/// Main builder for DUC to PDF conversion
pub struct DucToPdfBuilder {
    context: ConversionContext,
    document: Document,
    ocg_manager: OCGManager,
    block_manager: BlockManager,
    hatching_manager: HatchingManager,
    pdf_embedder: PdfEmbedder,
    page_ids: Vec<u32>, // Track page object IDs for pages tree
}

impl DucToPdfBuilder {
    /// Create a new builder instance
    pub fn new(exported_data: ExportedDataState, options: ConversionOptions) -> ConversionResult<Self> {
        // Initialize PDF document with version 1.7 for compatibility
        let document = Document::with_version("1.7");
        
        // Determine crop bounds if in crop mode
        let crop_bounds = match &options.mode {
            ConversionMode::Crop { clip_bounds } => Some(*clip_bounds),
            ConversionMode::Plot => None,
        };
        
        // Calculate or validate scale
        let scale = if let Some(user_scale) = options.scale {
            // User provided a scale - validate it works with coordinates
            Self::validate_all_coordinates_with_scale(&exported_data, Some(user_scale), crop_bounds)?;
            user_scale
        } else {
            // No scale provided - calculate required scale if needed
            let required_scale = calculate_required_scale(&exported_data, crop_bounds);
            if required_scale < 1.0 {
                println!("🔧 Auto-scaling applied: {:.6} ({}:1)", required_scale, (1.0/required_scale).round() as i32);
            }
            required_scale
        };
        
        // Find active standard
        let active_standard = Self::find_active_standard(&exported_data);
        
        let context = ConversionContext {
            exported_data,
            options,
            scale,
            resource_cache: ResourceCache::default(),
            active_standard,
        };
        
        Ok(Self {
            context,
            document,
            ocg_manager: OCGManager::new(),
            block_manager: BlockManager::new(),
            hatching_manager: HatchingManager::new(),
            pdf_embedder: PdfEmbedder::new(),
            page_ids: Vec::new(),
        })
    }
    
    /// Extract base element from DucElementEnum
    pub fn get_element_base(element: &DucElementEnum) -> &duc::types::DucElementBase {
        match element {
            DucElementEnum::DucRectangleElement(elem) => &elem.base,
            DucElementEnum::DucPolygonElement(elem) => &elem.base,
            DucElementEnum::DucEllipseElement(elem) => &elem.base,
            DucElementEnum::DucEmbeddableElement(elem) => &elem.base,
            DucElementEnum::DucPdfElement(elem) => &elem.base,
            DucElementEnum::DucMermaidElement(elem) => &elem.base,
            DucElementEnum::DucTableElement(elem) => &elem.base,
            DucElementEnum::DucImageElement(elem) => &elem.base,
            DucElementEnum::DucTextElement(elem) => &elem.base,
            DucElementEnum::DucLinearElement(elem) => &elem.linear_base.base,
            DucElementEnum::DucArrowElement(elem) => &elem.linear_base.base,
            DucElementEnum::DucFreeDrawElement(elem) => &elem.base,
            DucElementEnum::DucBlockInstanceElement(elem) => &elem.base,
            DucElementEnum::DucFrameElement(elem) => &elem.stack_element_base.base,
            DucElementEnum::DucPlotElement(elem) => &elem.stack_element_base.base,
            DucElementEnum::DucViewportElement(elem) => &elem.linear_base.base,
            DucElementEnum::DucXRayElement(elem) => &elem.base,
            DucElementEnum::DucLeaderElement(elem) => &elem.linear_base.base,
            DucElementEnum::DucDimensionElement(elem) => &elem.base,
            DucElementEnum::DucFeatureControlFrameElement(elem) => &elem.base,
            DucElementEnum::DucDocElement(elem) => &elem.base,
            DucElementEnum::DucParametricElement(elem) => &elem.base,
        }
    }
    
    /// Validate coordinates for all elements in the DUC data with optional scaling
    fn validate_all_coordinates_with_scale(
        data: &ExportedDataState, 
        scale: Option<f64>, 
        crop_bounds: Option<(f64, f64, f64, f64)>
    ) -> ConversionResult<()> {
        // If crop bounds are specified, only validate the crop area
        if let Some((cx, cy, cw, ch)) = crop_bounds {
            validate_coordinates_with_scale(cx, cy, scale)?;
            validate_coordinates_with_scale(cx + cw, cy + ch, scale)?;
            return Ok(());
        }
        
        // Otherwise validate all elements
        for element_wrapper in &data.elements {
            let base = Self::get_element_base(&element_wrapper.element);
            validate_coordinates_with_scale(base.x, base.y, scale)?;
            validate_coordinates_with_scale(base.x + base.width, base.y + base.height, scale)?;
        }
        Ok(())
    }
    
    /// Validate coordinates for all elements in the DUC data (legacy function)
    fn validate_all_coordinates(data: &ExportedDataState) -> ConversionResult<()> {
        for element_wrapper in &data.elements {
            let base = Self::get_element_base(&element_wrapper.element);
            validate_coordinates(base.x, base.y)?;
            validate_coordinates(base.x + base.width, base.y + base.height)?;
        }
        Ok(())
    }
    
    /// Find the active standard from the data
    fn find_active_standard(data: &ExportedDataState) -> Option<Standard> {
        // Get active standard from duc_local_state
        if let Some(local_state) = &data.duc_local_state {
            let active_std_id = &local_state.active_standard_id;
            if !active_std_id.is_empty() {
                return data.standards.iter()
                    .find(|std| &std.identifier.id == active_std_id)
                    .cloned();
            }
        }
        
        // Fallback to first standard if available
        data.standards.first().cloned()
    }
    
    /// Build the PDF document
    pub fn build(mut self) -> ConversionResult<Vec<u8>> {
        // Phase 1: Pre-computation & Resource Loading
        self.phase1_precomputation()?;
        
        // Phase 2: Page Generation
        self.phase2_page_generation()?;
        
        // Phase 3: Content Streaming (handled per page in phase 2)
        
        // Phase 4: Finalization
        self.phase4_finalization()
    }
    
    /// Phase 1: Pre-computation & Resource Loading
    fn phase1_precomputation(&mut self) -> ConversionResult<()> {
        // Set document metadata
        self.set_document_metadata()?;
        
        // Setup coordinate system
        self.setup_coordinate_system()?;
        
        // Process external files and create resource cache
        self.process_external_files()?;
        
        // Process blocks
        self.process_blocks()?;
        
        // Setup layers (OCGs)
        self.setup_layers()?;
        
        Ok(())
    }
    
    /// Set document metadata
    fn set_document_metadata(&mut self) -> ConversionResult<()> {
        let mut info = Dictionary::new();
        
        // Set title
        if let Some(title) = &self.context.options.metadata_title {
            info.set("Title", Object::string_literal(title.as_str()));
        } else if let Some(global_state) = &self.context.exported_data.duc_global_state {
            if let Some(name) = &global_state.name {
                if !name.is_empty() {
                    info.set("Title", Object::string_literal(name.as_str()));
                }
            }
        }
        
        // Set author
        if let Some(author) = &self.context.options.metadata_author {
            info.set("Author", Object::string_literal(author.as_str()));
        }
        
        // Set subject
        if let Some(subject) = &self.context.options.metadata_subject {
            info.set("Subject", Object::string_literal(subject.as_str()));
        }
        
        // Set creator and producer
        info.set("Creator", Object::string_literal("DUC to PDF Converter"));
        info.set("Producer", Object::string_literal("ducpdf"));
        
        // Set version info
        let keywords = format!(
            "DUC version: {}, Source: {}", 
            self.context.exported_data.version,
            self.context.exported_data.source
        );
        info.set("Keywords", Object::string_literal(keywords.as_str()));
        
        let info_id = self.document.add_object(Object::Dictionary(info));
        self.document.trailer.set("Info", Object::Reference(info_id));
        
        Ok(())
    }
    
    /// Setup coordinate system with 1 unit = 1mm
    fn setup_coordinate_system(&mut self) -> ConversionResult<()> {
        // The coordinate system will be set per page using UserUnit
        // 1 unit = 1mm, so UserUnit = 25.4/72.0 (converts default 72 DPI to mm)
        Ok(())
    }
    
    /// Process external files and build resource cache
    fn process_external_files(&mut self) -> ConversionResult<()> {
        if let Some(external_files) = &self.context.exported_data.external_files {
            let external_files_clone = external_files.clone();
            for file_entry in external_files_clone {
                let file_data = &file_entry.value;
                match file_data.mime_type.to_lowercase().as_str() {
                    "image/svg+xml" | "application/svg+xml" => {
                        // Handle SVG files using svg_to_pdf utility
                        let object_id = self.process_svg_file(&file_entry)?;
                        self.context.resource_cache.svg_objects.insert(file_data.id.clone(), object_id);
                    }
                    "image/png" | "image/jpeg" | "image/jpg" | "image/gif" => {
                        // Handle image files
                        let object_id = self.process_image_file(&file_entry)?;
                        self.context.resource_cache.images.insert(file_data.id.clone(), object_id);
                    }
                    "application/pdf" => {
                        // Handle embedded PDF files
                        let object_id = self.process_pdf_file(&file_entry)?;
                        self.context.resource_cache.embedded_pdfs.insert(file_data.id.clone(), object_id);
                    }
                    "font/ttf" | "font/otf" | "font/woff" | "font/woff2" => {
                        // Handle font files
                        let object_id = self.process_font_file(&file_entry)?;
                        self.context.resource_cache.fonts.insert(file_data.id.clone(), object_id);
                    }
                    _ => {
                        // Skip unknown file types
                        println!("Warning: Unsupported file type: {}", file_data.mime_type);
                    }
                }
            }
        }
        Ok(())
    }
    
    /// Process SVG file
    fn process_svg_file(&mut self, _file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        // This will be implemented using the svg_to_pdf utility
        // For now, return a placeholder
        Ok(0)
    }
    
    /// Process image file
    fn process_image_file(&mut self, _file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        // Create image XObject
        // For now, return a placeholder
        Ok(0)
    }
    
    /// Process PDF file for embedding
    fn process_pdf_file(&mut self, _file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        // Use hipdf::embed_pdf module
        // For now, return a placeholder
        Ok(0)
    }
    
    /// Process font file
    fn process_font_file(&mut self, _file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        // Create font object
        // For now, return a placeholder
        Ok(0)
    }
    
    /// Process DUC blocks
    fn process_blocks(&mut self) -> ConversionResult<()> {
        let blocks = self.context.exported_data.blocks.clone();
        for block in &blocks {
            // Use hipdf::blocks module to create reusable content
            self.process_single_block(block)?;
        }
        Ok(())
    }
    
    /// Process a single DUC block
    fn process_single_block(&mut self, _block: &DucBlock) -> ConversionResult<()> {
        // Create a Block using hipdf::blocks
        // For now, this is a placeholder
        Ok(())
    }
    
    /// Setup OCG layers
    fn setup_layers(&mut self) -> ConversionResult<()> {
        for layer in &self.context.exported_data.layers {
            let layer_name = if !layer.stack_base.label.is_empty() {
                &layer.stack_base.label
            } else {
                &layer.id
            };
            let layer_obj = Layer::new(layer_name, layer.stack_base.is_visible);
            self.ocg_manager.add_layer(layer_obj);
        }
        
        // Initialize layers in the document
        self.ocg_manager.initialize(&mut self.document);
        Ok(())
    }
    
    /// Phase 2: Page Generation
    fn phase2_page_generation(&mut self) -> ConversionResult<()> {
        match &self.context.options.mode {
            ConversionMode::Plot => {
                self.generate_plot_pages()?;
            }
            ConversionMode::Crop { clip_bounds } => {
                self.generate_crop_page(*clip_bounds)?;
            }
        }
        Ok(())
    }
    
    /// Generate pages for plot mode (one page per plot element)
    fn generate_plot_pages(&mut self) -> ConversionResult<()> {
        // Collect plot element bounds to avoid borrowing issues
        let plot_bounds: Vec<(f64, f64, f64, f64)> = self.context.exported_data.elements
            .iter()
            .filter_map(|elem| {
                if let DucElementEnum::DucPlotElement(plot) = &elem.element {
                    Some((
                        plot.stack_element_base.base.x,
                        plot.stack_element_base.base.y,
                        plot.stack_element_base.base.width,
                        plot.stack_element_base.base.height,
                    ))
                } else {
                    None
                }
            })
            .collect();
        
        if plot_bounds.is_empty() {
            // No plot elements, create a single page with all elements
            self.create_single_page_with_all_elements()?;
        } else {
            for bounds in plot_bounds {
                self.create_page_with_bounds(bounds)?;
            }
        }
        
        Ok(())
    }
    
    /// Generate a single page for crop mode
    fn generate_crop_page(&mut self, clip_bounds: (f64, f64, f64, f64)) -> ConversionResult<()> {
        self.create_page_with_clipping(clip_bounds)?;
        Ok(())
    }
    
    /// Create a single page with all elements (when no plots are defined)
    fn create_single_page_with_all_elements(&mut self) -> ConversionResult<()> {
        // Calculate bounding box of all elements
        let bounds = self.calculate_overall_bounds();
        self.create_page_with_bounds(bounds)?;
        Ok(())
    }
    
    /// Create a page for a specific plot element
    fn create_page_for_plot(&mut self, plot_element: &DucPlotElement) -> ConversionResult<()> {
        let bounds = (
            plot_element.stack_element_base.base.x,
            plot_element.stack_element_base.base.y,
            plot_element.stack_element_base.base.width,
            plot_element.stack_element_base.base.height,
        );
        self.create_page_with_bounds(bounds)?;
        Ok(())
    }
    
    /// Create a page with clipping bounds
    fn create_page_with_clipping(&mut self, clip_bounds: (f64, f64, f64, f64)) -> ConversionResult<()> {
        self.create_page_with_bounds(clip_bounds)?;
        // Add clipping path - this will be implemented in streaming phase
        Ok(())
    }
    
    /// Apply scaling to coordinates
    fn apply_scale(&self, value: f64) -> f64 {
        value * self.context.scale
    }
    
    /// Apply scaling to a point (x, y)
    fn apply_scale_point(&self, x: f64, y: f64) -> (f64, f64) {
        (self.apply_scale(x), self.apply_scale(y))
    }
    
    /// Apply scaling to bounds (x, y, width, height)
    fn apply_scale_bounds(&self, x: f64, y: f64, width: f64, height: f64) -> (f64, f64, f64, f64) {
        (
            self.apply_scale(x), 
            self.apply_scale(y), 
            self.apply_scale(width), 
            self.apply_scale(height)
        )
    }

    /// Create a page with specified bounds
    fn create_page_with_bounds(&mut self, bounds: (f64, f64, f64, f64)) -> ConversionResult<()> {
        let (_x, _y, width, height) = self.apply_scale_bounds(bounds.0, bounds.1, bounds.2, bounds.3);
        
        // Convert mm to PDF points for page size
        let page_width = width * MM_TO_PDF_UNITS;
        let page_height = height * MM_TO_PDF_UNITS;
        
        // Create content stream with actual content
        let content_stream = self.create_content_stream_for_bounds(bounds)?;
        let content_id = self.document.add_object(Object::Stream(content_stream));
        
        // Create page dictionary
        let mut page = Dictionary::new();
        page.set("Type", Object::Name("Page".as_bytes().to_vec()));
        page.set("MediaBox", Object::Array(vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(page_width as f32),
            Object::Real(page_height as f32),
        ]));
        
        // Set UserUnit to 1mm = 1 unit
        page.set("UserUnit", Object::Real(25.4 / 72.0));
        page.set("Contents", Object::Reference(content_id));
        
        // Add page to document and track ID
        let page_id = self.document.add_object(Object::Dictionary(page));
        self.page_ids.push(page_id.0); // Extract the object ID from the ObjectId
        
        Ok(())
    }
    
    /// Calculate overall bounds of all elements
    fn calculate_overall_bounds(&self) -> (f64, f64, f64, f64) {
        if self.context.exported_data.elements.is_empty() {
            return (0.0, 0.0, 210.0, 297.0); // A4 default
        }
        
        let mut min_x = f64::INFINITY;
        let mut min_y = f64::INFINITY;
        let mut max_x = f64::NEG_INFINITY;
        let mut max_y = f64::NEG_INFINITY;
        
        for element_wrapper in &self.context.exported_data.elements {
            let base = Self::get_element_base(&element_wrapper.element);
            min_x = min_x.min(base.x);
            min_y = min_y.min(base.y);
            max_x = max_x.max(base.x + base.width);
            max_y = max_y.max(base.y + base.height);
        }
        
        let width = max_x - min_x;
        let height = max_y - min_y;
        
        (min_x, min_y, width, height)
    }
    
    /// Create content stream for specified bounds
    fn create_content_stream_for_bounds(&self, bounds: (f64, f64, f64, f64)) -> ConversionResult<Stream> {
        let (x, y, width, height) = self.apply_scale_bounds(bounds.0, bounds.1, bounds.2, bounds.3);
        
        let mut content = String::new();
        
        // Start graphics state
        content.push_str("q\n");
        
        // Add a debug border to show the bounds
        content.push_str(&format!("0.5 w\n")); // Line width
        content.push_str(&format!("0 0 1 RG\n")); // Blue color for border
        content.push_str(&format!("{} {} {} {} re\n", x, y, width, height));
        content.push_str("S\n"); // Stroke the rectangle
        
        // Process DUC elements within these bounds
        self.add_duc_elements_to_content(&mut content, bounds)?;
        
        // End graphics state
        content.push_str("Q\n");
        
        let content_bytes = content.into_bytes();
        let mut stream_dict = Dictionary::new();
        stream_dict.set("Length", Object::Integer(content_bytes.len() as i64));
        
        Ok(Stream::new(stream_dict, content_bytes))
    }
    
    /// Add DUC elements to content stream
    fn add_duc_elements_to_content(&self, content: &mut String, bounds: (f64, f64, f64, f64)) -> ConversionResult<()> {
        let (bounds_x, bounds_y, bounds_width, bounds_height) = bounds;
        let bounds_max_x = bounds_x + bounds_width;
        let bounds_max_y = bounds_y + bounds_height;
        
        // Iterate through all elements and render those within bounds
        for element_wrapper in &self.context.exported_data.elements {
            let base = Self::get_element_base(&element_wrapper.element);
            
            // Check if element intersects with bounds
            let elem_max_x = base.x + base.width;
            let elem_max_y = base.y + base.height;
            
            let intersects = !(base.x > bounds_max_x || elem_max_x < bounds_x || 
                              base.y > bounds_max_y || elem_max_y < bounds_y);
            
            if intersects {
                // Apply scaling to element coordinates
                let scaled_x = self.apply_scale(base.x);
                let scaled_y = self.apply_scale(base.y);
                let scaled_width = self.apply_scale(base.width);
                let scaled_height = self.apply_scale(base.height);
                
                // Render element based on its type
                match &element_wrapper.element {
                    DucElementEnum::DucRectangleElement(_) => {
                        self.add_rectangle_element(content, scaled_x, scaled_y, scaled_width, scaled_height)?;
                    }
                    DucElementEnum::DucEllipseElement(_) => {
                        self.add_ellipse_element(content, scaled_x, scaled_y, scaled_width, scaled_height)?;
                    }
                    DucElementEnum::DucTextElement(text_elem) => {
                        self.add_text_element(content, text_elem, scaled_x, scaled_y)?;
                    }
                    DucElementEnum::DucLinearElement(_) => {
                        self.add_line_element(content, scaled_x, scaled_y, scaled_width, scaled_height)?;
                    }
                    _ => {
                        // For other element types, draw a placeholder rectangle
                        self.add_placeholder_element(content, scaled_x, scaled_y, scaled_width, scaled_height)?;
                    }
                }
            }
        }
        
        Ok(())
    }
    
    /// Add rectangle element to content
    fn add_rectangle_element(&self, content: &mut String, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<()> {
        content.push_str("0.2 w\n"); // Line width
        content.push_str("0 0 0 RG\n"); // Black color
        content.push_str(&format!("{} {} {} {} re\n", x, y, width, height));
        content.push_str("S\n"); // Stroke
        Ok(())
    }
    
    /// Add ellipse element to content (approximated with rectangle for now)
    fn add_ellipse_element(&self, content: &mut String, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<()> {
        content.push_str("0.2 w\n"); // Line width
        content.push_str("0 0.5 0 RG\n"); // Green color for ellipses
        content.push_str(&format!("{} {} {} {} re\n", x, y, width, height));
        content.push_str("S\n"); // Stroke
        Ok(())
    }
    
    /// Add text element to content
    fn add_text_element(&self, content: &mut String, _text_elem: &duc::types::DucTextElement, x: f64, y: f64) -> ConversionResult<()> {
        // For now, just draw a small marker for text
        content.push_str("0.1 w\n"); // Line width
        content.push_str("1 0 0 RG\n"); // Red color for text markers
        content.push_str(&format!("{} {} 5 5 re\n", x, y));
        content.push_str("S\n"); // Stroke
        Ok(())
    }
    
    /// Add line element to content
    fn add_line_element(&self, content: &mut String, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<()> {
        content.push_str("0.3 w\n"); // Line width
        content.push_str("0.5 0 0.5 RG\n"); // Purple color for lines
        content.push_str(&format!("{} {} m\n", x, y)); // Move to start
        content.push_str(&format!("{} {} l\n", x + width, y + height)); // Line to end
        content.push_str("S\n"); // Stroke
        Ok(())
    }
    
    /// Add placeholder element for unsupported types
    fn add_placeholder_element(&self, content: &mut String, x: f64, y: f64, width: f64, height: f64) -> ConversionResult<()> {
        content.push_str("0.1 w\n"); // Line width
        content.push_str("0.7 0.7 0.7 RG\n"); // Gray color for placeholders
        content.push_str(&format!("{} {} {} {} re\n", x, y, width, height));
        content.push_str("S\n"); // Stroke
        Ok(())
    }
    
    /// Phase 4: Finalization
    fn phase4_finalization(mut self) -> ConversionResult<Vec<u8>> {
        // Create Pages tree
        self.create_pages_tree()?;
        
        // Create Root catalog
        self.create_root_catalog()?;
        
        // Convert document to bytes
        let mut buffer = Vec::new();
        self.document.save_to(&mut buffer)
            .map_err(|e| ConversionError::PdfGenerationError(e.to_string()))?;
        Ok(buffer)
    }
    
    /// Create the Pages tree structure
    fn create_pages_tree(&mut self) -> ConversionResult<()> {
        if self.page_ids.is_empty() {
            return Err(ConversionError::PdfGenerationError("No pages created".to_string()));
        }
        
        // Create page references array
        let page_refs: Vec<Object> = self.page_ids.iter()
            .map(|&id| Object::Reference((id, 0)))
            .collect();
        
        // Create Pages dictionary
        let mut pages_dict = Dictionary::new();
        pages_dict.set("Type", Object::Name("Pages".as_bytes().to_vec()));
        pages_dict.set("Kids", Object::Array(page_refs));
        pages_dict.set("Count", Object::Integer(self.page_ids.len() as i64));
        
        // Add Pages object to document
        let pages_id = self.document.add_object(Object::Dictionary(pages_dict));
        
        // Update all page objects to reference the parent Pages object
        for &page_id in &self.page_ids {
            if let Ok(Object::Dictionary(ref mut page_dict)) = self.document.get_object_mut((page_id, 0)) {
                page_dict.set("Parent", Object::Reference(pages_id));
            }
        }
        
        // Store the pages_id for the catalog
        self.document.trailer.set("Pages", Object::Reference(pages_id));
        
        Ok(())
    }
    
    /// Create the Root catalog
    fn create_root_catalog(&mut self) -> ConversionResult<()> {
        // Get the Pages reference from trailer
        let pages_ref = match self.document.trailer.get(b"Pages") {
            Ok(obj) => obj.clone(),
            Err(_) => return Err(ConversionError::PdfGenerationError("Pages not found in trailer".to_string())),
        };
        
        // Create Root catalog dictionary
        let mut catalog = Dictionary::new();
        catalog.set("Type", Object::Name("Catalog".as_bytes().to_vec()));
        catalog.set("Pages", pages_ref);
        
        // Add OCG Properties if we have layers
        if let Ok(ocg_dict) = self.document.get_object((2, 0)) {
            if let Object::Dictionary(_) = ocg_dict {
                catalog.set("OCProperties", Object::Reference((2, 0)));
            }
        }
        
        // Add Root catalog to document
        let catalog_id = self.document.add_object(Object::Dictionary(catalog));
        
        // Set Root in trailer
        self.document.trailer.set("Root", Object::Reference(catalog_id));
        
        Ok(())
    }
}