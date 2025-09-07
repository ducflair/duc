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





use crate::{ConversionResult, ConversionError};
use crate::utils::style_resolver::{StyleResolver, ResolvedStyles};
use crate::streaming::stream_resources::ResourceStreamer;
use duc::types::{
    DucElementEnum, DucRectangleElement, DucTextElement, DucBlockInstanceElement,
    DucPolygonElement, DucEllipseElement, DucLinearElement, DucTableElement,
    DucMermaidElement, DucFreeDrawElement, DucPdfElement, DucImageElement,
    DucFrameElement, DucPlotElement, ElementWrapper
};
use hipdf::lopdf::content::Operation;
use hipdf::lopdf::Object;
use hipdf::ocg::OCGManager;
use hipdf::blocks::BlockManager;
use hipdf::hatching::HatchingManager;
use hipdf::embed_pdf::PdfEmbedder;
use bigcolor::BigColor;
use std::collections::HashMap;

/// Element streaming context for rendering DUC elements to PDF
pub struct ElementStreamer {
    style_resolver: StyleResolver,
    /// Cache for external resources (images, SVGs, PDFs, etc.)
    resource_cache: HashMap<String, u32>, // id -> object_id mapping
}

impl ElementStreamer {
    /// Create new element streamer
    pub fn new(style_resolver: StyleResolver) -> Self {
        Self { 
            style_resolver,
            resource_cache: HashMap::new(),
        }
    }
    
    /// Set resource cache for external resources
    pub fn set_resource_cache(&mut self, cache: HashMap<String, u32>) {
        self.resource_cache = cache;
    }
    
    /// Stream elements within specified bounds
    pub fn stream_elements_within_bounds(
        &self,
        elements: &[ElementWrapper],
        bounds: (f64, f64, f64, f64),
        resource_streamer: &mut ResourceStreamer,
        block_manager: &mut BlockManager,
        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
        ocg_manager: &OCGManager,
    ) -> ConversionResult<Vec<Operation>> {
        let mut all_operations = Vec::new();
        let (bounds_x, bounds_y, bounds_width, bounds_height) = bounds;
        let bounds_max_x = bounds_x + bounds_width;
        let bounds_max_y = bounds_y + bounds_height;
        
        // Filter and sort elements by z-index and visibility criteria
        let mut filtered_elements: Vec<_> = elements.iter()
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);
                
                // Apply visibility, deletion, and plot filters
                base.is_visible && !base.is_deleted && base.is_plot
            })
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);
                
                // Check if element intersects with bounds
                let elem_max_x = base.x + base.width;
                let elem_max_y = base.y + base.height;
                
                !(base.x > bounds_max_x || elem_max_x < bounds_x || 
                  base.y > bounds_max_y || elem_max_y < bounds_y)
            })
            .collect();
        
        // Sort by z-index (lower values render first)
        filtered_elements.sort_by(|a, b| {
            let base_a = Self::get_element_base(&a.element);
            let base_b = Self::get_element_base(&b.element);
            base_a.z_index.partial_cmp(&base_b.z_index).unwrap_or(std::cmp::Ordering::Equal)
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
            let has_clipping = base.frame_id.is_some();
            if let Some(frame_id) = &base.frame_id {
                let clipping_ops = self.handle_frame_clipping(frame_id, elements, bounds)?;
                all_operations.extend(clipping_ops);
            }
            
            // Stream the element
            let element_ops = self.stream_element_with_resources(
                &element_wrapper.element,
                resource_streamer,
                block_manager,
                hatching_manager,
                pdf_embedder,
            )?;
            
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
    
    /// Stream a single element with resource managers
    fn stream_element_with_resources(
        &self,
        element: &DucElementEnum,
        resource_streamer: &mut ResourceStreamer,
        block_manager: &mut BlockManager,
        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
    ) -> ConversionResult<Vec<Operation>> {
        let mut operations = Vec::new();
        
        // Save graphics state
        operations.push(Operation::new("q", vec![]));
        
        // Apply transformation (position, rotation)
        let base = Self::get_element_base(element);
        if base.x != 0.0 || base.y != 0.0 || base.angle != 0.0 {
            let transform_ops = self.create_transformation_matrix(base.x, base.y, base.angle);
            operations.extend(transform_ops);
        }
        
        // Resolve styles
        let styles = self.style_resolver.resolve_styles(element, None);
        
        // Apply styles
        let style_ops = self.apply_styles(&styles)?;
        operations.extend(style_ops);
        
        // Render element based on type using appropriate managers
        let element_ops = match element {
            DucElementEnum::DucRectangleElement(rect) => self.stream_rectangle(rect, hatching_manager)?,
            DucElementEnum::DucPolygonElement(polygon) => self.stream_polygon(polygon)?,
            DucElementEnum::DucEllipseElement(ellipse) => self.stream_ellipse(ellipse)?,
            DucElementEnum::DucTextElement(text) => self.stream_text(text)?,
            DucElementEnum::DucLinearElement(linear) => self.stream_linear(linear)?,
            DucElementEnum::DucTableElement(table) => self.stream_table(table)?,
            DucElementEnum::DucMermaidElement(mermaid) => self.stream_mermaid(mermaid, resource_streamer)?,
            DucElementEnum::DucFreeDrawElement(freedraw) => self.stream_freedraw(freedraw, resource_streamer)?,
            DucElementEnum::DucPdfElement(pdf) => self.stream_pdf_element(pdf, pdf_embedder)?,
            DucElementEnum::DucImageElement(image) => self.stream_image(image, resource_streamer)?,
            DucElementEnum::DucBlockInstanceElement(block_instance) => self.stream_block_instance(block_instance, block_manager)?,
            DucElementEnum::DucFrameElement(frame) => self.stream_frame(frame)?,
            DucElementEnum::DucPlotElement(plot) => self.stream_plot(plot)?,
            
            // Ignored elements (as per specifications)
            DucElementEnum::DucEmbeddableElement(_) => vec![], // Ignore
            DucElementEnum::DucXRayElement(_) => vec![], // Ignore
            DucElementEnum::DucArrowElement(_) => vec![], // Ignore
            
            // WIP elements (placeholder comments for now)
            DucElementEnum::DucLeaderElement(_) => {
                vec![Operation::new("% DucLeaderElement - WIP", vec![])]
            },
            DucElementEnum::DucDimensionElement(_) => {
                vec![Operation::new("% DucDimensionElement - WIP", vec![])]
            },
            DucElementEnum::DucFeatureControlFrameElement(_) => {
                vec![Operation::new("% DucFeatureControlFrameElement - WIP", vec![])]
            },
            DucElementEnum::DucViewportElement(_) => {
                vec![Operation::new("% DucViewportElement - WIP", vec![])]
            },
            DucElementEnum::DucDocElement(_) => {
                vec![Operation::new("% DucDocElement - WIP", vec![])]
            },
            DucElementEnum::DucParametricElement(_) => {
                vec![Operation::new("% DucParametricElement - WIP", vec![])]
            }
        };
        operations.extend(element_ops);
        
        // Restore graphics state
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
        // Use hipdf OCG manager to check layer visibility
        // For now, assume all layers are visible if they exist
        Ok(ocg_manager.get_layer(layer_id).is_some())
    }
    
    /// Build layer content using proper OCG marked content sequences
    pub fn build_layer_content(
        &self,
        layer_id: &str,
        elements: &[ElementWrapper],
        bounds: (f64, f64, f64, f64),
        resource_streamer: &mut ResourceStreamer,
        block_manager: &mut BlockManager,
        hatching_manager: &mut HatchingManager,
        pdf_embedder: &mut PdfEmbedder,
        _ocg_manager: &OCGManager,
    ) -> ConversionResult<Vec<Operation>> {
        let mut layer_ops = Vec::new();
        
        // Begin marked content sequence for this layer
        layer_ops.push(Operation::new("BDC", vec![
            Object::Name("OC".as_bytes().to_vec()),
            Object::Name(layer_id.as_bytes().to_vec()),
        ]));
        
        layer_ops.push(Operation::new(&format!("% Layer content: {}", layer_id), vec![]));
        
        // Filter elements that belong to this layer
        let layer_elements: Vec<_> = elements.iter()
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);
                base.layer_id.as_ref().map_or(false, |id| id == layer_id)
            })
            .filter(|element_wrapper| {
                let base = Self::get_element_base(&element_wrapper.element);
                
                // Apply visibility, deletion, and plot filters
                base.is_visible && !base.is_deleted && base.is_plot
            })
            .collect();
        
        // Stream elements in z-index order
        let mut sorted_elements = layer_elements;
        sorted_elements.sort_by(|a, b| {
            let base_a = Self::get_element_base(&a.element);
            let base_b = Self::get_element_base(&b.element);
            base_a.z_index.partial_cmp(&base_b.z_index).unwrap_or(std::cmp::Ordering::Equal)
        });
        
        // Add each element to the layer
        for element_wrapper in sorted_elements {
            let element_ops = self.stream_element_with_resources(
                &element_wrapper.element,
                resource_streamer,
                block_manager,
                hatching_manager,
                pdf_embedder,
            )?;
            
            layer_ops.extend(element_ops);
        }
        
        // End marked content sequence for this layer
        layer_ops.push(Operation::new("EMC", vec![]));
        
        Ok(layer_ops)
    }
    
    /// Handle frame clipping for elements
    fn handle_frame_clipping(&self, frame_id: &str, elements: &[ElementWrapper], _bounds: (f64, f64, f64, f64)) -> ConversionResult<Vec<Operation>> {
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
                        ops.push(Operation::new(&format!("% Applying frame transformation: x={}, y={}", x, y), vec![]));
                        // Note: In a full implementation, we would apply the frame's transformation matrix here
                    }
                    
                    // Set clipping rectangle
                    ops.push(Operation::new("re", vec![
                        Object::Real(x as f32), // Frame X position
                        Object::Real(y as f32), // Frame Y position  
                        Object::Real(width as f32), // Frame width
                        Object::Real(height as f32), // Frame height
                    ]));
                    ops.push(Operation::new("W", vec![])); // Set clipping path
                    ops.push(Operation::new("n", vec![])); // End path without filling/stroking
                    
                    // Add comment indicating clipping is active
                    ops.push(Operation::new(&format!("% Clipping active for frame: {} (bounds: x={}, y={}, w={}, h={})", 
                        frame_id, x, y, width, height), vec![]));
                    
                    // Note: The graphics state will be restored after the element is streamed
                    // This ensures nested clipping works correctly
                }
            }
        } else {
            // Frame not found, add warning
            ops.push(Operation::new(&format!("% Warning: Frame '{}' not found for clipping", frame_id), vec![]));
        }
        
        Ok(ops)
    }
    
    /// Stream a single element to PDF content operations (legacy method)
    pub fn stream_element(&self, element: &DucElementEnum) -> ConversionResult<Vec<Operation>> {
        let mut operations = Vec::new();
        
        // Save graphics state
        operations.push(Operation::new("q", vec![]));
        
        // Apply transformation (position, rotation)
        let base = Self::get_element_base(element);
        if base.x != 0.0 || base.y != 0.0 || base.angle != 0.0 {
            let transform_ops = self.create_transformation_matrix(base.x, base.y, base.angle);
            operations.extend(transform_ops);
        }
        
        // Resolve styles
        let styles = self.style_resolver.resolve_styles(element, None);
        
        // Apply styles
        let style_ops = self.apply_styles(&styles)?;
        operations.extend(style_ops);
        
        // Render element based on type
        let element_ops = match element {
            DucElementEnum::DucRectangleElement(rect) => self.stream_rectangle(rect, &mut HatchingManager::new())?,
            DucElementEnum::DucPolygonElement(polygon) => self.stream_polygon(polygon)?,
            DucElementEnum::DucEllipseElement(ellipse) => self.stream_ellipse(ellipse)?,
            DucElementEnum::DucTextElement(text) => self.stream_text(text)?,
            DucElementEnum::DucLinearElement(linear) => self.stream_linear(linear)?,
            DucElementEnum::DucTableElement(table) => self.stream_table(table)?,
            DucElementEnum::DucMermaidElement(mermaid) => self.stream_mermaid_legacy(mermaid)?,
            DucElementEnum::DucFreeDrawElement(freedraw) => self.stream_freedraw_legacy(freedraw)?,
            DucElementEnum::DucPdfElement(pdf) => self.stream_pdf_element_legacy(pdf)?,
            DucElementEnum::DucImageElement(image) => self.stream_image_legacy(image)?,
            DucElementEnum::DucBlockInstanceElement(block_instance) => self.stream_block_instance_legacy(block_instance)?,
            DucElementEnum::DucFrameElement(frame) => self.stream_frame(frame)?,
            DucElementEnum::DucPlotElement(plot) => self.stream_plot(plot)?,
            
            // Ignored elements (as per specifications)
            DucElementEnum::DucEmbeddableElement(_) => vec![], // Ignore
            DucElementEnum::DucXRayElement(_) => vec![], // Ignore
            DucElementEnum::DucArrowElement(_) => vec![], // Ignore
            
            // WIP elements (placeholder comments for now)
            DucElementEnum::DucLeaderElement(_) => {
                vec![Operation::new("% DucLeaderElement - WIP", vec![])]
            },
            DucElementEnum::DucDimensionElement(_) => {
                vec![Operation::new("% DucDimensionElement - WIP", vec![])]
            },
            DucElementEnum::DucFeatureControlFrameElement(_) => {
                vec![Operation::new("% DucFeatureControlFrameElement - WIP", vec![])]
            },
            DucElementEnum::DucViewportElement(_) => {
                vec![Operation::new("% DucViewportElement - WIP", vec![])]
            },
            DucElementEnum::DucDocElement(_) => {
                vec![Operation::new("% DucDocElement - WIP", vec![])]
            },
            DucElementEnum::DucParametricElement(_) => {
                vec![Operation::new("% DucParametricElement - WIP", vec![])]
            }
        };
        operations.extend(element_ops);
        
        // Restore graphics state
        operations.push(Operation::new("Q", vec![]));
        
        Ok(operations)
    }
    
    /// Create transformation matrix operations
    fn create_transformation_matrix(&self, x: f64, y: f64, angle: f64) -> Vec<Operation> {
        let mut ops = Vec::new();
        
        if x != 0.0 || y != 0.0 {
            // Translate
            ops.push(Operation::new("cm", vec![
                Object::Real(1.0),
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(1.0),
                Object::Real(x as f32),
                Object::Real(y as f32),
            ]));
        }
        
        if angle != 0.0 {
            // Rotate (angle in radians)
            let cos_a = angle.cos();
            let sin_a = angle.sin();
            ops.push(Operation::new("cm", vec![
                Object::Real(cos_a as f32),
                Object::Real(sin_a as f32),
                Object::Real(-sin_a as f32),
                Object::Real(cos_a as f32),
                Object::Real(0.0),
                Object::Real(0.0),
            ]));
        }
        
        ops
    }
    
    /// Apply resolved styles to PDF operations
    fn apply_styles(&self, styles: &ResolvedStyles) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        // Apply opacity
        if styles.opacity < 1.0 {
            ops.push(Operation::new("gs", vec![Object::Name(format!("GS{}", (styles.opacity * 100.0) as i32).into_bytes())]));
        }
        
        // Apply stroke styles
        if let Some(stroke) = styles.stroke.first() {
            if stroke.visible {
                // Set stroke color (simplified - assumes RGB hex color)
                if let Ok(color) = self.parse_color(&stroke.color) {
                    ops.push(Operation::new("RG", vec![
                        Object::Real(color.0),
                        Object::Real(color.1), 
                        Object::Real(color.2),
                    ]));
                }
                
                // Set line width
                ops.push(Operation::new("w", vec![Object::Real(stroke.width as f32)]));
                
                // Set dash pattern if present
                if let Some(dash) = &stroke.dash_pattern {
                    let dash_objects: Vec<Object> = dash.iter().map(|&d| Object::Real(d as f32)).collect();
                    ops.push(Operation::new("d", vec![
                        Object::Array(dash_objects),
                        Object::Real(0.0), // Phase
                    ]));
                }
            }
        }
        
        // Apply fill styles
        if let Some(background) = styles.background.first() {
            if background.visible {
                // Set fill color
                if let Ok(color) = self.parse_color(&background.color) {
                    ops.push(Operation::new("rg", vec![
                        Object::Real(color.0),
                        Object::Real(color.1),
                        Object::Real(color.2),
                    ]));
                }
            }
        }
        
        Ok(ops)
    }
    
    /// Parse color string to RGB values using bigcolor
    fn parse_color(&self, color_str: &str) -> Result<(f32, f32, f32), ConversionError> {
        let color = BigColor::new(color_str);
        let rgb = color.to_rgb();
        Ok((rgb.r as f32 / 255.0, rgb.g as f32 / 255.0, rgb.b as f32 / 255.0))
    }
    
    /// Stream rectangle element
    fn stream_rectangle(&self, rect: &DucRectangleElement, hatching_manager: &mut HatchingManager) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        // Handle filling and stroking with hatching support
        if let Some(styles) = &rect.base.styles {
            let has_background = !styles.background.is_empty();
            let has_stroke = !styles.stroke.is_empty();
            
            // Check for hatching patterns in backgrounds
            let has_hatching = self.style_resolver.has_hatching(&styles.background);
            
            if has_hatching {
                // Use style resolver for hatching pattern filling
                self.style_resolver.apply_hatching_pattern_with_dims(&styles.background, hatching_manager, &mut ops, rect.base.width, rect.base.height)?;
                
                // Create rectangle path for stroking if needed
                if has_stroke {
                    ops.push(Operation::new("re", vec![
                        Object::Real(0.0), // x (relative to current transformation)
                        Object::Real(0.0), // y
                        Object::Real(rect.base.width as f32),
                        Object::Real(rect.base.height as f32),
                    ]));
                    ops.push(Operation::new("S", vec![])); // Stroke after hatching
                }
            } else {
                // Create rectangle path
                ops.push(Operation::new("re", vec![
                    Object::Real(0.0), // x (relative to current transformation)
                    Object::Real(0.0), // y
                    Object::Real(rect.base.width as f32),
                    Object::Real(rect.base.height as f32),
                ]));
                
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
            ops.push(Operation::new("re", vec![
                Object::Real(0.0), // x (relative to current transformation)
                Object::Real(0.0), // y
                Object::Real(rect.base.width as f32),
                Object::Real(rect.base.height as f32),
            ]));
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
        ops.push(Operation::new("Tf", vec![
            Object::Name("F1".as_bytes().to_vec()),
            Object::Real(text.style.font_size as f32),
        ]));
        
        // Set text position (relative to current transformation)
        ops.push(Operation::new("Td", vec![
            Object::Real(0.0),
            Object::Real(0.0),
        ]));
        
        // Output text
        let resolved_text = self.style_resolver.resolve_dynamic_fields(&text.text, &DucElementEnum::DucTextElement(text.clone()));
        ops.push(Operation::new("Tj", vec![Object::string_literal(resolved_text.as_str())]));
        
        // End text object
        ops.push(Operation::new("ET", vec![]));
        
        Ok(ops)
    }
    
    /// Stream block instance element
    fn stream_block_instance(&self, block_instance: &DucBlockInstanceElement, _block_manager: &mut BlockManager) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        // Use hipdf::blocks to render the block instance
        let _block_id = &block_instance.block_id;
        
        // For now, create a placeholder for the block instance
        ops.push(Operation::new("% Block Instance", vec![]));
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(block_instance.base.width as f32),
            Object::Real(block_instance.base.height as f32),
        ]));
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
        ops.push(Operation::new("m", vec![
            Object::Real(first_x),
            Object::Real(first_y),
        ]));
        
        // Draw lines to other vertices
        for i in 1..sides {
            let angle = i as f32 * angle_step;
            let x = center_x + radius * angle.cos();
            let y = center_y + radius * angle.sin();
            ops.push(Operation::new("l", vec![
                Object::Real(x),
                Object::Real(y),
            ]));
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
        ops.push(Operation::new("m", vec![
            Object::Real(cx + rx),
            Object::Real(cy),
        ]));
        
        // Top right curve
        ops.push(Operation::new("c", vec![
            Object::Real(cx + rx), Object::Real(cy + ky),
            Object::Real(cx + kx), Object::Real(cy + ry),
            Object::Real(cx), Object::Real(cy + ry),
        ]));
        
        // Top left curve  
        ops.push(Operation::new("c", vec![
            Object::Real(cx - kx), Object::Real(cy + ry),
            Object::Real(cx - rx), Object::Real(cy + ky),
            Object::Real(cx - rx), Object::Real(cy),
        ]));
        
        // Bottom left curve
        ops.push(Operation::new("c", vec![
            Object::Real(cx - rx), Object::Real(cy - ky),
            Object::Real(cx - kx), Object::Real(cy - ry),
            Object::Real(cx), Object::Real(cy - ry),
        ]));
        
        // Bottom right curve
        ops.push(Operation::new("c", vec![
            Object::Real(cx + kx), Object::Real(cy - ry),
            Object::Real(cx + rx), Object::Real(cy - ky),
            Object::Real(cx + rx), Object::Real(cy),
        ]));
        
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
            ops.push(Operation::new("m", vec![
                Object::Real(first.x as f32),
                Object::Real(first.y as f32),
            ]));
            
            // Draw lines to subsequent points
            for point in &linear.linear_base.points[1..] {
                ops.push(Operation::new("l", vec![
                    Object::Real(point.x as f32),
                    Object::Real(point.y as f32),
                ]));
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
        
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(table.base.width as f32),
            Object::Real(table.base.height as f32),
        ]));
        
        ops.push(Operation::new("S", vec![])); // Stroke outline
        
        // TODO: Implement full table rendering with cells, borders, content
        ops.push(Operation::new("% TODO: Implement full table rendering", vec![]));
        
        Ok(ops)
    }
    
    /// Stream mermaid element (uses SVG from resources)
    fn stream_mermaid(&self, mermaid: &DucMermaidElement, _resource_streamer: &mut ResourceStreamer) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        if let Some(svg_path) = &mermaid.svg_path {
            if let Some(&svg_object_id) = self.resource_cache.get(svg_path) {
                // Use XObject for the SVG
                ops.push(Operation::new("% Mermaid SVG from cache", vec![]));
                ops.push(Operation::new("q", vec![])); // Save graphics state
                
                // Apply scaling if needed
                ops.push(Operation::new("cm", vec![
                    Object::Real(mermaid.base.width as f32), Object::Real(0.0), 
                    Object::Real(0.0), Object::Real(mermaid.base.height as f32),
                    Object::Real(0.0), Object::Real(0.0)
                ]));
                
                ops.push(Operation::new("Do", vec![
                    Object::Name(format!("SVG{}", svg_object_id).into_bytes()),
                ]));
                
                ops.push(Operation::new("Q", vec![])); // Restore graphics state
            } else {
                // SVG not found in cache, try to stream it directly
                ops.push(Operation::new("% Mermaid SVG streaming", vec![]));
                
                // Use the new ResourceStreamer approach
                match _resource_streamer.stream_svg_resource(
                    svg_path, 
                    0.0, 0.0, // x, y position
                    mermaid.base.width, 
                    mermaid.base.height
                ) {
                    Ok(svg_ops) => {
                        // Successfully streamed SVG operations
                        ops.extend(svg_ops);
                        ops.push(Operation::new("% SVG successfully embedded", vec![]));
                    }
                    Err(e) => {
                        // If resource streaming fails, don't try fallback - just error out
                        return Err(ConversionError::ResourceLoadError(
                            format!("Failed to stream SVG resource {}: {}", svg_path, e)
                        ));
                    }
                }
            }
        } else {
            // No svg_path, create placeholder
            ops.push(Operation::new("% Mermaid element without svg_path", vec![]));
            ops.push(Operation::new("re", vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(mermaid.base.width as f32),
                Object::Real(mermaid.base.height as f32),
            ]));
            ops.push(Operation::new("S", vec![]));
        }
        
        Ok(ops)
    }
    
    /// Stream freedraw element (uses SVG from resources)
    fn stream_freedraw(&self, freedraw: &DucFreeDrawElement, _resource_streamer: &mut ResourceStreamer) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        if let Some(svg_path) = &freedraw.svg_path {
            if let Some(&svg_object_id) = self.resource_cache.get(svg_path) {
                // Use XObject for the SVG
                ops.push(Operation::new("% Freedraw SVG from cache", vec![]));
                ops.push(Operation::new("q", vec![])); // Save graphics state
                
                // Apply scaling if needed
                ops.push(Operation::new("cm", vec![
                    Object::Real(freedraw.base.width as f32), Object::Real(0.0), 
                    Object::Real(0.0), Object::Real(freedraw.base.height as f32),
                    Object::Real(0.0), Object::Real(0.0)
                ]));
                
                ops.push(Operation::new("Do", vec![
                    Object::Name(format!("SVG{}", svg_object_id).into_bytes()),
                ]));
                
                ops.push(Operation::new("Q", vec![])); // Restore graphics state
            } else {
                // SVG not found in cache, try to stream it directly
                ops.push(Operation::new("% Freedraw SVG streaming", vec![]));
                
                // Use the new ResourceStreamer approach
                match _resource_streamer.stream_svg_resource(
                    svg_path, 
                    0.0, 0.0, // x, y position
                    freedraw.base.width, 
                    freedraw.base.height
                ) {
                    Ok(svg_ops) => {
                        // Successfully streamed SVG operations
                        ops.extend(svg_ops);
                        ops.push(Operation::new("% SVG successfully embedded", vec![]));
                    }
                    Err(e) => {
                        // If resource streaming fails, don't try fallback - just error out
                        return Err(ConversionError::ResourceLoadError(
                            format!("Failed to stream SVG resource {}: {}", svg_path, e)
                        ));
                    }
                }
            }
        } else {
            // No svg_path, create placeholder
            ops.push(Operation::new("% Freedraw element without svg_path", vec![]));
            ops.push(Operation::new("re", vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(freedraw.base.width as f32),
                Object::Real(freedraw.base.height as f32),
            ]));
            ops.push(Operation::new("S", vec![]));
        }
        
        Ok(ops)
    }
    
    /// Stream PDF element (embedded PDF)
    fn stream_pdf_element(&self, pdf: &DucPdfElement, _pdf_embedder: &mut PdfEmbedder) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        // Use hipdf::embed_pdf functionality
        if let Some(file_id) = &pdf.file_id {
            // Use pdf_embedder to embed the PDF
            ops.push(Operation::new("% PDF embedding with hipdf::embed_pdf", vec![]));
            
            // Create proper PDF embedding with hipdf
            // Note: This would be called from the builder level where we have access to the document
            // For now, create a visual representation of where the PDF would be embedded
            
            ops.push(Operation::new("q", vec![])); // Save graphics state
            
            // Create rectangle for PDF placement
            ops.push(Operation::new("re", vec![
                Object::Real(0.0), // x position
                Object::Real(0.0), // y position  
                Object::Real(pdf.base.width as f32),  // width
                Object::Real(pdf.base.height as f32), // height
            ]));
            
            // Set border to indicate PDF placement
            ops.push(Operation::new("w", vec![Object::Real(1.0)])); // Line width
            ops.push(Operation::new("RG", vec![Object::Real(0.8), Object::Real(0.2), Object::Real(0.2)])); // Red border
            ops.push(Operation::new("S", vec![])); // Stroke border
            
            // Add light fill to show PDF area
            ops.push(Operation::new("rg", vec![Object::Real(0.9), Object::Real(0.9), Object::Real(0.95)])); // Light blue fill
            ops.push(Operation::new("f", vec![])); // Fill
            
            // Add text annotation
            ops.push(Operation::new("BT", vec![])); // Begin text
            ops.push(Operation::new("Tf", vec![Object::Name("F1".as_bytes().to_vec()), Object::Real(10.0)])); // Font
            ops.push(Operation::new("rg", vec![Object::Real(0.0), Object::Real(0.0), Object::Real(0.0)])); // Black text
            ops.push(Operation::new("Td", vec![Object::Real(5.0), Object::Real(pdf.base.height as f32 - 15.0)])); // Position
            ops.push(Operation::new("Tj", vec![Object::string_literal(format!("PDF: {}", file_id).as_str())])); // Text
            ops.push(Operation::new("ET", vec![])); // End text
            
            ops.push(Operation::new("Q", vec![])); // Restore graphics state
            
            // The actual PDF embedding would be handled at the document level using:
            // let options = EmbedOptions {
            //     layout: MultiPageLayout::SinglePage,
            //     scale: 1.0,
            //     x: pdf.base.x,
            //     y: pdf.base.y,
            //     width: pdf.base.width,
            //     height: pdf.base.height,
            // };
            // pdf_embedder.embed_pdf(&mut document, file_id, &options)?;
            
        } else {
            // No file_id, create placeholder
            ops.push(Operation::new("% PDF element without file_id", vec![]));
            ops.push(Operation::new("re", vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(pdf.base.width as f32),
                Object::Real(pdf.base.height as f32),
            ]));
            ops.push(Operation::new("S", vec![]));
        }
        
        Ok(ops)
    }
    
    /// Stream image element
    fn stream_image(&self, image: &DucImageElement, resource_streamer: &mut ResourceStreamer) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        if let Some(file_id) = &image.file_id {
            // Try to use ResourceStreamer to stream the image
            ops.push(Operation::new("% Image streaming with ResourceStreamer", vec![]));
            
            // Save graphics state
            ops.push(Operation::new("q", vec![]));
            
            // Create image placement rectangle
            ops.push(Operation::new("re", vec![
                Object::Real(0.0), // x position
                Object::Real(0.0), // y position
                Object::Real(image.base.width as f32),  // width
                Object::Real(image.base.height as f32), // height
            ]));
            
            // Use the new ResourceStreamer approach
            match resource_streamer.stream_image_resource(
                file_id, 
                0.0, 0.0, 
                image.base.width, 
                image.base.height
            ) {
                Ok(image_ops) => {
                    // Successfully streamed image operations
                    ops.extend(image_ops);
                    ops.push(Operation::new("% Image successfully embedded", vec![]));
                }
                Err(e) => {
                    // If resource streaming fails, don't try fallback - just error out
                    return Err(ConversionError::ResourceLoadError(
                        format!("Failed to stream image resource {}: {}", file_id, e)
                    ));
                }
            }
            
            // Restore graphics state
            ops.push(Operation::new("Q", vec![]));
        } else {
            // No file_id, create placeholder
            ops.push(Operation::new("% Image element without file_id", vec![]));
            ops.push(Operation::new("re", vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(image.base.width as f32),
                Object::Real(image.base.height as f32),
            ]));
            ops.push(Operation::new("S", vec![]));
        }
        
        Ok(ops)
    }
    
    /// Stream frame element (StackLike - needs clipping consideration)
    fn stream_frame(&self, frame: &DucFrameElement) -> ConversionResult<Vec<Operation>> {
        let mut ops = Vec::new();
        
        // Save graphics state for clipping
        ops.push(Operation::new("q", vec![]));
        
        // Set clipping rectangle if needed
        if frame.stack_element_base.clip {
            ops.push(Operation::new("re", vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(frame.stack_element_base.base.width as f32),
                Object::Real(frame.stack_element_base.base.height as f32),
            ]));
            ops.push(Operation::new("W", vec![])); // Set clipping path
            ops.push(Operation::new("n", vec![])); // End path without filling/stroking
        }
        
        // Draw frame border if it has stroke styles
        if let Some(styles) = &frame.stack_element_base.base.styles {
            if !styles.stroke.is_empty() {
                ops.push(Operation::new("re", vec![
                    Object::Real(0.0),
                    Object::Real(0.0),
                    Object::Real(frame.stack_element_base.base.width as f32),
                    Object::Real(frame.stack_element_base.base.height as f32),
                ]));
                ops.push(Operation::new("S", vec![]));
            }
        }
        
        // TODO: Stream child elements within the frame
        ops.push(Operation::new("% TODO: Stream frame child elements", vec![]));
        
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
            ops.push(Operation::new("% Plot page - handled at page level", vec![]));
        } else {
            // Handle as cropped rectangle with clipping
            ops.push(Operation::new("q", vec![])); // Save state
            
            // Set clipping rectangle
            ops.push(Operation::new("re", vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(plot.stack_element_base.base.width as f32),
                Object::Real(plot.stack_element_base.base.height as f32),
            ]));
            ops.push(Operation::new("W", vec![])); // Set clipping path
            ops.push(Operation::new("n", vec![])); // End path
            
            // TODO: Stream child elements within the clipping bounds
            ops.push(Operation::new("% TODO: Stream plot child elements", vec![]));
            
            ops.push(Operation::new("Q", vec![])); // Restore state
        }
        
        Ok(ops)
    }
    
    // Legacy methods for the old stream_element function (without managers)
    
    fn stream_mermaid_legacy(&self, mermaid: &DucMermaidElement) -> ConversionResult<Vec<Operation>> {
        // Fallback to basic rendering without resource manager
        let mut ops = Vec::new();
        ops.push(Operation::new("% Mermaid (legacy)", vec![]));
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(mermaid.base.width as f32),
            Object::Real(mermaid.base.height as f32),
        ]));
        ops.push(Operation::new("S", vec![]));
        Ok(ops)
    }
    
    fn stream_freedraw_legacy(&self, freedraw: &DucFreeDrawElement) -> ConversionResult<Vec<Operation>> {
        // Fallback to basic rendering without resource manager
        let mut ops = Vec::new();
        ops.push(Operation::new("% Freedraw (legacy)", vec![]));
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(freedraw.base.width as f32),
            Object::Real(freedraw.base.height as f32),
        ]));
        ops.push(Operation::new("S", vec![]));
        Ok(ops)
    }
    
    fn stream_pdf_element_legacy(&self, pdf: &DucPdfElement) -> ConversionResult<Vec<Operation>> {
        // Fallback to basic rendering without PDF embedder
        let mut ops = Vec::new();
        ops.push(Operation::new("% PDF (legacy - no embedder available)", vec![]));
        
        // Create a better visual placeholder for PDF
        ops.push(Operation::new("q", vec![])); // Save state
        
        // Draw rectangle with PDF-specific styling
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(pdf.base.width as f32),
            Object::Real(pdf.base.height as f32),
        ]));
        
        // Add diagonal lines to indicate PDF content
        ops.push(Operation::new("w", vec![Object::Real(1.0)])); // Line width
        ops.push(Operation::new("RG", vec![Object::Real(0.5), Object::Real(0.5), Object::Real(0.8)])); // Blue-gray
        ops.push(Operation::new("S", vec![])); // Stroke border
        
        // Add diagonal pattern
        ops.push(Operation::new("w", vec![Object::Real(0.5)])); // Thinner lines
        ops.push(Operation::new("RG", vec![Object::Real(0.7), Object::Real(0.7), Object::Real(0.9)])); // Light blue
        ops.push(Operation::new("m", vec![Object::Real(0.0), Object::Real(0.0)])); // Move to start
        ops.push(Operation::new("l", vec![Object::Real(pdf.base.width as f32), Object::Real(pdf.base.height as f32)])); // Line to end
        ops.push(Operation::new("S", vec![])); // Stroke diagonal
        
        ops.push(Operation::new("Q", vec![])); // Restore state
        Ok(ops)
    }
    
    fn stream_image_legacy(&self, image: &DucImageElement) -> ConversionResult<Vec<Operation>> {
        // Fallback to basic rendering without resource manager
        let mut ops = Vec::new();
        ops.push(Operation::new("% Image (legacy - no resource streamer available)", vec![]));
        
        // Create a better visual placeholder for images
        ops.push(Operation::new("q", vec![])); // Save state
        
        // Draw rectangle with image-specific styling
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(image.base.width as f32),
            Object::Real(image.base.height as f32),
        ]));
        
        // Add border and fill to indicate image area
        ops.push(Operation::new("w", vec![Object::Real(1.0)])); // Line width
        ops.push(Operation::new("RG", vec![Object::Real(0.6), Object::Real(0.3), Object::Real(0.3)])); // Red border
        ops.push(Operation::new("S", vec![])); // Stroke border
        
        // Add cross-hatch pattern to indicate image content
        ops.push(Operation::new("w", vec![Object::Real(0.3)])); // Thin lines
        ops.push(Operation::new("RG", vec![Object::Real(0.8), Object::Real(0.8), Object::Real(0.8)])); // Gray cross-hatch
        
        // Draw cross-hatch lines
        ops.push(Operation::new("m", vec![Object::Real(0.0), Object::Real(0.0)]));
        ops.push(Operation::new("l", vec![Object::Real(image.base.width as f32), Object::Real(image.base.height as f32)]));
        ops.push(Operation::new("S", vec![]));
        
        ops.push(Operation::new("m", vec![Object::Real(image.base.width as f32), Object::Real(0.0)]));
        ops.push(Operation::new("l", vec![Object::Real(0.0), Object::Real(image.base.height as f32)]));
        ops.push(Operation::new("S", vec![]));
        
        ops.push(Operation::new("Q", vec![])); // Restore state
        Ok(ops)
    }
    
    fn stream_block_instance_legacy(&self, block_instance: &DucBlockInstanceElement) -> ConversionResult<Vec<Operation>> {
        // Fallback to basic rendering without block manager
        let mut ops = Vec::new();
        ops.push(Operation::new("% Block Instance (legacy)", vec![]));
        ops.push(Operation::new("re", vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(block_instance.base.width as f32),
            Object::Real(block_instance.base.height as f32),
        ]));
        ops.push(Operation::new("S", vec![]));
        Ok(ops)
    }
}
