//! Data scaling utilities for DUC to PDF conversion
//!
//! This module provides functionality to scale all precision-related fields
//! in DUC data structures to match PDF coordinate systems and requirements.

use duc::types;

/// Utility for scaling all precision-related fields in DUC data
pub struct DucDataScaler;

impl DucDataScaler {
    /// Scale all precision-related fields in the exported DUC data
    pub fn scale_exported_data(exported_data: &mut types::ExportedDataState, scale: f64) {
        // Scale all elements
        for element_wrapper in &mut exported_data.elements {
            Self::scale_element(&mut element_wrapper.element, scale);
        }

        // Scale blocks if needed
        for block in &mut exported_data.blocks {
            Self::scale_block(block, scale);
        }

        // Scale local state scroll values
        if let Some(ref mut local_state) = exported_data.duc_local_state {
            local_state.scroll_x *= scale;
            local_state.scroll_y *= scale;
        }
    }

    /// Scale a single element based on its type
    fn scale_element(element: &mut types::DucElementEnum, scale: f64) {
        match element {
            types::DucElementEnum::DucRectangleElement(rect) => {
                Self::scale_element_base(&mut rect.base, scale);
            }
            types::DucElementEnum::DucEllipseElement(ellipse) => {
                Self::scale_element_base(&mut ellipse.base, scale);
            }
            types::DucElementEnum::DucPolygonElement(polygon) => {
                Self::scale_element_base(&mut polygon.base, scale);
            }
            types::DucElementEnum::DucTextElement(text) => {
                Self::scale_element_base(&mut text.base, scale);
                Self::scale_text_style(&mut text.style, scale);
            }
            types::DucElementEnum::DucLinearElement(linear) => {
                Self::scale_linear_element_base(&mut linear.linear_base, scale);
            }
            types::DucElementEnum::DucArrowElement(arrow) => {
                Self::scale_linear_element_base(&mut arrow.linear_base, scale);
            }
            types::DucElementEnum::DucFreeDrawElement(freedraw) => {
                Self::scale_element_base(&mut freedraw.base, scale);
                Self::scale_freedraw_element(freedraw, scale);
            }
            types::DucElementEnum::DucTableElement(table) => {
                Self::scale_element_base(&mut table.base, scale);
                Self::scale_table_element(table, scale);
            }
            types::DucElementEnum::DucImageElement(image) => {
                Self::scale_element_base(&mut image.base, scale);
            }
            types::DucElementEnum::DucFrameElement(frame) => {
                Self::scale_element_base(&mut frame.stack_element_base.base, scale);
            }
            types::DucElementEnum::DucPlotElement(plot) => {
                Self::scale_element_base(&mut plot.stack_element_base.base, scale);
                Self::scale_plot_element(plot, scale);
            }
            types::DucElementEnum::DucViewportElement(viewport) => {
                Self::scale_linear_element_base(&mut viewport.linear_base, scale);
            }
            types::DucElementEnum::DucXRayElement(xray) => {
                Self::scale_element_base(&mut xray.base, scale);
            }
            types::DucElementEnum::DucLeaderElement(leader) => {
                Self::scale_linear_element_base(&mut leader.linear_base, scale);
                Self::scale_leader_element(leader, scale);
            }
            types::DucElementEnum::DucDimensionElement(dimension) => {
                Self::scale_element_base(&mut dimension.base, scale);
                Self::scale_dimension_element(dimension, scale);
            }
            types::DucElementEnum::DucFeatureControlFrameElement(fcf) => {
                Self::scale_element_base(&mut fcf.base, scale);
                Self::scale_fcf_element(fcf, scale);
            }
            types::DucElementEnum::DucDocElement(doc) => {
                Self::scale_element_base(&mut doc.base, scale);
                Self::scale_doc_element(doc, scale);
            }
            types::DucElementEnum::DucParametricElement(parametric) => {
                Self::scale_element_base(&mut parametric.base, scale);
            }
            types::DucElementEnum::DucBlockInstanceElement(block_instance) => {
                Self::scale_element_base(&mut block_instance.base, scale);
            }
            types::DucElementEnum::DucEmbeddableElement(embeddable) => {
                Self::scale_element_base(&mut embeddable.base, scale);
            }
            types::DucElementEnum::DucPdfElement(pdf) => {
                Self::scale_element_base(&mut pdf.base, scale);
            }
            types::DucElementEnum::DucMermaidElement(mermaid) => {
                Self::scale_element_base(&mut mermaid.base, scale);
            }
        }
    }

    /// Scale the base element fields
    fn scale_element_base(base: &mut types::DucElementBase, scale: f64) {
        base.x *= scale;
        base.y *= scale;
        base.width *= scale;
        base.height *= scale;

        // Scale background radius
        base.styles.roundness *= scale;

        // Scale stroke widths
        for stroke in &mut base.styles.stroke {
            stroke.width *= scale;
        }
    }

    /// Scale text style fields
    fn scale_text_style(style: &mut types::DucTextStyle, scale: f64) {
        style.font_size *= scale;
        style.line_height *= scale as f32;

        if let Some(ref mut paper_height) = style.paper_text_height {
            *paper_height *= scale;
        }
    }

    /// Scale linear element base (points, lines, etc.)
    fn scale_linear_element_base(base: &mut types::DucLinearElementBase, scale: f64) {
        Self::scale_element_base(&mut base.base, scale);

        // Scale all points
        for point in &mut base.points {
            point.x *= scale;
            point.y *= scale;
        }

        // Scale last committed point
        if let Some(ref mut point) = base.last_committed_point {
            point.x *= scale;
            point.y *= scale;
        }

        // Scale Bezier handles for each line segment
        for line in &mut base.lines {
            if let Some(handle) = line.start.handle.as_mut() {
                handle.x *= scale;
                handle.y *= scale;
            }

            if let Some(handle) = line.end.handle.as_mut() {
                handle.x *= scale;
                handle.y *= scale;
            }
        }
    }

    /// Scale freedraw element specific fields
    fn scale_freedraw_element(freedraw: &mut types::DucFreeDrawElement, scale: f64) {
        freedraw.size *= scale;

        // Scale all points
        for point in &mut freedraw.points {
            point.x *= scale;
            point.y *= scale;
        }

        // Scale last committed point
        if let Some(ref mut point) = freedraw.last_committed_point {
            point.x *= scale;
            point.y *= scale;
        }

        // Scale SVG path if present
        if let Some(ref mut svg_path) = freedraw.svg_path {
            *svg_path = Self::scale_svg_path(svg_path, scale);
        }
    }

    /// Scale SVG path data by a given scale factor
    /// This applies the scale to all numeric values in the path
    fn scale_svg_path(path_data: &str, scale: f64) -> String {
        let mut result = String::new();
        let mut current_number = String::new();
        let mut in_number = false;
        
        for ch in path_data.chars() {
            if ch.is_ascii_digit() || ch == '.' || (ch == '-' && !in_number) {
                // Part of a number
                current_number.push(ch);
                in_number = true;
            } else {
                // Not part of a number
                if in_number {
                    // We just finished a number, scale it
                    if let Ok(num) = current_number.parse::<f64>() {
                        result.push_str(&format!("{}", num * scale));
                    } else {
                        result.push_str(&current_number);
                    }
                    current_number.clear();
                    in_number = false;
                }
                result.push(ch);
            }
        }
        
        // Don't forget the last number if path ends with one
        if in_number {
            if let Ok(num) = current_number.parse::<f64>() {
                result.push_str(&format!("{}", num * scale));
            } else {
                result.push_str(&current_number);
            }
        }
        
        result
    }

    /// Scale table element fields
    fn scale_table_element(table: &mut types::DucTableElement, scale: f64) {
        // Scale column widths
        for column in &mut table.columns {
            column.value.width *= scale;
        }
    }

    /// Scale leader element fields
    fn scale_leader_element(_leader: &mut types::DucLeaderElement, _scale: f64) {
        // Leader element scaling - no specific fields to scale based on current structure
    }

    /// Scale dimension element fields
    fn scale_dimension_element(dimension: &mut types::DucDimensionElement, scale: f64) {
        // Scale text position
        if let Some(ref mut text_position) = dimension.text_position {
            text_position.x *= scale;
            text_position.y *= scale;
        }

        // Scale definition points
        dimension.definition_points.origin1.x *= scale;
        dimension.definition_points.origin1.y *= scale;
        dimension.definition_points.location.x *= scale;
        dimension.definition_points.location.y *= scale;

        if let Some(ref mut origin2) = dimension.definition_points.origin2 {
            origin2.x *= scale;
            origin2.y *= scale;
        }

        if let Some(ref mut center) = dimension.definition_points.center {
            center.x *= scale;
            center.y *= scale;
        }

        if let Some(ref mut jog) = dimension.definition_points.jog {
            jog.x *= scale;
            jog.y *= scale;
        }

        // Scale nested text styles
        Self::scale_text_style(&mut dimension.style.text_style, scale);

        // Scale tolerance text style
        if let Some(ref mut tolerance) = dimension.tolerance_override {
            if let Some(ref mut text_style) = tolerance.text_style {
                Self::scale_text_style(text_style, scale);
            }
        }
    }

    /// Scale feature control frame element fields
    fn scale_fcf_element(fcf: &mut types::DucFeatureControlFrameElement, scale: f64) {
        // Scale layout fields
        fcf.style.layout.padding *= scale;
        fcf.style.layout.segment_spacing *= scale;
        fcf.style.layout.row_spacing *= scale;

        // Scale text style
        Self::scale_text_style(&mut fcf.style.text_style, scale);
    }

    /// Scale document element fields
    fn scale_doc_element(doc: &mut types::DucDocElement, scale: f64) {
        // Scale column layout
        for column in &mut doc.columns.definitions {
            column.width *= scale;
            column.gutter *= scale;
        }

        // Scale document text style if it exists
        // Note: Doc style structure may need additional scaling based on actual fields
    }

    /// Scale plot element fields
    fn scale_plot_element(plot: &mut types::DucPlotElement, scale: f64) {
        // Scale plot layout margins
        plot.layout.margins.left *= scale;
        plot.layout.margins.top *= scale;
        plot.layout.margins.right *= scale;
        plot.layout.margins.bottom *= scale;
    }

    /// Scale block data
    fn scale_block(block: &mut types::DucBlock, scale: f64) {
        // Scale block element bases
        for element in &mut block.elements {
            Self::scale_element(&mut element.element, scale);
        }
    }

    /// Transform y-coordinate from top-left origin (duc) to bottom-left origin (PDF)
    /// This is used during element placement, not modifying the original data
    pub fn transform_y_coordinate_to_pdf_system(y: f64, height: f64, page_height: f64) -> f64 {
        page_height - (y + height)
    }

    /// Transform a single point y-coordinate from top-left to bottom-left origin
    pub fn transform_point_y_to_pdf_system(y: f64, page_height: f64) -> f64 {
        page_height - y
    }
}
