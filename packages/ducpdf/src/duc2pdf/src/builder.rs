use crate::{ConversionOptions, ConversionResult, ConversionError, ConversionMode, 
          validate_coordinates, validate_coordinates_with_scale, calculate_required_scale, MM_TO_PDF_UNITS};
use crate::streaming::stream_elements::ElementStreamer;
use crate::utils::style_resolver::StyleResolver;
use crate::streaming::stream_resources::ResourceStreamer;
use duc::types::{ExportedDataState, DucBlock, DucExternalFileEntry, Standard, DucPlotElement, DucElementEnum, ElementWrapper};
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
    element_streamer: ElementStreamer,
    resource_streamer: ResourceStreamer,
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
        
        // Initialize style resolver
        let style_resolver = StyleResolver::new(context.active_standard.clone());
        
        Ok(Self {
            context,
            document,
            ocg_manager: OCGManager::new(),
            block_manager: BlockManager::new(),
            hatching_manager: HatchingManager::new(),
            pdf_embedder: PdfEmbedder::new(),
            element_streamer: ElementStreamer::new(style_resolver),
            resource_streamer: ResourceStreamer::new(),
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
        
        // Initialize layers in the document with proper OCG structure
        self.ocg_manager.initialize(&mut self.document);
        
        // Set up OCG properties in the document catalog
        self.setup_ocg_properties()?;
        
        Ok(())
    }
    
    /// Setup OCG properties in the document
    fn setup_ocg_properties(&mut self) -> ConversionResult<()> {
        // For now, create a basic OCG structure
        // TODO: Implement proper OCG reference collection when hipdf API supports it
        
        // Create OCG properties dictionary
        let mut ocg_props = Dictionary::new();
        
        // Create empty OCGs array for now
        let ocg_refs: Vec<Object> = Vec::new();
        
        if !ocg_refs.is_empty() {
            // Set OCGs array
            ocg_props.set("OCGs", Object::Array(ocg_refs));
            
            // Create default configuration
            let mut default_config = Dictionary::new();
            default_config.set("BaseState", Object::Name("ON".as_bytes().to_vec()));
            default_config.set("ON", Object::Array(vec![])); // Will be populated with visible layers
            default_config.set("OFF", Object::Array(vec![])); // Will be populated with hidden layers
            
            // Add default configuration to OCG properties
            let config_id = self.document.add_object(Object::Dictionary(default_config));
            ocg_props.set("OCProperties", Object::Array(vec![Object::Reference(config_id)]));
            
            // Store OCG properties in document
            let ocg_props_id = self.document.add_object(Object::Dictionary(ocg_props));
            
            // Set OCG properties in document catalog
            match self.document.catalog_mut() {
                Ok(catalog) => {
                    catalog.set("OCProperties", Object::Reference(ocg_props_id));
                }
                Err(_) => {
                    // If catalog is not available, store in trailer
                    self.document.trailer.set("OCProperties", Object::Reference(ocg_props_id));
                }
            }
        }
        
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
        
        // Create content stream using modular element streaming
        let content_stream = self.create_modular_content_stream(bounds)?;
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
        
        // Add OCG properties to the page if we have layers
        if !self.context.exported_data.layers.is_empty() {
            self.add_page_ocg_properties(&mut page)?;
        }
        
        // Add page to document and track ID
        let page_id = self.document.add_object(Object::Dictionary(page));
        self.page_ids.push(page_id.0); // Extract the object ID from the ObjectId
        
        Ok(())
    }
    
    /// Create modular content stream using the element streamer with layer support
    fn create_modular_content_stream(&mut self, bounds: (f64, f64, f64, f64)) -> ConversionResult<Stream> {
        let (x, y, width, height) = self.apply_scale_bounds(bounds.0, bounds.1, bounds.2, bounds.3);
        
        let mut content = String::new();
        
        // Start graphics state
        content.push_str("q\n");
        
        // Apply coordinate transformation for bounds
        content.push_str(&format!("{} {} translate\n", x, y));
        
        // Handle layered content using hipdf LayerContentBuilder
        if !self.context.exported_data.layers.is_empty() {
            // Stream elements by layer using LayerContentBuilder
            let all_operations = self.stream_elements_by_layer(bounds)?;
            
            // Convert operations to content stream text
            for op in all_operations {
                content.push_str(&self.operation_to_string(&op));
                content.push('\n');
            }
        } else {
            // No layers, use the original streaming approach
            let operations = self.element_streamer.stream_elements_within_bounds(
                &self.context.exported_data.elements,
                bounds,
                &mut self.resource_streamer,
                &mut self.block_manager,
                &mut self.hatching_manager,
                &mut self.pdf_embedder,
                &self.ocg_manager,
            )?;
            
            // Convert operations to content stream text
            for op in operations {
                content.push_str(&self.operation_to_string(&op));
                content.push('\n');
            }
        }
        
        // End graphics state
        content.push_str("Q\n");
        
        let content_bytes = content.into_bytes();
        let mut stream_dict = Dictionary::new();
        stream_dict.set("Length", Object::Integer(content_bytes.len() as i64));
        
        Ok(Stream::new(stream_dict, content_bytes))
    }
    
    /// Stream elements organized by layers using LayerContentBuilder
    fn stream_elements_by_layer(&mut self, bounds: (f64, f64, f64, f64)) -> ConversionResult<Vec<hipdf::lopdf::content::Operation>> {
        use hipdf::lopdf::content::Operation;
        
        let mut all_operations = Vec::new();
        
        // First, stream elements that don't belong to any layer
        let unlayered_elements: Vec<ElementWrapper> = self.context.exported_data.elements
            .iter()
            .filter(|element_wrapper| {
                let base = crate::builder::DucToPdfBuilder::get_element_base(&element_wrapper.element);
                base.layer_id.is_none()
            })
            .cloned()
            .collect();
        
        if !unlayered_elements.is_empty() {
            let unlayered_ops = self.element_streamer.stream_elements_within_bounds(
                &unlayered_elements,
                bounds,
                &mut self.resource_streamer,
                &mut self.block_manager,
                &mut self.hatching_manager,
                &mut self.pdf_embedder,
                &self.ocg_manager,
            )?;
            all_operations.extend(unlayered_ops);
        }
        
        // Then stream each layer separately
        for layer in &self.context.exported_data.layers {
            let layer_ops = self.element_streamer.build_layer_content(
                &layer.id,
                &self.context.exported_data.elements,
                bounds,
                &mut self.resource_streamer,
                &mut self.block_manager,
                &mut self.hatching_manager,
                &mut self.pdf_embedder,
                &self.ocg_manager,
            )?;
            
            all_operations.extend(layer_ops);
        }
        
        Ok(all_operations)
    }
    
    /// Add OCG properties to page
    fn add_page_ocg_properties(&mut self, page: &mut Dictionary) -> ConversionResult<()> {
        // Create optional content configuration dictionary
        let mut oc_config = Dictionary::new();
        oc_config.set("OCGs", Object::Array(vec![])); // Will be populated with layer references
        
        // Add the OCG configuration to the page
        if let Ok(ocg_dict) = self.document.get_object((2, 0)) {
            if let Object::Dictionary(_) = ocg_dict {
                page.set("OCProperties", Object::Reference((2, 0)));
            }
        }
        
        Ok(())
    }
    
    /// Convert PDF operation to string representation
    fn operation_to_string(&self, op: &hipdf::lopdf::content::Operation) -> String {
        let mut result = String::new();
        
        // Add operands
        for operand in &op.operands {
            match operand {
                Object::Real(val) => result.push_str(&format!("{} ", val)),
                Object::Integer(val) => result.push_str(&format!("{} ", val)),
                Object::Name(name) => result.push_str(&format!("/{} ", String::from_utf8_lossy(name))),
                Object::String(str_lit, _) => result.push_str(&format!("({}) ", String::from_utf8_lossy(str_lit))),
                Object::Array(arr) => {
                    result.push('[');
                    for item in arr {
                        match item {
                            Object::Real(val) => result.push_str(&format!("{} ", val)),
                            Object::Integer(val) => result.push_str(&format!("{} ", val)),
                            _ => result.push_str("? "),
                        }
                    }
                    result.push(']');
                    result.push(' ');
                }
                _ => result.push_str("? "),
            }
        }
        
        // Add operator
        result.push_str(&String::from_utf8_lossy(op.operator.as_bytes()));
        
        result
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