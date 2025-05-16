use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::types::*;
use crate::generated::duc::{
    DucElement as FbDucElement, DucElementBuilder,
    Point as FbPoint, PointBuilder,
    SimplePoint as FbSimplePoint, SimplePointBuilder,
    PointBinding as FbPointBinding, PointBindingBuilder,
    BindingPointBuilder,
    BoundElementBuilder,
    ElementStroke as FbElementStroke, ElementStrokeBuilder,
    ElementBackground as FbElementBackground, ElementBackgroundBuilder,
    ElementContentBase as FbElementContentBase, ElementContentBaseBuilder,
    StrokeStyle as FbStrokeStyle, StrokeStyleBuilder,
    StrokeSides as FbStrokeSides, StrokeSidesBuilder,
    TilingProperties as FbTilingProperties, TilingPropertiesBuilder,
    ImageCrop as FbImageCrop, ImageCropBuilder,
};

/// Serializes a Rust DucElementVariant into a FlatBuffers DucElement
pub fn serialize_duc_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element_variant: &DucElementVariant,
) -> WIPOffset<FbDucElement<'a>> {
    match element_variant {
        DucElementVariant::Base(element) => {
            serialize_base_duc_element(builder, element)
        },
        DucElementVariant::Rectangle(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        },
        DucElementVariant::Ellipse(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        },
        DucElementVariant::Diamond(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        },
        DucElementVariant::Text(element) => {
            serialize_text_element(builder, element)
        },
        DucElementVariant::Linear(element) => {
            serialize_linear_element(builder, element)
        },
        DucElementVariant::Arrow(element) => {
            serialize_arrow_element(builder, element)
        },
        DucElementVariant::FreeDraw(element) => {
            serialize_freedraw_element(builder, element)
        },
        DucElementVariant::Image(element) => {
            serialize_image_element(builder, element)
        },
        DucElementVariant::Frame(element) => {
            serialize_frame_element(builder, element)
        },
        DucElementVariant::Group(element) => {
            serialize_group_element(builder, element)
        },
        DucElementVariant::MagicFrame(element) => {
            serialize_magic_frame_element(builder, element)
        },
        DucElementVariant::Selection(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        },
    }
}

/// Helper function to serialize a base DucElement
pub fn serialize_base_duc_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucElement,
) -> WIPOffset<FbDucElement<'a>> {
    let element_builder = serialize_base_duc_element_with_builder(builder, element);
    element_builder.finish()
}

/// Helper function to create a DucElementBuilder with common fields
pub fn serialize_base_duc_element_with_builder<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    element: &DucElement,
) -> DucElementBuilder<'a, 'b, A> {
    // Create string offsets
    let id = builder.create_string(&element.id);
    let element_type = builder.create_string(&element.element_type);
    let scope = builder.create_string(&element.scope);
    let label = builder.create_string(&element.label);
    
    // Serialize group IDs
    let group_ids = if !element.group_ids.is_empty() {
        let mut ids_vec = Vec::with_capacity(element.group_ids.len());
        for id in &element.group_ids {
            ids_vec.push(builder.create_string(id));
        }
        Some(builder.create_vector(&ids_vec))
    } else {
        None
    };
    
    // Serialize frame ID
    let frame_id = element.frame_id.as_ref().map(|id| builder.create_string(id));
    
    // Serialize link
    let link = element.link.as_ref().map(|l| builder.create_string(l));
    
    // Serialize bound elements
    let bound_elements = if let Some(elements) = &element.bound_elements {
        if !elements.is_empty() {
            let mut elements_vec = Vec::with_capacity(elements.len());
            for bound in elements {
                let id = builder.create_string(&bound.id);
                let element_type = builder.create_string(&bound.element_type);
                
                let mut bound_builder = BoundElementBuilder::new(builder);
                bound_builder.add_id(id);
                bound_builder.add_type_(element_type);
                
                elements_vec.push(bound_builder.finish());
            }
            Some(builder.create_vector(&elements_vec))
        } else {
            None
        }
    } else {
        None
    };
    
    // Serialize strokes
    let strokes = if !element.stroke.is_empty() {
        let mut strokes_vec = Vec::with_capacity(element.stroke.len());
        for stroke in &element.stroke {
            let stroke_offset = serialize_element_stroke(builder, stroke);
            strokes_vec.push(stroke_offset);
        }
        Some(builder.create_vector(&strokes_vec))
    } else {
        None
    };
    
    // Serialize backgrounds
    let backgrounds = if !element.background.is_empty() {
        let mut bg_vec = Vec::with_capacity(element.background.len());
        for bg in &element.background {
            let bg_offset = serialize_element_background(builder, bg);
            bg_vec.push(bg_offset);
        }
        Some(builder.create_vector(&bg_vec))
    } else {
        None
    };
    
    // Create element builder and add common fields
    let mut element_builder = DucElementBuilder::new(builder);
    element_builder.add_id(id);
    element_builder.add_type_(element_type);
    element_builder.add_x_v3(element.x);
    element_builder.add_y_v3(element.y);
    element_builder.add_scope(scope);
    element_builder.add_label(label);
    element_builder.add_is_visible(element.is_visible);
    element_builder.add_roundness(element.roundness);
    
    // Add blending mode if present
    if let Some(blending) = element.blending {
        element_builder.add_blending(blending as i8);
    }
    
    // Add element subset if present
    if let Some(subset) = element.subset {
        element_builder.add_subset(subset as i8);
    }
    
    element_builder.add_opacity(element.opacity as f32);
    element_builder.add_width_v3(element.width);
    element_builder.add_height_v3(element.height);
    element_builder.add_angle_v3(element.angle);
    element_builder.add_is_deleted(element.is_deleted);
    
    // Add group IDs if present
    if let Some(ids) = group_ids {
        element_builder.add_group_ids(ids);
    }
    
    // Add frame ID if present
    if let Some(id) = frame_id {
        element_builder.add_frame_id(id);
    }
    
    // Add bound elements if present
    if let Some(elements) = bound_elements {
        element_builder.add_bound_elements(elements);
    }
    
    // Add link if present
    if let Some(l) = link {
        element_builder.add_link(l);
    }
    
    element_builder.add_locked(element.locked);
    element_builder.add_z_index(element.z_index);
    
    // Add strokes if present
    if let Some(s) = strokes {
        element_builder.add_stroke(s);
    }
    
    // Add backgrounds if present
    if let Some(bg) = backgrounds {
        element_builder.add_background(bg);
    }
    
    element_builder
}

/// Serialize a Text element
pub fn serialize_text_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucTextElement,
) -> WIPOffset<FbDucElement<'a>> {
    // We need to manually create the builder instead of using serialize_base_duc_element_with_builder
    // to avoid multiple mutable borrows
    
    // Create a base element with common fields
    let id = builder.create_string(&element.base.id);
    let element_type = builder.create_string(&element.base.element_type);
    let scope = builder.create_string(&element.base.scope);
    let label = builder.create_string(&element.base.label);
    
    // Create text-specific resources
    let text = builder.create_string(&element.text);
    let font_family = builder.create_string(&format!("{}", element.font_family as i8));
    
    // Container ID if present
    let container_id_offset = if let Some(container_id) = &element.container_id {
        Some(builder.create_string(container_id))
    } else {
        None
    };
    
    // Serialize group IDs
    let group_ids = if !element.base.group_ids.is_empty() {
        let mut ids_vec = Vec::with_capacity(element.base.group_ids.len());
        for id in &element.base.group_ids {
            ids_vec.push(builder.create_string(id));
        }
        Some(builder.create_vector(&ids_vec))
    } else {
        None
    };
    
    // Serialize frame ID
    let frame_id = element.base.frame_id.as_ref().map(|id| builder.create_string(id));
    
    // Serialize link
    let link = element.base.link.as_ref().map(|l| builder.create_string(l));
    
    // Serialize bound elements
    let bound_elements = if let Some(elements) = &element.base.bound_elements {
        if !elements.is_empty() {
            let mut elements_vec = Vec::with_capacity(elements.len());
            for bound in elements {
                let id = builder.create_string(&bound.id);
                let element_type = builder.create_string(&bound.element_type);
                
                let mut bound_builder = BoundElementBuilder::new(builder);
                bound_builder.add_id(id);
                bound_builder.add_type_(element_type);
                
                elements_vec.push(bound_builder.finish());
            }
            Some(builder.create_vector(&elements_vec))
        } else {
            None
        }
    } else {
        None
    };
    
    // Serialize strokes
    let strokes = if !element.base.stroke.is_empty() {
        let mut strokes_vec = Vec::with_capacity(element.base.stroke.len());
        for stroke in &element.base.stroke {
            let stroke_offset = serialize_element_stroke(builder, stroke);
            strokes_vec.push(stroke_offset);
        }
        Some(builder.create_vector(&strokes_vec))
    } else {
        None
    };
    
    // Serialize backgrounds
    let backgrounds = if !element.base.background.is_empty() {
        let mut bg_vec = Vec::with_capacity(element.base.background.len());
        for bg in &element.base.background {
            let bg_offset = serialize_element_background(builder, bg);
            bg_vec.push(bg_offset);
        }
        Some(builder.create_vector(&bg_vec))
    } else {
        None
    };
    
    // Now build the element with all the resources we've prepared
    let mut element_builder = DucElementBuilder::new(builder);
    
    // Add base element fields
    element_builder.add_id(id);
    element_builder.add_type_(element_type);
    element_builder.add_x_v3(element.base.x);
    element_builder.add_y_v3(element.base.y);
    element_builder.add_scope(scope);
    element_builder.add_label(label);
    element_builder.add_is_visible(element.base.is_visible);
    element_builder.add_roundness(element.base.roundness);
    
    // Add blending mode if present
    if let Some(blending) = element.base.blending {
        element_builder.add_blending(blending as i8);
    }
    
    // Add element subset if present
    if let Some(subset) = element.base.subset {
        element_builder.add_subset(subset as i8);
    }
    
    element_builder.add_opacity(element.base.opacity as f32);
    element_builder.add_width_v3(element.base.width);
    element_builder.add_height_v3(element.base.height);
    element_builder.add_angle_v3(element.base.angle);
    element_builder.add_is_deleted(element.base.is_deleted);
    
    // Add group IDs if present
    if let Some(ids) = group_ids {
        element_builder.add_group_ids(ids);
    }
    
    // Add frame ID if present
    if let Some(id) = frame_id {
        element_builder.add_frame_id(id);
    }
    
    // Add bound elements if present
    if let Some(elements) = bound_elements {
        element_builder.add_bound_elements(elements);
    }
    
    // Add link if present
    if let Some(l) = link {
        element_builder.add_link(l);
    }
    
    element_builder.add_locked(element.base.locked);
    element_builder.add_z_index(element.base.z_index);
    
    // Add strokes if present
    if let Some(s) = strokes {
        element_builder.add_stroke(s);
    }
    
    // Add backgrounds if present
    if let Some(bg) = backgrounds {
        element_builder.add_background(bg);
    }
    
    // Add text-specific fields
    element_builder.add_text(text);
    element_builder.add_font_family(font_family);
    element_builder.add_font_size_v3(element.font_size);
    element_builder.add_text_align_v3(element.text_align as i8);
    element_builder.add_vertical_align_v3(element.vertical_align as i8);
    element_builder.add_line_height_v3(element.line_height);
    element_builder.add_auto_resize(element.auto_resize);
    
    // Add container ID if we prepared it
    if let Some(id) = container_id_offset {
        element_builder.add_container_id(id);
    }
    
    element_builder.finish()
}

/// Serialize a Linear element
pub fn serialize_linear_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucLinearElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create all the points and resources needed
    let mut points_vec = Vec::with_capacity(element.points.len());
    for point in &element.points {
        let point_offset = serialize_point(builder, point);
        points_vec.push(point_offset);
    }
    let points = if !element.points.is_empty() {
        Some(builder.create_vector(&points_vec))
    } else {
        None
    };
    
    // Last committed point
    let last_committed_point_offset = if let Some(point) = &element.last_committed_point {
        Some(serialize_point(builder, point))
    } else {
        None
    };
    
    // Bindings
    let start_binding_offset = if let Some(binding) = &element.start_binding {
        Some(serialize_point_binding(builder, binding))
    } else {
        None
    };
    
    let end_binding_offset = if let Some(binding) = &element.end_binding {
        Some(serialize_point_binding(builder, binding))
    } else {
        None
    };
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    
    // Add all prepared resources
    if let Some(pts) = points {
        element_builder.add_points(pts);
    }
    
    if let Some(point) = last_committed_point_offset {
        element_builder.add_last_committed_point(point);
    }
    
    if let Some(binding) = start_binding_offset {
        element_builder.add_start_binding(binding);
    }
    
    if let Some(binding) = end_binding_offset {
        element_builder.add_end_binding(binding);
    }
    
    element_builder.finish()
}

/// Serialize an Arrow element
pub fn serialize_arrow_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucArrowElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create all the points and resources needed
    let mut points_vec = Vec::with_capacity(element.base.points.len());
    for point in &element.base.points {
        let point_offset = serialize_point(builder, point);
        points_vec.push(point_offset);
    }
    let points = if !element.base.points.is_empty() {
        Some(builder.create_vector(&points_vec))
    } else {
        None
    };
    
    // Last committed point
    let last_committed_point_offset = if let Some(point) = &element.base.last_committed_point {
        Some(serialize_point(builder, point))
    } else {
        None
    };
    
    // Bindings
    let start_binding_offset = if let Some(binding) = &element.base.start_binding {
        Some(serialize_point_binding(builder, binding))
    } else {
        None
    };
    
    let end_binding_offset = if let Some(binding) = &element.base.end_binding {
        Some(serialize_point_binding(builder, binding))
    } else {
        None
    };
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base.base);
    
    // Add all prepared resources
    if let Some(pts) = points {
        element_builder.add_points(pts);
    }
    
    if let Some(point) = last_committed_point_offset {
        element_builder.add_last_committed_point(point);
    }
    
    if let Some(binding) = start_binding_offset {
        element_builder.add_start_binding(binding);
    }
    
    if let Some(binding) = end_binding_offset {
        element_builder.add_end_binding(binding);
    }
    
    // Add arrow-specific fields
    element_builder.add_elbowed(element.elbowed);
    
    element_builder.finish()
}

/// Serialize a FreeDraw element
pub fn serialize_freedraw_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucFreeDrawElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create all the points and resources needed
    let mut points_vec = Vec::with_capacity(element.points.len());
    for point in &element.points {
        let point_offset = serialize_point(builder, point);
        points_vec.push(point_offset);
    }
    let points = if !element.points.is_empty() {
        Some(builder.create_vector(&points_vec))
    } else {
        None
    };
    
    // Pressures
    let pressures = if !element.pressures.is_empty() {
        Some(builder.create_vector(&element.pressures))
    } else {
        None
    };
    
    // Last committed point
    let last_committed_point_offset = if let Some(point) = &element.last_committed_point {
        Some(serialize_point(builder, point))
    } else {
        None
    };
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    
    // Add all prepared resources
    if let Some(pts) = points {
        element_builder.add_points(pts);
    }
    
    if let Some(press) = pressures {
        element_builder.add_pressures_v3(press);
    }
    
    // Add simulate pressure flag
    element_builder.add_simulate_pressure(element.simulate_pressure);
    
    if let Some(point) = last_committed_point_offset {
        element_builder.add_last_committed_point(point);
    }
    
    element_builder.finish()
}

/// Serialize an Image element
pub fn serialize_image_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucImageElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create all the resources needed
    let file_id_offset = if let Some(file_id) = &element.file_id {
        Some(builder.create_string(file_id))
    } else {
        None
    };
    
    let status = builder.create_string(match element.status {
        ImageStatus::Pending => "pending",
        ImageStatus::Loaded => "saved",
        ImageStatus::Error => "error",
    });
    
    // Create scale
    let scale = serialize_simple_point(builder, &SimplePoint {
        x: element.scale.0,
        y: element.scale.1,
    });
    
    // Create crop if present
    let crop_offset = if let Some(crop) = &element.crop {
        Some(serialize_image_crop(builder, crop))
    } else {
        None
    };
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    
    // Add all prepared resources
    if let Some(id) = file_id_offset {
        element_builder.add_file_id(id);
    }
    
    element_builder.add_status(status);
    element_builder.add_scale_v3(scale);
    
    if let Some(crop) = crop_offset {
        element_builder.add_crop(crop);
    }
    
    element_builder.finish()
}

/// Serialize a Frame element
pub fn serialize_frame_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucFrameElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create the string resources
    let name = builder.create_string(&element.base.label);
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    
    // Add frame-specific fields
    element_builder.add_is_collapsed(element.is_collapsed);
    element_builder.add_clip(element.clip);
    element_builder.add_name(name);
    
    element_builder.finish()
}

/// Serialize a Group element
pub fn serialize_group_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucGroupElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create the string resources
    let name = builder.create_string(&element.base.label);
    let group_id_ref = builder.create_string(&element.group_id_ref);
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    
    // Add group-specific fields
    element_builder.add_is_collapsed(element.is_collapsed);
    element_builder.add_clip(element.clip);
    element_builder.add_name(name);
    element_builder.add_group_id_ref(group_id_ref);
    
    element_builder.finish()
}

/// Serialize a MagicFrame element
pub fn serialize_magic_frame_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucMagicFrameElement,
) -> WIPOffset<FbDucElement<'a>> {
    // First create the string resources
    let name = builder.create_string(&element.base.label);
    
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    
    // Add magicframe-specific fields
    element_builder.add_is_collapsed(element.is_collapsed);
    element_builder.add_clip(element.clip);
    element_builder.add_name(name);
    
    element_builder.finish()
}

/// Helper function to serialize a Point
pub fn serialize_point<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    point: &Point,
) -> WIPOffset<FbPoint<'a>> {
    // Create a local builder for handles first
    let handle_in_offset = if let Some(handle) = &point.handle_in {
        Some(serialize_simple_point(builder, handle))
    } else {
        None
    };
    
    let handle_out_offset = if let Some(handle) = &point.handle_out {
        Some(serialize_simple_point(builder, handle))
    } else {
        None
    };
    
    // Now build the point
    let mut point_builder = PointBuilder::new(builder);
    
    point_builder.add_x_v3(point.x);
    point_builder.add_y_v3(point.y);
    point_builder.add_peer(point.peer);
    
    if let Some(is_curve) = point.is_curve {
        point_builder.add_is_curve(is_curve);
    }
    
    if let Some(mirroring) = point.mirroring {
        point_builder.add_mirroring(mirroring as i8);
    }
    
    if let Some(border_radius) = point.border_radius {
        point_builder.add_border_radius(border_radius);
    }
    
    // Add handle_in if we prepared it
    if let Some(handle) = handle_in_offset {
        point_builder.add_handle_in(handle);
    }
    
    // Add handle_out if we prepared it
    if let Some(handle) = handle_out_offset {
        point_builder.add_handle_out(handle);
    }
    
    point_builder.finish()
}

/// Helper function to serialize a SimplePoint
pub fn serialize_simple_point<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    point: &SimplePoint,
) -> WIPOffset<FbSimplePoint<'a>> {
    let mut point_builder = SimplePointBuilder::new(builder);
    point_builder.add_x(point.x);
    point_builder.add_y(point.y);
    point_builder.finish()
}

/// Helper function to serialize a PointBinding
pub fn serialize_point_binding<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    binding: &PointBinding,
) -> WIPOffset<FbPointBinding<'a>> {
    // Create all string/object offsets first to avoid borrowing conflicts
    let element_id = builder.create_string(&binding.element_id);
    
    // Create the fixed_point if it exists - serialize as SimplePoint
    let fixed_point_offset = if let Some(point) = &binding.fixed_point {
        Some(serialize_simple_point(builder, point))
    } else {
        None
    };
    
    // Create bound point if needed
    let bound_point_offset = if let Some(point) = &binding.point {
        let mut bp_builder = BindingPointBuilder::new(builder);
        bp_builder.add_index(point.index);
        bp_builder.add_offset(point.offset);
        Some(bp_builder.finish())
    } else {
        None
    };
    
    // Now build the binding
    let mut binding_builder = PointBindingBuilder::new(builder);
    binding_builder.add_element_id(element_id);
    binding_builder.add_focus(binding.focus);
    binding_builder.add_gap(binding.gap);
    
    // Add head enum value as i8
    if let Some(head) = binding.head {
        binding_builder.add_head(head as i8);
    } else {
        binding_builder.add_head(0);
    }
    
    // Add fixed point if we prepared it
    if let Some(point_offset) = fixed_point_offset {
        binding_builder.add_fixed_point(point_offset);
    }
    
    // Add bound point if we prepared it
    if let Some(point) = bound_point_offset {
        binding_builder.add_point(point);
    }
    
    binding_builder.finish()
}

/// Helper function to serialize an ElementStroke
pub fn serialize_element_stroke<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    stroke: &ElementStroke,
) -> WIPOffset<FbElementStroke<'a>> {
    // Create content and style first
    let content = serialize_element_content_base(builder, &stroke.content);
    let style = serialize_stroke_style(builder, &stroke.style);
    
    // Create stroke sides if needed
    let sides_offset = if let Some(sides) = &stroke.stroke_sides {
        Some(serialize_stroke_sides(builder, sides))
    } else {
        None
    };
    
    // Now build the stroke
    let mut stroke_builder = ElementStrokeBuilder::new(builder);
    stroke_builder.add_content(content);
    stroke_builder.add_width(stroke.width);
    stroke_builder.add_style(style);
    stroke_builder.add_placement(stroke.placement as i8);
    
    // Add stroke sides if we prepared it
    if let Some(sides) = sides_offset {
        stroke_builder.add_stroke_sides(sides);
    }
    
    stroke_builder.finish()
}

/// Helper function to serialize an ElementBackground
pub fn serialize_element_background<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    background: &ElementBackground,
) -> WIPOffset<FbElementBackground<'a>> {
    // Create content first
    let content = serialize_element_content_base(builder, &background.content);
    
    // Now build the background
    let mut bg_builder = ElementBackgroundBuilder::new(builder);
    bg_builder.add_content(content);
    
    bg_builder.finish()
}

/// Helper function to serialize an ElementContentBase
pub fn serialize_element_content_base<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    content: &ElementContentBase,
) -> WIPOffset<FbElementContentBase<'a>> {
    // Create src string first
    let src = builder.create_string(&content.src);
    
    // Create tiling properties if needed
    let tiling_offset = if let Some(tiling) = &content.tiling {
        Some(serialize_tiling_properties(builder, tiling))
    } else {
        None
    };
    
    // Now build the content
    let mut content_builder = ElementContentBaseBuilder::new(builder);
    content_builder.add_preference(content.preference as i8);
    content_builder.add_src(src);
    content_builder.add_visible(content.visible);
    content_builder.add_opacity(content.opacity);
    
    // Add tiling if we prepared it
    if let Some(tiling) = tiling_offset {
        content_builder.add_tiling(tiling);
    }
    
    content_builder.finish()
}

/// Helper function to serialize a StrokeStyle
pub fn serialize_stroke_style<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    style: &StrokeStyle,
) -> WIPOffset<FbStrokeStyle<'a>> {
    // Create dash vector first if needed
    let dash_vector = if let Some(dash) = &style.dash {
        Some(builder.create_vector(dash))
    } else {
        None
    };
    
    // Now build the style
    let mut style_builder = StrokeStyleBuilder::new(builder);
    style_builder.add_preference(style.preference as i8);
    
    // Add cap if present
    if let Some(cap) = style.cap {
        style_builder.add_cap(cap as i8);
    }
    
    // Add join if present
    if let Some(join) = style.join {
        style_builder.add_join(join as i8);
    }
    
    // Add dash array if we prepared it
    if let Some(dash) = dash_vector {
        style_builder.add_dash(dash);
    }
    
    // Add dash cap if present
    if let Some(dash_cap) = style.dash_cap {
        style_builder.add_dash_cap(dash_cap as i8);
    }
    
    // Add miter limit if present
    if let Some(miter_limit) = style.miter_limit {
        style_builder.add_miter_limit(miter_limit);
    }
    
    style_builder.finish()
}

/// Helper function to serialize a StrokeSides
pub fn serialize_stroke_sides<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    sides: &StrokeSides,
) -> WIPOffset<FbStrokeSides<'a>> {
    // Create values vector first if needed
    let values_vector = if let Some(values) = &sides.values {
        Some(builder.create_vector(values))
    } else {
        None
    };
    
    // Now build the sides
    let mut sides_builder = StrokeSidesBuilder::new(builder);
    sides_builder.add_preference(sides.preference as i8);
    
    // Add values if we prepared them
    if let Some(values) = values_vector {
        sides_builder.add_values(values);
    }
    
    sides_builder.finish()
}

/// Helper function to serialize TilingProperties
pub fn serialize_tiling_properties<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    tiling: &TilingProperties,
) -> WIPOffset<FbTilingProperties<'a>> {
    let mut tiling_builder = TilingPropertiesBuilder::new(builder);
    tiling_builder.add_size_in_percent(tiling.size_in_percent);
    tiling_builder.add_angle(tiling.angle);
    
    // Add spacing if present
    if let Some(spacing) = tiling.spacing {
        tiling_builder.add_spacing(spacing);
    }
    
    // Add offset_x if present
    if let Some(offset_x) = tiling.offset_x {
        tiling_builder.add_offset_x(offset_x);
    }
    
    // Add offset_y if present
    if let Some(offset_y) = tiling.offset_y {
        tiling_builder.add_offset_y(offset_y);
    }
    
    tiling_builder.finish()
}

/// Helper function to serialize ImageCrop
pub fn serialize_image_crop<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    crop: &ImageCrop,
) -> WIPOffset<FbImageCrop<'a>> {
    let mut crop_builder = ImageCropBuilder::new(builder);
    crop_builder.add_x(crop.x);
    crop_builder.add_y(crop.y);
    crop_builder.add_width(crop.width);
    crop_builder.add_height(crop.height);
    crop_builder.add_natural_width(crop.natural_width);
    crop_builder.add_natural_height(crop.natural_height);
    
    crop_builder.finish()
} 