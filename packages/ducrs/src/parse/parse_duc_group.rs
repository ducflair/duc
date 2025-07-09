use crate::generated::duc::{DucGroup as FbDucGroup};
use crate::types::DucGroup;
use super::parse_duc_element::{parse_element_background, parse_element_stroke};

pub fn parse_duc_group(
    fb_group: FbDucGroup,
) -> DucGroup {
    let id = fb_group.id().unwrap().to_string();
    let label = fb_group.label().unwrap().to_string();
    let description = fb_group.description().map(|s| s.to_string());
    let labeling_color = fb_group.labeling_color().unwrap().to_string();

    let is_collapsed = fb_group.is_collapsed();
    let no_plot = fb_group.no_plot().unwrap_or(false);
    let locked = fb_group.locked();
    let is_visible = fb_group.is_visible();
    let opacity = fb_group.opacity();
    let clip = fb_group.clip().unwrap_or(false);

    let stroke_override = fb_group.stroke_override().and_then(|fb_stroke| {
        parse_element_stroke(&fb_stroke)
    });

    let background_override = fb_group.background_override().and_then(|fb_background| {
        parse_element_background(&fb_background)
    });

    DucGroup {
        id,
        label,
        description,
        is_collapsed,
        no_plot,
        locked,
        is_visible,
        opacity,
        labeling_color,
        stroke_override,
        background_override,
        clip,
    }
} 