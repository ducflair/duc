# ducpy.builders.element_builders

Helper functions for creating DUC elements with a user-friendly API.
Only the 15 element types from duc.sql / types.rs are supported.

## Classes

| [`BaseElementParams`](#ducpy.builders.element_builders.BaseElementParams)               |    |
|-----------------------------------------------------------------------------------------|----|
| [`ElementBuilder`](#ducpy.builders.element_builders.ElementBuilder)                     |    |
| [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)     |    |
| [`RectangleElementBuilder`](#ducpy.builders.element_builders.RectangleElementBuilder)   |    |
| [`EllipseElementBuilder`](#ducpy.builders.element_builders.EllipseElementBuilder)       |    |
| [`PolygonElementBuilder`](#ducpy.builders.element_builders.PolygonElementBuilder)       |    |
| [`LinearElementBuilder`](#ducpy.builders.element_builders.LinearElementBuilder)         |    |
| [`ArrowElementBuilder`](#ducpy.builders.element_builders.ArrowElementBuilder)           |    |
| [`ImageElementBuilder`](#ducpy.builders.element_builders.ImageElementBuilder)           |    |
| [`PdfElementBuilder`](#ducpy.builders.element_builders.PdfElementBuilder)               |    |
| [`TextElementBuilder`](#ducpy.builders.element_builders.TextElementBuilder)             |    |
| [`TableElementBuilder`](#ducpy.builders.element_builders.TableElementBuilder)           |    |
| [`FrameElementBuilder`](#ducpy.builders.element_builders.FrameElementBuilder)           |    |
| [`PlotElementBuilder`](#ducpy.builders.element_builders.PlotElementBuilder)             |    |
| [`FreeDrawElementBuilder`](#ducpy.builders.element_builders.FreeDrawElementBuilder)     |    |
| [`DocElementBuilder`](#ducpy.builders.element_builders.DocElementBuilder)               |    |
| [`EmbeddableElementBuilder`](#ducpy.builders.element_builders.EmbeddableElementBuilder) |    |
| [`ModelElementBuilder`](#ducpy.builders.element_builders.ModelElementBuilder)           |    |

## Functions

| [`_create_element_wrapper`](#ducpy.builders.element_builders._create_element_wrapper)(element_class, base_params, ...)   | Helper function to create an ElementWrapper with the given parameters.   |
|--------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| [`create_duc_path`](#ducpy.builders.element_builders.create_duc_path)(→ ducpy.classes.ElementsClass.DucPath)             |                                                                          |
| [`create_bound_element`](#ducpy.builders.element_builders.create_bound_element)(...)                                     |                                                                          |

## Module Contents

### ducpy.builders.element_builders.\_create_element_wrapper(element_class, base_params, element_params, explicit_properties_override=None)

Helper function to create an ElementWrapper with the given parameters.

### *class* ducpy.builders.element_builders.BaseElementParams

#### x *: float*

#### y *: float*

#### width *: float*

#### height *: float*

#### scope *: str*

#### angle *: float* *= 0.0*

#### styles *: [ducpy.classes.ElementsClass.DucElementStylesBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucElementStylesBase) | None* *= None*

#### id *: str | None* *= None*

#### label *: str* *= ''*

#### locked *: bool* *= False*

#### is_visible *: bool* *= True*

#### z_index *: float* *= 0.0*

#### description *: str* *= ''*

#### group_ids *: List[str] | None* *= []*

#### region_ids *: List[str] | None* *= []*

#### layer_id *: str* *= ''*

#### frame_id *: str | None* *= None*

#### bound_elements *: List[[ducpy.classes.ElementsClass.BoundElement](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.BoundElement)] | None* *= []*

#### link *: str* *= ''*

#### custom_data *: str* *= ''*

#### is_plot *: bool* *= True*

#### is_deleted *: bool* *= False*

#### index *: str | None* *= None*

#### instance_id *: str | None* *= None*

### *class* ducpy.builders.element_builders.ElementBuilder(x: float = 0.0, y: float = 0.0, width: float = 1.0, height: float = 1.0, scope: str = DEFAULT_SCOPE)

#### base

#### extra

#### at_position(x: float, y: float)

#### with_size(width: float, height: float)

#### with_angle(angle: float)

#### with_styles(styles: [ducpy.classes.ElementsClass.DucElementStylesBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucElementStylesBase))

#### with_id(id: str)

#### with_label(label: str)

#### with_scope(scope: str)

#### with_locked(locked: bool)

#### with_visible(is_visible: bool)

#### with_instance_id(instance_id: str)

#### with_z_index(z_index: float)

#### with_description(description: str)

#### with_group_ids(group_ids: List[str])

#### with_region_ids(region_ids: List[str])

#### with_layer_id(layer_id: str)

#### with_frame_id(frame_id: str)

#### with_bound_elements(bound_elements: List[[ducpy.classes.ElementsClass.BoundElement](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.BoundElement)])

#### with_bound_element(element_id: str, element_type: str)

#### with_link(link: str)

#### with_custom_data(custom_data: str)

#### with_plot(is_plot: bool)

#### with_deleted(is_deleted: bool)

#### with_index(index: str)

#### with_extra(\*\*kwargs)

#### build_rectangle()

#### build_ellipse()

#### build_polygon()

#### build_linear_element()

#### build_arrow_element()

#### build_image_element()

#### build_pdf_element()

#### build_text_element()

#### build_table_element()

#### build_frame_element()

#### build_plot_element()

#### build_freedraw_element()

#### build_doc_element()

#### build_embeddable_element()

#### build_model_element()

### ducpy.builders.element_builders.create_duc_path(line_indices: List[int], background: [ducpy.classes.ElementsClass.ElementBackground](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementBackground) | None = None, stroke: [ducpy.classes.ElementsClass.ElementStroke](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementStroke) | None = None) → [ducpy.classes.ElementsClass.DucPath](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPath)

### ducpy.builders.element_builders.create_bound_element(element_id: str, element_type: str) → [ducpy.classes.ElementsClass.BoundElement](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.BoundElement)

### *class* ducpy.builders.element_builders.ElementSpecificBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

#### base

#### extra

### *class* ducpy.builders.element_builders.RectangleElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.EllipseElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_ratio(ratio: float)

#### with_start_angle(start_angle: float)

#### with_end_angle(end_angle: float)

#### with_show_aux_crosshair(show_aux_crosshair: bool)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.PolygonElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_sides(sides: int)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.LinearElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_points(points: List[tuple])

#### with_lines(lines: List[[ducpy.classes.ElementsClass.DucLine](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucLine)] | None)

#### with_path_overrides(path_overrides: List[[ducpy.classes.ElementsClass.DucPath](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPath)] | None)

#### with_last_committed_point(lcp: [ducpy.classes.ElementsClass.DucPoint](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPoint) | None)

#### with_start_binding(sb: [ducpy.classes.ElementsClass.DucPointBinding](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPointBinding) | None)

#### with_end_binding(eb: [ducpy.classes.ElementsClass.DucPointBinding](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPointBinding) | None)

#### with_wipeout_below(wipeout_below: bool)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.ArrowElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_points(points: List[tuple])

#### with_start_binding(sb: [ducpy.classes.ElementsClass.DucPointBinding](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPointBinding) | None)

#### with_end_binding(eb: [ducpy.classes.ElementsClass.DucPointBinding](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPointBinding) | None)

#### with_elbowed(elbowed: bool)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.ImageElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_file_id(file_id: str)

#### with_scale(scale: List[float])

#### with_status(status: [ducpy.enums.IMAGE_STATUS](../../enums/index.md#ducpy.enums.IMAGE_STATUS))

#### with_crop(crop: [ducpy.classes.ElementsClass.ImageCrop](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ImageCrop) | None)

#### with_filter(f: [ducpy.classes.ElementsClass.DucImageFilter](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucImageFilter) | None)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.PdfElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_file_id(file_id: str)

#### with_grid_config(grid_config: [ducpy.classes.ElementsClass.DocumentGridConfig](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DocumentGridConfig))

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.TextElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_text(text: str)

#### with_text_style(text_style: [ducpy.classes.ElementsClass.DucTextStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucTextStyle) | None)

#### with_auto_resize(auto_resize: bool)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.TableElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_file_id(file_id: str)

#### with_table_style(style: [ducpy.classes.ElementsClass.DucTableStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucTableStyle) | None)

#### with_grid_config(grid_config: [ducpy.classes.ElementsClass.DocumentGridConfig](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DocumentGridConfig))

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.FrameElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_stack_base(stack_base: [ducpy.classes.ElementsClass.DucStackBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucStackBase) | None)

#### with_clip(clip: bool)

#### with_label_visible(label_visible: bool)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.PlotElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_margins(margins: [ducpy.classes.ElementsClass.Margins](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.Margins) | None)

#### with_style(style: [ducpy.classes.ElementsClass.DucPlotStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPlotStyle) | None)

#### with_stack_base(stack_base: [ducpy.classes.ElementsClass.DucStackBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucStackBase) | None)

#### with_clip(clip: bool)

#### with_label_visible(label_visible: bool)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.FreeDrawElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_points(points: list)

#### with_pressures(pressures: list)

#### with_size_thickness(size: float)

#### with_thinning(thinning: float)

#### with_smoothing(smoothing: float)

#### with_streamline(streamline: float)

#### with_easing(easing: str)

#### with_simulate_pressure(simulate_pressure: bool)

#### with_start_cap(cap: bool)

#### with_start_taper(taper: float)

#### with_start_easing(easing: str)

#### with_end_cap(cap: bool)

#### with_end_taper(taper: float)

#### with_end_easing(easing: str)

#### with_last_committed_point(lcp: [ducpy.classes.ElementsClass.DucPoint](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucPoint) | None)

#### with_svg_path(svg_path: str | None)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.DocElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_text(text: str)

#### with_doc_style(style: [ducpy.classes.ElementsClass.DucDocStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucDocStyle) | None)

#### with_file_id(file_id: str)

#### with_referenced_file_ids(referenced_file_ids: List[str])

#### with_grid_config(grid_config: [ducpy.classes.ElementsClass.DocumentGridConfig](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DocumentGridConfig))

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.EmbeddableElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_link(link: str)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)

### *class* ducpy.builders.element_builders.ModelElementBuilder(base: [BaseElementParams](#ducpy.builders.element_builders.BaseElementParams), extra: dict)

Bases: [`ElementSpecificBuilder`](#ducpy.builders.element_builders.ElementSpecificBuilder)

#### with_model_type(model_type: str)

#### with_code(code: str)

#### with_file_ids(file_ids: List[str])

#### with_viewer_state(viewer_state)

#### build() → [ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)
