use crate::streaming::stream_elements::ElementStreamer;
use crate::streaming::stream_resources::ResourceStreamer;
use crate::utils::style_resolver::StyleResolver;
use crate::utils::svg_to_pdf::svg_to_pdf;
use crate::{
    calculate_required_scale, validate_coordinates, validate_coordinates_with_scale,
    ConversionError, ConversionMode, ConversionOptions, ConversionResult, MM_TO_PDF_UNITS,
};
use duc::types::{
    DucBlock, DucElementEnum, DucExternalFileEntry, DucPlotElement, ElementWrapper,
    ExportedDataState, Standard,
};
use hipdf::blocks::BlockManager;
use hipdf::embed_pdf::PdfEmbedder;
use hipdf::hatching::HatchingManager;
use hipdf::lopdf::{Dictionary, Document, Object, Stream};
use hipdf::ocg::OCGManager;
use std::collections::HashMap;

/// Resource cache for storing PDF object IDs
#[derive(Default, Clone)]
pub struct ResourceCache {
    pub images: HashMap<String, u32>,
    pub fonts: HashMap<String, u32>,
    pub embedded_pdfs: HashMap<String, u32>,
    pub svg_objects: HashMap<String, u32>,
    pub xobject_names: HashMap<String, String>, // resource_id -> XObject name mapping
}

/// Context for PDF conversion
pub struct ConversionContext {
    pub exported_data: ExportedDataState,
    pub options: ConversionOptions,
    pub scale: f64,
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
    page_ids: Vec<u32>,
    layer_refs: HashMap<String, Object>, // layer_id -> OCG reference
    layer_prop_names: HashMap<String, String>, // layer_id -> Properties name (e.g., OCG_1)
}

impl DucToPdfBuilder {
    /// Create a new builder instance
    pub fn new(
        exported_data: ExportedDataState,
        options: ConversionOptions,
    ) -> ConversionResult<Self> {
        let document = Document::with_version("1.7");

        let crop_bounds = match &options.mode {
            ConversionMode::Crop { clip_bounds } => Some(*clip_bounds),
            ConversionMode::Plot => None,
        };

        let scale = if let Some(user_scale) = options.scale {
            Self::validate_all_coordinates_with_scale(
                &exported_data,
                Some(user_scale),
                crop_bounds,
            )?;
            user_scale
        } else {
            let required_scale = calculate_required_scale(&exported_data, crop_bounds);
            if required_scale < 1.0 {
                println!(
                    "🔧 Auto-scaling applied: {:.6} ({}:1)",
                    required_scale,
                    (1.0 / required_scale).round() as i32
                );
            }
            required_scale
        };

        let active_standard = Self::find_active_standard(&exported_data);

        let context = ConversionContext {
            exported_data,
            options,
            scale,
            resource_cache: ResourceCache::default(),
            active_standard,
        };

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
            layer_refs: HashMap::new(),
            layer_prop_names: HashMap::new(),
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
        crop_bounds: Option<(f64, f64, f64, f64)>,
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
                return data
                    .standards
                    .iter()
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
            self.context.exported_data.version, self.context.exported_data.source
        );
        info.set("Keywords", Object::string_literal(keywords.as_str()));

        let info_id = self.document.add_object(Object::Dictionary(info));
        self.document
            .trailer
            .set("Info", Object::Reference(info_id));

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
                        self.process_svg_file(&file_entry)?;
                        // SVG files are stored as embedded_pdfs since they're converted to PDF
                        // (already stored in process_svg_file, no need to duplicate here)
                    }
                    "image/png" | "image/jpeg" | "image/jpg" | "image/gif" => {
                        // Handle image files
                        let object_id = self.process_image_file(&file_entry)?;
                        self.context
                            .resource_cache
                            .images
                            .insert(file_data.id.clone(), object_id);
                    }
                    "application/pdf" => {
                        // Handle embedded PDF files
                        let object_id = self.process_pdf_file(&file_entry)?;
                        self.context
                            .resource_cache
                            .embedded_pdfs
                            .insert(file_data.id.clone(), object_id);
                    }
                    "font/ttf" | "font/otf" | "font/woff" | "font/woff2" => {
                        // Handle font files
                        let object_id = self.process_font_file(&file_entry)?;
                        self.context
                            .resource_cache
                            .fonts
                            .insert(file_data.id.clone(), object_id);
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

    /// Process SVG file and convert to PDF for later embedding
    fn process_svg_file(&mut self, file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        let svg_data = &file_entry.value.data;

        // Convert SVG to PDF using the utility
        let pdf_bytes = svg_to_pdf(svg_data).map_err(|e| {
            ConversionError::ResourceLoadError(format!("SVG to PDF conversion failed: {}", e))
        })?;

        // Load the PDF bytes for later embedding (don't embed now, save for when image elements reference it)
        let embed_id = format!("svg_{}", file_entry.key);
        self.pdf_embedder
            .load_pdf_from_bytes(&pdf_bytes, &embed_id)
            .map_err(|e| {
                ConversionError::ResourceLoadError(format!(
                    "Failed to load converted SVG PDF: {}",
                    e
                ))
            })?;

        // Store as embedded PDF (not regular image) so stream_image can detect it's an SVG-converted PDF
        self.context
            .resource_cache
            .embedded_pdfs
            .insert(file_entry.key.clone(), 0); // 0 as placeholder, will be updated when embedded

        Ok(0) // Return placeholder, actual embedding happens during streaming
    }

    /// Process image file
    fn process_image_file(&mut self, file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        let image_data = &file_entry.value.data;
        let mime_type = &file_entry.value.mime_type;

        // Create image XObject based on MIME type
        let mut image_dict = Dictionary::new();
        image_dict.set("Type", Object::Name("XObject".as_bytes().to_vec()));
        image_dict.set("Subtype", Object::Name("Image".as_bytes().to_vec()));

        match mime_type.to_lowercase().as_str() {
            "image/png" => {
                image_dict.set("Filter", Object::Name("FlateDecode".as_bytes().to_vec()));
                image_dict.set("ColorSpace", Object::Name("DeviceRGB".as_bytes().to_vec()));
                image_dict.set("BitsPerComponent", Object::Integer(8));
                // PNG might have alpha channel
                image_dict.set("SMaskInData", Object::Integer(1));
            }
            "image/jpeg" | "image/jpg" => {
                image_dict.set("Filter", Object::Name("DCTDecode".as_bytes().to_vec()));
                image_dict.set("ColorSpace", Object::Name("DeviceRGB".as_bytes().to_vec()));
                image_dict.set("BitsPerComponent", Object::Integer(8));
            }
            _ => {
                return Err(ConversionError::ResourceLoadError(format!(
                    "Unsupported image type: {}",
                    mime_type
                )));
            }
        }

        // For now, use default dimensions - in production these should be parsed from image data
        image_dict.set("Width", Object::Integer(100));
        image_dict.set("Height", Object::Integer(100));

        // Create image stream with the actual image data (JPEG supported; PNG embedding requires decoding)
        let stream = Stream::new(image_dict, image_data.to_vec());
        let (object_id, _) = self.document.add_object(Object::Stream(stream));

        // Store the image ID in the resource cache
        self.context
            .resource_cache
            .images
            .insert(file_entry.key.clone(), object_id);
        // Also assign an XObject name so content can reference it
        self.context
            .resource_cache
            .xobject_names
            .insert(file_entry.key.clone(), format!("Im{}", object_id));

        Ok(object_id)
    }

    /// Process PDF file for embedding
    fn process_pdf_file(&mut self, file_entry: &DucExternalFileEntry) -> ConversionResult<u32> {
        let pdf_data = &file_entry.value.data;
        let embed_id = format!("pdf_{}", file_entry.key);

        // Just load the PDF, don't embed it yet
        self.pdf_embedder
            .load_pdf_from_bytes(pdf_data, &embed_id)
            .map_err(|e| {
                ConversionError::ResourceLoadError(format!("Failed to load PDF: {}", e))
            })?;

        // Store a marker that this PDF is loaded (will be embedded when used)
        self.context
            .resource_cache
            .embedded_pdfs
            .insert(file_entry.key.clone(), 0);

        Ok(0)
    }

    /// Embed a PDF for a specific element
    fn embed_pdf_for_element(
        &mut self,
        file_id: &str,
        _width: f64,
        _height: f64,
    ) -> ConversionResult<()> {
        use hipdf::embed_pdf::{EmbedOptions, MultiPageLayout};

        let embed_id = format!("pdf_{}", file_id);

        // Check if already embedded
        if self
            .context
            .resource_cache
            .xobject_names
            .contains_key(file_id)
        {
            return Ok(());
        }

        // Create embedding options - using unit dimensions since scaling happens in content stream
        let options = EmbedOptions::new()
            .at_position(0.0, 0.0)
            .with_scale(1.0)
            .with_layout(MultiPageLayout::FirstPageOnly)
            .preserve_aspect_ratio(true);

        // Embed the PDF
        let result = self
            .pdf_embedder
            .embed_pdf(&mut self.document, &embed_id, &options)
            .map_err(|e| {
                ConversionError::ResourceLoadError(format!("Failed to embed PDF: {}", e))
            })?;

        // Store the XObject reference
        for (name, obj_ref) in result.xobject_resources {
            if let Object::Reference(_id) = obj_ref {
                self.context
                    .resource_cache
                    .xobject_names
                    .insert(file_id.to_string(), name);
                return Ok(());
            }
        }

        Err(ConversionError::ResourceLoadError(
            "Failed to get XObject reference".to_string(),
        ))
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

    /// Setup OCG layers with proper references
    fn setup_layers(&mut self) -> ConversionResult<()> {
        // We will create OCG dictionaries manually and attach OCProperties at catalog creation.
        // Create OCG references for each layer and keep them in layer_refs.
        let mut counter: usize = 1;
        for layer in &self.context.exported_data.layers {
            let layer_name = if !layer.stack_base.label.is_empty() {
                &layer.stack_base.label
            } else {
                &layer.id
            };

            let mut ocg_dict = Dictionary::new();
            ocg_dict.set("Type", Object::Name("OCG".as_bytes().to_vec()));
            ocg_dict.set("Name", Object::string_literal(layer_name.as_str()));

            // Add Intent to specify this is for View (layer visibility)
            ocg_dict.set(
                "Intent",
                Object::Array(vec![Object::Name("View".as_bytes().to_vec())]),
            );

            // Add Usage dictionary for better layer behavior
            let mut usage_dict = Dictionary::new();
            let mut view_dict = Dictionary::new();
            view_dict.set("ViewState", Object::Name("ON".as_bytes().to_vec()));
            usage_dict.set("View", Object::Dictionary(view_dict));
            ocg_dict.set("Usage", Object::Dictionary(usage_dict));

            let ocg_id = self.document.add_object(Object::Dictionary(ocg_dict));
            self.layer_refs
                .insert(layer.id.clone(), Object::Reference(ocg_id));

            // Also generate a Properties name for this layer (used in BDC with /OC <<>> refs)
            let prop_name = format!("OCG_{}", counter);
            self.layer_prop_names.insert(layer.id.clone(), prop_name);
            counter += 1;
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
        let plot_bounds: Vec<(f64, f64, f64, f64)> = self
            .context
            .exported_data
            .elements
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
    fn create_page_with_clipping(
        &mut self,
        clip_bounds: (f64, f64, f64, f64),
    ) -> ConversionResult<()> {
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
            self.apply_scale(height),
        )
    }

    /// Create a page with specified bounds
    fn create_page_with_bounds(&mut self, bounds: (f64, f64, f64, f64)) -> ConversionResult<()> {
        let (_x, _y, width, height) =
            self.apply_scale_bounds(bounds.0, bounds.1, bounds.2, bounds.3);

        let page_width = width * MM_TO_PDF_UNITS;
        let page_height = height * MM_TO_PDF_UNITS;

        // Create content stream
        let content_stream = self.create_modular_content_stream(bounds)?;
        let content_id = self.document.add_object(Object::Stream(content_stream));

        // Setup page resources including XObjects
        let resources = self.create_page_resources()?;

        // Create page dictionary
        let mut page = Dictionary::new();
        page.set("Type", Object::Name("Page".as_bytes().to_vec()));
        page.set(
            "MediaBox",
            Object::Array(vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(page_width as f32),
                Object::Real(page_height as f32),
            ]),
        );

        page.set("UserUnit", Object::Real(25.4 / 72.0));
        page.set("Contents", Object::Reference(content_id));
        page.set("Resources", Object::Dictionary(resources));

        let page_id = self.document.add_object(Object::Dictionary(page));
        self.page_ids.push(page_id.0);

        Ok(())
    }

    /// Create page resources including XObjects and Properties
    fn create_page_resources(&mut self) -> ConversionResult<Dictionary> {
        let mut resources = Dictionary::new();

        // Add font resources
        let mut font_obj = Dictionary::new();
        font_obj.set("Type", Object::Name("Font".as_bytes().to_vec()));
        font_obj.set("Subtype", Object::Name("Type1".as_bytes().to_vec()));
        font_obj.set("BaseFont", Object::Name("Helvetica".as_bytes().to_vec()));
        let font_id = self.document.add_object(Object::Dictionary(font_obj));
        let mut font_dict = Dictionary::new();
        font_dict.set("F1", Object::Reference(font_id));
        resources.set("Font", Object::Dictionary(font_dict));

        // Add XObject resources for images, PDFs, and SVGs
        let mut xobject_dict = Dictionary::new();

        // Add cached resources to XObject dictionary (prefer provided names)
        for (resource_id, xobject_name) in &self.context.resource_cache.xobject_names {
            if let Some(&obj_id) = self.context.resource_cache.images.get(resource_id) {
                xobject_dict.set(xobject_name.clone(), Object::Reference((obj_id, 0)));
            } else if let Some(&obj_id) = self.context.resource_cache.embedded_pdfs.get(resource_id)
            {
                xobject_dict.set(xobject_name.clone(), Object::Reference((obj_id, 0)));
            }
        }

        // Also register any resources that have object IDs but no name mapping yet
        for (resource_id, &obj_id) in &self.context.resource_cache.images {
            if !self
                .context
                .resource_cache
                .xobject_names
                .contains_key(resource_id)
            {
                let name = format!("Im{}", obj_id);
                xobject_dict.set(name.clone(), Object::Reference((obj_id, 0)));
                self.context
                    .resource_cache
                    .xobject_names
                    .insert(resource_id.clone(), name);
            }
        }
        for (resource_id, &obj_id) in &self.context.resource_cache.embedded_pdfs {
            if !self
                .context
                .resource_cache
                .xobject_names
                .contains_key(resource_id)
            {
                let name = format!("XObj{}", obj_id);
                xobject_dict.set(name.clone(), Object::Reference((obj_id, 0)));
                self.context
                    .resource_cache
                    .xobject_names
                    .insert(resource_id.clone(), name);
            }
        }
        if !xobject_dict.is_empty() {
            resources.set("XObject", Object::Dictionary(xobject_dict));
        }

        // Add Properties for OCG, mapping property names to OCG references
        if !self.layer_refs.is_empty() {
            let mut properties = Dictionary::new();
            for layer in &self.context.exported_data.layers {
                if let (Some(ocg_ref), Some(prop_name)) = (
                    self.layer_refs.get(&layer.id),
                    self.layer_prop_names.get(&layer.id),
                ) {
                    properties.set(prop_name.as_str(), ocg_ref.clone());
                }
            }
            if !properties.is_empty() {
                resources.set("Properties", Object::Dictionary(properties));
            }
        }

        Ok(resources)
    }

    /// Create modular content stream using the element streamer with layer support
    fn create_modular_content_stream(
        &mut self,
        bounds: (f64, f64, f64, f64),
    ) -> ConversionResult<Stream> {
        let (x, y, _width, _height) =
            self.apply_scale_bounds(bounds.0, bounds.1, bounds.2, bounds.3);

        let mut content = String::new();

        // Start graphics state
        content.push_str("q\n");

        // Apply coordinate transformation for bounds (cm matrix)
        content.push_str(&format!("1 0 0 1 {} {} cm\n", x, y));

        // Handle layered content using hipdf LayerContentBuilder
        // Make resource names available to the element streamer
        self.element_streamer
            .set_resource_cache(self.context.resource_cache.xobject_names.clone());
        self.element_streamer
            .set_embedded_pdfs(self.context.resource_cache.embedded_pdfs.clone());

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
                &mut self.document,
            )?;

            // Convert operations to content stream text
            for op in operations {
                content.push_str(&self.operation_to_string(&op));
                content.push('\n');
            }
        }

        // End graphics state
        content.push_str("Q\n");

        // Register any new XObjects (embedded PDFs) collected during streaming so create_page_resources can include them.
        for (name, obj_ref) in self.element_streamer.drain_new_xobjects() {
            if let Object::Reference((id, _gen)) = obj_ref {
                // Store under embedded_pdfs using name as key if not already stored
                self.context
                    .resource_cache
                    .embedded_pdfs
                    .insert(name.clone(), id);
                self.context
                    .resource_cache
                    .xobject_names
                    .insert(name.clone(), name.clone());
            }
        }

        let content_bytes = content.into_bytes();
        let mut stream_dict = Dictionary::new();
        stream_dict.set("Length", Object::Integer(content_bytes.len() as i64));

        Ok(Stream::new(stream_dict, content_bytes))
    }

    /// Stream elements organized by layers
    fn stream_elements_by_layer(
        &mut self,
        bounds: (f64, f64, f64, f64),
    ) -> ConversionResult<Vec<hipdf::lopdf::content::Operation>> {
        use hipdf::lopdf::content::Operation;

        let mut all_operations = Vec::new();

        // Pre-process PDF elements to ensure they're embedded
        let pdf_elements: Vec<_> =
            self.context
                .exported_data
                .elements
                .iter()
                .filter_map(|element_wrapper| {
                    if let DucElementEnum::DucPdfElement(pdf_elem) = &element_wrapper.element {
                        pdf_elem.file_id.as_ref().map(|file_id| {
                            (file_id.clone(), pdf_elem.base.width, pdf_elem.base.height)
                        })
                    } else {
                        None
                    }
                })
                .collect();
        for (file_id, width, height) in pdf_elements {
            self.embed_pdf_for_element(&file_id, width, height)?;
        }

        // Pass updated resource cache to element streamer
        self.element_streamer
            .set_resource_cache(self.context.resource_cache.xobject_names.clone());
        self.element_streamer
            .set_embedded_pdfs(self.context.resource_cache.embedded_pdfs.clone());

        // Stream unlayered elements first
        let unlayered_elements: Vec<ElementWrapper> = self
            .context
            .exported_data
            .elements
            .iter()
            .filter(|element_wrapper| {
                let base =
                    crate::builder::DucToPdfBuilder::get_element_base(&element_wrapper.element);
                let is_unlayered = base.layer_id.is_none();
                is_unlayered
            })
            .cloned()
            .collect();

        if !unlayered_elements.is_empty() {
            let ops = self.element_streamer.stream_elements_within_bounds(
                &unlayered_elements,
                bounds,
                &mut self.resource_streamer,
                &mut self.block_manager,
                &mut self.hatching_manager,
                &mut self.pdf_embedder,
                &self.ocg_manager,
                &mut self.document,
            )?;
            all_operations.extend(ops);
        }

        // Stream each layer with proper OCG marked content
        for layer in &self.context.exported_data.layers {
            let layer_elements: Vec<ElementWrapper> = self
                .context
                .exported_data
                .elements
                .iter()
                .filter(|element_wrapper| {
                    let base =
                        crate::builder::DucToPdfBuilder::get_element_base(&element_wrapper.element);
                    let matches = base
                        .layer_id
                        .as_ref()
                        .map_or(false, |layer_id| layer_id == &layer.id);

                    if matches {
                        // Additional bounds check for this specific content stream
                        let (bounds_x, bounds_y, bounds_width, bounds_height) = bounds;
                        let bounds_max_x = bounds_x + bounds_width;
                        let bounds_max_y = bounds_y + bounds_height;
                        let elem_max_x = base.x + base.width;
                        let elem_max_y = base.y + base.height;

                        let intersects = !(base.x > bounds_max_x
                            || elem_max_x < bounds_x
                            || base.y > bounds_max_y
                            || elem_max_y < bounds_y);

                        if intersects {
                            // Element intersects this content stream bounds
                        }
                        intersects
                    } else {
                        false
                    }
                })
                .cloned()
                .collect();

            if !layer_elements.is_empty() {
                // Begin marked content for layer using Properties name reference
                if let Some(prop_name) = self.layer_prop_names.get(&layer.id) {
                    all_operations.push(Operation::new(
                        "BDC",
                        vec![
                            Object::Name(b"OC".to_vec()),
                            // Use a name object that matches the Properties key (e.g., /OCG_1)
                            Object::Name(prop_name.as_bytes().to_vec()),
                        ],
                    ));
                }

                // Stream layer elements
                let layer_ops = self.element_streamer.stream_elements_within_bounds(
                    &layer_elements,
                    bounds,
                    &mut self.resource_streamer,
                    &mut self.block_manager,
                    &mut self.hatching_manager,
                    &mut self.pdf_embedder,
                    &self.ocg_manager,
                    &mut self.document,
                )?;
                all_operations.extend(layer_ops);

                // End marked content
                all_operations.push(Operation::new("EMC", vec![]));
            }
        }

        Ok(all_operations)
    }

    /// Convert PDF operation to string representation
    fn operation_to_string(&self, op: &hipdf::lopdf::content::Operation) -> String {
        fn obj_to_str(obj: &Object) -> String {
            match obj {
                Object::Null => "null".to_string(),
                Object::Boolean(b) => {
                    if *b {
                        "true".into()
                    } else {
                        "false".into()
                    }
                }
                Object::Integer(v) => format!("{}", v),
                Object::Real(v) => format!("{}", v),
                Object::Name(n) => format!("/{}", String::from_utf8_lossy(n)),
                Object::String(s, _) => format!("({})", String::from_utf8_lossy(s)),
                Object::Reference((id, gen)) => format!("{} {} R ", id, gen),
                Object::Array(arr) => {
                    let parts: Vec<String> = arr.iter().map(obj_to_str).collect();
                    format!("[{}]", parts.join(" "))
                }
                Object::Dictionary(dict) => {
                    // Serialize dictionary as << /Key value ... >>
                    let mut parts = String::new();
                    parts.push_str("<< ");
                    for (k, v) in dict.iter() {
                        parts.push_str(&format!(
                            "/{} {} ",
                            String::from_utf8_lossy(k),
                            obj_to_str(v)
                        ));
                    }
                    parts.push_str(">>");
                    parts
                }
                _ => "?".to_string(),
            }
        }

        let mut result = String::new();
        for operand in &op.operands {
            result.push_str(&obj_to_str(operand));
            result.push(' ');
        }
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
        self.document
            .save_to(&mut buffer)
            .map_err(|e| ConversionError::PdfGenerationError(e.to_string()))?;
        Ok(buffer)
    }

    /// Create the Pages tree structure
    fn create_pages_tree(&mut self) -> ConversionResult<()> {
        if self.page_ids.is_empty() {
            return Err(ConversionError::PdfGenerationError(
                "No pages created ".to_string(),
            ));
        }

        // Create page references array
        let page_refs: Vec<Object> = self
            .page_ids
            .iter()
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
            if let Ok(Object::Dictionary(ref mut page_dict)) =
                self.document.get_object_mut((page_id, 0))
            {
                page_dict.set("Parent", Object::Reference(pages_id));
            }
        }

        // Store the pages_id for the catalog
        self.document
            .trailer
            .set("Pages", Object::Reference(pages_id));

        Ok(())
    }

    /// Create the Root catalog
    fn create_root_catalog(&mut self) -> ConversionResult<()> {
        // Get the Pages reference from trailer
        let pages_ref = match self.document.trailer.get(b"Pages") {
            Ok(obj) => obj.clone(),
            Err(_) => {
                return Err(ConversionError::PdfGenerationError(
                    "Pages not found in trailer ".to_string(),
                ))
            }
        };

        // Create Root catalog dictionary
        let mut catalog = Dictionary::new();
        catalog.set("Type", Object::Name("Catalog".as_bytes().to_vec()));
        catalog.set("Pages", pages_ref);

        // Attach OCProperties (layers) if we have them
        if !self.layer_refs.is_empty() {
            // Build OCGs array
            let mut ocgs_array: Vec<Object> = Vec::new();
            let mut on_array: Vec<Object> = Vec::new();
            let mut off_array: Vec<Object> = Vec::new();

            for layer in &self.context.exported_data.layers {
                if let Some(ocg_ref) = self.layer_refs.get(&layer.id) {
                    ocgs_array.push(ocg_ref.clone());
                    if layer.stack_base.is_visible {
                        on_array.push(ocg_ref.clone());
                    } else {
                        off_array.push(ocg_ref.clone());
                    }
                }
            }

            let mut d_dict = Dictionary::new();
            d_dict.set("BaseState", Object::Name("ON".as_bytes().to_vec()));

            // Add Order array to define layer display order
            let mut order_array = Vec::new();
            for layer in &self.context.exported_data.layers {
                if let Some(ocg_ref) = self.layer_refs.get(&layer.id) {
                    order_array.push(ocg_ref.clone());
                }
            }
            d_dict.set("Order", Object::Array(order_array));

            // Add AS (Automatic State) array for better viewer support
            let mut as_array = Vec::new();
            let mut as_dict = Dictionary::new();
            as_dict.set("Event", Object::Name("View".as_bytes().to_vec()));
            as_dict.set("OCGs", Object::Array(ocgs_array.clone()));
            as_dict.set(
                "Category",
                Object::Array(vec![Object::Name("View".as_bytes().to_vec())]),
            );
            as_array.push(Object::Dictionary(as_dict));
            d_dict.set("AS", Object::Array(as_array));

            if !on_array.is_empty() {
                d_dict.set("ON", Object::Array(on_array));
            }
            if !off_array.is_empty() {
                d_dict.set("OFF", Object::Array(off_array));
            }

            let mut ocprops = Dictionary::new();
            ocprops.set("OCGs", Object::Array(ocgs_array));
            ocprops.set("D", Object::Dictionary(d_dict));

            catalog.set("OCProperties", Object::Dictionary(ocprops));
        }

        // Add Root catalog to document
        let catalog_id = self.document.add_object(Object::Dictionary(catalog));

        // Set Root in trailer
        self.document
            .trailer
            .set("Root", Object::Reference(catalog_id));

        Ok(())
    }
}
