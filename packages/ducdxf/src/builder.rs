use crate::cad::bounds::{calculate_block_bounds, calculate_document_bounds, BoundingBox, Transform2D};
use crate::cad::color::{parse_hex_color, resolve_color, rgb_to_hex};
use crate::cad::linetype::LineDashPattern;
use crate::cad::mtext::{clean_mtext, decode_cad_text_escapes};
use crate::error::ConversionResult;
use crate::options::{ColorMode, ConversionMode, ConversionOptions};

use acadrust::document::CadDocument;
use acadrust::entities::{BoundaryEdge, EntityType};
use acadrust::objects::ObjectType;
use acadrust::types::color::Color;

use duc::types::*;
use std::collections::{HashMap, HashSet};

fn create_content(src: String, opacity: f64) -> ElementContentBase {
    ElementContentBase {
        preference: None,
        src,
        visible: true,
        opacity,
        tiling: None,
        hatch: None,
        image_filter: None,
    }
}

pub struct CadToDucBuilder<'a> {
    doc: &'a CadDocument,
    options: ConversionOptions,
    bbox: BoundingBox,
    layer_colors: HashMap<String, Color>,
    default_draw_rgb: (u8, u8, u8),
    element_seed: i32,
}

impl<'a> CadToDucBuilder<'a> {
    pub fn new(doc: &'a CadDocument, options: ConversionOptions) -> ConversionResult<Self> {
        let bbox = calculate_document_bounds(doc, true);

        let default_draw_rgb = options
            .default_draw_color
            .as_deref()
            .and_then(parse_hex_color)
            .unwrap_or((0, 0, 0));

        let mut layer_colors = HashMap::new();
        for layer in doc.layers.iter() {
            layer_colors.insert(layer.name.clone(), layer.color);
        }

        Ok(Self {
            doc,
            options,
            bbox,
            layer_colors,
            default_draw_rgb,
            element_seed: 1000,
        })
    }

    fn next_seed(&mut self) -> i32 {
        self.element_seed += 1;
        self.element_seed
    }

    /// Resolves the backing block name for a paper space layout.
    fn find_layout_block_name(&self, layout: &acadrust::objects::Layout) -> Option<String> {
        // 1. By block_record handle or layout handle
        if let Some(b) = self.doc.block_records.iter().find(|b| {
            (layout.block_record.value() != 0 && b.handle == layout.block_record)
                || (layout.handle.value() != 0 && b.layout == layout.handle)
        }) {
            return Some(b.name.clone());
        }

        // 2. By layout name directly
        if let Some(b) = self.doc.block_records.iter().find(|b| b.name.eq_ignore_ascii_case(&layout.name)) {
            return Some(b.name.clone());
        }

        // 3. By standard AutoCAD paper space naming convention
        let candidate_names = [
            format!(
                "*Paper_Space{}",
                if layout.tab_order <= 1 {
                    String::new()
                } else {
                    (layout.tab_order - 1).to_string()
                }
            ),
            format!("*Paper_Space{}", layout.tab_order),
            "*Paper_Space".to_string(),
        ];
        for name in &candidate_names {
            if self.doc.block_records.iter().any(|b| b.name.eq_ignore_ascii_case(name)) {
                return Some(name.clone());
            }
        }

        None
    }

    /// Checks whether a layout is enabled and visible (contains sheet geometry or active model viewports).
    fn is_layout_visible_and_enabled(&self, layout: &acadrust::objects::Layout) -> bool {
        // Model space is handled separately as the final plot
        if layout.name.eq_ignore_ascii_case("model") || layout.tab_order <= 0 {
            return false;
        }

        let block_name = match self.find_layout_block_name(layout) {
            Some(name) => name,
            None => return false,
        };

        let mut has_sheet_entities = false;
        let mut has_active_viewport = false;

        for entity in self.doc.entities_in_block(&block_name) {
            match entity {
                EntityType::Viewport(vp) => {
                    let is_overall = vp.id == 1
                        || ((vp.center.x - vp.view_center.x).abs() < 1e-3
                            && (vp.center.y - vp.view_center.y).abs() < 1e-3
                            && (vp.height - vp.view_height).abs() < 1e-3);
                    if !is_overall && vp.status.is_on && vp.width > 0.0 && vp.height > 0.0 && vp.view_height > 0.0 {
                        has_active_viewport = true;
                    }
                }
                _ => {
                    has_sheet_entities = true;
                }
            }
        }

        has_sheet_entities || has_active_viewport
    }

    pub fn build(mut self) -> ConversionResult<ExportedDataState> {
        let mut elements: Vec<ElementWrapper> = Vec::new();
        let mut current_y_offset = 0.0;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);

        // Check if a specific layout was requested
        let specific_layout = self.options.layout.clone();

        if let Some(target_layout) = specific_layout {
            if target_layout.eq_ignore_ascii_case("model") {
                let _ = self.build_model_space_plot(&mut elements, current_y_offset, now)?;
            } else {
                let layout_obj = self.doc.objects.iter().find_map(|(_h, obj)| {
                    if let ObjectType::Layout(l) = obj {
                        if l.name.eq_ignore_ascii_case(&target_layout) {
                            return Some(l.clone());
                        }
                    }
                    None
                });

                if let Some(l) = layout_obj {
                    let _ = self.build_paper_space_plot(&l, &mut elements, current_y_offset, now)?;
                } else {
                    let _ = self.build_model_space_plot(&mut elements, current_y_offset, now)?;
                }
            }
        } else {
            // Default multi-layout mode:
            // 1. Each enabled and visible paper space layout is a Plot element
            let mut paper_layouts: Vec<_> = self
                .doc
                .objects
                .iter()
                .filter_map(|(_h, obj)| {
                    if let ObjectType::Layout(l) = obj {
                        if self.is_layout_visible_and_enabled(l) {
                            return Some(l.clone());
                        }
                    }
                    None
                })
                .collect();

            // Sort layouts strictly by their AutoCAD tab order (DXF group 71), with name as tie-breaker
            paper_layouts.sort_by(|a, b| {
                a.tab_order
                    .cmp(&b.tab_order)
                    .then_with(|| a.name.cmp(&b.name))
            });

            for l in &paper_layouts {
                let plot_h = self.build_paper_space_plot(l, &mut elements, current_y_offset, now)?;
                current_y_offset += plot_h + self.options.vertical_spacing;
            }

            // 2. Model Space is ALWAYS the last plot element at the bottom!
            let _ = self.build_model_space_plot(&mut elements, current_y_offset, now)?;
        }

        // Export layers
        let layers = if self.options.export_layers {
            self.build_layers(now)
        } else {
            vec![]
        };

        Ok(ExportedDataState {
            id: Some("ducdxf-export".to_string()),
            version: "1.0.0".to_string(),
            source: "ducdxf".to_string(),
            data_type: "drawing".to_string(),
            dictionary: None,
            thumbnail: None,
            charter: None,
            issues: vec![],
            elements,
            blocks: vec![],
            block_instances: vec![],
            block_collections: vec![],
            groups: vec![],
            regions: vec![],
            layers,
            duc_local_state: None,
            duc_global_state: Some(DucGlobalState {
                view_background_color: self
                    .options
                    .background_color
                    .clone()
                    .unwrap_or_else(|| "#ffffff".to_string()),
                main_scope: "mm".to_string(),
                scope_exponent_threshold: 3,
            }),
            version_graph: None,
            external_files: None,
            external_files_data: None,
        })
    }

    fn build_layers(&self, _now: i64) -> Vec<DucLayer> {
        let mut out = Vec::new();
        for layer in self.doc.layers.iter() {
            let rgb = resolve_color(
                &layer.color,
                None,
                None,
                self.default_draw_rgb,
            );
            let hex = rgb_to_hex(rgb);

            out.push(DucLayer {
                id: layer.name.clone(),
                stack_base: DucStackBase {
                    label: layer.name.clone(),
                    description: None,
                    is_collapsed: false,
                    is_plot: layer.is_plottable,
                    is_visible: !layer.is_off() && !layer.is_frozen(),
                    locked: layer.is_locked(),
                    styles: DucStackLikeStyles { opacity: 1.0 },
                },
                readonly: false,
                overrides: Some(DucLayerOverrides {
                    stroke: ElementStroke {
                        content: create_content(hex.clone(), 1.0),
                        width: self.options.min_line_width,
                        style: StrokeStyle {
                            preference: Some(STROKE_PREFERENCE::SOLID),
                            cap: None,
                            join: None,
                            dash: None,
                            dash_line_override: None,
                            dash_cap: None,
                            miter_limit: None,
                        },
                        placement: Some(STROKE_PLACEMENT::CENTER),
                        stroke_sides: None,
                    },
                    background: ElementBackground {
                        content: create_content(hex, 1.0),
                    },
                }),
            });
        }
        out
    }

    /// Builds a single paper space layout plot element and its children.
    fn build_paper_space_plot(
        &mut self,
        layout: &acadrust::objects::Layout,
        elements: &mut Vec<ElementWrapper>,
        plot_y: f64,
        now: i64,
    ) -> ConversionResult<f64> {
        let block_name = self
            .find_layout_block_name(layout)
            .unwrap_or_else(|| "*Paper_Space".to_string());

        let extent_w = (layout.max_limits.0 - layout.min_limits.0).abs();
        let extent_h = (layout.max_limits.1 - layout.min_limits.1).abs();

        let (plot_w, plot_h, page_scale, min_x, max_y) = if layout.paper_width > 10.0 && layout.paper_height > 10.0 {
            let p_w = layout.paper_width;
            let p_h = layout.paper_height;

            let is_landscape = if extent_w > 0.1 && extent_h > 0.1 {
                extent_w > extent_h
            } else {
                layout.plot_rotation == 1 || layout.plot_rotation == 3 || p_w > p_h
            };

            let (sheet_w, sheet_h) = if is_landscape {
                (p_w.max(p_h), p_w.min(p_h))
            } else {
                (p_w.min(p_h), p_w.max(p_h))
            };

            let (scale, m_x, m_y) = if extent_w > 0.01 && extent_h > 0.01 {
                let s = (sheet_w / extent_w).min(sheet_h / extent_h);
                let min_x = layout.min_limits.0.min(layout.max_limits.0);
                let max_y = layout.min_limits.1.max(layout.max_limits.1);
                (s, min_x, max_y)
            } else {
                let block_bounds = calculate_block_bounds(self.doc, &block_name);
                if block_bounds.is_valid() {
                    let bw = block_bounds.width().max(1.0);
                    let bh = block_bounds.height().max(1.0);
                    let s = (sheet_w / bw).min(sheet_h / bh);
                    (s, block_bounds.min_x, block_bounds.max_y)
                } else {
                    (1.0, 0.0, sheet_h)
                }
            };

            (sheet_w, sheet_h, scale, m_x, m_y)
        } else {
            let block_bounds = calculate_block_bounds(self.doc, &block_name);
            let margin = self.options.margin;
            let bw = block_bounds.width().max(100.0);
            let bh = block_bounds.height().max(100.0);
            let pw = bw + 2.0 * margin;
            let ph = bh + 2.0 * margin;
            (pw, ph, 1.0, block_bounds.min_x - margin, block_bounds.max_y + margin)
        };

        let plot_id = format!("plot_{}", layout.name.replace(' ', "_"));
        let seed = self.next_seed();

        let plot_element = DucPlotElement {
            stack_element_base: DucStackElementBase {
                base: DucElementBase {
                    id: plot_id.clone(),
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![ElementBackground {
                            content: create_content(
                                self.options.background_color.clone().unwrap_or_else(|| "#ffffff".to_string()),
                                1.0,
                            ),
                        }],
                        stroke: vec![ElementStroke {
                            content: create_content("#000000".to_string(), 0.25),
                            width: 0.5,
                            style: StrokeStyle {
                                preference: Some(STROKE_PREFERENCE::SOLID),
                                cap: None,
                                join: None,
                                dash: None,
                                dash_line_override: None,
                                dash_cap: None,
                                miter_limit: None,
                            },
                            placement: Some(STROKE_PLACEMENT::INSIDE),
                            stroke_sides: None,
                        }],
                        opacity: 1.0,
                    },
                    x: 0.0,
                    y: plot_y,
                    width: plot_w,
                    height: plot_h,
                    angle: 0.0,
                    scope: "mm".to_string(),
                    label: layout.name.clone(),
                    description: None,
                    is_visible: true,
                    seed,
                    version: 1,
                    version_nonce: seed + 1000,
                    updated: now,
                    index: None,
                    is_plot: true,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: None,
                    frame_id: None,
                    bound_elements: None,
                    z_index: 0.0,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                stack_base: DucStackBase {
                    label: layout.name.clone(),
                    description: None,
                    is_collapsed: false,
                    is_plot: true,
                    is_visible: true,
                    locked: false,
                    styles: DucStackLikeStyles { opacity: 1.0 },
                },
                clip: true,
                label_visible: true,
            },
            style: DucPlotStyle {},
            layout: PlotLayout {
                margins: Margins {
                    top: 0.0,
                    right: 0.0,
                    bottom: 0.0,
                    left: 0.0,
                },
            },
        };

        elements.push(ElementWrapper {
            element: DucElementEnum::DucPlotElement(plot_element),
        });

        // Paper Space coordinate mapping to DUC canvas inside plot:
        // x_duc = plot.x + (x_cad - min_x) * scale
        // y_duc = plot.y + (max_y - y_cad) * scale
        let paper_transform = Transform2D {
            a: page_scale,
            b: 0.0,
            c: 0.0,
            d: -page_scale,
            tx: -min_x * page_scale,
            ty: plot_y + max_y * page_scale,
        };

        // Separate layout entities into viewports and sheet elements
        let mut viewports = Vec::new();
        let mut sheet_entities: Vec<&EntityType> = Vec::new();

        for entity in self.doc.entities_in_block(&block_name) {
            if let EntityType::Viewport(vp) = entity {
                viewports.push(vp);
            } else {
                sheet_entities.push(entity);
            }
        }

        // 1. Render viewports looking into model space
        for vp in viewports {
            let is_overall = (vp.center.x - vp.view_center.x).abs() < 1e-3
                && (vp.center.y - vp.view_center.y).abs() < 1e-3
                && (vp.height - vp.view_height).abs() < 1e-3;

            if is_overall || vp.id == 1 || !vp.status.is_on || vp.width <= 0.0 || vp.height <= 0.0 || vp.view_height <= 0.0 {
                continue;
            }

            let (vp_cx, vp_cy) = paper_transform.apply(vp.center.x, vp.center.y);
            let vp_scale = vp.height * page_scale / vp.view_height;
            let twist_rad = -(vp.twist_angle).to_radians();
            let cos_tw = twist_rad.cos();
            let sin_tw = twist_rad.sin();

            // Transform model space entity coordinates into DUC canvas coordinates
            let vp_transform = Transform2D {
                a: cos_tw * vp_scale,
                b: -sin_tw * vp_scale,
                c: -sin_tw * vp_scale,
                d: -cos_tw * vp_scale,
                tx: vp_cx - (vp.view_center.x * cos_tw * vp_scale - vp.view_center.y * sin_tw * vp_scale),
                ty: vp_cy + (vp.view_center.x * sin_tw * vp_scale + vp.view_center.y * cos_tw * vp_scale),
            };

            let frozen_handles: HashSet<_> = vp.frozen_layers.iter().copied().collect();

            // Group model space entities by layer
            for entity in self.doc.model_space_entities() {
                let layer_name = entity.as_entity().layer().to_string();
                if layer_name.eq_ignore_ascii_case("defpoints") {
                    continue;
                }
                if let Some(layer) = self.doc.layers.iter().find(|l| l.name == layer_name) {
                    if !layer.is_plottable || layer.is_frozen() || layer.is_off() || frozen_handles.contains(&layer.handle) {
                        continue;
                    }
                }

                let mut visited_blocks = HashSet::new();
                self.convert_entity_to_duc(
                    entity,
                    &vp_transform,
                    vp_scale,
                    &plot_id,
                    elements,
                    &mut visited_blocks,
                    0,
                    now,
                );
            }
        }

        // 2. Render sheet entities on top of viewports (title blocks, annotations)
        for entity in sheet_entities {
            let layer_name = entity.as_entity().layer().to_string();
            if layer_name.eq_ignore_ascii_case("defpoints") {
                continue;
            }
            if let Some(layer) = self.doc.layers.iter().find(|l| l.name == layer_name) {
                if !layer.is_plottable || layer.is_frozen() || layer.is_off() {
                    continue;
                }
            }

            let mut visited_blocks = HashSet::new();
            self.convert_entity_to_duc(
                entity,
                &paper_transform,
                page_scale,
                &plot_id,
                elements,
                &mut visited_blocks,
                0,
                now,
            );
        }

        Ok(plot_h)
    }

    /// Builds the Model Space plot element (always the last plot).
    fn build_model_space_plot(
        &mut self,
        elements: &mut Vec<ElementWrapper>,
        plot_y: f64,
        now: i64,
    ) -> ConversionResult<f64> {
        let bbox = match &self.options.mode {
            ConversionMode::Plot => self.bbox,
            ConversionMode::Crop {
                offset_x,
                offset_y,
                width,
                height,
            } => {
                let w = width.unwrap_or(self.bbox.width());
                let h = height.unwrap_or(self.bbox.height());
                BoundingBox {
                    min_x: *offset_x,
                    min_y: *offset_y,
                    max_x: *offset_x + w,
                    max_y: *offset_y + h,
                }
            }
        };

        let margin = self.options.margin;
        let drawing_w = bbox.width().max(1.0);
        let drawing_h = bbox.height().max(1.0);

        let scale = self.options.scale.unwrap_or(1.0);
        let content_w = drawing_w * scale;
        let content_h = drawing_h * scale;

        let plot_w = content_w + 2.0 * margin;
        let plot_h = content_h + 2.0 * margin;

        let plot_id = "plot_Model".to_string();
        let seed = self.next_seed();

        let plot_element = DucPlotElement {
            stack_element_base: DucStackElementBase {
                base: DucElementBase {
                    id: plot_id.clone(),
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![ElementBackground {
                            content: create_content(
                                self.options.background_color.clone().unwrap_or_else(|| "#ffffff".to_string()),
                                1.0,
                            ),
                        }],
                        stroke: vec![ElementStroke {
                            content: create_content("#000000".to_string(), 0.25),
                            width: 0.5,
                            style: StrokeStyle {
                                preference: Some(STROKE_PREFERENCE::SOLID),
                                cap: None,
                                join: None,
                                dash: None,
                                dash_line_override: None,
                                dash_cap: None,
                                miter_limit: None,
                            },
                            placement: Some(STROKE_PLACEMENT::INSIDE),
                            stroke_sides: None,
                        }],
                        opacity: 1.0,
                    },
                    x: 0.0,
                    y: plot_y,
                    width: plot_w,
                    height: plot_h,
                    angle: 0.0,
                    scope: "mm".to_string(),
                    label: "Model Space".to_string(),
                    description: None,
                    is_visible: true,
                    seed,
                    version: 1,
                    version_nonce: seed + 1000,
                    updated: now,
                    index: None,
                    is_plot: true,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: None,
                    frame_id: None,
                    bound_elements: None,
                    z_index: 0.0,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                stack_base: DucStackBase {
                    label: "Model Space".to_string(),
                    description: None,
                    is_collapsed: false,
                    is_plot: true,
                    is_visible: true,
                    locked: false,
                    styles: DucStackLikeStyles { opacity: 1.0 },
                },
                clip: true,
                label_visible: true,
            },
            style: DucPlotStyle {},
            layout: PlotLayout {
                margins: Margins {
                    top: margin,
                    right: margin,
                    bottom: margin,
                    left: margin,
                },
            },
        };

        elements.push(ElementWrapper {
            element: DucElementEnum::DucPlotElement(plot_element),
        });

        // Model space transform:
        // x_duc = margin + (x_cad - min_x) * scale
        // y_duc = plot_y + margin + (max_y - y_cad) * scale
        let model_transform = Transform2D {
            a: scale,
            b: 0.0,
            c: 0.0,
            d: -scale,
            tx: margin - bbox.min_x * scale,
            ty: plot_y + margin + bbox.max_y * scale,
        };

        for entity in self.doc.model_space_entities() {
            let layer_name = entity.as_entity().layer().to_string();
            if layer_name.eq_ignore_ascii_case("defpoints") {
                continue;
            }
            if let Some(layer) = self.doc.layers.iter().find(|l| l.name == layer_name) {
                if !layer.is_plottable || layer.is_frozen() || layer.is_off() {
                    continue;
                }
            }

            let mut visited_blocks = HashSet::new();
            self.convert_entity_to_duc(
                entity,
                &model_transform,
                scale,
                &plot_id,
                elements,
                &mut visited_blocks,
                0,
                now,
            );
        }

        Ok(plot_h)
    }

    #[allow(clippy::too_many_arguments)]
    fn convert_entity_to_duc(
        &mut self,
        entity: &EntityType,
        transform: &Transform2D,
        scale_factor: f64,
        plot_id: &str,
        elements: &mut Vec<ElementWrapper>,
        visited_blocks: &mut HashSet<String>,
        depth: usize,
        now: i64,
    ) {
        if depth > 32 {
            return;
        }

        let dyn_ent = entity.as_entity();
        if dyn_ent.is_invisible() {
            return;
        }

        let layer_name = dyn_ent.layer();
        let layer_color = self.layer_colors.get(layer_name);

        let entity_color = dyn_ent.color();
        let rgb = resolve_color(&entity_color, layer_color, None, self.default_draw_rgb);
        let final_rgb = match self.options.color_mode {
            ColorMode::Normal => rgb,
            ColorMode::Monochrome => (0, 0, 0),
            ColorMode::Grayscale => {
                let gray = (0.299 * rgb.0 as f64 + 0.587 * rgb.1 as f64 + 0.114 * rgb.2 as f64) as u8;
                (gray, gray, gray)
            }
            ColorMode::Invert => (255 - rgb.0, 255 - rgb.1, 255 - rgb.2),
        };
        let stroke_hex = rgb_to_hex(final_rgb);

        let stroke_width = if self.options.use_lineweights {
            let line_weight_val = dyn_ent.line_weight().millimeters().unwrap_or(0.15);
            let mut w = line_weight_val * self.options.line_width_scale;
            if scale_factor < 0.1 {
                w = (w * (scale_factor * 10.0).max(0.1)).max(self.options.min_line_width);
            } else {
                w = w.max(self.options.min_line_width);
            }
            w
        } else {
            // Uniform thin hairline
            (self.options.min_line_width * self.options.line_width_scale).max(0.1)
        };

        let dash_info = LineDashPattern::solid();

        let stroke_item = ElementStroke {
            content: create_content(stroke_hex.clone(), 1.0),
            width: stroke_width,
            style: StrokeStyle {
                preference: Some(dash_info.preference),
                cap: Some(STROKE_CAP::ROUND),
                join: Some(STROKE_JOIN::ROUND),
                dash: if dash_info.is_solid() { None } else { Some(dash_info.dash_array) },
                dash_line_override: None,
                dash_cap: Some(STROKE_CAP::ROUND),
                miter_limit: Some(4.0),
            },
            placement: Some(STROKE_PLACEMENT::CENTER),
            stroke_sides: None,
        };

        match entity {
            EntityType::Line(line) => {
                let (p1x, p1y) = transform.apply(line.start.x, line.start.y);
                let (p2x, p2y) = transform.apply(line.end.x, line.end.y);

                self.push_linear_segment(
                    p1x,
                    p1y,
                    p2x,
                    p2y,
                    stroke_item,
                    layer_name,
                    plot_id,
                    elements,
                    now,
                );
            }
            EntityType::Circle(circle) => {
                let (cx, cy) = transform.apply(circle.center.x, circle.center.y);
                let r = (circle.radius * transform.scale()).abs();
                if r < 1e-4 {
                    return;
                }

                let seed = self.next_seed();
                let elem_id = format!("ellipse_{}", seed);

                let ellipse_elem = DucEllipseElement {
                    base: DucElementBase {
                        id: elem_id,
                        styles: DucElementStylesBase {
                            roundness: 0.0,
                            blending: None,
                            background: vec![],
                            stroke: vec![stroke_item],
                            opacity: 1.0,
                        },
                        x: cx - r,
                        y: cy - r,
                        width: 2.0 * r,
                        height: 2.0 * r,
                        angle: 0.0,
                        scope: "mm".to_string(),
                        label: "Circle".to_string(),
                        description: None,
                        is_visible: true,
                        seed,
                        version: 1,
                        version_nonce: seed + 500,
                        updated: now,
                        index: None,
                        is_plot: false,
                        is_deleted: false,
                        group_ids: vec![],
                        block_ids: vec![],
                        region_ids: vec![],
                        instance_id: None,
                        layer_id: Some(layer_name.to_string()),
                        frame_id: Some(plot_id.to_string()),
                        bound_elements: None,
                        z_index: 1.0,
                        link: None,
                        locked: false,
                        custom_data: None,
                    },
                    ratio: 1.0,
                    start_angle: 0.0,
                    end_angle: std::f64::consts::TAU,
                    show_aux_crosshair: false,
                };

                elements.push(ElementWrapper {
                    element: DucElementEnum::DucEllipseElement(ellipse_elem),
                });
            }
            EntityType::Arc(arc) => {
                let (cx, cy) = transform.apply(arc.center.x, arc.center.y);
                let r = (arc.radius * transform.scale()).abs();
                if r < 1e-4 {
                    return;
                }

                // In flipped Y coordinate system, invert angles
                let rot = transform.rotation_radians();
                let start_rad = -(arc.start_angle.to_radians() + rot);
                let end_rad = -(arc.end_angle.to_radians() + rot);

                let seed = self.next_seed();
                let elem_id = format!("arc_{}", seed);

                let ellipse_elem = DucEllipseElement {
                    base: DucElementBase {
                        id: elem_id,
                        styles: DucElementStylesBase {
                            roundness: 0.0,
                            blending: None,
                            background: vec![],
                            stroke: vec![stroke_item],
                            opacity: 1.0,
                        },
                        x: cx - r,
                        y: cy - r,
                        width: 2.0 * r,
                        height: 2.0 * r,
                        angle: 0.0,
                        scope: "mm".to_string(),
                        label: "Arc".to_string(),
                        description: None,
                        is_visible: true,
                        seed,
                        version: 1,
                        version_nonce: seed + 500,
                        updated: now,
                        index: None,
                        is_plot: false,
                        is_deleted: false,
                        group_ids: vec![],
                        block_ids: vec![],
                        region_ids: vec![],
                        instance_id: None,
                        layer_id: Some(layer_name.to_string()),
                        frame_id: Some(plot_id.to_string()),
                        bound_elements: None,
                        z_index: 1.0,
                        link: None,
                        locked: false,
                        custom_data: None,
                    },
                    ratio: 1.0,
                    start_angle: end_rad,
                    end_angle: start_rad,
                    show_aux_crosshair: false,
                };

                elements.push(ElementWrapper {
                    element: DucElementEnum::DucEllipseElement(ellipse_elem),
                });
            }
            EntityType::Ellipse(ellipse) => {
                let (cx, cy) = transform.apply(ellipse.center.x, ellipse.center.y);
                let maj_len = ellipse.major_axis.x.hypot(ellipse.major_axis.y) * transform.scale();
                let min_len = maj_len * ellipse.minor_axis_ratio;

                if maj_len < 1e-4 || min_len < 1e-4 {
                    return;
                }

                let seed = self.next_seed();
                let elem_id = format!("ellipse_{}", seed);

                let ellipse_elem = DucEllipseElement {
                    base: DucElementBase {
                        id: elem_id,
                        styles: DucElementStylesBase {
                            roundness: 0.0,
                            blending: None,
                            background: vec![],
                            stroke: vec![stroke_item],
                            opacity: 1.0,
                        },
                        x: cx - maj_len,
                        y: cy - min_len,
                        width: 2.0 * maj_len,
                        height: 2.0 * min_len,
                        angle: 0.0,
                        scope: "mm".to_string(),
                        label: "Ellipse".to_string(),
                        description: None,
                        is_visible: true,
                        seed,
                        version: 1,
                        version_nonce: seed + 500,
                        updated: now,
                        index: None,
                        is_plot: false,
                        is_deleted: false,
                        group_ids: vec![],
                        block_ids: vec![],
                        region_ids: vec![],
                        instance_id: None,
                        layer_id: Some(layer_name.to_string()),
                        frame_id: Some(plot_id.to_string()),
                        bound_elements: None,
                        z_index: 1.0,
                        link: None,
                        locked: false,
                        custom_data: None,
                    },
                    ratio: ellipse.minor_axis_ratio as f32,
                    start_angle: ellipse.start_parameter,
                    end_angle: ellipse.end_parameter,
                    show_aux_crosshair: false,
                };

                elements.push(ElementWrapper {
                    element: DucElementEnum::DucEllipseElement(ellipse_elem),
                });
            }
            EntityType::LwPolyline(lwpoly) => {
                if lwpoly.vertices.len() < 2 {
                    return;
                }

                let mut pts = Vec::new();
                for i in 0..lwpoly.vertices.len() - 1 {
                    let v1 = &lwpoly.vertices[i];
                    let v2 = &lwpoly.vertices[i + 1];
                    let (p1x, p1y) = transform.apply(v1.location.x, v1.location.y);
                    let (p2x, p2y) = transform.apply(v2.location.x, v2.location.y);

                    if v1.bulge.abs() > 1e-4 {
                        // Tessellate bulge arc into smooth segments
                        let arc_pts = tessellate_bulge(p1x, p1y, p2x, p2y, v1.bulge);
                        for (ax, ay) in arc_pts {
                            pts.push((ax, ay));
                        }
                    } else {
                        pts.push((p1x, p1y));
                    }
                }

                let last = lwpoly.vertices.last().unwrap();
                let (last_x, last_y) = transform.apply(last.location.x, last.location.y);
                pts.push((last_x, last_y));

                if lwpoly.is_closed {
                    let first = &lwpoly.vertices[0];
                    let (first_x, first_y) = transform.apply(first.location.x, first.location.y);
                    if last.bulge.abs() > 1e-4 {
                        let arc_pts = tessellate_bulge(last_x, last_y, first_x, first_y, last.bulge);
                        for (ax, ay) in arc_pts {
                            pts.push((ax, ay));
                        }
                    }
                    pts.push((first_x, first_y));
                }

                self.push_polyline(pts, stroke_item, layer_name, plot_id, elements, now);
            }
            EntityType::Polyline(poly) => {
                if poly.vertices.len() < 2 {
                    return;
                }
                let mut pts = Vec::new();
                for v in &poly.vertices {
                    let (px, py) = transform.apply(v.location.x, v.location.y);
                    pts.push((px, py));
                }
                if poly.is_closed() && !pts.is_empty() {
                    let first = pts[0];
                    pts.push(first);
                }
                self.push_polyline(pts, stroke_item, layer_name, plot_id, elements, now);
            }
            EntityType::Polyline2D(poly) => {
                if poly.vertices.len() < 2 {
                    return;
                }
                let mut pts = Vec::new();
                for v in &poly.vertices {
                    let (px, py) = transform.apply(v.location.x, v.location.y);
                    pts.push((px, py));
                }
                if poly.is_closed() && !pts.is_empty() {
                    let first = pts[0];
                    pts.push(first);
                }
                self.push_polyline(pts, stroke_item, layer_name, plot_id, elements, now);
            }
            EntityType::Point(pt) => {
                let (px, py) = transform.apply(pt.location.x, pt.location.y);
                let sz = 1.0;
                self.push_linear_segment(
                    px - sz, py, px + sz, py,
                    stroke_item.clone(), layer_name, plot_id, elements, now,
                );
                self.push_linear_segment(
                    px, py - sz, px, py + sz,
                    stroke_item, layer_name, plot_id, elements, now,
                );
            }
            EntityType::Solid(solid) => {
                let (x1, y1) = transform.apply(solid.first_corner.x, solid.first_corner.y);
                let (x2, y2) = transform.apply(solid.second_corner.x, solid.second_corner.y);
                let (x3, y3) = transform.apply(solid.third_corner.x, solid.third_corner.y);
                let (x4, y4) = transform.apply(solid.fourth_corner.x, solid.fourth_corner.y);

                let pts = vec![(x1, y1), (x2, y2), (x4, y4), (x3, y3), (x1, y1)];
                self.push_filled_polygon(pts, stroke_hex, layer_name, plot_id, elements, now);
            }
            EntityType::Face3D(face) => {
                let (x1, y1) = transform.apply(face.first_corner.x, face.first_corner.y);
                let (x2, y2) = transform.apply(face.second_corner.x, face.second_corner.y);
                let (x3, y3) = transform.apply(face.third_corner.x, face.third_corner.y);
                let (x4, y4) = transform.apply(face.fourth_corner.x, face.fourth_corner.y);

                let pts = vec![(x1, y1), (x2, y2), (x3, y3), (x4, y4), (x1, y1)];
                self.push_polyline(pts, stroke_item, layer_name, plot_id, elements, now);
            }
            EntityType::Text(txt) => {
                let (px, py) = transform.apply(txt.insertion_point.x, txt.insertion_point.y);
                let font_size = (txt.height * transform.scale()).max(0.5);
                let decoded = decode_cad_text_escapes(&txt.value);
                let total_rot = -txt.rotation.to_radians();

                let seed = self.next_seed();
                let elem_id = format!("text_{}", seed);

                let text_elem = DucTextElement {
                    base: DucElementBase {
                        id: elem_id,
                        styles: DucElementStylesBase {
                            roundness: 0.0,
                            blending: None,
                            background: vec![],
                            stroke: vec![stroke_item],
                            opacity: 1.0,
                        },
                        x: px,
                        y: py,
                        width: (decoded.len() as f64) * font_size * 0.6,
                        height: font_size,
                        angle: total_rot,
                        scope: "mm".to_string(),
                        label: decoded.clone(),
                        description: None,
                        is_visible: true,
                        seed,
                        version: 1,
                        version_nonce: seed + 500,
                        updated: now,
                        index: None,
                        is_plot: false,
                        is_deleted: false,
                        group_ids: vec![],
                        block_ids: vec![],
                        region_ids: vec![],
                        instance_id: None,
                        layer_id: Some(layer_name.to_string()),
                        frame_id: Some(plot_id.to_string()),
                        bound_elements: None,
                        z_index: 2.0,
                        link: None,
                        locked: false,
                        custom_data: None,
                    },
                    style: DucTextStyle {
                        is_ltr: true,
                        font_family: "Inter".to_string(),
                        big_font_family: "Noto Sans".to_string(),
                        text_align: TEXT_ALIGN::LEFT,
                        vertical_align: VERTICAL_ALIGN::BOTTOM,
                        line_height: 1.2,
                        line_spacing: LineSpacing {
                            value: 1.0,
                            line_type: Some(LINE_SPACING_TYPE::AT_LEAST),
                        },
                        oblique_angle: 0.0,
                        font_size,
                        width_factor: 1.0,
                        is_upside_down: false,
                        is_backwards: false,
                    },
                    text: decoded.clone(),
                    auto_resize: true,
                    container_id: None,
                    original_text: txt.value.clone(),
                };

                elements.push(ElementWrapper {
                    element: DucElementEnum::DucTextElement(text_elem),
                });
            }
            EntityType::MText(mtext) => {
                let (px, py) = transform.apply(mtext.insertion_point.x, mtext.insertion_point.y);
                let font_size = (mtext.height * transform.scale()).max(0.5);
                let lines = clean_mtext(&mtext.value);
                let text_joined = lines.join("\n");
                let total_rot = -mtext.rotation.to_radians();

                let seed = self.next_seed();
                let elem_id = format!("mtext_{}", seed);

                let text_elem = DucTextElement {
                    base: DucElementBase {
                        id: elem_id,
                        styles: DucElementStylesBase {
                            roundness: 0.0,
                            blending: None,
                            background: vec![],
                            stroke: vec![stroke_item],
                            opacity: 1.0,
                        },
                        x: px,
                        y: py,
                        width: if mtext.rectangle_width > 0.0 {
                            mtext.rectangle_width * transform.scale()
                        } else {
                            (text_joined.len() as f64) * font_size * 0.6
                        },
                        height: font_size * (lines.len() as f64) * 1.3,
                        angle: total_rot,
                        scope: "mm".to_string(),
                        label: text_joined.clone(),
                        description: None,
                        is_visible: true,
                        seed,
                        version: 1,
                        version_nonce: seed + 500,
                        updated: now,
                        index: None,
                        is_plot: false,
                        is_deleted: false,
                        group_ids: vec![],
                        block_ids: vec![],
                        region_ids: vec![],
                        instance_id: None,
                        layer_id: Some(layer_name.to_string()),
                        frame_id: Some(plot_id.to_string()),
                        bound_elements: None,
                        z_index: 2.0,
                        link: None,
                        locked: false,
                        custom_data: None,
                    },
                    style: DucTextStyle {
                        is_ltr: true,
                        font_family: "Inter".to_string(),
                        big_font_family: "Noto Sans".to_string(),
                        text_align: TEXT_ALIGN::LEFT,
                        vertical_align: VERTICAL_ALIGN::TOP,
                        line_height: 1.2,
                        line_spacing: LineSpacing {
                            value: 1.0,
                            line_type: Some(LINE_SPACING_TYPE::AT_LEAST),
                        },
                        oblique_angle: 0.0,
                        font_size,
                        width_factor: 1.0,
                        is_upside_down: false,
                        is_backwards: false,
                    },
                    text: text_joined.clone(),
                    auto_resize: true,
                    container_id: None,
                    original_text: mtext.value.clone(),
                };

                elements.push(ElementWrapper {
                    element: DucElementEnum::DucTextElement(text_elem),
                });
            }
            EntityType::Hatch(hatch) => {
                for path in &hatch.paths {
                    let mut pts = Vec::new();
                    for edge in &path.edges {
                        match edge {
                            BoundaryEdge::Line(line) => {
                                let (p1x, p1y) = transform.apply(line.start.x, line.start.y);
                                let (p2x, p2y) = transform.apply(line.end.x, line.end.y);
                                if pts.is_empty() {
                                    pts.push((p1x, p1y));
                                }
                                pts.push((p2x, p2y));
                            }
                            BoundaryEdge::CircularArc(arc) => {
                                let (cx, cy) = transform.apply(arc.center.x, arc.center.y);
                                let r = arc.radius * transform.scale();
                                let rot = transform.rotation_radians();
                                let start_rad = -(arc.start_angle.to_radians() + rot);
                                let end_rad = -(arc.end_angle.to_radians() + rot);
                                let num_steps = 16;
                                let step = (end_rad - start_rad) / (num_steps as f64);
                                for s in 0..=num_steps {
                                    let a = start_rad + (s as f64) * step;
                                    pts.push((cx + r * a.cos(), cy + r * a.sin()));
                                }
                            }
                            BoundaryEdge::Polyline(poly) => {
                                for v in &poly.vertices {
                                    let (vx, vy) = transform.apply(v.x, v.y);
                                    pts.push((vx, vy));
                                }
                            }
                            BoundaryEdge::Spline(sp) => {
                                for pt in &sp.control_points {
                                    let (sx, sy) = transform.apply(pt.x, pt.y);
                                    pts.push((sx, sy));
                                }
                            }
                            BoundaryEdge::EllipticArc(el) => {
                                let (cx, cy) = transform.apply(el.center.x, el.center.y);
                                let r = el.major_axis_endpoint.x.hypot(el.major_axis_endpoint.y) * transform.scale();
                                pts.push((cx - r, cy));
                                pts.push((cx + r, cy));
                            }
                        }
                    }

                    if !pts.is_empty() {
                        if hatch.is_solid {
                            self.push_filled_polygon(pts, stroke_hex.clone(), layer_name, plot_id, elements, now);
                        } else {
                            self.push_polyline(pts, stroke_item.clone(), layer_name, plot_id, elements, now);
                        }
                    }
                }
            }
            EntityType::Spline(spline) => {
                let mut pts = Vec::new();
                for pt in &spline.control_points {
                    let (px, py) = transform.apply(pt.x, pt.y);
                    pts.push((px, py));
                }
                if pts.len() >= 2 {
                    if spline.flags.closed {
                        let first = pts[0];
                        pts.push(first);
                    }
                    self.push_polyline(pts, stroke_item, layer_name, plot_id, elements, now);
                }
            }
            EntityType::Insert(insert) => {
                let insert_transform = Transform2D::from_trs(
                    insert.insert_point.x,
                    insert.insert_point.y,
                    insert.rotation,
                    insert.x_scale(),
                    insert.y_scale(),
                );
                let combined = transform.combine(&insert_transform);

                let block_name = &insert.block_name;
                if visited_blocks.insert(block_name.clone()) {
                    for block_ent in self.doc.entities_in_block(block_name) {
                        self.convert_entity_to_duc(
                            block_ent,
                            &combined,
                            scale_factor,
                            plot_id,
                            elements,
                            visited_blocks,
                            depth + 1,
                            now,
                        );
                    }
                    visited_blocks.remove(block_name);
                }
            }
            EntityType::Dimension(dim) => {
                let block_name = &dim.base().block_name;
                if !block_name.is_empty() && visited_blocks.insert(block_name.clone()) {
                    for block_ent in self.doc.entities_in_block(block_name) {
                        self.convert_entity_to_duc(
                            block_ent,
                            transform,
                            scale_factor,
                            plot_id,
                            elements,
                            visited_blocks,
                            depth + 1,
                            now,
                        );
                    }
                    visited_blocks.remove(block_name);
                }
            }
            _ => {}
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn push_linear_segment(
        &mut self,
        p1x: f64,
        p1y: f64,
        p2x: f64,
        p2y: f64,
        stroke_item: ElementStroke,
        layer_name: &str,
        plot_id: &str,
        elements: &mut Vec<ElementWrapper>,
        now: i64,
    ) {
        let min_x = p1x.min(p2x);
        let min_y = p1y.min(p2y);
        let max_x = p1x.max(p2x);
        let max_y = p1y.max(p2y);

        let seed = self.next_seed();
        let elem_id = format!("line_{}", seed);

        let linear_elem = DucLinearElement {
            linear_base: DucLinearElementBase {
                base: DucElementBase {
                    id: elem_id,
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![],
                        stroke: vec![stroke_item],
                        opacity: 1.0,
                    },
                    x: min_x,
                    y: min_y,
                    width: (max_x - min_x).max(0.1),
                    height: (max_y - min_y).max(0.1),
                    angle: 0.0,
                    scope: "mm".to_string(),
                    label: "Line".to_string(),
                    description: None,
                    is_visible: true,
                    seed,
                    version: 1,
                    version_nonce: seed + 500,
                    updated: now,
                    index: None,
                    is_plot: false,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: Some(layer_name.to_string()),
                    frame_id: Some(plot_id.to_string()),
                    bound_elements: None,
                    z_index: 1.0,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                points: vec![
                    DucPoint {
                        x: p1x - min_x,
                        y: p1y - min_y,
                        mirroring: None,
                    },
                    DucPoint {
                        x: p2x - min_x,
                        y: p2y - min_y,
                        mirroring: None,
                    },
                ],
                lines: vec![DucLine {
                    start: DucLineReference {
                        index: 0,
                        handle: None,
                    },
                    end: DucLineReference {
                        index: 1,
                        handle: None,
                    },
                }],
                path_overrides: vec![],
                last_committed_point: None,
                start_binding: None,
                end_binding: None,
            },
            wipeout_below: false,
        };

        elements.push(ElementWrapper {
            element: DucElementEnum::DucLinearElement(linear_elem),
        });
    }

    fn push_polyline(
        &mut self,
        pts: Vec<(f64, f64)>,
        stroke_item: ElementStroke,
        layer_name: &str,
        plot_id: &str,
        elements: &mut Vec<ElementWrapper>,
        now: i64,
    ) {
        if pts.len() < 2 {
            return;
        }

        let mut min_x = f64::INFINITY;
        let mut min_y = f64::INFINITY;
        let mut max_x = f64::NEG_INFINITY;
        let mut max_y = f64::NEG_INFINITY;

        for (x, y) in &pts {
            min_x = min_x.min(*x);
            min_y = min_y.min(*y);
            max_x = max_x.max(*x);
            max_y = max_y.max(*y);
        }

        let duc_points: Vec<DucPoint> = pts
            .iter()
            .map(|(x, y)| DucPoint {
                x: *x - min_x,
                y: *y - min_y,
                mirroring: None,
            })
            .collect();

        let mut duc_lines = Vec::with_capacity(pts.len() - 1);
        for i in 0..pts.len() - 1 {
            duc_lines.push(DucLine {
                start: DucLineReference {
                    index: i as i32,
                    handle: None,
                },
                end: DucLineReference {
                    index: (i + 1) as i32,
                    handle: None,
                },
            });
        }

        let seed = self.next_seed();
        let elem_id = format!("poly_{}", seed);

        let linear_elem = DucLinearElement {
            linear_base: DucLinearElementBase {
                base: DucElementBase {
                    id: elem_id,
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![],
                        stroke: vec![stroke_item],
                        opacity: 1.0,
                    },
                    x: min_x,
                    y: min_y,
                    width: (max_x - min_x).max(0.1),
                    height: (max_y - min_y).max(0.1),
                    angle: 0.0,
                    scope: "mm".to_string(),
                    label: "Polyline".to_string(),
                    description: None,
                    is_visible: true,
                    seed,
                    version: 1,
                    version_nonce: seed + 500,
                    updated: now,
                    index: None,
                    is_plot: false,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: Some(layer_name.to_string()),
                    frame_id: Some(plot_id.to_string()),
                    bound_elements: None,
                    z_index: 1.0,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                points: duc_points,
                lines: duc_lines,
                path_overrides: vec![],
                last_committed_point: None,
                start_binding: None,
                end_binding: None,
            },
            wipeout_below: false,
        };

        elements.push(ElementWrapper {
            element: DucElementEnum::DucLinearElement(linear_elem),
        });
    }

    fn push_filled_polygon(
        &mut self,
        pts: Vec<(f64, f64)>,
        fill_hex: String,
        layer_name: &str,
        plot_id: &str,
        elements: &mut Vec<ElementWrapper>,
        now: i64,
    ) {
        if pts.len() < 3 {
            return;
        }

        let mut min_x = f64::INFINITY;
        let mut min_y = f64::INFINITY;
        let mut max_x = f64::NEG_INFINITY;
        let mut max_y = f64::NEG_INFINITY;

        for (x, y) in &pts {
            min_x = min_x.min(*x);
            min_y = min_y.min(*y);
            max_x = max_x.max(*x);
            max_y = max_y.max(*y);
        }

        let duc_points: Vec<DucPoint> = pts
            .iter()
            .map(|(x, y)| DucPoint {
                x: *x - min_x,
                y: *y - min_y,
                mirroring: None,
            })
            .collect();

        let mut duc_lines = Vec::with_capacity(pts.len() - 1);
        for i in 0..pts.len() - 1 {
            duc_lines.push(DucLine {
                start: DucLineReference {
                    index: i as i32,
                    handle: None,
                },
                end: DucLineReference {
                    index: (i + 1) as i32,
                    handle: None,
                },
            });
        }

        let seed = self.next_seed();
        let elem_id = format!("fill_{}", seed);

        let linear_elem = DucLinearElement {
            linear_base: DucLinearElementBase {
                base: DucElementBase {
                    id: elem_id,
                    styles: DucElementStylesBase {
                        roundness: 0.0,
                        blending: None,
                        background: vec![ElementBackground {
                            content: create_content(fill_hex, 1.0),
                        }],
                        stroke: vec![],
                        opacity: 1.0,
                    },
                    x: min_x,
                    y: min_y,
                    width: (max_x - min_x).max(0.1),
                    height: (max_y - min_y).max(0.1),
                    angle: 0.0,
                    scope: "mm".to_string(),
                    label: "Filled Polygon".to_string(),
                    description: None,
                    is_visible: true,
                    seed,
                    version: 1,
                    version_nonce: seed + 500,
                    updated: now,
                    index: None,
                    is_plot: false,
                    is_deleted: false,
                    group_ids: vec![],
                    block_ids: vec![],
                    region_ids: vec![],
                    instance_id: None,
                    layer_id: Some(layer_name.to_string()),
                    frame_id: Some(plot_id.to_string()),
                    bound_elements: None,
                    z_index: 0.5,
                    link: None,
                    locked: false,
                    custom_data: None,
                },
                points: duc_points,
                lines: duc_lines,
                path_overrides: vec![],
                last_committed_point: None,
                start_binding: None,
                end_binding: None,
            },
            wipeout_below: false,
        };

        elements.push(ElementWrapper {
            element: DucElementEnum::DucLinearElement(linear_elem),
        });
    }
}

/// Helper function to tessellate a 2D bulge arc into discrete points.
fn tessellate_bulge(p1x: f64, p1y: f64, p2x: f64, p2y: f64, bulge: f64) -> Vec<(f64, f64)> {
    let dx = p2x - p1x;
    let dy = p2y - p1y;
    let chord_len = dx.hypot(dy);
    if chord_len < 1e-6 {
        return vec![(p1x, p1y)];
    }

    let theta = 4.0 * bulge.atan();
    let r = (chord_len / (2.0 * (theta / 2.0).sin())).abs();
    let sagitta = (bulge * chord_len) / 2.0;

    let mx = (p1x + p2x) / 2.0;
    let my = (p1y + p2y) / 2.0;

    let normal_x = -dy / chord_len;
    let normal_y = dx / chord_len;

    let h = r - sagitta.abs();
    let cx = if bulge > 0.0 {
        mx + normal_x * h
    } else {
        mx - normal_x * h
    };
    let cy = if bulge > 0.0 {
        my + normal_y * h
    } else {
        my - normal_y * h
    };

    let start_angle = (p1y - cy).atan2(p1x - cx);
    let end_angle = (p2y - cy).atan2(p2x - cx);

    let mut span = end_angle - start_angle;
    if bulge > 0.0 && span < 0.0 {
        span += std::f64::consts::TAU;
    } else if bulge < 0.0 && span > 0.0 {
        span -= std::f64::consts::TAU;
    }

    let steps = 8;
    let mut out = Vec::with_capacity(steps);
    for s in 0..steps {
        let a = start_angle + span * (s as f64 / steps as f64);
        out.push((cx + r * a.cos(), cy + r * a.sin()));
    }
    out
}
