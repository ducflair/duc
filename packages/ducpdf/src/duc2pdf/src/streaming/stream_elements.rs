// Leverage style resolver from utils to first get the adequate style for the element

// Then, based on the element type, stream the adequate PDF commands to represent it:
// DucRectangleElement, DucPolygonElement, DucEllipseElement, DucTextElement, DucLinearElement: these are pretty straightforward to stream as basic PDF drawing commands
// DucTableElement: stream as an actual table
// DucMermaidElement, DucFreedrawElement: stream as a pdf from the svg conversion we did into resources earlier

// DucEmbeddableElement, DucXRayElement, DucArrowElement: don't stream these, will just ignore them
// DucPdfElement: will use the hipdf::embed_pdf with combination of the resources we loaded earlier
// DucImageElement: stream an image using the resources we loaded earlier
// DucBlockInstance: stream the corresponding block as an instance we loaded earlier using hipdf::blocks
// DucFrameElement: stream as a simple rectangle but be careful since we need might need to clip, since this is a StackLike
// DucPlotElement: IF CROP: stream as a rectangle element but be careful since we need might need to clip, since this is a StackLike ELSE IF PLOTS: each plot element is an actual pdf document page so it is a little different, we grab the size of the plot and then create the page with the respective StackLike content and handling

// DucLeaderElement, DucDimensionElement, DucFeatureControlFrameElement: ⚠️ WIP, don't stream these for now
// DucViewportElement: ⚠️ WIP, don't stream these for now - stream as a linear element but be careful since we need might need to clip, since this is a StackLike
// DucDocElement: ⚠️ WIP, don't stream these for now - still provisioning
// DucParametricElement: ⚠️ WIP, don't stream these for now - still provisioning

// Process properly StackLike conditions such as clipping, visibility, opacity, blend modes, etc. (style overrides must have been handled in the style resolver in the beginning) these are StackLike:
// groups: [DucGroup];
// regions: [DucRegion];
// layers: [DucLayer];
// And also from the Elements pool: DucFrame, DucViewport and DucPlot

use crate::scaling::DucDataScaler;
use crate::streaming::pdf_linear::PdfLinearRenderer;
use crate::streaming::stream_resources::ResourceStreamer;
use crate::utils::freedraw_bounds::FreeDrawBounds;
use crate::utils::style_resolver::{ResolvedStyles, StyleResolver};
use crate::{ConversionError, ConversionResult};
use bigcolor::BigColor;
use duc::types::{
    BEZIER_MIRRORING, ELEMENT_CONTENT_PREFERENCE, STROKE_CAP, STROKE_JOIN, DucElementEnum,
    DucEllipseElement, DucFrameElement,
    DucFreeDrawElement, DucImageElement, DucLine, DucLineReference, DucLinearElement,
    DucLinearElementBase, DucPath, DucPdfElement, DucPlotElement, DucPoint,
    DucPolygonElement, DucRectangleElement, DucTableElement, DucTextElement, ElementBackground,
    ElementContentBase, ElementWrapper, GeometricPoint, DucBlockInstance, DucBlockDuplicationArray,
};

use hipdf::embed_pdf::PdfEmbedder;
use hipdf::fonts::Font;
use hipdf::hatching::HatchingManager;
use hipdf::images::ImageManager;
use hipdf::lopdf::content::Operation;
use hipdf::lopdf::{Dictionary, Document, Object};
use hipdf::ocg::OCGManager;
use std::collections::{BTreeSet, HashMap, HashSet};
use std::f64::consts::PI;
use wasm_bindgen::JsValue;

const DUC_STANDARD_PRIMARY_COLOR: &str = "oklch(62% 0.15 281)";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct OpacityKey {
    stroke_thousandths: u16,
    fill_thousandths: u16,
}

#[derive(Debug, Clone, Copy)]
struct StyleProfile {
    use_background_fill: bool,
    fill_from_stroke: bool,
    apply_stroke_properties: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum StreamMode {
    Crop,
    Plot,
}

/// Element streaming context for rendering DUC elements to PDF
pub struct ElementStreamer {
    style_resolver: StyleResolver,
    /// Page height for coordinate transformation from top-left to bottom-left origin
    page_height: f64,
    /// Absolute origin of the current page prior to page-level transformation (bounds.x, bounds.y)
    page_origin: (f64, f64),
    /// Page-level translation applied in the content stream
    page_translation: (f64, f64),
    /// Cache for external resources (images, SVGs, PDFs, etc.)
    resource_cache: HashMap<String, String>, // resource_id -> XObject name
    /// Cache for image IDs from ImageManager
    images: HashMap<String, u32>, // file_id -> image_id
    /// Newly embedded XObject resources produced while streaming (name -> reference)
    new_xobjects: Vec<(String, Object)>,
    /// Reference to embedded PDFs to check if file is SVG-converted PDF
    embedded_pdfs: HashMap<String, u32>, // file_id -> object_id
    /// Cache for freedraw bounding boxes calculated during preprocessing
    freedraw_bboxes: HashMap<String, FreeDrawBounds>, // freedraw_id -> cached bounding box
    /// Cache for SVG natural dimensions for scaling calculations
    svg_dimensions: HashMap<String, (f64, f64)>, // svg_id -> (width, height) in natural SVG units
    /// Font resource name for text rendering (fallback/primary)
    font_resource_name: String,
    /// Active font used for text rendering and encoding (fallback/primary)
    text_font: Font,
    /// Map of font family name → (Font, resource_name) for per-element font selection
    font_map: HashMap<String, (Font, String)>,
    /// Map of block instances for looking up duplication arrays
    block_instances: HashMap<String, DucBlockInstance>,
    /// Whether we should require elements to be marked as "plot" to be rendered
    render_only_plot_elements: bool,
    /// Cached ExtGState names keyed by stroke/fill opacity thousandths
    ext_gstate_cache: HashMap<OpacityKey, String>,
    /// Stored ExtGState dictionaries keyed by their resource name
    ext_gstate_definitions: HashMap<String, Dictionary>,
    /// Names of ExtGStates referenced while streaming the current page
    current_page_ext_gstates: BTreeSet<String>,
    /// Active streaming mode for the current page
    current_mode: StreamMode,
    /// Plot identifier for the current page when in plot mode
    current_plot_id: Option<String>,
    /// Allowed element identifiers constrained by the current page context
    allowed_element_ids: Option<HashSet<String>>,
}

impl ElementStreamer {
    /// Create new element streamer
    pub fn new(
        style_resolver: StyleResolver,
        page_height: f64,
        font_resource_name: String,
        text_font: Font,
        block_instances: HashMap<String, DucBlockInstance>,
        font_map: HashMap<String, (Font, String)>,
    ) -> Self {
        Self {
            style_resolver,
            page_height,
            page_origin: (0.0, 0.0),
            page_translation: (0.0, 0.0),
            resource_cache: HashMap::new(),
            images: HashMap::new(),
            new_xobjects: Vec::new(),
            embedded_pdfs: HashMap::new(),
            freedraw_bboxes: HashMap::new(),
            svg_dimensions: HashMap::new(),
            font_resource_name,
            text_font,
            font_map,
            block_instances,
            render_only_plot_elements: false,
            ext_gstate_cache: HashMap::new(),
            ext_gstate_definitions: HashMap::new(),
            current_page_ext_gstates: BTreeSet::new(),
            current_mode: StreamMode::Crop,
            current_plot_id: None,
            allowed_element_ids: None,
        }
    }

    /// Calculate duplication offsets for block instance grid rendering
    /// Returns a vector of (x_offset, y_offset) tuples for each grid position
    /// The first offset is always (0.0, 0.0) representing the original position
    pub fn get_duplication_offsets(
        duplication_array: &DucBlockDuplicationArray,
        element_width: f64,
        element_height: f64,
    ) -> Vec<(f64, f64)> {
        if duplication_array.row_spacing.is_nan() || duplication_array.col_spacing.is_nan() {

             log::warn!(
                "Duplication array has NaN spacing! row_spacing: {}, col_spacing: {}",
                duplication_array.row_spacing,
                duplication_array.col_spacing
            );
        }

        let rows = duplication_array.rows.max(1) as usize;
        let cols = duplication_array.cols.max(1) as usize;
        let row_spacing = duplication_array.row_spacing;
        let col_spacing = duplication_array.col_spacing;

        let stride_x = element_width + col_spacing;
        let stride_y = element_height + row_spacing;

        let mut offsets = Vec::with_capacity(rows * cols);
        for row in 0..rows {
            for col in 0..cols {
                let x_offset = col as f64 * stride_x;
                let y_offset = row as f64 * stride_y;
                offsets.push((x_offset, y_offset));
            }
        }
        offsets
    }

    /// Get duplication offsets for an element by looking up its block instance
    /// Returns None if element has no instance_id or no duplication array
    pub fn get_element_duplication_offsets(
        &self,
        element: &DucElementEnum,
    ) -> Option<Vec<(f64, f64)>> {
        let base = Self::get_element_base(element);
        let instance_id = base.instance_id.as_ref()?;

        // Look up the block instance from self.block_instances
        if let Some(block_instance) = self.block_instances.get(instance_id) {
            if let Some(dup_array) = &block_instance.duplication_array {
                // Only return offsets if there's more than one copy to render
                if dup_array.rows > 1 || dup_array.cols > 1 {

                    // Attempt to extract dimensions from the element
                    // This allows "gap" spacing: offset = index * (size + spacing)
                    let (width, height) = match element {
                        DucElementEnum::DucRectangleElement(r) => (r.base.width, r.base.height),
                        DucElementEnum::DucEllipseElement(e) => (e.base.width, e.base.height),
                        DucElementEnum::DucImageElement(i) => (i.base.width, i.base.height),
                        DucElementEnum::DucFrameElement(f) => (f.stack_element_base.base.width, f.stack_element_base.base.height),
                        DucElementEnum::DucPlotElement(p) => (p.stack_element_base.base.width, p.stack_element_base.base.height),
                        DucElementEnum::DucTableElement(t) => (t.base.width, t.base.height),
                        DucElementEnum::DucDocElement(d) => (d.base.width, d.base.height),
                        DucElementEnum::DucEmbeddableElement(e) => (e.base.width, e.base.height),
                        DucElementEnum::DucPolygonElement(p) => (p.base.width, p.base.height),
                        DucElementEnum::DucTextElement(t) => (t.base.width, t.base.height),
                        DucElementEnum::DucFreeDrawElement(f) => (f.base.width, f.base.height),
                        DucElementEnum::DucLinearElement(l) => (l.linear_base.base.width, l.linear_base.base.height),
                        DucElementEnum::DucArrowElement(a) => (a.linear_base.base.width, a.linear_base.base.height),
                        DucElementEnum::DucPdfElement(p) => (p.base.width, p.base.height),
                        DucElementEnum::DucModelElement(m) => (m.base.width, m.base.height),
                    };

                    return Some(Self::get_duplication_offsets(dup_array, width, height));
                }
            }
        } else {
             log::info!("Element refers to instance {} which is missing from block_instances!", instance_id);
        }
        None
    }

    /// Update the active font used for text rendering
    pub fn set_text_font(&mut self, font_resource_name: String, font: Font) {
        self.font_resource_name = font_resource_name;
        self.text_font = font;
    }

    /// Set resource cache for external resources
    pub fn set_resource_cache(&mut self, cache: HashMap<String, String>) {
        self.resource_cache = cache;
    }

    /// Add image ID to cache
    pub fn add_image(&mut self, file_id: String, image_id: u32) {
        self.images.insert(file_id, image_id);
    }

    /// Set embedded PDF cache
    pub fn set_embedded_pdfs(&mut self, embedded_pdfs: HashMap<String, u32>) {
        self.embedded_pdfs = embedded_pdfs;
    }

    /// Set image cache from resource cache
    pub fn set_images(&mut self, images: HashMap<String, u32>) {
        self.images = images;
    }

    /// Set freedraw bounding box cache from preprocessing
    pub fn set_freedraw_bboxes(&mut self, freedraw_bboxes: HashMap<String, FreeDrawBounds>) {
        self.freedraw_bboxes = freedraw_bboxes;
    }

    /// Set SVG dimensions cache from preprocessing
    pub fn set_svg_dimensions(&mut self, svg_dimensions: HashMap<String, (f64, f64)>) {
        self.svg_dimensions = svg_dimensions;
    }

    /// Set page height for coordinate transformation
    pub fn set_page_height(&mut self, page_height: f64) {
        self.page_height = page_height;
    }

    /// Record the page origin (bounds.x, bounds.y) for the current content stream
    pub fn set_page_origin(&mut self, origin_x: f64, origin_y: f64) {
        self.page_origin = (origin_x, origin_y);
    }

    /// Record the page-level translation applied in the content stream
    pub fn set_page_translation(&mut self, tx: f64, ty: f64) {
        self.page_translation = (tx, ty);
    }

    /// Control whether only elements flagged as plot should be rendered
    pub fn set_render_only_plot_elements(&mut self, value: bool) {
        self.render_only_plot_elements = value;
    }

    /// Configure the streamer for the current page context
    pub fn set_page_context(
        &mut self,
        is_plot_mode: bool,
        active_plot_id: Option<&str>,
        allowed_element_ids: Option<HashSet<String>>,
    ) {
        self.current_mode = if is_plot_mode {
            StreamMode::Plot
        } else {
            StreamMode::Crop
        };
        self.current_plot_id = active_plot_id.map(|id| id.to_string());
        self.allowed_element_ids = allowed_element_ids;
    }

    /// Reset the streamer context after finishing a page
    pub fn clear_page_context(&mut self) {
        self.current_mode = StreamMode::Crop;
        self.current_plot_id = None;
        self.allowed_element_ids = None;
    }

    /// Stream elements within specified bounds with local state for scroll positioning
    pub fn stream_elements_within_bounds(
        &mut self,
        elements: &[ElementWrapper],
        all_elements: &[ElementWrapper],
        bounds: (f64, f64, f64, f64),
        local_state: Option<&duc::types::DucLocalState>,
        resource_streamer: &mut ResourceStreamer,

        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
        image_manager: &mut ImageManager,
        ocg_manager: &OCGManager,
        document: &mut Document,
    ) -> ConversionResult<Vec<Operation>> {
        let mut all_operations = Vec::new();
        let is_plot_mode = matches!(self.current_mode, StreamMode::Plot);
        let (_bounds_x, _bounds_y, _bounds_width, _bounds_height) = bounds;



        // Filter and sort elements by z-index and visibility criteria
        let mut filtered_elements: Vec<_> = elements
            .iter()
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);

                if !self.should_render_element(base) {
                    return false;
                }

                if !is_plot_mode {
                    return true;
                }

                if let Some(allowed_ids) = &self.allowed_element_ids {
                    allowed_ids.contains(base.id.as_str())
                } else {
                    true
                }
            })
            .filter(|element_wrapper| {
                if is_plot_mode {
                    return true;
                }

                let base = Self::get_element_base(&element_wrapper.element);

                // CROP mode: check bounds intersection with scroll offset applied
                if base.layer_id.is_some() {
                    return true;
                }

                true
            })
            .collect();

        // Sort by z-index (lower values render first)
        filtered_elements.sort_by(|a, b| {
            let base_a = Self::get_element_base(&a.element);
            let base_b = Self::get_element_base(&b.element);
            base_a
                .z_index
                .partial_cmp(&base_b.z_index)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // Stream elements in z-index order
        for element_wrapper in filtered_elements {
            let base = Self::get_element_base(&element_wrapper.element);

            // Apply layer visibility if the element has layer information
            if let Some(layer_id) = &base.layer_id {
                // Check if this layer should be visible using the OCG manager
                let is_layer_visible = self.is_layer_visible(ocg_manager, layer_id)?;

                if !is_layer_visible {
                    continue; // Skip invisible layers
                }

                // Note: OCG layer operations will be handled by LayerContentBuilder
                // when we build the layer content in the builder.rs
                // We just need to track which elements belong to which layers
            }

            // Handle clipping if element has a frame_id
            let mut clip_applied = false;
            if let Some(frame_id) = &base.frame_id {
                let (clipping_ops, clip_active) =
                    self.handle_frame_clipping(frame_id, all_elements, bounds, local_state)?;
                if !clipping_ops.is_empty() {
                    all_operations.extend(clipping_ops);
                }
                clip_applied = clip_active;
            }

            // Get duplication offsets (default to single (0,0) if none)
            let offsets = self
                .get_element_duplication_offsets(&element_wrapper.element)
                .unwrap_or_else(|| vec![(0.0, 0.0)]);

            for (x_off, y_off) in offsets {
                // Stream the element with duplication offset applied AFTER its own transform
                // so the offset is not rotated or scaled by the element transform.
                let element_ops = self.stream_element_with_resources(
                    &element_wrapper.element,
                    local_state,
                    all_elements,
                    document,
                    resource_streamer,
                    hatching_manager,
                    pdf_embedder,
                    image_manager,
                    Some((x_off, y_off)),
                )?;

                all_operations.extend(element_ops);
            }

            // Restore graphics state if clipping was applied
            if clip_applied {
                all_operations.push(Operation::new("Q", vec![])); // Restore graphics state
                all_operations.push(Operation::new("% Clipping state restored", vec![]));
            }

            // Note: Layer marked content sequences are now handled by LayerContentBuilder
            // The EMC (end marked content) operations will be added automatically
        }

        Ok(all_operations)
    }

    /// Stream a single element with resource managers and local state
    fn stream_element_with_resources(
        &mut self,
        element: &DucElementEnum,
        local_state: Option<&duc::types::DucLocalState>,
        all_elements: &[ElementWrapper],
        document: &mut Document,
        resource_streamer: &mut ResourceStreamer,

        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
        image_manager: &mut ImageManager,
        duplication_offset: Option<(f64, f64)>,
    ) -> ConversionResult<Vec<Operation>> {
        let mut operations = Vec::new();
        let is_plot_mode = matches!(self.current_mode, StreamMode::Plot);

        // Save graphics state for all elements (including PDFs)
        operations.push(Operation::new("q", vec![]));

        // Apply transformation (position, rotation) with scroll offset
        let base = Self::get_element_base(element);
        let center_override = Self::compute_element_center_override(element);
        if base.x != 0.0 || base.y != 0.0 || base.angle != 0.0 {
            let transform_ops = if is_plot_mode && base.frame_id.is_some() {
                // This is a child element of a plot/ frame, use relative positioning
                // Find the parent plot element to get its position
                if let Some((
                    (parent_x, parent_y, parent_width, parent_height),
                    margins,
                    clip_active,
                    is_frame_parent,
                )) = self.find_parent_plot_bounds(element, all_elements)
                {
                    self.create_transformation_matrix_for_plot_child(
                        base,
                        parent_x,
                        parent_y,
                        parent_width,
                        parent_height,
                        margins,
                        clip_active,
                        is_frame_parent,
                        center_override,
                    )
                } else {
                    // Fallback to regular transformation if parent not found
                    self.create_transformation_matrix_with_scroll(
                        base,
                        if is_plot_mode { None } else { local_state },
                        center_override,
                    )
                }
            } else {
                // Regular element, use standard transformation
                self.create_transformation_matrix_with_scroll(
                    base,
                    if is_plot_mode { None } else { local_state },
                    center_override,
                )
            };
            operations.extend(transform_ops);
        }

        // Apply duplication offset AFTER the element's own transform so it is not rotated
        // or scaled by the element transform. PDF Y axis is inverted, so negate Y.
        if let Some((x_off, y_off)) = duplication_offset {
            if x_off != 0.0 || y_off != 0.0 {
                operations.push(Operation::new(
                    "cm",
                    vec![
                        Object::Real(1.0),
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(1.0),
                        Object::Real(x_off as f32),
                        Object::Real((-y_off) as f32),
                    ],
                ));
            }
        }

        // Special handling: PDF elements - do not apply styles to avoid affecting embedded content
        let styles = self.style_resolver.resolve_styles(element);

        let is_pdf = matches!(element, DucElementEnum::DucPdfElement(_));
        if !is_pdf {
            let style_ops = self.apply_styles(element, &styles)?;
            operations.extend(style_ops);
        }

        // Render element based on type using appropriate managers
        let element_ops = match element {
            DucElementEnum::DucRectangleElement(rect) => {
                self.stream_rectangle(rect, hatching_manager)?
            }
            DucElementEnum::DucPolygonElement(polygon) => self.stream_polygon(polygon)?,
            DucElementEnum::DucEllipseElement(ellipse) => self.stream_ellipse(ellipse)?,
            DucElementEnum::DucTextElement(text) => self.stream_text(text)?,
            DucElementEnum::DucLinearElement(linear) => self.stream_linear(linear)?,
            DucElementEnum::DucTableElement(table) => self.stream_table(table)?,
            DucElementEnum::DucFreeDrawElement(freedraw) => {
                self.stream_freedraw(freedraw, &styles, document, pdf_embedder, resource_streamer)?
            }
            DucElementEnum::DucPdfElement(pdf) => {
                self.stream_pdf_element(pdf, document, pdf_embedder)?
            }
            DucElementEnum::DucImageElement(image) => self.stream_image(
                image,
                document,
                pdf_embedder,
                image_manager,
                resource_streamer,
            )?,
            DucElementEnum::DucFrameElement(frame) => self.stream_frame(frame)?,
            DucElementEnum::DucPlotElement(plot) => self.stream_plot(plot)?,

            // Ignored elements (as per specifications)
            DucElementEnum::DucEmbeddableElement(_) => vec![], // Ignore
            DucElementEnum::DucArrowElement(_) => vec![],      // Ignore
            DucElementEnum::DucDocElement(_) => {
                vec![Operation::new("% DucDocElement - WIP", vec![])]
            }
            DucElementEnum::DucModelElement(_) => {
                vec![Operation::new("% DucModelElement - WIP", vec![])]
            }
        };
        operations.extend(element_ops);

        // Restore graphics state for all elements
        operations.push(Operation::new("Q", vec![]));

        Ok(operations)
    }

    /// Get element base (extracted from builder for reuse)
    fn get_element_base(element: &DucElementEnum) -> &duc::types::DucElementBase {
        match element {
            DucElementEnum::DucRectangleElement(elem) => &elem.base,
            DucElementEnum::DucPolygonElement(elem) => &elem.base,
            DucElementEnum::DucEllipseElement(elem) => &elem.base,
            DucElementEnum::DucEmbeddableElement(elem) => &elem.base,
            DucElementEnum::DucPdfElement(elem) => &elem.base,
            DucElementEnum::DucTableElement(elem) => &elem.base,
            DucElementEnum::DucImageElement(elem) => &elem.base,
            DucElementEnum::DucTextElement(elem) => &elem.base,
            DucElementEnum::DucLinearElement(elem) => &elem.linear_base.base,
            DucElementEnum::DucArrowElement(elem) => &elem.linear_base.base,
            DucElementEnum::DucFreeDrawElement(elem) => &elem.base,
            DucElementEnum::DucFrameElement(elem) => &elem.stack_element_base.base,
            DucElementEnum::DucPlotElement(elem) => &elem.stack_element_base.base,
            DucElementEnum::DucDocElement(elem) => &elem.base,
            DucElementEnum::DucModelElement(elem) => &elem.base,
        }
    }

    pub fn should_render_element(&self, base: &duc::types::DucElementBase) -> bool {
        if !base.is_visible || base.is_deleted {
            return false;
        }

        if self.render_only_plot_elements {
            base.is_plot
        } else {
            true
        }
    }

    /// Find the parent plot element bounds for a given element
    fn find_parent_plot_bounds(
        &self,
        element: &DucElementEnum,
        all_elements: &[ElementWrapper],
    ) -> Option<(
        (f64, f64, f64, f64),
        Option<(f64, f64, f64, f64)>,
        bool,
        bool, // is_frame_parent
    )> {
        let base = Self::get_element_base(element);

        if let Some(frame_id) = &base.frame_id {
            // Find the parent plot element by ID
            for element_wrapper in all_elements {
                let wrapper_base = Self::get_element_base(&element_wrapper.element);

                if wrapper_base.id == *frame_id {
                    // Check if this is a plot element
                    if let DucElementEnum::DucPlotElement(plot) = &element_wrapper.element {
                        let plot_base = &plot.stack_element_base.base;
                        let margins = Some((
                            plot.layout.margins.left,
                            plot.layout.margins.top,
                            plot.layout.margins.right,
                            plot.layout.margins.bottom,
                        ));
                        return Some((
                            (plot_base.x, plot_base.y, plot_base.width, plot_base.height),
                            margins,
                            plot.stack_element_base.clip,
                            false, // This is a plot parent
                        ));
                    }
                    // Also check for frame elements (they can act as containers too)
                    else if let DucElementEnum::DucFrameElement(frame) = &element_wrapper.element
                    {
                        let frame_base = &frame.stack_element_base.base;
                        return Some((
                            (
                                frame_base.x,
                                frame_base.y,
                                frame_base.width,
                                frame_base.height,
                            ),
                            None,
                            frame.stack_element_base.clip,
                            true, // This is a frame parent
                        ));
                    }
                }
            }
        }

        None
    }

    /// Check if layer exists in OCG manager
    fn is_layer_visible(&self, ocg_manager: &OCGManager, layer_id: &str) -> ConversionResult<bool> {
        // If OCG manager isn't populated, don't hide content
        if ocg_manager.get_layer(layer_id).is_none() {
            return Ok(true);
        }
        Ok(true)
    }

    /// Handle frame clipping for elements
    fn handle_frame_clipping(
        &self,
        frame_id: &str,
        all_elements: &[ElementWrapper],
        _bounds: (f64, f64, f64, f64),
        local_state: Option<&duc::types::DucLocalState>,
    ) -> ConversionResult<(Vec<Operation>, bool)> {
        let mut ops = Vec::new();
        let mut clip_applied = false;

        // Find the frame element by ID
        let is_plot_mode = matches!(self.current_mode, StreamMode::Plot);
        let (scroll_x, scroll_y) = if is_plot_mode {
            (0.0, 0.0)
        } else if let Some(state) = local_state {
            (state.scroll_x, state.scroll_y)
        } else {
            (0.0, 0.0)
        };

        if let Some(frame_wrapper) = all_elements.iter().find(|wrapper| {
            let base = Self::get_element_base(&wrapper.element);
            base.id == frame_id
        }) {
            match &frame_wrapper.element {
                DucElementEnum::DucFrameElement(frame) => {
                    if frame.stack_element_base.clip {
                        let base = &frame.stack_element_base.base;
                        let width = base.width;
                        let height = base.height;

                        // Calculate stroke width if present (inset clipping to prevent stroke from being clipped)
                        let stroke_inset = if let Some(stroke) = base.styles.stroke.first() {
                            if stroke.content.visible {
                                stroke.width / 2.0 // Inset by half stroke width so stroke extends outward
                            } else {
                                0.0
                            }
                        } else {
                            0.0
                        };

                        ops.push(Operation::new("q", vec![]));
                        clip_applied = true;

                        if is_plot_mode {
                            let x = base.x;
                            let y = base.y;

                            // Transform frame position to PDF coordinates
                            let plot_y = self.page_origin.1;
                            let pdf_x = x;
                            let pdf_y = self.page_height - y + (2.0 * plot_y);

                            // Translate to frame origin in PDF coordinates so plot children
                            // remain in the same coordinate space as the clipping region.
                            ops.push(Operation::new(
                                "cm",
                                vec![
                                    Object::Real(1.0),
                                    Object::Real(0.0),
                                    Object::Real(0.0),
                                    Object::Real(1.0),
                                    Object::Real(pdf_x as f32),
                                    Object::Real(pdf_y as f32),
                                ],
                            ));

                            // Inset clipping rect by stroke width to prevent border clipping
                            ops.push(Operation::new(
                                "re",
                                vec![
                                    Object::Real(stroke_inset as f32),
                                    Object::Real(-(stroke_inset as f32)),
                                    Object::Real((width - 2.0 * stroke_inset) as f32),
                                    Object::Real(-(height - 2.0 * stroke_inset) as f32),
                                ],
                            ));
                            ops.push(Operation::new("W", vec![]));
                            ops.push(Operation::new("n", vec![]));
                            ops.push(Operation::new(
                                &format!(
                                    "% Clipping active for frame (PDF coords): {} at ({}, {}) (w={}, h={}, inset={})",
                                    frame_id, pdf_x, pdf_y, width, height, stroke_inset
                                ),
                                vec![],
                            ));
                        } else {
                            let clip_x = base.x + scroll_x + stroke_inset;
                            let clip_y = base.y + scroll_y + stroke_inset;
                            let clip_width = width - 2.0 * stroke_inset;
                            let clip_height = height - 2.0 * stroke_inset;
                            let pdf_y = DucDataScaler::transform_y_coordinate_to_pdf_system(
                                clip_y,
                                clip_height,
                                self.page_height,
                            );

                            ops.push(Operation::new(
                                "re",
                                vec![
                                    Object::Real(clip_x as f32),
                                    Object::Real(pdf_y as f32),
                                    Object::Real(clip_width as f32),
                                    Object::Real(clip_height as f32),
                                ],
                            ));
                            ops.push(Operation::new("W", vec![]));
                            ops.push(Operation::new("n", vec![]));
                            ops.push(Operation::new(
                                &format!(
                                    "% Clipping active for frame (absolute coords): {} (w={}, h={}, inset={})",
                                    frame_id, width, height, stroke_inset
                                ),
                                vec![],
                            ));
                        }
                    }
                }
                DucElementEnum::DucPlotElement(plot) => {
                    if plot.stack_element_base.clip {
                        let base = &plot.stack_element_base.base;

                        let ml = plot.layout.margins.left;
                        let mt = plot.layout.margins.top;
                        let mr = plot.layout.margins.right;
                        let mb = plot.layout.margins.bottom;
                        let width = base.width - (ml + mr);
                        let height = base.height - (mt + mb);

                        ops.push(Operation::new("q", vec![]));
                        clip_applied = true;

                        if is_plot_mode {
                            let tx = base.x + ml;
                            let ty = base.y + mt;

                            // Translate to plot content origin (after margins)
                            ops.push(Operation::new(
                                "cm",
                                vec![
                                    Object::Real(1.0),
                                    Object::Real(0.0),
                                    Object::Real(0.0),
                                    Object::Real(1.0),
                                    Object::Real(tx as f32),
                                    Object::Real(ty as f32),
                                ],
                            ));
                            ops.push(Operation::new(
                                "re",
                                vec![
                                    Object::Real(0.0),
                                    Object::Real(0.0),
                                    Object::Real(width as f32),
                                    Object::Real(height as f32),
                                ],
                            ));
                            ops.push(Operation::new("W", vec![]));
                            ops.push(Operation::new("n", vec![]));
                            ops.push(Operation::new(
                                &format!(
                                    "% Clipping active for plot (local content): {} (w={}, h={})",
                                    frame_id, width, height
                                ),
                                vec![],
                            ));
                        } else {
                            let clip_x = base.x + ml + scroll_x;
                            let clip_y = base.y + mt + scroll_y;
                            let pdf_y = DucDataScaler::transform_y_coordinate_to_pdf_system(
                                clip_y,
                                height,
                                self.page_height,
                            );

                            ops.push(Operation::new(
                                "re",
                                vec![
                                    Object::Real(clip_x as f32),
                                    Object::Real(pdf_y as f32),
                                    Object::Real(width as f32),
                                    Object::Real(height as f32),
                                ],
                            ));
                            ops.push(Operation::new("W", vec![]));
                            ops.push(Operation::new("n", vec![]));
                            ops.push(Operation::new(
                                &format!(
                                    "% Clipping active for plot (absolute content): {} (w={}, h={})",
                                    frame_id, width, height
                                ),
                                vec![],
                            ));
                        }
                    }
                }
                _ => {}
            }
        } else {
            // Frame not found, add warning
            ops.push(Operation::new(
                &format!("% Warning: Frame '{}' not found for clipping", frame_id),
                vec![],
            ));
        }

        Ok((ops, clip_applied))
    }

    fn compute_element_center_override(element: &DucElementEnum) -> Option<(f64, f64)> {
        match element {
            DucElementEnum::DucLinearElement(linear) => {
                Self::compute_linear_center(&linear.linear_base)
            }
            DucElementEnum::DucPolygonElement(polygon) => {
                // Rotate regular polygons around the centre of the bounding ellipse to keep
                // inscribed shapes aligned regardless of the number of sides. Odd-sided
                // polygons are vertically asymmetric when their top vertex is pinned at
                // 12 o'clock, so using the geometry bounds would introduce an off-centre
                // pivot and cause drift when an element rotation is applied.
                Some((polygon.base.width / 2.0, -(polygon.base.height / 2.0)))
            }
            DucElementEnum::DucEllipseElement(ellipse) => {
                let linear = Self::convert_ellipse_to_linear_element(ellipse);
                Self::compute_linear_center(&linear.linear_base)
            }
            _ => None,
        }
    }

    fn compute_linear_center(linear_base: &duc::types::DucLinearElementBase) -> Option<(f64, f64)> {
        if linear_base.points.is_empty() {
            return None;
        }

        let mut min_x = f64::INFINITY;
        let mut min_y = f64::INFINITY;
        let mut max_x = f64::NEG_INFINITY;
        let mut max_y = f64::NEG_INFINITY;

        for point in &linear_base.points {
            let x = point.x;
            let y = -point.y;
            if !x.is_finite() || !y.is_finite() {
                continue;
            }
            min_x = min_x.min(x);
            min_y = min_y.min(y);
            max_x = max_x.max(x);
            max_y = max_y.max(y);
        }

        for line in &linear_base.lines {
            if let Some(handle) = &line.start.handle {
                let x = handle.x;
                let y = -handle.y;
                if x.is_finite() && y.is_finite() {
                    min_x = min_x.min(x);
                    min_y = min_y.min(y);
                    max_x = max_x.max(x);
                    max_y = max_y.max(y);
                }
            }
            if let Some(handle) = &line.end.handle {
                let x = handle.x;
                let y = -handle.y;
                if x.is_finite() && y.is_finite() {
                    min_x = min_x.min(x);
                    min_y = min_y.min(y);
                    max_x = max_x.max(x);
                    max_y = max_y.max(y);
                }
            }
        }

        if !min_x.is_finite() || !min_y.is_finite() || !max_x.is_finite() || !max_y.is_finite() {
            return None;
        }

        Some(((min_x + max_x) / 2.0, (min_y + max_y) / 2.0))
    }

    /// Create transformation matrix operations with scroll offset
    fn create_transformation_matrix(
        &self,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        angle: f64,
        center_override: Option<(f64, f64)>,
    ) -> Vec<Operation> {
        let mut ops = Vec::new();

        // 1. Translate element to its final position
        ops.push(Operation::new(
            "cm",
            vec![
                Object::Real(1.0),
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(1.0),
                Object::Real(x as f32),
                Object::Real(y as f32),
            ],
        ));

        // 2. Rotate around the element's local origin (0,0)
        if angle != 0.0 {
            let (center_x, center_y) = center_override.unwrap_or((width / 2.0, -height / 2.0));

            // Translate to center for rotation
            ops.push(Operation::new(
                "cm",
                vec![
                    Object::Real(1.0),
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(1.0),
                    Object::Real(center_x as f32),
                    Object::Real(center_y as f32),
                ],
            ));

            // Rotate
            let negated_angle = -angle;
            let cos_a = negated_angle.cos();
            let sin_a = negated_angle.sin();
            ops.push(Operation::new(
                "cm",
                vec![
                    Object::Real(cos_a as f32),
                    Object::Real(sin_a as f32),
                    Object::Real(-sin_a as f32),
                    Object::Real(cos_a as f32),
                    Object::Real(0.0),
                    Object::Real(0.0),
                ],
            ));

            // Translate back from center
            ops.push(Operation::new(
                "cm",
                vec![
                    Object::Real(1.0),
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(1.0),
                    Object::Real(-center_x as f32),
                    Object::Real(-center_y as f32),
                ],
            ));
        }

        ops
    }

    /// Create transformation matrix operations with scroll offset applied
    fn create_transformation_matrix_with_scroll(
        &self,
        base: &duc::types::DucElementBase,
        local_state: Option<&duc::types::DucLocalState>,
        center_override: Option<(f64, f64)>,
    ) -> Vec<Operation> {
        let (scroll_x, scroll_y) = if let Some(state) = local_state {
            (state.scroll_x, state.scroll_y)
        } else {
            (0.0, 0.0)
        };

        // Apply scroll offset to the coordinates
        let adjusted_x = base.x + scroll_x;
        let adjusted_y = base.y + scroll_y;

        // Transform y-coordinate from top-left (duc) to bottom-left (PDF) origin
        let transformed_y =
            DucDataScaler::transform_point_y_to_pdf_system(adjusted_y, self.page_height);

        self.create_transformation_matrix(
            adjusted_x,
            transformed_y,
            base.width,
            base.height,
            base.angle,
            center_override,
        )
    }

    /// Create transformation matrix operations for child elements relative to their parent plot
    fn create_transformation_matrix_for_plot_child(
        &self,
        base: &duc::types::DucElementBase,
        parent_x: f64,
        parent_y: f64,
        parent_width: f64,
        parent_height: f64,
        parent_margins: Option<(f64, f64, f64, f64)>,
        parent_clip_active: bool,
        is_frame_parent: bool,
        center_override: Option<(f64, f64)>,
    ) -> Vec<Operation> {
        let (translation_x, translation_y) = self.compute_plot_child_translation(
            base,
            parent_x,
            parent_y,
            parent_width,
            parent_height,
            parent_margins,
            parent_clip_active,
            is_frame_parent,
        );

        self.create_transformation_matrix(
            translation_x,
            translation_y,
            base.width,
            base.height,
            base.angle,
            center_override,
        )
    }

    fn compute_plot_child_translation(
        &self,
        base: &duc::types::DucElementBase,
        parent_x: f64,
        parent_y: f64,
        _parent_width: f64,
        _parent_height: f64,
        parent_margins: Option<(f64, f64, f64, f64)>,
        parent_clip_active: bool,
        is_frame_parent: bool,
    ) -> (f64, f64) {
        let plot_y = self.page_origin.1;

        if is_frame_parent && parent_clip_active {
            // For frame parents with clipping in PLOT mode:
            // The clipping has already translated to (pdf_x, pdf_y) where:
            // pdf_x = parent_x
            // pdf_y = page_height - parent_y + (2.0 * plot_y)
            // So child elements need to be positioned relative to the frame's origin at (0, 0)
            // in the transformed coordinate system

            let translation_x = base.x - parent_x;
            let translation_y = -(base.y - parent_y); // Negative because PDF Y increases downward

            (translation_x, translation_y)
        } else {
            // For plot parents with margins/clipping
            let (ml, mt, _mr, _mb) = if parent_clip_active {
                parent_margins.unwrap_or((0.0, 0.0, 0.0, 0.0))
            } else {
                (0.0, 0.0, 0.0, 0.0)
            };

            let clip_translation_x = if parent_clip_active {
                parent_x + ml
            } else {
                0.0
            };

            let clip_translation_y = if parent_clip_active {
                parent_y + mt
            } else {
                0.0
            };

            // For plot children, use the existing logic
            // The global page transformation has already been applied in create_content_stream
            // which translates by (-bounds_x, -bounds_y) where bounds are the plot bounds
            // So we need to compute the child's position relative to the already-translated plot position
            let translation_x = base.x - clip_translation_x;

            // For Y coordinate, we need to account for:
            // 1. PDF coordinate system (Y increases downward)
            // 2. Page height transformation
            // 3. Global page translation that was already applied
            let translation_y = self.page_height - base.y + (2.0 * plot_y) - clip_translation_y;

            (translation_x, translation_y)
        }
    }

    fn quantize_opacity(value: f64) -> u16 {
        let clamped = value.clamp(0.0, 1.0);
        let quantized = (clamped * 1000.0).round();
        quantized.max(0.0).min(1000.0) as u16
    }

    fn ensure_ext_gstate(&mut self, stroke_alpha: f64, fill_alpha: f64) -> Option<String> {
        let stroke_q = Self::quantize_opacity(stroke_alpha);
        let fill_q = Self::quantize_opacity(fill_alpha);

        if stroke_q == 1000 && fill_q == 1000 {
            return None;
        }

        let key = OpacityKey {
            stroke_thousandths: stroke_q,
            fill_thousandths: fill_q,
        };

        if let Some(existing) = self.ext_gstate_cache.get(&key) {
            self.current_page_ext_gstates.insert(existing.clone());
            return Some(existing.clone());
        }

        let name = format!("GS{:02}", self.ext_gstate_cache.len() + 1);
        let mut dict = Dictionary::new();
        dict.set("Type", Object::Name(b"ExtGState".to_vec()));

        if stroke_q < 1000 {
            dict.set("CA", Object::Real((stroke_q as f32) / 1000.0));
        }
        if fill_q < 1000 {
            dict.set("ca", Object::Real((fill_q as f32) / 1000.0));
        }

        self.ext_gstate_cache.insert(key, name.clone());
        self.ext_gstate_definitions
            .insert(name.clone(), dict.clone());
        self.current_page_ext_gstates.insert(name.clone());
        Some(name)
    }

    /// Prepare streamer for a new page by clearing per-page ExtGState tracking
    pub fn begin_page(&mut self) {
        self.current_page_ext_gstates.clear();
    }

    /// Retrieve ExtGState dictionaries referenced on the current page
    pub fn take_page_ext_gstates(&mut self) -> Vec<(String, Dictionary)> {
        let names: Vec<String> = self.current_page_ext_gstates.iter().cloned().collect();
        self.current_page_ext_gstates.clear();

        let mut result = Vec::new();
        for name in names {
            if let Some(dict) = self.ext_gstate_definitions.get(&name) {
                result.push((name, dict.clone()));
            }
        }
        result
    }

    /// Apply resolved styles to PDF operations
    fn apply_styles(
        &mut self,
        element: &DucElementEnum,
        styles: &ResolvedStyles,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        let profile = Self::determine_style_profile(element);

        let maybe_background = styles.background.iter().find(|bg| bg.visible);
        let maybe_stroke = styles.stroke.iter().find(|st| st.visible);

        let element_opacity = styles.opacity.clamp(0.0, 1.0);

        let fill_color = if profile.fill_from_stroke {
            maybe_stroke
                .map(|stroke| stroke.color.clone())
                .or_else(|| maybe_background.map(|bg| bg.color.clone()))
        } else if profile.use_background_fill {
            maybe_background.map(|bg| bg.color.clone())
        } else {
            None
        };

        let fill_opacity = if profile.fill_from_stroke {
            styles.get_combined_stroke_opacity()
        } else if profile.use_background_fill {
            styles.get_combined_fill_opacity()
        } else {
            element_opacity
        };

        let stroke_opacity = if profile.apply_stroke_properties {
            styles.get_combined_stroke_opacity()
        } else {
            element_opacity
        };

        if let Some(gs_name) = self.ensure_ext_gstate(stroke_opacity, fill_opacity) {
            ops.push(Operation::new(
                "gs",
                vec![Object::Name(gs_name.into_bytes())],
            ));
        }

        if let Some(color_str) = &fill_color {
            if let Ok(color) = self.parse_color(color_str) {
                ops.push(Operation::new(
                    "rg",
                    vec![
                        Object::Real(color.0),
                        Object::Real(color.1),
                        Object::Real(color.2),
                    ],
                ));
            }
        }

        if let Some(stroke) = maybe_stroke {
            if profile.apply_stroke_properties || profile.fill_from_stroke {
                if let Ok(color) = self.parse_color(&stroke.color) {
                    ops.push(Operation::new(
                        "RG",
                        vec![
                            Object::Real(color.0),
                            Object::Real(color.1),
                            Object::Real(color.2),
                        ],
                    ));
                }
            }

            if profile.apply_stroke_properties {
                ops.push(Operation::new("w", vec![Object::Real(stroke.width as f32)]));

                let cap = match stroke.cap {
                    STROKE_CAP::ROUND => 1,
                    STROKE_CAP::SQUARE => 2,
                    _ => 0,
                };
                ops.push(Operation::new("J", vec![Object::Integer(i64::from(cap))]));

                let join = match stroke.join {
                    STROKE_JOIN::ROUND => 1,
                    STROKE_JOIN::BEVEL => 2,
                    _ => 0,
                };
                ops.push(Operation::new("j", vec![Object::Integer(i64::from(join))]));

                if let Some(dash) = &stroke.dash_pattern {
                    if !dash.is_empty() {
                        let dash_objects: Vec<Object> =
                            dash.iter().map(|&d| Object::Real(d as f32)).collect();
                        ops.push(Operation::new(
                            "d",
                            vec![Object::Array(dash_objects), Object::Real(0.0)],
                        ));
                    }
                }
            }
        }

        Ok(ops)
    }

    /// Parse color string to RGB values using bigcolor
    fn parse_color(&self, color_str: &str) -> Result<(f32, f32, f32), ConversionError> {
        let color = BigColor::new(color_str);
        let rgb = color.to_rgb();
        Ok((
            rgb.r as f32 / 255.0,
            rgb.g as f32 / 255.0,
            rgb.b as f32 / 255.0,
        ))
    }

    /// Stream rectangle element
    fn stream_rectangle(
        &self,
        rect: &DucRectangleElement,
        hatching_manager: &mut HatchingManager,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Handle filling and stroking with hatching support
        let styles = &rect.base.styles;
        let has_background = !styles.background.is_empty();
        let has_stroke = !styles.stroke.is_empty();

        // Check for hatching patterns in backgrounds
        let has_hatching = self.style_resolver.has_hatching(&styles.background);

        if has_hatching {
            // Use style resolver for hatching pattern filling
            self.style_resolver.apply_hatching_pattern_with_dims(
                &styles.background,
                hatching_manager,
                &mut ops,
                rect.base.width,
                rect.base.height,
            )?;

            // Create rectangle path for stroking if needed
            if has_stroke {
                ops.push(Operation::new(
                    "re",
                    vec![
                        Object::Real(0.0),                        // x (relative to current transformation)
                        Object::Real(-(rect.base.height as f32)), // y (flip to keep origin at top-left)
                        Object::Real(rect.base.width as f32),
                        Object::Real(rect.base.height as f32),
                    ],
                ));
                ops.push(Operation::new("S", vec![])); // Stroke after hatching
            }
        } else {
            // Create rectangle path
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),                        // x (relative to current transformation)
                    Object::Real(-(rect.base.height as f32)), // y (flip to keep origin at top-left)
                    Object::Real(rect.base.width as f32),
                    Object::Real(rect.base.height as f32),
                ],
            ));

            // Standard fill and stroke
            if has_background && has_stroke {
                ops.push(Operation::new("B", vec![])); // Fill and stroke
            } else if has_background {
                ops.push(Operation::new("f", vec![])); // Fill only
            } else if has_stroke {
                ops.push(Operation::new("S", vec![])); // Stroke only
            }
        }

        Ok(ops)
    }

    fn determine_style_profile(element: &DucElementEnum) -> StyleProfile {
        match element {
            DucElementEnum::DucRectangleElement(_)
            | DucElementEnum::DucPolygonElement(_)
            | DucElementEnum::DucEllipseElement(_)
            | DucElementEnum::DucLinearElement(_)
            | DucElementEnum::DucTableElement(_) => StyleProfile {
                use_background_fill: true,
                fill_from_stroke: false,
                apply_stroke_properties: true,
            },
            DucElementEnum::DucFrameElement(_)
            | DucElementEnum::DucPlotElement(_) => StyleProfile {
                use_background_fill: false,
                fill_from_stroke: false,
                apply_stroke_properties: true,
            },
            DucElementEnum::DucTextElement(_) => StyleProfile {
                use_background_fill: false,
                fill_from_stroke: true,
                apply_stroke_properties: false,
            },
            DucElementEnum::DucFreeDrawElement(_)
            | DucElementEnum::DucImageElement(_)
            | DucElementEnum::DucPdfElement(_)
            | DucElementEnum::DucEmbeddableElement(_)
            | DucElementEnum::DucArrowElement(_)
            | DucElementEnum::DucDocElement(_) => StyleProfile {
                use_background_fill: false,
                fill_from_stroke: false,
                apply_stroke_properties: false,
            },
            DucElementEnum::DucModelElement(_) => StyleProfile {
                use_background_fill: false,
                fill_from_stroke: false,
                apply_stroke_properties: false,
            },
        }
    }

    /// Stream text element
    fn stream_text(&self, text: &DucTextElement) -> ConversionResult<Vec<Operation>> {
        use duc::types::{TEXT_ALIGN, VERTICAL_ALIGN};
        use hipdf::fonts::utils::{create_text_block, TextAlign, WrapStrategy};

        let resolved_text = self
            .style_resolver
            .resolve_dynamic_fields(&text.text, &DucElementEnum::DucTextElement(text.clone()));

        // Resolve font for this element: look up font_map by family, fallback to primary
        let (active_font, active_resource_name) = self
            .font_map
            .get(&text.style.font_family)
            .map(|(f, r)| (f, r.as_str()))
            .unwrap_or((&self.text_font, &self.font_resource_name));

        // Determine text alignment
        let align = match text.style.text_align {
            TEXT_ALIGN::LEFT => TextAlign::Left,
            TEXT_ALIGN::CENTER => TextAlign::Center,
            TEXT_ALIGN::RIGHT => TextAlign::Right,
        };

        // Calculate line height from style
        let line_height = text.style.font_size as f32 * text.style.line_height;

        // Determine wrapping strategy
        let wrap_strategy = if text.auto_resize {
            WrapStrategy::Word
        } else {
            WrapStrategy::Hybrid
        };

        let font_size = text.style.font_size as f32;
        let element_height = text.base.height as f32;

        // Estimate total text height for vertical alignment
        let line_count = {
            let max_w = if text.auto_resize { None } else { Some(text.base.width as f32) };
            let paragraphs: Vec<&str> = resolved_text.split('\n').collect();
            let mut count = 0usize;
            for para in &paragraphs {
                if para.is_empty() {
                    count += 1;
                } else if let Some(w) = max_w {
                    let wrapped = hipdf::fonts::utils::wrap_text(active_font, para, w, font_size, wrap_strategy);
                    count += wrapped.len().max(1);
                } else {
                    count += 1;
                }
            }
            count
        };
        let total_text_height = font_size + (line_count.saturating_sub(1) as f32) * line_height;

        // Apply vertical alignment
        let text_start_y = match text.style.vertical_align {
            VERTICAL_ALIGN::MIDDLE => {
                -(font_size + (element_height - total_text_height) / 2.0)
            }
            VERTICAL_ALIGN::BOTTOM => {
                -(element_height)
            }
            // TOP or default
            _ => -font_size,
        };

        let max_width = if text.auto_resize {
            None
        } else {
            Some(text.base.width as f32)
        };

        let max_height = Some(text.base.height as f32);

        let operations = create_text_block(
            active_resource_name,
            active_font,
            &resolved_text,
            0.0,
            text_start_y,
            font_size,
            max_width,
            max_height,
            line_height,
            align,
            wrap_strategy,
        );

        Ok(operations)
    }

    /// Stream table element
    fn stream_table(&self, table: &DucTableElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Placeholder rectangle for the table bounds
        ops.push(Operation::new("% Table placeholder", vec![]));
        ops.push(Operation::new(
            "re",
            vec![
                Object::Real(0.0),                         // x (relative to current transformation)
                Object::Real(-(table.base.height as f32)), // y (flip to keep origin at top-left)
                Object::Real(table.base.width as f32),
                Object::Real(table.base.height as f32),
            ],
        ));
        ops.push(Operation::new("S", vec![]));
        ops.push(Operation::new(
            "% TODO: Implement full table rendering",
            vec![],
        ));

        Ok(ops)
    }

    /// Stream polygon element
    fn stream_polygon(&self, polygon: &DucPolygonElement) -> ConversionResult<Vec<Operation>> {
        let linear = Self::convert_polygon_to_linear_element(polygon);
        PdfLinearRenderer::stream_linear(&linear)
    }

    fn convert_polygon_to_linear_element(polygon: &DucPolygonElement) -> DucLinearElement {
        let sides = polygon.sides.max(3);
        let points = Self::generate_polygon_points(sides, polygon.base.width, polygon.base.height);
        let mut lines: Vec<DucLine> = Vec::with_capacity(points.len());

        for i in 0..points.len() {
            let next_i = (i + 1) % points.len();
            lines.push(DucLine {
                start: DucLineReference {
                    index: i as i32,
                    handle: None,
                },
                end: DucLineReference {
                    index: next_i as i32,
                    handle: None,
                },
            });
        }

        DucLinearElement {
            linear_base: DucLinearElementBase {
                base: polygon.base.clone(),
                points,
                lines,
                path_overrides: Vec::new(),
                last_committed_point: None,
                start_binding: None,
                end_binding: None,
            },
            wipeout_below: false,
        }
    }

    fn generate_polygon_points(sides: i32, width: f64, height: f64) -> Vec<DucPoint> {
        let valid_sides = sides.max(3);
        let cx = width / 2.0;
        let cy = height / 2.0;
        let rx = width / 2.0;
        let ry = height / 2.0;

        (0..valid_sides)
            .map(|i| {
                let t = (i as f64) * 2.0 * PI / (valid_sides as f64) - PI / 2.0;
                DucPoint {
                    x: cx + rx * t.cos(),
                    y: cy + ry * t.sin(),
                    mirroring: None,
                }
            })
            .collect()
    }

    /// Stream ellipse element
    pub fn stream_ellipse(&self, ellipse: &DucEllipseElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        let linear = Self::convert_ellipse_to_linear_element(ellipse);
        ops.extend(PdfLinearRenderer::stream_linear(&linear)?);

        if ellipse.show_aux_crosshair {
            ops.extend(self.stream_ellipse_crosshair(ellipse)?);
        }

        Ok(ops)
    }

    fn stream_ellipse_crosshair(
        &self,
        ellipse: &DucEllipseElement,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        let base = &ellipse.base;

        let cx = base.width / 2.0;
        let cy = base.height / 2.0;
        let cross_width = base.width * 1.2;
        let cross_height = base.height * 1.2;
        let x1 = cx - cross_width / 2.0;
        let x2 = cx + cross_width / 2.0;
        let y1 = cy - cross_height / 2.0;
        let y2 = cy + cross_height / 2.0;

        let (r, g, b) = self.parse_color(DUC_STANDARD_PRIMARY_COLOR)?;
        ops.push(Operation::new(
            "RG",
            vec![Object::Real(r), Object::Real(g), Object::Real(b)],
        ));
        ops.push(Operation::new("w", vec![Object::Real(0.5)]));
        ops.push(Operation::new("J", vec![Object::Integer(1)]));
        ops.push(Operation::new("j", vec![Object::Integer(1)]));

        ops.push(Operation::new("% Aux crosshair horizontal", vec![]));
        let (dash_array_h, dash_offset_h) = Self::crosshair_dash_params(cross_width);
        ops.push(Operation::new(
            "d",
            vec![Object::Array(dash_array_h), Object::Real(dash_offset_h)],
        ));
        ops.push(Operation::new(
            "m",
            vec![Object::Real(x1 as f32), Object::Real(-(cy) as f32)],
        ));
        ops.push(Operation::new(
            "l",
            vec![Object::Real(x2 as f32), Object::Real(-(cy) as f32)],
        ));
        ops.push(Operation::new("S", vec![]));

        ops.push(Operation::new("% Aux crosshair vertical", vec![]));
        let (dash_array_v, dash_offset_v) = Self::crosshair_dash_params(cross_height);
        ops.push(Operation::new(
            "d",
            vec![Object::Array(dash_array_v), Object::Real(dash_offset_v)],
        ));
        ops.push(Operation::new(
            "m",
            vec![Object::Real(cx as f32), Object::Real(-y1 as f32)],
        ));
        ops.push(Operation::new(
            "l",
            vec![Object::Real(cx as f32), Object::Real(-y2 as f32)],
        ));
        ops.push(Operation::new("S", vec![]));

        Ok(ops)
    }

    fn crosshair_dash_params(line_length: f64) -> (Vec<Object>, f32) {
        const PATTERN: [f64; 4] = [26.0, 6.0, 0.6, 6.0];
        let dash_array: Vec<Object> = PATTERN
            .iter()
            .map(|&value| Object::Real(value as f32))
            .collect();

        let total: f64 = PATTERN.iter().sum();
        if line_length <= f64::EPSILON || total <= f64::EPSILON {
            return (dash_array, 0.0);
        }

        let main_dash = PATTERN[0];
        let mut offset = (main_dash / 2.0 - line_length / 2.0) % total;
        if offset < 0.0 {
            offset += total;
        }

        (dash_array, offset as f32)
    }

    pub fn convert_ellipse_to_linear_element(element: &DucEllipseElement) -> DucLinearElement {
        let base = &element.base;
        let width = base.width;
        let height = base.height;
        let ratio_f64 = element.ratio as f64;
        let start_angle = element.start_angle;
        let end_angle = element.end_angle;

        let rx = width / 2.0;
        let ry = height / 2.0;
        let cx = width / 2.0;
        let cy = height / 2.0;
        let epsilon: f64 = 1e-6;

        let sweep_angle = end_angle - start_angle;
        let is_full_shape = sweep_angle.abs() >= 2.0 * PI - epsilon;
        let has_hole = ratio_f64 > epsilon && ratio_f64 < 1.0_f64 - epsilon;

        let mut all_points: Vec<DucPoint> = Vec::new();
        let mut all_lines: Vec<DucLine> = Vec::new();
        let mut path_overrides: Vec<DucPath> = Vec::new();

        let create_arc = |radius_x: f64, radius_y: f64, s_angle: f64, e_angle: f64| {
            let mut arc_points = Vec::new();
            let mut arc_lines = Vec::new();
            let sweep = e_angle - s_angle;
            if sweep.abs() < epsilon {
                return (arc_points, arc_lines);
            }

            let n_segments = (sweep.abs() / (PI / 2.0)).ceil() as usize;
            let segment_sweep = sweep / n_segments as f64;

            let n_points = if is_full_shape {
                n_segments
            } else {
                n_segments + 1
            };

            for i in 0..n_points {
                let angle = s_angle + (i as f64) * segment_sweep;
                arc_points.push(DucPoint {
                    x: cx + radius_x * angle.cos(),
                    y: cy + radius_y * angle.sin(),
                    mirroring: Some(BEZIER_MIRRORING::ANGLE_LENGTH),
                });
            }

            for i in 0..n_segments {
                let p0_idx = i;
                let p3_idx = (i + 1) % n_points;

                let angle0 = s_angle + (i as f64) * segment_sweep;
                let angle1 = s_angle + ((i + 1) as f64) * segment_sweep;

                let p0_x = cx + radius_x * angle0.cos();
                let p0_y = cy + radius_y * angle0.sin();
                let p3_x = cx + radius_x * angle1.cos();
                let p3_y = cy + radius_y * angle1.sin();

                let k = (4.0 / 3.0) * (segment_sweep / 4.0).tan();
                let t0_x = -radius_x * angle0.sin();
                let t0_y = radius_y * angle0.cos();
                let t1_x = -radius_x * angle1.sin();
                let t1_y = radius_y * angle1.cos();

                let cp1_x = p0_x + t0_x * k;
                let cp1_y = p0_y + t0_y * k;
                let cp2_x = p3_x - t1_x * k;
                let cp2_y = p3_y - t1_y * k;

                arc_lines.push(DucLine {
                    start: DucLineReference {
                        index: p0_idx as i32,
                        handle: Some(GeometricPoint { x: cp1_x, y: cp1_y }),
                    },
                    end: DucLineReference {
                        index: p3_idx as i32,
                        handle: Some(GeometricPoint { x: cp2_x, y: cp2_y }),
                    },
                });
            }

            (arc_points, arc_lines)
        };

        let add_path_to_element = |points_to_add: &Vec<DucPoint>,
                                   lines_to_add: &Vec<DucLine>,
                                   all_points: &mut Vec<DucPoint>,
                                   all_lines: &mut Vec<DucLine>|
         -> (Vec<i32>, Vec<i32>) {
            let point_offset = all_points.len() as i32;
            let line_offset = all_lines.len() as i32;
            let point_indices: Vec<i32> = (0..points_to_add.len())
                .map(|i| point_offset + i as i32)
                .collect();
            let line_indices: Vec<i32> = (0..lines_to_add.len())
                .map(|i| line_offset + i as i32)
                .collect();

            all_points.extend_from_slice(points_to_add);

            for line in lines_to_add {
                let mut new_line = line.clone();
                let start_idx = line.start.index as usize;
                let end_idx = line.end.index as usize;
                new_line.start.index = point_indices[start_idx];
                new_line.end.index = point_indices[end_idx];
                all_lines.push(new_line);
            }

            (point_indices, line_indices)
        };

        let (outer_points, outer_lines) = create_arc(rx, ry, start_angle, end_angle);
        let (outer_indices, _outer_line_indices) =
            add_path_to_element(&outer_points, &outer_lines, &mut all_points, &mut all_lines);

        if has_hole && !outer_indices.is_empty() {
            let rx_inner = rx * (1.0_f64 - ratio_f64);
            let ry_inner = ry * (1.0_f64 - ratio_f64);
            let (inner_points_orig, inner_lines_orig) =
                create_arc(rx_inner, ry_inner, start_angle, end_angle);

            let inner_points: Vec<DucPoint> = inner_points_orig.into_iter().rev().collect();

            let inner_lines: Vec<DucLine> = inner_lines_orig
                .into_iter()
                .rev()
                .map(|line| {
                    let num_pts = inner_points.len();
                    DucLine {
                        start: DucLineReference {
                            index: (num_pts as i32 - 1) - line.end.index,
                            handle: line.end.handle.clone(),
                        },
                        end: DucLineReference {
                            index: (num_pts as i32 - 1) - line.start.index,
                            handle: line.start.handle.clone(),
                        },
                    }
                })
                .collect();

            let (inner_indices, inner_line_indices) =
                add_path_to_element(&inner_points, &inner_lines, &mut all_points, &mut all_lines);

            if is_full_shape {
                path_overrides.push(DucPath {
                    line_indices: inner_line_indices,
                    background: Some(ElementBackground {
                        content: ElementContentBase {
                            visible: false,
                            ..element.base.styles.background.get(0).map_or_else(
                                || ElementContentBase {
                                    visible: false,
                                    preference: Some(ELEMENT_CONTENT_PREFERENCE::SOLID),
                                    src: String::new(),
                                    opacity: 0.0,
                                    tiling: None,
                                    hatch: None,
                                    image_filter: None,
                                },
                                |bg| bg.content.clone(),
                            )
                        },
                    }),
                    stroke: None,
                });
            } else if !inner_indices.is_empty() {
                let outer_start_idx = outer_indices[0];
                let outer_end_idx = *outer_indices.last().unwrap_or(&outer_start_idx);
                let inner_start_idx = inner_indices[0];
                let inner_end_idx = *inner_indices.last().unwrap_or(&inner_start_idx);

                all_points[outer_start_idx as usize].mirroring = Some(BEZIER_MIRRORING::NONE);
                all_points[outer_end_idx as usize].mirroring = Some(BEZIER_MIRRORING::NONE);
                all_points[inner_start_idx as usize].mirroring = Some(BEZIER_MIRRORING::NONE);
                all_points[inner_end_idx as usize].mirroring = Some(BEZIER_MIRRORING::NONE);

                all_lines.push(DucLine {
                    start: DucLineReference {
                        index: outer_end_idx,
                        handle: None,
                    },
                    end: DucLineReference {
                        index: inner_start_idx,
                        handle: None,
                    },
                });
                all_lines.push(DucLine {
                    start: DucLineReference {
                        index: inner_end_idx,
                        handle: None,
                    },
                    end: DucLineReference {
                        index: outer_start_idx,
                        handle: None,
                    },
                });
            }
        } else if !is_full_shape && !outer_indices.is_empty() {
            let center_point = DucPoint {
                x: cx,
                y: cy,
                mirroring: Some(BEZIER_MIRRORING::NONE),
            };
            let center_index = all_points.len() as i32;
            all_points.push(center_point);

            let outer_start_idx = outer_indices[0];
            let outer_end_idx = *outer_indices.last().unwrap_or(&outer_start_idx);

            all_points[outer_start_idx as usize].mirroring = Some(BEZIER_MIRRORING::NONE);
            all_points[outer_end_idx as usize].mirroring = Some(BEZIER_MIRRORING::NONE);

            all_lines.push(DucLine {
                start: DucLineReference {
                    index: outer_end_idx,
                    handle: None,
                },
                end: DucLineReference {
                    index: center_index,
                    handle: None,
                },
            });
            all_lines.push(DucLine {
                start: DucLineReference {
                    index: center_index,
                    handle: None,
                },
                end: DucLineReference {
                    index: outer_start_idx,
                    handle: None,
                },
            });
        }

        DucLinearElement {
            linear_base: DucLinearElementBase {
                base: base.clone(),
                points: all_points,
                lines: all_lines,
                path_overrides,
                last_committed_point: None,
                start_binding: None,
                end_binding: None,
            },
            wipeout_below: false,
        }
    }

    /// Stream linear element (lines)
    fn stream_linear(&self, linear: &DucLinearElement) -> ConversionResult<Vec<Operation>> {
        PdfLinearRenderer::stream_linear(linear)
    }

    /// Stream freedraw element by converting SVG path data into a PDF XObject
    fn stream_freedraw(
        &mut self,
        freedraw: &DucFreeDrawElement,
        _styles: &ResolvedStyles,
        document: &mut Document,
        pdf_embedder: &mut PdfEmbedder,
        _resource_streamer: &mut ResourceStreamer,
    ) -> ConversionResult<Vec<Operation>> {
        use crate::utils::freedraw_bounds::calculate_freedraw_bbox;
        use hipdf::embed_pdf::{EmbedOptions, PageRange};

        let mut ops = Vec::new();

        // Check if this Freedraw element has an embedded PDF (from svg_path processing)
        let has_embedded_pdf = self.context_has_embedded_pdf(&freedraw.base.id);

        if has_embedded_pdf {
            // Use embedded PDF from svg_path conversion
            let embed_id = format!("freedraw_{}", freedraw.base.id);

            // Use cached bounding box to get the offset that was applied during SVG creation
            // The SVG was normalized with translate(-min_x, -min_y), so we need to account for this
            let bbox_offset = if let Some(bounds) = self.freedraw_bboxes.get(&freedraw.base.id) {
                (bounds.min_x as f32, bounds.min_y as f32)
            } else {
                // Fallback: calculate if not cached (shouldn't happen in normal flow)
                web_sys::console::log_1(&JsValue::from_str(&format!(
                    "Warning: No cached bounding box found for freedraw {}, calculating fallback",
                    freedraw.base.id
                )));
                if let Some(bounds) = calculate_freedraw_bbox(freedraw) {
                    (bounds.min_x as f32, bounds.min_y as f32)
                } else {
                    (0.0, 0.0)
                }
            };

            let options = EmbedOptions {
                page_range: Some(PageRange::Single(0)), // Freedraw SVG-PDFs have only one page
                // Element transform has already translated to (base.x, base.y)
                // But we need to offset by the bounding box min values because the SVG was normalized
                position: (bbox_offset.0, -bbox_offset.1),
                max_width: Some(freedraw.base.width as f32),
                max_height: Some(freedraw.base.height as f32),
                preserve_aspect_ratio: true,
                ..Default::default()
            };

            match pdf_embedder.embed_pdf(document, &embed_id, &options) {
                Ok(result) => {
                    for (name, obj_ref) in result.xobject_resources.iter() {
                        self.resource_cache
                            .insert(freedraw.base.id.clone(), name.clone());
                        self.new_xobjects.push((name.clone(), obj_ref.clone()));
                    }

                    // PDF draws from bottom-left, so we need to offset by -height
                    ops.push(Operation::new("q", vec![])); // Save state
                    ops.push(Operation::new(
                        "cm",
                        vec![
                            Object::Real(1.0),
                            Object::Real(0.0),
                            Object::Real(0.0),
                            Object::Real(1.0),
                            Object::Real(0.0),
                            Object::Real(-(freedraw.base.height as f32)),
                        ],
                    ));
                    ops.extend(result.operations);
                    ops.push(Operation::new("Q", vec![])); // Restore state
                }
                Err(e) => {
                    web_sys::console::log_1(&JsValue::from_str(&format!(
                        "Failed to embed Freedraw SVG-PDF {}: {}",
                        embed_id, e
                    )));
                    // No fallback - just log the error
                    ops.push(Operation::new(
                        &format!("% Failed to embed Freedraw SVG-PDF {}: {}", embed_id, e),
                        vec![],
                    ));
                }
            }
        } else {
            ops.push(Operation::new(
                &format!(
                    "% No embedded PDF for Freedraw element {}",
                    freedraw.base.id
                ),
                vec![],
            ));
        }

        Ok(ops)
    }

    /// Stream PDF element (embedded PDF)
    fn stream_pdf_element(
        &mut self,
        pdf: &DucPdfElement,
        document: &mut Document,
        pdf_embedder: &mut PdfEmbedder,
    ) -> ConversionResult<Vec<Operation>> {
        use hipdf::embed_pdf::{EmbedOptions, PageRange};

        let mut ops = Vec::new();

        // Validate file id
        let file_id = if let Some(fid) = &pdf.file_id {
            fid.clone()
        } else {
            ops.push(Operation::new("% PDF element without file_id", vec![]));
            // Placeholder rectangle
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(-(pdf.base.height as f32)),
                    Object::Real(pdf.base.width as f32),
                    Object::Real(pdf.base.height as f32),
                ],
            ));
            ops.push(Operation::new("S", vec![]));
            return Ok(ops);
        };

        let embed_id = format!("pdf_{}", file_id);

        // Build embed options. The element transform has already moved to (base.x, base.y),
        // so we place the embedded PDF at local origin (0,0) and size it to the element bounds.
        // Use zero-based first page.
        let options = EmbedOptions {
            page_range: Some(PageRange::Single(0)),
            position: (0.0, 0.0),
            max_width: Some(pdf.base.width as f32),
            max_height: Some(pdf.base.height as f32),
            preserve_aspect_ratio: true,
            ..Default::default()
        };

        // Perform embedding (the PDF must have been previously loaded with this id during resource processing)
        match pdf_embedder.embed_pdf(document, &embed_id, &options) {
            Ok(result) => {
                // Record XObject resources so the builder can add them to page resources later
                for (name, obj_ref) in result.xobject_resources.iter() {
                    // Track mapping (use file id to map to XObject name for resource assembly)
                    self.resource_cache.insert(file_id.clone(), name.clone());
                    self.new_xobjects.push((name.clone(), obj_ref.clone()));
                }

                // PDF elements need Y-offset correction similar to images
                // PDF draws from bottom-left, so we need to offset by -height
                ops.push(Operation::new("q", vec![])); // Save state
                ops.push(Operation::new(
                    "cm",
                    vec![
                        Object::Real(1.0),
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(1.0),
                        Object::Real(0.0),
                        Object::Real(-(pdf.base.height as f32)),
                    ],
                ));
                // Append the operations generated by embedder (already includes positioning & clipping if any)
                ops.extend(result.operations);
                ops.push(Operation::new("Q", vec![])); // Restore state
            }
            Err(e) => {
                ops.push(Operation::new(
                    &format!("% Failed to embed PDF {}: {}", embed_id, e),
                    vec![],
                ));
                // Fallback placeholder
                ops.push(Operation::new(
                    "re",
                    vec![
                        Object::Real(0.0),
                        Object::Real(-(pdf.base.height as f32)),
                        Object::Real(pdf.base.width as f32),
                        Object::Real(pdf.base.height as f32),
                    ],
                ));
                ops.push(Operation::new("S", vec![]));
            }
        }

        Ok(ops)
    }

    /// Drain newly embedded XObject resources (name, reference) collected during streaming
    pub fn drain_new_xobjects(&mut self) -> Vec<(String, Object)> {
        let mut taken = Vec::new();
        std::mem::swap(&mut self.new_xobjects, &mut taken);
        taken
    }

    /// Stream image element
    fn stream_image(
        &mut self,
        image: &DucImageElement,
        document: &mut Document,
        pdf_embedder: &mut PdfEmbedder,
        image_manager: &mut ImageManager,
        _resource_streamer: &mut ResourceStreamer,
    ) -> ConversionResult<Vec<Operation>> {
        use hipdf::embed_pdf::{EmbedOptions, PageRange};
        let mut ops = Vec::new();

        if let Some(file_id) = &image.file_id {
            // Check if this file_id corresponds to an SVG that was converted to PDF
            if self.context_has_embedded_pdf(file_id) {
                // SVG-PDF handling code
                let embed_id = format!("svg_{}", file_id);

                let options = EmbedOptions {
                    page_range: Some(PageRange::Single(0)), // SVG-PDFs have only one page
                    // Element transform has already translated to (base.x, base.y)
                    position: (0.0, 0.0),
                    ..Default::default()
                };

                match pdf_embedder.embed_pdf(document, &embed_id, &options) {
                    Ok(result) => {
                        for (name, obj_ref) in result.xobject_resources.iter() {
                            self.resource_cache.insert(file_id.clone(), name.clone());
                            self.new_xobjects.push((name.clone(), obj_ref.clone()));
                        }

                        // Calculate scaling factors to stretch SVG to fill element bounds
                        let (mut scale_x, mut scale_y) = (1.0_f64, 1.0_f64);

                        if let Some(&(svg_width, svg_height)) = self.svg_dimensions.get(file_id) {
                            if svg_width > 0.0 && svg_height > 0.0 {
                                scale_x = image.base.width / svg_width;
                                scale_y = image.base.height / svg_height;
                            }
                        } else if let Some(crop) = &image.crop {
                            if crop.natural_width > 0.0 && crop.natural_height > 0.0 {
                                scale_x = image.base.width / crop.natural_width;
                                scale_y = image.base.height / crop.natural_height;
                            }
                        }

                        // PDF/SVG elements need Y-offset correction similar to images
                        // PDF draws from bottom-left, so we need to offset by -height
                        ops.push(Operation::new("q", vec![])); // Save state

                        // Apply scaling transformation to stretch SVG to fill element bounds
                        ops.push(Operation::new(
                            "cm",
                            vec![
                                Object::Real(scale_x as f32),  // Scale X to fill width
                                Object::Real(0.0),
                                Object::Real(0.0),
                                Object::Real(scale_y as f32),  // Scale Y to fill height
                                Object::Real(0.0),
                                Object::Real(-(image.base.height as f32)), // Y-offset correction
                            ],
                        ));

                        ops.extend(result.operations);
                        ops.push(Operation::new("Q", vec![])); // Restore state
                    }
                    Err(e) => {
                        ops.push(Operation::new(
                            &format!("% Failed to embed SVG-PDF {}: {}", embed_id, e),
                            vec![],
                        ));
                        println!("❌ Failed to embed SVG-PDF {}: {}", embed_id, e);
                        // Placeholder relative to current transform
                        ops.push(Operation::new(
                            "re",
                            vec![
                                Object::Real(0.0),
                                Object::Real(-(image.base.height as f32)),
                                Object::Real(image.base.width as f32),
                                Object::Real(image.base.height as f32),
                            ],
                        ));
                        ops.push(Operation::new("S", vec![]));
                    }
                }
            } else {
                // Regular image (PNG/JPEG) - use image_manager

                // Try to find the image using the file_id
                let mut found_image_id = None;

                // First try direct lookup
                if let Some(&image_id) = self.images.get(file_id) {
                    found_image_id = Some(image_id);
                } else {
                    // If direct lookup fails, try to find a key that contains the file_id
                    // This handles cases where the file_id format doesn't match exactly
                    for (cache_key, &cache_image_id) in &self.images {
                        if cache_key.contains(file_id) || file_id.contains(cache_key) {
                            found_image_id = Some(cache_image_id);
                            break;
                        }
                    }
                }

                if let Some(image_id) = found_image_id {
                    // Use image_manager to get proper XObject name and add to resources
                    let mut temp_resources = hipdf::lopdf::Dictionary::new();
                    let resource_name =
                        image_manager.add_to_resources(&mut temp_resources, (image_id, 0));
                    // Register XObject resource directly using a Reference to the image object id
                    self.new_xobjects
                        .push((resource_name.clone(), Object::Reference((image_id, 0))));

                    // Use image_manager to draw the image with proper transformations
                    // PDF draws images from bottom-left corner, so we need to offset by -height
                    // to make it appear at the correct position (since our transform positions top-left)
                    let y_offset = -(image.base.height as f32);
                    ops.extend(hipdf::images::ImageManager::draw_image(
                        &resource_name,
                        0.0,
                        y_offset,
                        image.base.width as f32,
                        image.base.height as f32,
                    ));
                } else {
                    // Image not found - create red border placeholder with error text
                    ops.push(Operation::new(
                        &format!("% Image not found: {}", file_id),
                        vec![],
                    ));

                    // Set red stroke color (RGB: 1.0, 0.0, 0.0)
                    ops.push(Operation::new(
                        "RG",
                        vec![
                            Object::Real(1.0), // Red
                            Object::Real(0.0), // Green
                            Object::Real(0.0), // Blue
                        ],
                    ));

                    // Draw rectangle with red border
                    ops.push(Operation::new(
                        "re",
                        vec![
                            Object::Real(0.0),
                            Object::Real(-(image.base.height as f32)),
                            Object::Real(image.base.width as f32),
                            Object::Real(image.base.height as f32),
                        ],
                    ));
                    ops.push(Operation::new("S", vec![]));

                    // Add error text inside the rectangle
                    ops.push(Operation::new("BT", vec![])); // Begin text
                    ops.push(Operation::new(
                        "Tf",
                        vec![
                            Object::Name("F1".as_bytes().to_vec()), // Font name
                            Object::Real(12.0),                     // Font size
                        ],
                    ));

                    // Position text at top-left with some padding
                    ops.push(Operation::new(
                        "Td",
                        vec![
                            Object::Real(5.0),
                            Object::Real(image.base.height as f32 - 20.0),
                        ],
                    ));

                    // Output error message
                    let error_msg = format!("Image not found: {}", file_id);
                    ops.push(Operation::new(
                        "Tj",
                        vec![Object::string_literal(error_msg.as_str())],
                    ));

                    ops.push(Operation::new("ET", vec![])); // End text
                }
            }
        } else {
            // No file_id - create blue border placeholder
            ops.push(Operation::new("% Image element without file_id", vec![]));

            // Set blue stroke color (RGB: 0.0, 0.0, 1.0)
            ops.push(Operation::new(
                "RG",
                vec![
                    Object::Real(0.0), // Red
                    Object::Real(0.0), // Green
                    Object::Real(1.0), // Blue
                ],
            ));

            // Draw rectangle with blue border
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(-(image.base.height as f32)),
                    Object::Real(image.base.width as f32),
                    Object::Real(image.base.height as f32),
                ],
            ));
            ops.push(Operation::new("S", vec![]));
        }

        Ok(ops)
    }

    /// Helper to check if a file_id corresponds to an embedded PDF (including SVG-converted PDFs)
    fn context_has_embedded_pdf(&self, file_id: &str) -> bool {
        self.embedded_pdfs.contains_key(file_id)
    }

    /// Stream frame element (StackLike - needs clipping consideration)
    fn stream_frame(&self, frame: &DucFrameElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Note: Clipping is handled in handle_frame_clipping for child elements
        // This function only renders the frame border if present

        // Draw frame border if it has stroke styles
        let styles = &frame.stack_element_base.base.styles;
        if !styles.stroke.is_empty() {
            // Draw rectangle at element bounds
            // The clipping inset in handle_frame_clipping ensures the stroke won't be clipped
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(frame.stack_element_base.base.width as f32),
                    Object::Real(-(frame.stack_element_base.base.height as f32)),
                ],
            ));
            ops.push(Operation::new("S", vec![]));
        }

        // Stream child elements within the frame's coordinate system
        // Note: The actual child elements will be streamed by the main streaming loop
        // with proper coordinate transformation based on their frame_id
        ops.push(Operation::new(
            "% Frame element - child elements will be streamed with frame-relative positioning",
            vec![],
        ));

        Ok(ops)
    }

    /// Stream plot element (StackLike - handle crop vs plots mode)
    fn stream_plot(&self, plot: &DucPlotElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Check if this is a plot stack element (based on stack_base.is_plot)
        if plot.stack_element_base.stack_base.is_plot {
            // Handle as actual plot page - this would be handled differently
            // at the page level, not at the element level
            ops.push(Operation::new(
                "% Plot page - handled at page level",
                vec![],
            ));
        } else {
            // Handle as cropped rectangle with clipping
            ops.push(Operation::new("q", vec![])); // Save state

            // Set clipping rectangle
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(plot.stack_element_base.base.width as f32),
                    Object::Real(plot.stack_element_base.base.height as f32),
                ],
            ));
            ops.push(Operation::new("W", vec![])); // Set clipping path
            ops.push(Operation::new("n", vec![])); // End path

            // TODO: Stream child elements within the clipping bounds
            ops.push(Operation::new("% TODO: Stream plot child elements", vec![]));

            ops.push(Operation::new("Q", vec![])); // Restore state
        }

        Ok(ops)
    }
}
