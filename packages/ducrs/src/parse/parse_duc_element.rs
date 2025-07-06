use std::i8;

use crate::types::*;
use crate::types::DucElement as RustDucElement;
use crate::generated::duc::DucElement as BinDucElement;

/// Parses a FlatBuffers DucElement into our Rust DucElement type
pub fn parse_base_duc_element(element: &BinDucElement) -> RustDucElement {
    let id = element.id().unwrap_or("").to_string();
    let element_type = element.type_().unwrap_or("").to_string();
    
    let x = element.x_v3();
    let y = element.y_v3();
    let z_index = element.z_index();
    let scope = element.scope().unwrap_or("").to_string();
    
    let subset = element.subset().map(|val| unsafe { std::mem::transmute::<i8, crate::types::ElementSubset>(val) });

    let label = element.label().unwrap_or("").to_string();
    let is_visible = element.is_visible();
    
    let roundness = element.roundness(); 
    
    // Parse blending mode with proper handling of Option
    let blending = element.blending().map(|val| unsafe { std::mem::transmute::<i8, crate::types::Blending>(val) });
    
    // Parse stroke data
    let strokes = if let Some(strokes_vec) = element.stroke() {
        let mut result = Vec::with_capacity(strokes_vec.len());
        for i in 0..strokes_vec.len() {
            let fb_stroke = strokes_vec.get(i);
            let stroke = parse_element_stroke(&fb_stroke);
            if let Some(stroke) = stroke {
                result.push(stroke);
            }
        }
        result
    } else {
        Vec::new()
    };
    
    // Parse background data
    let backgrounds = if let Some(backgrounds_vec) = element.background() {
        let mut result = Vec::with_capacity(backgrounds_vec.len());
        for i in 0..backgrounds_vec.len() {
            let fb_background = backgrounds_vec.get(i);
            let background = parse_element_background(&fb_background);
            if let Some(background) = background {
                result.push(background);
            }
        }
        result
    } else {
        Vec::new()
    };
    
    let opacity = element.opacity();
    
    let width = element.width_v3();
    let height = element.height_v3();
    let angle = element.angle_v3();
    
    let is_deleted = element.is_deleted();
    
    // Parse group IDs
    let group_ids = if let Some(ids) = element.group_ids() {
        let mut result = Vec::with_capacity(ids.len());
        for i in 0..ids.len() {
            let id_str = ids.get(i);
            result.push(id_str.to_string());
        }
        result
    } else {
        Vec::new()
    };
    
    let frame_id = element.frame_id().map(|s| s.to_string());
    
    // Parse bound elements
    let bound_elements = if let Some(elements) = element.bound_elements() {
        let mut result = Vec::with_capacity(elements.len());
        for i in 0..elements.len() {
            let bound = elements.get(i);
            result.push(crate::types::BoundElement {
                id: bound.id().unwrap_or("").to_string(),
                element_type: bound.type_().unwrap_or("").to_string(),
            });
        }
        if result.is_empty() { None } else { Some(result) }
    } else {
        None
    };
    
    let link = element.link().map(|s| s.to_string());
    let locked = element.locked();
    
    crate::types::DucElement {
        id,
        element_type,
        x,
        y,
        z_index,
        scope,
        subset,
        label,
        is_visible,
        roundness,
        blending,
        stroke: strokes,
        background: backgrounds,
        opacity,
        width,
        height,
        angle,
        is_deleted,
        group_ids,
        frame_id,
        bound_elements,
        link,
        locked,
        seed: None,
        version: None,
        version_nonce: None,
        updated: None,
        index: None,
        custom_data: None,
    }
}

/// Parse a specialized element based on its type
pub fn parse_duc_element(element: &BinDucElement) -> Option<DucElementVariant> {
    let base = parse_base_duc_element(element);
    let element_type = base.element_type.clone();
    
    match element_type.as_str() {
        val if val == ElementType::Text.as_str() => {
            let text_element = parse_text_element(element, base);
            Some(DucElementVariant::Text(text_element))
        },
        val if val == ElementType::Line.as_str() => {
            let line_element = parse_linear_element(element, base);
            Some(DucElementVariant::Linear(line_element))
        },
        val if val == ElementType::Arrow.as_str() => {
            let linear = parse_linear_element(element, base);
            let arrow = DucArrowElement {
                base: linear,
                elbowed: element.elbowed().unwrap_or(false),
            };
            Some(DucElementVariant::Arrow(arrow))
        },
        val if val == ElementType::FreeDraw.as_str() => {
            let freedraw = parse_freedraw_element(element, base);
            Some(DucElementVariant::FreeDraw(freedraw))
        },
        val if val == ElementType::Image.as_str() => {
            let image = parse_image_element(element, base);
            Some(DucElementVariant::Image(image))
        },
        val if val == ElementType::Frame.as_str() => {
            let frame = DucFrameElement {
                base,
                is_collapsed: element.is_collapsed().unwrap_or(false),
                clip: element.clip().unwrap_or(false),
            };
            Some(DucElementVariant::Frame(frame))
        },
        val if val == ElementType::Group.as_str() => {
            let group = DucGroupElement {
                base,
                is_collapsed: element.is_collapsed().unwrap_or(false),
                clip: element.clip().unwrap_or(false),
                group_id_ref: element.group_id_ref().unwrap_or("").to_string(),
            };
            Some(DucElementVariant::Group(group))
        },
        val if val == ElementType::MagicFrame.as_str() => {
            let magic_frame = DucMagicFrameElement {
                base,
                is_collapsed: element.is_collapsed().unwrap_or(false),
                clip: element.clip().unwrap_or(false),
            };
            Some(DucElementVariant::MagicFrame(magic_frame))
        },
        val if val == ElementType::Rectangle.as_str() => {
            let rectangle = DucRectangleElement { base };
            Some(DucElementVariant::Rectangle(rectangle))
        },
        val if val == ElementType::Ellipse.as_str() => {
            let ellipse = DucEllipseElement { base };
            Some(DucElementVariant::Ellipse(ellipse))
        },
        val if val == ElementType::Diamond.as_str() => {
            let diamond = DucDiamondElement { base };
            Some(DucElementVariant::Diamond(diamond))
        },
        val if val == ElementType::Selection.as_str() => {
            let selection = DucSelectionElement { base };
            Some(DucElementVariant::Selection(selection))
        },
        _ => Some(DucElementVariant::Base(base)),
    }
}

// Helper functions for parsing sub-elements

fn parse_text_element(element: &BinDucElement, base: RustDucElement) -> DucTextElement {
    let font_size = element.font_size_v3().unwrap_or_else(|| 
        element.font_size_v2().unwrap_or(16) as f64);
    
    let font_family: i8 = element.font_family()
        .and_then(|s| s.parse::<i8>().ok()) 
        .unwrap_or(FontFamily::Virgil as i8); 
    let font_family = unsafe { std::mem::transmute(font_family) };
    
    let text = element.text().unwrap_or("").to_string();
    
    let text_align = element.text_align_v3()
    .map(|v| unsafe { std::mem::transmute::<i8, TextAlign>(v) })
    .unwrap_or(TextAlign::Left); // Fallback value
    
    let vertical_align = unsafe { std::mem::transmute(element.vertical_align_v3()) };

    let container_id = element.container_id().map(|s| s.to_string());    

    let line_height = element.line_height_v3().unwrap_or_else(|| 
        element.line_height_v2().unwrap_or(1.25) as f64);

    let auto_resize = element.auto_resize().unwrap_or(true);
    
    DucTextElement {
        base,
        font_size,
        font_family,
        text,
        text_align,
        vertical_align,
        container_id,
        line_height,
        auto_resize,
        original_text: None,
    }
}

fn parse_linear_element(element: &BinDucElement, base: RustDucElement) -> DucLinearElement {
    let points = parse_points(element);
    
    let last_committed_point = if let Some(point) = element.last_committed_point() {
        Some(parse_point(&point))
    } else {
        None
    };
    
    let start_binding = if let Some(binding) = element.start_binding() {
        Some(parse_point_binding(&binding))
    } else {
        None
    };
    
    let end_binding = if let Some(binding) = element.end_binding() {
        Some(parse_point_binding(&binding))
    } else {
        None
    };
    
    DucLinearElement {
        base,
        points,
        last_committed_point,
        start_binding,
        end_binding,
    }
}

fn parse_freedraw_element(element: &BinDucElement, base: RustDucElement) -> DucFreeDrawElement {
    let points = parse_points(element);
    
    let pressures = if let Some(pressures_vec) = element.pressures_v3() {
        (0..pressures_vec.len())
            .map(|i| pressures_vec.get(i))
            .collect()
    } else {
        Vec::new()
    };
    
    let simulate_pressure = element.simulate_pressure().unwrap_or(false);
    
    let last_committed_point = if let Some(point) = element.last_committed_point() {
        Some(parse_point(&point))
    } else {
        None
    };
    
    DucFreeDrawElement {
        base,
        points,
        pressures,
        simulate_pressure,
        last_committed_point,
    }
}

fn parse_image_element(element: &BinDucElement, base: RustDucElement) -> DucImageElement {
    let file_id = element.file_id().map(|s| s.to_string());
    
    let status = match element.status().unwrap_or("pending") {
        "loaded" => ImageStatus::Loaded,
        "error" => ImageStatus::Error,
        _ => ImageStatus::Pending,
    };
    
    // Create scale from either v3 or default
    let scale = if let Some(scale_point) = element.scale_v3() {
        (scale_point.x(), scale_point.y())
    } else {
        (1.0, 1.0)
    };
    
    let crop = if let Some(fb_crop) = element.crop() {
        Some(crate::types::ImageCrop {
            x: fb_crop.x(),
            y: fb_crop.y(),
            width: fb_crop.width(),
            height: fb_crop.height(),
            natural_width: fb_crop.natural_width(),
            natural_height: fb_crop.natural_height(),
        })
    } else {
        None
    };
    
    DucImageElement {
        base,
        file_id,
        status,
        scale,
        crop,
    }
}

// Helper functions for parsing common types

fn parse_points(element: &BinDucElement) -> Vec<crate::types::Point> {
    if let Some(points_vec) = element.points() {
        let mut result = Vec::with_capacity(points_vec.len());
        for i in 0..points_vec.len() {
            let point = points_vec.get(i);
            result.push(parse_point(&point));
        }
        result
    } else {
        Vec::new()
    }
}

pub fn parse_point(point: &crate::generated::duc::Point) -> crate::types::Point {
    // Parse x, y with v3 taking precedence over v2
    let x = point.x_v3();
    let y = point.y_v3();
    
    let is_curve = point.is_curve();
    let peer = point.peer();
    
    let mirroring = point.mirroring()
        .map(|m| unsafe { std::mem::transmute(m) });
    
    let border_radius = point.border_radius();
    
    let handle_in = if let Some(handle) = point.handle_in() {
        Some(SimplePoint {
            x: handle.x(),
            y: handle.y(),
        })
    } else {
        None
    };
    
    let handle_out = if let Some(handle) = point.handle_out() {
        Some(SimplePoint {
            x: handle.x(),
            y: handle.y(),
        })
    } else {
        None
    };

    
    crate::types::Point {
        x,
        y,
        is_curve,
        mirroring,
        border_radius,
        handle_in,
        handle_out,
        peer,
    }
}

fn parse_point_binding(binding: &crate::generated::duc::PointBinding) -> crate::types::PointBinding {
    let element_id = binding.element_id().unwrap_or("").to_string();
    let focus = binding.focus();
    let gap = binding.gap();
    
    let fixed_point = if let Some(point) = binding.fixed_point() {
        Some(SimplePoint {
            x: point.x(),
            y: point.y(),
        })
    } else {
        None
    };
    
    let bound_point = if let Some(bp) = binding.point() {
        Some(crate::types::BindingPoint {
            index: bp.index(),
            offset: bp.offset(),
        })
    } else {
        None
    };
    
    let head = unsafe { std::mem::transmute(binding.head()) };
    
    crate::types::PointBinding {
        element_id,
        focus,
        gap,
        fixed_point,
        point: bound_point,
        head,
    }
}

pub fn parse_element_stroke(stroke: &crate::generated::duc::ElementStroke) -> Option<crate::types::ElementStroke> {

    let content: crate::types::ElementContentBase  = if let Some(fb_content) = stroke.content() {
        parse_element_content_base(&fb_content)
    } else {
        return None;
    };
    
    let width = stroke.width();
    
    let style = if let Some(fb_style) = stroke.style() {
        parse_stroke_style(&fb_style)
    } else {
        return None;
    };
    
    let placement = unsafe { std::mem::transmute(stroke.placement()) };
    let stroke_sides = stroke.stroke_sides().map(|fb_sides| parse_stroke_sides(&fb_sides));
    
    Some(crate::types::ElementStroke {
        content,
        width,
        style,
        placement,
        stroke_sides,
    })
}

fn parse_element_content_base(content: &crate::generated::duc::ElementContentBase) -> crate::types::ElementContentBase {
    let preference = unsafe { std::mem::transmute(content.preference()) };
    
    let src = content.src().unwrap_or("#000000").to_string();
    let visible = content.visible();
    let opacity = content.opacity();
    
    let tiling = if let Some(fb_tiling) = content.tiling() {
        Some(crate::types::TilingProperties {
            size_in_percent: fb_tiling.size_in_percent(),
            angle: fb_tiling.angle(),
            spacing: fb_tiling.spacing(),
            offset_x: fb_tiling.offset_x(),
            offset_y: fb_tiling.offset_y(),
        })
    } else {
        None
    };
    
    crate::types::ElementContentBase {
        preference,
        src,
        visible,
        opacity,
        tiling,
    }
}

fn parse_stroke_style(style: &crate::generated::duc::StrokeStyle) -> crate::types::StrokeStyle {
    let preference = unsafe { std::mem::transmute(style.preference()) };
    
    let cap = style.cap().map(|c| unsafe { std::mem::transmute(c) });
    let join = style.join().map(|j| unsafe { std::mem::transmute(j) });
    
    let dash = if let Some(dash_vec) = style.dash() {
        let mut result = Vec::with_capacity(dash_vec.len());
        for i in 0..dash_vec.len() {
            result.push(dash_vec.get(i));
        }
        if result.is_empty() { None } else { Some(result) }
    } else {
        None
    };
    
    let dash_cap = style.dash_cap().map(|c| unsafe { std::mem::transmute(c) });
    let miter_limit = style.miter_limit();
    
    crate::types::StrokeStyle {
        preference,
        cap,
        join,
        dash,
        dash_cap,
        miter_limit,
    }
}

fn parse_stroke_sides(sides: &crate::generated::duc::StrokeSides) -> crate::types::StrokeSides {
    let preference = unsafe { std::mem::transmute(sides.preference()) };
    let values = if let Some(values_vec) = sides.values() {
        let mut result = Vec::with_capacity(values_vec.len());
        for i in 0..values_vec.len() {
            result.push(values_vec.get(i));
        }
        if result.is_empty() { None } else { Some(result) }
    } else {
        None
    };
    
    crate::types::StrokeSides {
        preference,
        values,
    }
}

pub fn parse_element_background(background: &crate::generated::duc::ElementBackground) -> Option<crate::types::ElementBackground> {
    let content = if let Some(fb_content) = background.content() {
        parse_element_content_base(&fb_content)
    } else {
        return None;
    };
    
    Some(crate::types::ElementBackground {
        content,
    })
}
