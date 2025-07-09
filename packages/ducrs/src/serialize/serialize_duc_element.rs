use flatbuffers::{self, FlatBufferBuilder, WIPOffset};

use crate::generated::duc::{
    BindingPointBuilder, BoundElementBuilder, 
    DucBlockInstanceElementOverrideBuilder, DucElement as FbDucElement, DucElementBuilder,
    DucPath as FbDucPath, DucPathBuilder, DucTableCell as FbDucTableCell, DucTableCellBuilder,
    DucTableColumn as FbDucTableColumn, DucTableColumnBuilder, DucTableRow as FbDucTableRow,
    DucTableRowBuilder, DucTableStyleBuilder, DucTableStyleProps as FbDucTableStyleProps,
    DucTableStylePropsBuilder, ElementBackground as FbElementBackground, ElementBackgroundBuilder,
    ElementContentBase as FbElementContentBase, ElementContentBaseBuilder,
    ElementStroke as FbElementStroke, ElementStrokeBuilder, ImageCrop as FbImageCrop,
    ImageCropBuilder, Point as FbPoint, PointBinding as FbPointBinding, PointBindingBuilder,
    PointBuilder, SimplePoint as FbSimplePoint, SimplePointBuilder, StrokeSides as FbStrokeSides,
    StrokeSidesBuilder, StrokeStyle as FbStrokeStyle, StrokeStyleBuilder,
    TilingProperties as FbTilingProperties, TilingPropertiesBuilder,
};
use crate::types::*;

/// Serializes a Rust DucElementVariant into a FlatBuffers DucElement
pub fn serialize_duc_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element_variant: &DucElementVariant,
) -> WIPOffset<FbDucElement<'a>> {
    match element_variant {
        DucElementVariant::Base(element) => serialize_base_duc_element(builder, element),
        DucElementVariant::Rectangle(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        }
        DucElementVariant::Ellipse(element) => serialize_ellipse_element(builder, element),
        DucElementVariant::Polygon(element) => serialize_polygon_element(builder, element),
        DucElementVariant::Text(element) => serialize_text_element(builder, element),
        DucElementVariant::Linear(element) => serialize_linear_element(builder, element),
        DucElementVariant::Arrow(element) => serialize_arrow_element(builder, element),
        DucElementVariant::FreeDraw(element) => serialize_freedraw_element(builder, element),
        DucElementVariant::Image(element) => serialize_image_element(builder, element),
        DucElementVariant::Frame(element) => serialize_frame_element(builder, element),
        DucElementVariant::MagicFrame(element) => serialize_magic_frame_element(builder, element),
        DucElementVariant::Selection(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        }
        DucElementVariant::Table(element) => serialize_table_element(builder, element),
        DucElementVariant::Doc(element) => serialize_doc_element(builder, element),
        DucElementVariant::Embeddable(element) => {
            let base = serialize_base_duc_element_with_builder(builder, &element.base);
            base.finish()
        }
        DucElementVariant::BlockInstance(element) => serialize_block_instance_element(builder, element),
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

    // Create description offset if present
    let description_offset = element.description.as_ref().map(|desc| builder.create_string(desc));

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
    let frame_id = element
        .frame_id
        .as_ref()
        .map(|id| builder.create_string(id));

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
    element_builder.add_x(element.x);
    element_builder.add_y(element.y);
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
    element_builder.add_width(element.width);
    element_builder.add_height(element.height);
    element_builder.add_angle(element.angle);
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

    // Add description field if present
    if let Some(description) = description_offset {
        element_builder.add_description(description);
    }
    element_builder.add_no_plot(element.no_plot);

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
    let frame_id = element
        .base
        .frame_id
        .as_ref()
        .map(|id| builder.create_string(id));

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
    element_builder.add_x(element.base.x);
    element_builder.add_y(element.base.y);
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
    element_builder.add_width(element.base.width);
    element_builder.add_height(element.base.height);
    element_builder.add_angle(element.base.angle);
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

    // Add text-specific fields with new naming convention
    element_builder.add_text_text(text);
    element_builder.add_text_font_family(font_family);
    element_builder.add_text_font_size(element.font_size);
    element_builder.add_text_text_align(element.text_align as i8);
    element_builder.add_text_vertical_align(element.vertical_align as i8);
    element_builder.add_text_line_height(element.line_height);
    element_builder.add_text_auto_resize(element.auto_resize);

    // Add container ID if we prepared it
    if let Some(id) = container_id_offset {
        element_builder.add_text_container_id(id);
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

    // Path overrides
    let path_overrides = if !element.path_overrides.is_empty() {
        let mut paths_vec = Vec::with_capacity(element.path_overrides.len());
        for path in &element.path_overrides {
            let path_offset = serialize_duc_path(builder, path);
            paths_vec.push(path_offset);
        }
        Some(builder.create_vector(&paths_vec))
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
        element_builder.add_linear_element_points(pts);
    }

    if let Some(paths) = path_overrides {
        element_builder.add_linear_element_path_overrides(paths);
    }

    if let Some(point) = last_committed_point_offset {
        element_builder.add_linear_element_last_committed_point(point);
    }

    if let Some(binding) = start_binding_offset {
        element_builder.add_linear_element_start_binding(binding);
    }

    if let Some(binding) = end_binding_offset {
        element_builder.add_linear_element_end_binding(binding);
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

    // Path overrides
    let path_overrides = if !element.base.path_overrides.is_empty() {
        let mut paths_vec = Vec::with_capacity(element.base.path_overrides.len());
        for path in &element.base.path_overrides {
            let path_offset = serialize_duc_path(builder, path);
            paths_vec.push(path_offset);
        }
        Some(builder.create_vector(&paths_vec))
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
        element_builder.add_linear_element_points(pts);
    }

    if let Some(paths) = path_overrides {
        element_builder.add_linear_element_path_overrides(paths);
    }

    if let Some(point) = last_committed_point_offset {
        element_builder.add_linear_element_last_committed_point(point);
    }

    if let Some(binding) = start_binding_offset {
        element_builder.add_linear_element_start_binding(binding);
    }

    if let Some(binding) = end_binding_offset {
        element_builder.add_linear_element_end_binding(binding);
    }

    // Add arrow-specific fields
    element_builder.add_arrow_elbowed(element.elbowed);

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

    // Create string offsets for easing properties and svg_path
    let easing_offset = element.easing.as_ref().map(|s| builder.create_string(s));
    let start_easing_offset = element.start_easing.as_ref().map(|s| builder.create_string(s));
    let end_easing_offset = element.end_easing.as_ref().map(|s| builder.create_string(s));
    let svg_path_offset = element.svg_path.as_ref().map(|s| builder.create_string(s));

    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);

    // Add all prepared resources
    if let Some(pts) = points {
        element_builder.add_linear_element_points(pts);
    }

    if let Some(press) = pressures {
        element_builder.add_free_draw_pressures(press)
    }

    // Add simulate pressure flag
    element_builder.add_free_draw_simulate_pressure(element.simulate_pressure);

    if let Some(point) = last_committed_point_offset {
        element_builder.add_linear_element_last_committed_point(point);
    }

    if let Some(thinning) = element.thinning {
        element_builder.add_free_draw_thinning(thinning);
    }
    if let Some(smoothing) = element.smoothing {
        element_builder.add_free_draw_smoothing(smoothing);
    }
    if let Some(streamline) = element.streamline {
        element_builder.add_free_draw_streamline(streamline);
    }
    if let Some(offset) = easing_offset {
        element_builder.add_free_draw_easing(offset);
    }
    if let Some(start_cap) = element.start_cap {
        element_builder.add_free_draw_start_cap(start_cap);
    }
    if let Some(start_taper) = element.start_taper {
        element_builder.add_free_draw_start_taper(start_taper);
    }
    if let Some(offset) = start_easing_offset {
        element_builder.add_free_draw_start_easing(offset);
    }
    if let Some(end_cap) = element.end_cap {
        element_builder.add_free_draw_end_cap(end_cap);
    }
    if let Some(end_taper) = element.end_taper {
        element_builder.add_free_draw_end_taper(end_taper);
    }
    if let Some(offset) = end_easing_offset {
        element_builder.add_free_draw_end_easing(offset);
    }
    if let Some(offset) = svg_path_offset {
        element_builder.add_free_draw_svg_path(offset);
    }
    element_builder.add_free_draw_size(element.size);

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

    // Create scale
    let scale = serialize_simple_point(
        builder,
        &SimplePoint {
            x: element.scale.0,
            y: element.scale.1,
        },
    );

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

    element_builder.add_image_status(element.status);
    element_builder.add_image_scale(scale);

    if let Some(crop) = crop_offset {
        element_builder.add_image_crop(crop);
    }

    element_builder.finish()
}

/// Serialize a Polygon element
pub fn serialize_polygon_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucPolygonElement,
) -> WIPOffset<FbDucElement<'a>> {
    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);

    // Add frame-specific fields
    element_builder.add_polygon_sides(element.sides);

    element_builder.finish()
}

/// Serialize a Frame element
pub fn serialize_frame_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucFrameElement,
) -> WIPOffset<FbDucElement<'a>> {
    // Create labeling color string
    let labeling_color_offset = builder.create_string(&element.labeling_color);
    
    // Create stroke override if present
    let stroke_override_offset = if let Some(stroke) = &element.stroke_override {
        Some(serialize_element_stroke(builder, stroke))
    } else {
        None
    };
    
    // Create background override if present
    let background_override_offset = if let Some(background) = &element.background_override {
        Some(serialize_element_background(builder, background))
    } else {
        None
    };

    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);

    // Add frame-specific fields
    element_builder.add_stack_like_is_collapsed(element.is_collapsed);
    element_builder.add_stack_like_clip(element.clip);
    element_builder.add_stack_like_labeling_color(labeling_color_offset);
    
    if let Some(stroke_offset) = stroke_override_offset {
        element_builder.add_stack_like_stroke_override(stroke_offset);
    }
    
    if let Some(bg_offset) = background_override_offset {
        element_builder.add_stack_like_background_override(bg_offset);
    }

    element_builder.finish()
}

/// Serialize a MagicFrame element
pub fn serialize_magic_frame_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucMagicFrameElement,
) -> WIPOffset<FbDucElement<'a>> {
    // Create labeling color string
    let labeling_color_offset = builder.create_string(&element.labeling_color);
    
    // Create stroke override if present
    let stroke_override_offset = if let Some(stroke) = &element.stroke_override {
        Some(serialize_element_stroke(builder, stroke))
    } else {
        None
    };
    
    // Create background override if present
    let background_override_offset = if let Some(background) = &element.background_override {
        Some(serialize_element_background(builder, background))
    } else {
        None
    };

    // Now create the element builder
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);

    // Add magicframe-specific fields
    element_builder.add_stack_like_is_collapsed(element.is_collapsed);
    element_builder.add_stack_like_clip(element.clip);
    element_builder.add_stack_like_labeling_color(labeling_color_offset);
    
    if let Some(stroke_offset) = stroke_override_offset {
        element_builder.add_stack_like_stroke_override(stroke_offset);
    }
    
    if let Some(bg_offset) = background_override_offset {
        element_builder.add_stack_like_background_override(bg_offset);
    }

    element_builder.finish()
}

/// Helper function to serialize a Point
pub fn serialize_point<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    point: &Point,
) -> WIPOffset<FbPoint<'a>> {
    // Now build the point
    let mut point_builder = PointBuilder::new(builder);

    point_builder.add_x_v3(point.x);
    point_builder.add_y_v3(point.y);

    if let Some(mirroring) = point.mirroring {
        point_builder.add_mirroring(mirroring as i8);
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
    // Create the element_id string first
    let element_id = builder.create_string(&binding.element_id);

    // Create fixed point if needed
    let fixed_point_offset = if let Some(point) = &binding.fixed_point {
        Some(serialize_simple_point(builder, point))
    } else {
        None
    };

    // Create binding point builder separately if needed
    let binding_point_offset = if let Some(point) = &binding.point {
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

    // Add fixed point if we prepared it
    if let Some(point_offset) = fixed_point_offset {
        binding_builder.add_fixed_point(point_offset);
    }

    // Add binding point if we prepared it
    if let Some(bp_offset) = binding_point_offset {
        binding_builder.add_point(bp_offset);
    }

    // Add head if present
    if let Some(head) = binding.head {
        binding_builder.add_head(head as i8);
    }

    binding_builder.finish()
}

/// Helper function to serialize a Path
pub fn serialize_duc_path<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    path: &Path,
) -> WIPOffset<FbDucPath<'a>> {
    // Create line indices vector
    let line_indices_vector = builder.create_vector(&path.line_indices);

    // Create background if present
    let background_offset = if let Some(background) = &path.background {
        Some(serialize_element_background(builder, background))
    } else {
        None
    };

    // Create stroke if present
    let stroke_offset = if let Some(stroke) = &path.stroke {
        Some(serialize_element_stroke(builder, stroke))
    } else {
        None
    };

    // Now build the path
    let mut path_builder = DucPathBuilder::new(builder);
    path_builder.add_line_indices(line_indices_vector);
    
    if let Some(bg_offset) = background_offset {
        path_builder.add_background(bg_offset);
    }
    
    if let Some(st_offset) = stroke_offset {
        path_builder.add_stroke(st_offset);
    }

    path_builder.finish()
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

/// Serialize a Table element
pub fn serialize_table_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucTableElement,
) -> WIPOffset<FbDucElement<'a>> {
    let column_order_offsets = element
        .column_order
        .iter()
        .map(|id| builder.create_string(id))
        .collect::<Vec<_>>();
    let column_order_vector = Some(builder.create_vector(&column_order_offsets));

    let row_order_offsets = element
        .row_order
        .iter()
        .map(|id| builder.create_string(id))
        .collect::<Vec<_>>();
    let row_order_vector = Some(builder.create_vector(&row_order_offsets));

    let columns_offsets = element
        .columns
        .values()
        .map(|col| serialize_duc_table_column(builder, col))
        .collect::<Vec<_>>();
    let columns_vector = Some(builder.create_vector(&columns_offsets));

    let rows_offsets = element
        .rows
        .values()
        .map(|row| serialize_duc_table_row(builder, row))
        .collect::<Vec<_>>();
    let rows_vector = Some(builder.create_vector(&rows_offsets));

    let cells_offsets = element
        .cells
        .values()
        .map(|cell| serialize_duc_table_cell(builder, cell))
        .collect::<Vec<_>>();
    let cells_vector = Some(builder.create_vector(&cells_offsets));

    let style_offset = element
        .style
        .as_ref()
        .map(|s| serialize_duc_table_style_props(builder, s));
    let table_style_offset = style_offset.map(|props_offset| {
        let mut table_style_builder = DucTableStyleBuilder::new(builder);
        table_style_builder.add_default_props(props_offset);
        table_style_builder.finish()
    });

    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);

    if let Some(vec) = column_order_vector {
        element_builder.add_table_column_order(vec);
    }
    if let Some(vec) = row_order_vector {
        element_builder.add_table_row_order(vec);
    }
    if let Some(vec) = columns_vector {
        element_builder.add_table_columns(vec);
    }
    if let Some(vec) = rows_vector {
        element_builder.add_table_rows(vec);
    }
    if let Some(vec) = cells_vector {
        element_builder.add_table_cells(vec);
    }
    if let Some(offset) = table_style_offset {
        element_builder.add_table_style(offset);
    }

    element_builder.finish()
}

/// Serialize a Doc element
pub fn serialize_doc_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucDocElement,
) -> WIPOffset<FbDucElement<'a>> {
    let content_offset = builder.create_string(&element.content);
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    element_builder.add_doc_content(content_offset);
    element_builder.finish()
}

// Helper functions for serializing table components
fn serialize_duc_table_style_props<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    style_props: &DucTableStyleProps,
) -> WIPOffset<FbDucTableStyleProps<'a>> {
    let background_color_offset = style_props
        .background_color
        .as_ref()
        .map(|s| builder.create_string(s));
    let border_dashes_vector = style_props
        .border_dashes
        .as_ref()
        .map(|d| builder.create_vector(d));
    let border_color_offset = style_props
        .border_color
        .as_ref()
        .map(|s| builder.create_string(s));
    let text_color_offset = style_props
        .text_color
        .as_ref()
        .map(|s| builder.create_string(s));
    let text_font_offset = style_props
        .text_font
        .as_ref()
        .map(|s| builder.create_string(s));

    let mut style_props_builder = DucTableStylePropsBuilder::new(builder);
    if let Some(offset) = background_color_offset {
        style_props_builder.add_background_color(offset);
    }
    if let Some(width) = style_props.border_width {
        style_props_builder.add_border_width(width);
    }
    if let Some(vector) = border_dashes_vector {
        style_props_builder.add_border_dashes(vector);
    }
    if let Some(offset) = border_color_offset {
        style_props_builder.add_border_color(offset);
    }
    if let Some(offset) = text_color_offset {
        style_props_builder.add_text_color(offset);
    }
    if let Some(size) = style_props.text_size {
        style_props_builder.add_text_size(size);
    }
    if let Some(offset) = text_font_offset {
        style_props_builder.add_text_font(offset);
    }
    if let Some(align) = style_props.text_align {
        style_props_builder.add_text_align(align as i8);
    }
    style_props_builder.finish()
}

fn serialize_duc_table_column<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    column: &DucTableColumn,
) -> WIPOffset<FbDucTableColumn<'a>> {
    let id_offset = builder.create_string(&column.id);
    let style_offset = column
        .style
        .as_ref()
        .map(|s| serialize_duc_table_style_props(builder, s));

    let mut column_builder = DucTableColumnBuilder::new(builder);
    column_builder.add_id(id_offset);
    if let Some(width) = column.width {
        column_builder.add_width(width);
    }
    if let Some(offset) = style_offset {
        column_builder.add_style(offset);
    }
    column_builder.finish()
}

fn serialize_duc_table_row<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    row: &DucTableRow,
) -> WIPOffset<FbDucTableRow<'a>> {
    let id_offset = builder.create_string(&row.id);
    let style_offset = row
        .style
        .as_ref()
        .map(|s| serialize_duc_table_style_props(builder, s));

    let mut row_builder = DucTableRowBuilder::new(builder);
    row_builder.add_id(id_offset);
    if let Some(height) = row.height {
        row_builder.add_height(height);
    }
    if let Some(offset) = style_offset {
        row_builder.add_style(offset);
    }
    row_builder.finish()
}

fn serialize_duc_table_cell<'a, 'b, A: flatbuffers::Allocator + 'a>(
    builder: &'b mut FlatBufferBuilder<'a, A>,
    cell: &DucTableCell,
) -> WIPOffset<FbDucTableCell<'a>> {
    let row_id_offset = builder.create_string(&cell.row_id);
    let column_id_offset = builder.create_string(&cell.column_id);
    let data_offset = builder.create_string(&cell.data);
    let style_offset = cell
        .style
        .as_ref()
        .map(|s| serialize_duc_table_style_props(builder, s));

    let mut cell_builder = DucTableCellBuilder::new(builder);
    cell_builder.add_row_id(row_id_offset);
    cell_builder.add_column_id(column_id_offset);
    cell_builder.add_data(data_offset);
    if let Some(offset) = style_offset {
        cell_builder.add_style(offset);
    }
    cell_builder.finish()
}

pub fn serialize_ellipse_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucEllipseElement,
) -> WIPOffset<FbDucElement<'a>> {
    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);

    if let Some(ratio) = element.ratio {
        element_builder.add_ellipse_ratio(ratio);
    }
    if let Some(start_angle) = element.start_angle {
        element_builder.add_ellipse_start_angle(start_angle);
    }
    if let Some(end_angle) = element.end_angle {
        element_builder.add_ellipse_end_angle(end_angle);
    }
    if let Some(show_aux_crosshair) = element.show_aux_crosshair {
        element_builder.add_ellipse_show_aux_crosshair(show_aux_crosshair);
    }

    element_builder.finish()
}

/// Serialize a BlockInstance element
pub fn serialize_block_instance_element<'a>(
    builder: &mut FlatBufferBuilder<'a>,
    element: &DucBlockInstanceElement,
) -> WIPOffset<FbDucElement<'a>> {
    let block_id_offset = builder.create_string(&element.block_id);
    
    // Serialize block element overrides if present
    let overrides_vector = if let Some(overrides) = &element.block_element_overrides {
        if !overrides.is_empty() {
            let mut overrides_vec = Vec::with_capacity(overrides.len());
            for (element_id, overrides_json) in overrides {
                let element_id_offset = builder.create_string(element_id);
                let overrides_offset = builder.create_string(overrides_json);
                
                let mut override_builder = DucBlockInstanceElementOverrideBuilder::new(builder);
                override_builder.add_element_id(element_id_offset);
                override_builder.add_overrides(overrides_offset);
                
                overrides_vec.push(override_builder.finish());
            }
            Some(builder.create_vector(&overrides_vec))
        } else {
            None
        }
    } else {
        None
    };

    let mut element_builder = serialize_base_duc_element_with_builder(builder, &element.base);
    element_builder.add_block_instance_block_id(block_id_offset);
    
    if let Some(overrides) = overrides_vector {
        element_builder.add_block_instance_element_overrides(overrides);
    }

    element_builder.finish()
}
