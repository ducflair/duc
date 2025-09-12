// Leverage style resolver from utils to first get the adequate style for the element

// Then, based on the element type, stream the adequate PDF commands to represent it:
// DucRectangleElement, DucPolygonElement, DucEllipseElement, DucTextElement, DucLinearElement: these are pretty straightforward to stream as basic PDF drawing commands
// DucTableElement: stream as an actual table
// DucMermaidElement, DucFreedrawElement: stream as a pdf from the svg conversion we did into resources earlier

// DucEmbeddableElement, DucXRayElement, DucArrowElement: don't stream these, will just ignore them
// DucPdfElement: will use the hipdf::embed_pdf with combination of the resources we loaded earlier
// DucImageElement: stream an image using the resources we loaded earlier
// DucBlockInstanceElement: stream the corresponding block as an instance we loaded earlier using hipdf::blocks
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

use crate::streaming::stream_resources::ResourceStreamer;
use crate::utils::style_resolver::{ResolvedStyles, StyleResolver};
use crate::{ConversionError, ConversionResult};
use bigcolor::BigColor;
use duc::types::{
    DucBlockInstanceElement, DucElementEnum, DucEllipseElement, DucFrameElement,
    DucFreeDrawElement, DucImageElement, DucLinearElement, DucMermaidElement, DucPdfElement,
    DucPlotElement, DucPolygonElement, DucRectangleElement, DucTableElement, DucTextElement,
    ElementWrapper,
};
use hipdf::blocks::BlockManager;
use hipdf::embed_pdf::PdfEmbedder;
use hipdf::hatching::HatchingManager;
use hipdf::images::ImageManager;
use hipdf::lopdf::content::Operation;
use hipdf::lopdf::{Object, Document};
use hipdf::ocg::OCGManager;
use std::collections::HashMap;

/// Element streaming context for rendering DUC elements to PDF
pub struct ElementStreamer {
    style_resolver: StyleResolver,
    /// Cache for external resources (images, SVGs, PDFs, etc.)
    resource_cache: HashMap<String, String>, // resource_id -> XObject name
    /// Cache for image IDs from ImageManager
    images: HashMap<String, u32>, // file_id -> image_id
    /// Newly embedded XObject resources produced while streaming (name -> reference)
    new_xobjects: Vec<(String, Object)>,
    /// Reference to embedded PDFs to check if file is SVG-converted PDF
    embedded_pdfs: HashMap<String, u32>, // file_id -> object_id
}

impl ElementStreamer {
    /// Create new element streamer
    pub fn new(style_resolver: StyleResolver) -> Self {
        Self {
            style_resolver,
            resource_cache: HashMap::new(),
            images: HashMap::new(),
            new_xobjects: Vec::new(),
            embedded_pdfs: HashMap::new(),
        }
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

    /// Stream elements within specified bounds with local state for scroll positioning
    pub fn stream_elements_within_bounds(
        &mut self,
        elements: &[ElementWrapper],
        bounds: (f64, f64, f64, f64),
        local_state: Option<&duc::types::DucLocalState>,
        resource_streamer: &mut ResourceStreamer,
        block_manager: &mut BlockManager,
        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
        image_manager: &mut ImageManager,
        ocg_manager: &OCGManager,
        document: &mut Document,
    ) -> ConversionResult<Vec<Operation>> {
        let mut all_operations = Vec::new();
        let (bounds_x, bounds_y, bounds_width, bounds_height) = bounds;
        let bounds_max_x = bounds_x + bounds_width;
        let bounds_max_y = bounds_y + bounds_height;

        // Filter and sort elements by z-index and visibility criteria
        let mut filtered_elements: Vec<_> = elements
            .iter()
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);

                // Apply visibility, deletion, and plot filters
                let visible = base.is_visible && !base.is_deleted && base.is_plot;
                // if !visible {
                //     println!("DEBUG: Element {} filtered out - is_visible: {}, is_deleted: {}, is_plot: {}", 
                //         base.id, base.is_visible, base.is_deleted, base.is_plot);
                // }
                visible
            })
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);

                // Check if element intersects with bounds
                // Skip bounds check for elements that belong to a layer (to allow layer testing)
                if base.layer_id.is_some() {
                    true
                } else {
                    let elem_max_x = base.x + base.width;
                    let elem_max_y = base.y + base.height;

                    !(base.x > bounds_max_x
                        || elem_max_x < bounds_x
                        || base.y > bounds_max_y
                        || elem_max_y < bounds_y)
                }
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
        // println!(
        //     "DEBUG: Starting to stream {} filtered elements",
        //     filtered_elements.len()
        // );
    for element_wrapper in filtered_elements {
            let base = Self::get_element_base(&element_wrapper.element);
            // println!(
            //     "DEBUG: Streaming element {} with layer_id: {:?}",
            //     base.id, base.layer_id
            // );

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
            let has_clipping = base.frame_id.is_some();
            if let Some(frame_id) = &base.frame_id {
                let clipping_ops = self.handle_frame_clipping(frame_id, elements, bounds)?;
                all_operations.extend(clipping_ops);
            }

            // Stream the element
            let element_ops = self.stream_element_with_resources(
                &element_wrapper.element,
                local_state,
                document,
                resource_streamer,
                block_manager,
                hatching_manager,
                pdf_embedder,
                image_manager,
            )?;

            println!(
                "DEBUG: Element {} generated {} operations",
                base.id,
                element_ops.len()
            );
            all_operations.extend(element_ops);

            // Restore graphics state if clipping was applied
            if has_clipping {
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
        document: &mut Document,
        resource_streamer: &mut ResourceStreamer,
        block_manager: &mut BlockManager,
        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
        image_manager: &mut ImageManager,
    ) -> ConversionResult<Vec<Operation>> {
        let mut operations = Vec::new();

        // Special handling: PDF elements will be embedded via hipdf::embed_pdf which already manages transformations.
        let is_pdf = matches!(element, DucElementEnum::DucPdfElement(_));
        if !is_pdf {
            // Save graphics state
            operations.push(Operation::new("q", vec![]));

            // Apply transformation (position, rotation) with scroll offset
            let base = Self::get_element_base(element);
            if base.x != 0.0 || base.y != 0.0 || base.angle != 0.0 {
                let transform_ops = self.create_transformation_matrix_with_scroll(base.x, base.y, base.angle, local_state);
                operations.extend(transform_ops);
            }

            // Resolve and apply styles (skip for PDFs)
            let styles = self.style_resolver.resolve_styles(element, None);
            let style_ops = self.apply_styles(&styles)?;
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
            DucElementEnum::DucMermaidElement(mermaid) => {
                self.stream_mermaid(mermaid, resource_streamer)?
            }
            DucElementEnum::DucFreeDrawElement(freedraw) => {
                self.stream_freedraw(freedraw, resource_streamer)?
            }
            DucElementEnum::DucPdfElement(pdf) => self.stream_pdf_element(pdf, document, pdf_embedder)?,
            DucElementEnum::DucImageElement(image) => {
                self.stream_image(image, document, pdf_embedder, image_manager, resource_streamer)?
            }
            DucElementEnum::DucBlockInstanceElement(block_instance) => {
                self.stream_block_instance(block_instance, block_manager)?
            }
            DucElementEnum::DucFrameElement(frame) => self.stream_frame(frame)?,
            DucElementEnum::DucPlotElement(plot) => self.stream_plot(plot)?,

            // Ignored elements (as per specifications)
            DucElementEnum::DucEmbeddableElement(_) => vec![], // Ignore
            DucElementEnum::DucXRayElement(_) => vec![],       // Ignore
            DucElementEnum::DucArrowElement(_) => vec![],      // Ignore

            // WIP elements (placeholder comments for now)
            DucElementEnum::DucLeaderElement(_) => {
                vec![Operation::new("% DucLeaderElement - WIP", vec![])]
            }
            DucElementEnum::DucDimensionElement(_) => {
                vec![Operation::new("% DucDimensionElement - WIP", vec![])]
            }
            DucElementEnum::DucFeatureControlFrameElement(_) => {
                vec![Operation::new(
                    "% DucFeatureControlFrameElement - WIP",
                    vec![],
                )]
            }
            DucElementEnum::DucViewportElement(_) => {
                vec![Operation::new("% DucViewportElement - WIP", vec![])]
            }
            DucElementEnum::DucDocElement(_) => {
                vec![Operation::new("% DucDocElement - WIP", vec![])]
            }
            DucElementEnum::DucParametricElement(_) => {
                vec![Operation::new("% DucParametricElement - WIP", vec![])]
            }
        };
        operations.extend(element_ops);

        if !is_pdf {
            // Restore graphics state for non-PDF elements
            operations.push(Operation::new("Q", vec![]));
        }

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
        elements: &[ElementWrapper],
        _bounds: (f64, f64, f64, f64),
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Find the frame element by ID
        if let Some(frame_wrapper) = elements.iter().find(|wrapper| {
            let base = Self::get_element_base(&wrapper.element);
            base.id == frame_id
        }) {
            if let DucElementEnum::DucFrameElement(frame) = &frame_wrapper.element {
                if frame.stack_element_base.clip {
                    // Get frame position and dimensions
                    let frame_base = &frame.stack_element_base.base;
                    let x = frame_base.x;
                    let y = frame_base.y;
                    let width = frame_base.width;
                    let height = frame_base.height;

                    // Create clipping path based on frame bounds
                    ops.push(Operation::new("q", vec![])); // Save graphics state

                    // Apply frame transformation if needed
                    if x != 0.0 || y != 0.0 {
                        ops.push(Operation::new(
                            &format!("% Applying frame transformation: x={}, y={}", x, y),
                            vec![],
                        ));
                        // Note: In a full implementation, we would apply the frame's transformation matrix here
                    }

                    // Set clipping rectangle
                    ops.push(Operation::new(
                        "re",
                        vec![
                            Object::Real(x as f32),      // Frame X position
                            Object::Real(y as f32),      // Frame Y position
                            Object::Real(width as f32),  // Frame width
                            Object::Real(height as f32), // Frame height
                        ],
                    ));
                    ops.push(Operation::new("W", vec![])); // Set clipping path
                    ops.push(Operation::new("n", vec![])); // End path without filling/stroking

                    // Add comment indicating clipping is active
                    ops.push(Operation::new(
                        &format!(
                            "% Clipping active for frame: {} (bounds: x={}, y={}, w={}, h={})",
                            frame_id, x, y, width, height
                        ),
                        vec![],
                    ));

                    // Note: The graphics state will be restored after the element is streamed
                    // This ensures nested clipping works correctly
                }
            }
        } else {
            // Frame not found, add warning
            ops.push(Operation::new(
                &format!("% Warning: Frame '{}' not found for clipping", frame_id),
                vec![],
            ));
        }

        Ok(ops)
    }

    /// Create transformation matrix operations with scroll offset
    fn create_transformation_matrix(&self, x: f64, y: f64, angle: f64) -> Vec<Operation> {
        let mut ops = Vec::new();

        if x != 0.0 || y != 0.0 {
            // Translate
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
        }

        if angle != 0.0 {
            // Rotate (angle in radians)
            let cos_a = angle.cos();
            let sin_a = angle.sin();
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
        }

        ops
    }

    /// Create transformation matrix operations with scroll offset applied
    fn create_transformation_matrix_with_scroll(&self, x: f64, y: f64, angle: f64, local_state: Option<&duc::types::DucLocalState>) -> Vec<Operation> {
        let (scroll_x, scroll_y) = if let Some(state) = local_state {
            (state.scroll_x, state.scroll_y)
        } else {
            (0.0, 0.0)
        };

        // Apply scroll offset to the coordinates
        let adjusted_x = x + scroll_x;
        let adjusted_y = y + scroll_y;

        self.create_transformation_matrix(adjusted_x, adjusted_y, angle)
    }

    /// Apply resolved styles to PDF operations
    fn apply_styles(&self, styles: &ResolvedStyles) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Apply opacity
        if styles.opacity < 1.0 {
            ops.push(Operation::new(
                "gs",
                vec![Object::Name(
                    format!("GS{}", (styles.opacity * 100.0) as i32).into_bytes(),
                )],
            ));
        }

        // Apply stroke styles
        if let Some(stroke) = styles.stroke.first() {
            if stroke.visible {
                // Set stroke color (simplified - assumes RGB hex color)
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

                // Set line width
                ops.push(Operation::new("w", vec![Object::Real(stroke.width as f32)]));

                // Set dash pattern if present
                if let Some(dash) = &stroke.dash_pattern {
                    let dash_objects: Vec<Object> =
                        dash.iter().map(|&d| Object::Real(d as f32)).collect();
                    ops.push(Operation::new(
                        "d",
                        vec![
                            Object::Array(dash_objects),
                            Object::Real(0.0), // Phase
                        ],
                    ));
                }
            }
        }

        // Apply fill styles
        if let Some(background) = styles.background.first() {
            if background.visible {
                // Set fill color
                if let Ok(color) = self.parse_color(&background.color) {
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
        if let Some(styles) = &rect.base.styles {
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
                            Object::Real(0.0), // x (relative to current transformation)
                            Object::Real(0.0), // y
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
                        Object::Real(0.0), // x (relative to current transformation)
                        Object::Real(0.0), // y
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
        } else {
            // No styles, just create rectangle path
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0), // x (relative to current transformation)
                    Object::Real(0.0), // y
                    Object::Real(rect.base.width as f32),
                    Object::Real(rect.base.height as f32),
                ],
            ));
            ops.push(Operation::new("S", vec![])); // Stroke only
        }

        Ok(ops)
    }

    /// Stream text element
    fn stream_text(&self, text: &DucTextElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Begin text object
        ops.push(Operation::new("BT", vec![]));

        // Set font and size (simplified)
        ops.push(Operation::new(
            "Tf",
            vec![
                Object::Name("F1".as_bytes().to_vec()),
                Object::Real(text.style.font_size as f32),
            ],
        ));

        // Set text position (relative to current transformation)
        ops.push(Operation::new(
            "Td",
            vec![Object::Real(0.0), Object::Real(0.0)],
        ));

        // Output text
        let resolved_text = self
            .style_resolver
            .resolve_dynamic_fields(&text.text, &DucElementEnum::DucTextElement(text.clone()));
        ops.push(Operation::new(
            "Tj",
            vec![Object::string_literal(resolved_text.as_str())],
        ));

        // End text object
        ops.push(Operation::new("ET", vec![]));

        Ok(ops)
    }

    /// Stream block instance element
    fn stream_block_instance(
        &self,
        block_instance: &DucBlockInstanceElement,
        _block_manager: &mut BlockManager,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Use hipdf::blocks to render the block instance
        let _block_id = &block_instance.block_id;

        // For now, create a placeholder for the block instance
        ops.push(Operation::new("% Block Instance", vec![]));
        ops.push(Operation::new(
            "re",
            vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(block_instance.base.width as f32),
                Object::Real(block_instance.base.height as f32),
            ],
        ));
        ops.push(Operation::new("S", vec![]));

        // TODO: Use block_manager to render actual block content
        // block_manager.render_block(block_id, &block_instance.attributes)?;

        Ok(ops)
    }

    /// Stream polygon element
    fn stream_polygon(&self, polygon: &DucPolygonElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Generate a regular polygon with the specified number of sides
        let sides = polygon.sides.max(3); // Minimum 3 sides
        let center_x = polygon.base.width as f32 / 2.0;
        let center_y = polygon.base.height as f32 / 2.0;
        let radius = center_x.min(center_y);

        let angle_step = 2.0 * std::f32::consts::PI / sides as f32;

        // Start at the first vertex
        let first_x = center_x + radius * (0.0_f32).cos();
        let first_y = center_y + radius * (0.0_f32).sin();
        ops.push(Operation::new(
            "m",
            vec![Object::Real(first_x), Object::Real(first_y)],
        ));

        // Draw lines to other vertices
        for i in 1..sides {
            let angle = i as f32 * angle_step;
            let x = center_x + radius * angle.cos();
            let y = center_y + radius * angle.sin();
            ops.push(Operation::new("l", vec![Object::Real(x), Object::Real(y)]));
        }

        // Close the path
        ops.push(Operation::new("h", vec![]));

        // Fill and/or stroke
        if let Some(styles) = &polygon.base.styles {
            if !styles.background.is_empty() && !styles.stroke.is_empty() {
                ops.push(Operation::new("B", vec![])); // Fill and stroke
            } else if !styles.background.is_empty() {
                ops.push(Operation::new("f", vec![])); // Fill only
            } else if !styles.stroke.is_empty() {
                ops.push(Operation::new("S", vec![])); // Stroke only
            }
        }

        Ok(ops)
    }

    /// Stream ellipse element
    fn stream_ellipse(&self, ellipse: &DucEllipseElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        let rx = ellipse.base.width as f32 / 2.0;
        let ry = ellipse.base.height as f32 / 2.0;
        let cx = rx;
        let cy = ry;

        // Approximate ellipse using Bézier curves (4 curves for full ellipse)
        let kappa = 0.5522848; // Magic number for Bézier approximation of circle
        let kx = kappa * rx;
        let ky = kappa * ry;

        // Start at rightmost point
        ops.push(Operation::new(
            "m",
            vec![Object::Real(cx + rx), Object::Real(cy)],
        ));

        // Top right curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real(cx + rx),
                Object::Real(cy + ky),
                Object::Real(cx + kx),
                Object::Real(cy + ry),
                Object::Real(cx),
                Object::Real(cy + ry),
            ],
        ));

        // Top left curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real(cx - kx),
                Object::Real(cy + ry),
                Object::Real(cx - rx),
                Object::Real(cy + ky),
                Object::Real(cx - rx),
                Object::Real(cy),
            ],
        ));

        // Bottom left curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real(cx - rx),
                Object::Real(cy - ky),
                Object::Real(cx - kx),
                Object::Real(cy - ry),
                Object::Real(cx),
                Object::Real(cy - ry),
            ],
        ));

        // Bottom right curve
        ops.push(Operation::new(
            "c",
            vec![
                Object::Real(cx + kx),
                Object::Real(cy - ry),
                Object::Real(cx + rx),
                Object::Real(cy - ky),
                Object::Real(cx + rx),
                Object::Real(cy),
            ],
        ));

        // Fill and/or stroke
        if let Some(styles) = &ellipse.base.styles {
            if !styles.background.is_empty() && !styles.stroke.is_empty() {
                ops.push(Operation::new("B", vec![])); // Fill and stroke
            } else if !styles.background.is_empty() {
                ops.push(Operation::new("f", vec![])); // Fill only
            } else if !styles.stroke.is_empty() {
                ops.push(Operation::new("S", vec![])); // Stroke only
            }
        }

        Ok(ops)
    }

    /// Stream linear element (lines)
    fn stream_linear(&self, linear: &DucLinearElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Get points from the linear element
        if !linear.linear_base.points.is_empty() {
            // Move to first point
            let first = &linear.linear_base.points[0];
            ops.push(Operation::new(
                "m",
                vec![Object::Real(first.x as f32), Object::Real(first.y as f32)],
            ));

            // Draw lines to subsequent points
            for point in &linear.linear_base.points[1..] {
                ops.push(Operation::new(
                    "l",
                    vec![Object::Real(point.x as f32), Object::Real(point.y as f32)],
                ));
            }

            // Stroke the path
            ops.push(Operation::new("S", vec![]));
        }

        Ok(ops)
    }

    /// Stream table element
    fn stream_table(&self, table: &DucTableElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // This is a complex element that would require:
        // 1. Calculate cell positions and sizes
        // 2. Draw cell borders
        // 3. Draw cell content (text, etc.)
        // For now, create a placeholder rectangle

        ops.push(Operation::new(
            "re",
            vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(table.base.width as f32),
                Object::Real(table.base.height as f32),
            ],
        ));

        ops.push(Operation::new("S", vec![])); // Stroke outline

        // TODO: Implement full table rendering with cells, borders, content
        ops.push(Operation::new(
            "% TODO: Implement full table rendering",
            vec![],
        ));

        Ok(ops)
    }

    /// Stream mermaid element (uses SVG from resources)
    fn stream_mermaid(
        &self,
        mermaid: &DucMermaidElement,
        _resource_streamer: &mut ResourceStreamer,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        if let Some(svg_path) = &mermaid.svg_path {
            if let Some(xobject_name) = self.resource_cache.get(svg_path) {
                // Use XObject for the SVG
                ops.push(Operation::new("% Mermaid SVG from cache", vec![]));
                ops.push(Operation::new("q", vec![])); // Save graphics state

                // Apply scaling if needed
                ops.push(Operation::new(
                    "cm",
                    vec![
                        Object::Real(mermaid.base.width as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(mermaid.base.height as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                    ],
                ));

                ops.push(Operation::new(
                    "Do",
                    vec![Object::Name(xobject_name.as_bytes().to_vec())],
                ));

                ops.push(Operation::new("Q", vec![])); // Restore graphics state
            } else {
                // SVG not found in cache, try to stream it directly
                ops.push(Operation::new("% Mermaid SVG streaming", vec![]));

                // Use the new ResourceStreamer approach
                match _resource_streamer.stream_svg_resource(
                    svg_path,
                    0.0,
                    0.0, // x, y position
                    mermaid.base.width,
                    mermaid.base.height,
                ) {
                    Ok(svg_ops) => {
                        // Successfully streamed SVG operations
                        ops.extend(svg_ops);
                        ops.push(Operation::new("% SVG successfully embedded", vec![]));
                    }
                    Err(e) => {
                        // If resource streaming fails, don't try fallback - just error out
                        return Err(ConversionError::ResourceLoadError(format!(
                            "Failed to stream SVG resource {}: {}",
                            svg_path, e
                        )));
                    }
                }
            }
        } else {
            // No svg_path, create placeholder
            ops.push(Operation::new("% Mermaid element without svg_path", vec![]));
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(mermaid.base.width as f32),
                    Object::Real(mermaid.base.height as f32),
                ],
            ));
            ops.push(Operation::new("S", vec![]));
        }

        Ok(ops)
    }

    /// Stream freedraw element (uses SVG from resources)
    fn stream_freedraw(
        &self,
        freedraw: &DucFreeDrawElement,
        _resource_streamer: &mut ResourceStreamer,
    ) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        if let Some(svg_path) = &freedraw.svg_path {
            if let Some(xobject_name) = self.resource_cache.get(svg_path) {
                // Use XObject for the SVG
                ops.push(Operation::new("% Freedraw SVG from cache", vec![]));
                ops.push(Operation::new("q", vec![])); // Save graphics state

                // Apply scaling if needed
                ops.push(Operation::new(
                    "cm",
                    vec![
                        Object::Real(freedraw.base.width as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(freedraw.base.height as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                    ],
                ));

                ops.push(Operation::new(
                    "Do",
                    vec![Object::Name(xobject_name.as_bytes().to_vec())],
                ));

                ops.push(Operation::new("Q", vec![])); // Restore graphics state
            } else {
                // SVG not found in cache, try to stream it directly
                ops.push(Operation::new("% Freedraw SVG streaming", vec![]));

                // Use the new ResourceStreamer approach
                match _resource_streamer.stream_svg_resource(
                    svg_path,
                    0.0,
                    0.0, // x, y position
                    freedraw.base.width,
                    freedraw.base.height,
                ) {
                    Ok(svg_ops) => {
                        // Successfully streamed SVG operations
                        ops.extend(svg_ops);
                        ops.push(Operation::new("% SVG successfully embedded", vec![]));
                    }
                    Err(e) => {
                        // If resource streaming fails, don't try fallback - just error out
                        return Err(ConversionError::ResourceLoadError(format!(
                            "Failed to stream SVG resource {}: {}",
                            svg_path, e
                        )));
                    }
                }
            }
        } else {
            // No svg_path, create placeholder
            ops.push(Operation::new(
                "% Freedraw element without svg_path",
                vec![],
            ));
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(freedraw.base.width as f32),
                    Object::Real(freedraw.base.height as f32),
                ],
            ));
            ops.push(Operation::new("S", vec![]));
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
        let file_id = if let Some(fid) = &pdf.file_id { fid.clone() } else {
            ops.push(Operation::new("% PDF element without file_id", vec![]));
            // Placeholder rectangle
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(pdf.base.x as f32),
                    Object::Real(pdf.base.y as f32),
                    Object::Real(pdf.base.width as f32),
                    Object::Real(pdf.base.height as f32),
                ],
            ));
            ops.push(Operation::new("S", vec![]));
            return Ok(ops);
        };

        let embed_id = format!("pdf_{}", file_id);

        // Build embed options mirroring the provided test syntax.
        // We place at absolute coordinates (element base x, y) and preserve aspect ratio inside bounds width/height.
        // Use zero-based first page (hipdf appears to use zero-based internally; prior Single(1) caused OOB on single-page PDFs)
        let options = EmbedOptions {
            page_range: Some(PageRange::Single(0)),
            position: (pdf.base.x as f32, pdf.base.y as f32),
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
                // Append the operations generated by embedder (already includes positioning & clipping if any)
                ops.extend(result.operations);
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
                        Object::Real(pdf.base.x as f32),
                        Object::Real(pdf.base.y as f32),
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
            // SVGs converted to PDF are stored in embedded_pdfs, not images
            if self.context_has_embedded_pdf(file_id) {
                // This is an SVG converted to PDF - embed it like we do for regular PDFs
                let embed_id = format!("svg_{}", file_id);
                
                // Build embed options using image element dimensions and position
                let options = EmbedOptions {
                    page_range: Some(PageRange::Single(0)), // SVG-PDFs have only one page
                    position: (image.base.x as f32, image.base.y as f32),
                    max_width: Some(image.base.width as f32),
                    max_height: Some(image.base.height as f32),
                    preserve_aspect_ratio: true,
                    ..Default::default()
                };

                // Embed the SVG-converted PDF
                match pdf_embedder.embed_pdf(document, &embed_id, &options) {
                    Ok(result) => {
                        // Record XObject resources for page resources
                        for (name, obj_ref) in result.xobject_resources.iter() {
                            self.resource_cache.insert(file_id.clone(), name.clone());
                            self.new_xobjects.push((name.clone(), obj_ref.clone()));
                        }
                        // Use the operations generated by the embedder
                        ops.extend(result.operations);
                    }
                    Err(e) => {
                        ops.push(Operation::new(
                            &format!("% Failed to embed SVG-PDF {}: {}", embed_id, e),
                            vec![],
                        ));
                        // Fallback placeholder
                        ops.push(Operation::new(
                            "re",
                            vec![
                                Object::Real(image.base.x as f32),
                                Object::Real(image.base.y as f32),
                                Object::Real(image.base.width as f32),
                                Object::Real(image.base.height as f32),
                            ],
                        ));
                        ops.push(Operation::new("S", vec![]));
                    }
                }
            } else {
                if let Some(image_id) = self.images.get(file_id) {
                    // Create a temporary resource dictionary to get the image name
                    let mut temp_resources = hipdf::lopdf::Dictionary::new();
                    let image_name = image_manager.add_to_resources(&mut temp_resources, (*image_id, 0));
                    
                    // Add the image to our new_xobjects so it gets added to page resources
                    if let Ok(xobj_dict) = temp_resources.get(b"XObject")
                        .and_then(|obj| obj.as_dict()) {
                        if let Ok(image_obj) = xobj_dict.get(image_name.as_bytes()) {
                            self.new_xobjects.push((image_name.clone(), image_obj.clone()));
                        }
                    }
                    
                    // Draw the image with proper positioning and scaling
                    ops.push(Operation::new("q", vec![])); // Save graphics state
                    
                    // Position and scale
                    ops.push(Operation::new(
                        "cm",
                        vec![
                            Object::Real(image.base.width as f32),
                            Object::Real(0.0),
                            Object::Real(0.0),
                            Object::Real(image.base.height as f32),
                            Object::Real(image.base.x as f32),
                            Object::Real(image.base.y as f32),
                        ],
                    ));
                    
                    // Draw the image
                    ops.push(Operation::new(
                        "Do",
                        vec![Object::Name(image_name.as_bytes().to_vec())],
                    ));
                    
                    ops.push(Operation::new("Q", vec![])); // Restore graphics state
                } else {
                    // Fallback placeholder
                    ops.push(Operation::new("% Image not found in cache", vec![]));
                    ops.push(Operation::new(
                        "re",
                        vec![
                            Object::Real(image.base.x as f32),
                            Object::Real(image.base.y as f32),
                            Object::Real(image.base.width as f32),
                            Object::Real(image.base.height as f32),
                        ],
                    ));
                    ops.push(Operation::new("S", vec![]));
                }
            }
        }

        Ok(ops)
    }

    /// Helper to check if a file_id corresponds to an embedded PDF (including SVG-converted PDFs)
    fn context_has_embedded_pdf(&self, file_id: &str) -> bool {
        // Check if this file_id is in the embedded_pdfs cache, indicating it's either
        // a regular PDF or an SVG that was converted to PDF
        self.embedded_pdfs.contains_key(file_id)
    }

    /// Stream frame element (StackLike - needs clipping consideration)
    fn stream_frame(&self, frame: &DucFrameElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();

        // Save graphics state for clipping
        ops.push(Operation::new("q", vec![]));

        // Set clipping rectangle if needed
        if frame.stack_element_base.clip {
            ops.push(Operation::new(
                "re",
                vec![
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(frame.stack_element_base.base.width as f32),
                    Object::Real(frame.stack_element_base.base.height as f32),
                ],
            ));
            ops.push(Operation::new("W", vec![])); // Set clipping path
            ops.push(Operation::new("n", vec![])); // End path without filling/stroking
        }

        // Draw frame border if it has stroke styles
        if let Some(styles) = &frame.stack_element_base.base.styles {
            if !styles.stroke.is_empty() {
                ops.push(Operation::new(
                    "re",
                    vec![
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(frame.stack_element_base.base.width as f32),
                        Object::Real(frame.stack_element_base.base.height as f32),
                    ],
                ));
                ops.push(Operation::new("S", vec![]));
            }
        }

        // TODO: Stream child elements within the frame
        ops.push(Operation::new(
            "% TODO: Stream frame child elements",
            vec![],
        ));

        // Restore graphics state
        ops.push(Operation::new("Q", vec![]));

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
