# ducpy.classes.ElementsClass

## Attributes

| [`DucElement`](#ducpy.classes.ElementsClass.DucElement)   |    |
|-----------------------------------------------------------|----|

## Classes

| [`DictionaryEntry`](#ducpy.classes.ElementsClass.DictionaryEntry)                   |                                                                                                       |
|-------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| [`StringValueEntry`](#ducpy.classes.ElementsClass.StringValueEntry)                 |                                                                                                       |
| [`GeometricPoint`](#ducpy.classes.ElementsClass.GeometricPoint)                     |                                                                                                       |
| [`DucPoint`](#ducpy.classes.ElementsClass.DucPoint)                                 |                                                                                                       |
| [`Margins`](#ducpy.classes.ElementsClass.Margins)                                   |                                                                                                       |
| [`Viewer3DClipPlane`](#ducpy.classes.ElementsClass.Viewer3DClipPlane)               |                                                                                                       |
| [`Viewer3DMaterial`](#ducpy.classes.ElementsClass.Viewer3DMaterial)                 |                                                                                                       |
| [`Viewer3DZebra`](#ducpy.classes.ElementsClass.Viewer3DZebra)                       |                                                                                                       |
| [`Viewer3DCamera`](#ducpy.classes.ElementsClass.Viewer3DCamera)                     |                                                                                                       |
| [`Viewer3DGridPlanes`](#ducpy.classes.ElementsClass.Viewer3DGridPlanes)             |                                                                                                       |
| [`Viewer3DGrid`](#ducpy.classes.ElementsClass.Viewer3DGrid)                         | Tagged union: {"type": "uniform", "value": bool} or {"type": "perPlane", "value": Viewer3DGridPlanes} |
| [`Viewer3DDisplay`](#ducpy.classes.ElementsClass.Viewer3DDisplay)                   |                                                                                                       |
| [`Viewer3DClipping`](#ducpy.classes.ElementsClass.Viewer3DClipping)                 |                                                                                                       |
| [`Viewer3DExplode`](#ducpy.classes.ElementsClass.Viewer3DExplode)                   |                                                                                                       |
| [`Viewer3DState`](#ducpy.classes.ElementsClass.Viewer3DState)                       |                                                                                                       |
| [`TilingProperties`](#ducpy.classes.ElementsClass.TilingProperties)                 |                                                                                                       |
| [`HatchPatternLine`](#ducpy.classes.ElementsClass.HatchPatternLine)                 |                                                                                                       |
| [`CustomHatchPattern`](#ducpy.classes.ElementsClass.CustomHatchPattern)             |                                                                                                       |
| [`DucHatchStyle`](#ducpy.classes.ElementsClass.DucHatchStyle)                       |                                                                                                       |
| [`DucImageFilter`](#ducpy.classes.ElementsClass.DucImageFilter)                     |                                                                                                       |
| [`ElementContentBase`](#ducpy.classes.ElementsClass.ElementContentBase)             |                                                                                                       |
| [`StrokeStyle`](#ducpy.classes.ElementsClass.StrokeStyle)                           |                                                                                                       |
| [`StrokeSides`](#ducpy.classes.ElementsClass.StrokeSides)                           |                                                                                                       |
| [`ElementStroke`](#ducpy.classes.ElementsClass.ElementStroke)                       |                                                                                                       |
| [`ElementBackground`](#ducpy.classes.ElementsClass.ElementBackground)               |                                                                                                       |
| [`DucElementStylesBase`](#ducpy.classes.ElementsClass.DucElementStylesBase)         |                                                                                                       |
| [`BoundElement`](#ducpy.classes.ElementsClass.BoundElement)                         |                                                                                                       |
| [`DucElementBase`](#ducpy.classes.ElementsClass.DucElementBase)                     |                                                                                                       |
| [`DucHead`](#ducpy.classes.ElementsClass.DucHead)                                   |                                                                                                       |
| [`PointBindingPoint`](#ducpy.classes.ElementsClass.PointBindingPoint)               |                                                                                                       |
| [`DucPointBinding`](#ducpy.classes.ElementsClass.DucPointBinding)                   |                                                                                                       |
| [`DucLineReference`](#ducpy.classes.ElementsClass.DucLineReference)                 |                                                                                                       |
| [`DucLine`](#ducpy.classes.ElementsClass.DucLine)                                   |                                                                                                       |
| [`DucPath`](#ducpy.classes.ElementsClass.DucPath)                                   |                                                                                                       |
| [`DucLinearElementBase`](#ducpy.classes.ElementsClass.DucLinearElementBase)         |                                                                                                       |
| [`DucStackLikeStyles`](#ducpy.classes.ElementsClass.DucStackLikeStyles)             |                                                                                                       |
| [`DucStackBase`](#ducpy.classes.ElementsClass.DucStackBase)                         |                                                                                                       |
| [`DucStackElementBase`](#ducpy.classes.ElementsClass.DucStackElementBase)           |                                                                                                       |
| [`LineSpacing`](#ducpy.classes.ElementsClass.LineSpacing)                           |                                                                                                       |
| [`DucTextStyle`](#ducpy.classes.ElementsClass.DucTextStyle)                         |                                                                                                       |
| [`DucTableStyle`](#ducpy.classes.ElementsClass.DucTableStyle)                       |                                                                                                       |
| [`DucDocStyle`](#ducpy.classes.ElementsClass.DucDocStyle)                           |                                                                                                       |
| [`DucPlotStyle`](#ducpy.classes.ElementsClass.DucPlotStyle)                         |                                                                                                       |
| [`DucRectangleElement`](#ducpy.classes.ElementsClass.DucRectangleElement)           |                                                                                                       |
| [`DucPolygonElement`](#ducpy.classes.ElementsClass.DucPolygonElement)               |                                                                                                       |
| [`DucEllipseElement`](#ducpy.classes.ElementsClass.DucEllipseElement)               |                                                                                                       |
| [`DucEmbeddableElement`](#ducpy.classes.ElementsClass.DucEmbeddableElement)         |                                                                                                       |
| [`DocumentGridConfig`](#ducpy.classes.ElementsClass.DocumentGridConfig)             |                                                                                                       |
| [`DucPdfElement`](#ducpy.classes.ElementsClass.DucPdfElement)                       |                                                                                                       |
| [`DucDocElement`](#ducpy.classes.ElementsClass.DucDocElement)                       |                                                                                                       |
| [`DucTableElement`](#ducpy.classes.ElementsClass.DucTableElement)                   |                                                                                                       |
| [`ImageCrop`](#ducpy.classes.ElementsClass.ImageCrop)                               |                                                                                                       |
| [`DucImageElement`](#ducpy.classes.ElementsClass.DucImageElement)                   |                                                                                                       |
| [`DucTextElement`](#ducpy.classes.ElementsClass.DucTextElement)                     |                                                                                                       |
| [`DucLinearElement`](#ducpy.classes.ElementsClass.DucLinearElement)                 |                                                                                                       |
| [`DucArrowElement`](#ducpy.classes.ElementsClass.DucArrowElement)                   |                                                                                                       |
| [`DucFreeDrawEnds`](#ducpy.classes.ElementsClass.DucFreeDrawEnds)                   |                                                                                                       |
| [`DucFreeDrawElement`](#ducpy.classes.ElementsClass.DucFreeDrawElement)             |                                                                                                       |
| [`DucFrameElement`](#ducpy.classes.ElementsClass.DucFrameElement)                   |                                                                                                       |
| [`PlotLayout`](#ducpy.classes.ElementsClass.PlotLayout)                             |                                                                                                       |
| [`DucPlotElement`](#ducpy.classes.ElementsClass.DucPlotElement)                     |                                                                                                       |
| [`DucModelElement`](#ducpy.classes.ElementsClass.DucModelElement)                   |                                                                                                       |
| [`DucBlockDuplicationArray`](#ducpy.classes.ElementsClass.DucBlockDuplicationArray) |                                                                                                       |
| [`DucBlockMetadata`](#ducpy.classes.ElementsClass.DucBlockMetadata)                 |                                                                                                       |
| [`DucBlock`](#ducpy.classes.ElementsClass.DucBlock)                                 |                                                                                                       |
| [`DucBlockInstance`](#ducpy.classes.ElementsClass.DucBlockInstance)                 |                                                                                                       |
| [`DucBlockCollectionEntry`](#ducpy.classes.ElementsClass.DucBlockCollectionEntry)   |                                                                                                       |
| [`DucBlockCollection`](#ducpy.classes.ElementsClass.DucBlockCollection)             |                                                                                                       |
| [`DucGroup`](#ducpy.classes.ElementsClass.DucGroup)                                 |                                                                                                       |
| [`DucRegion`](#ducpy.classes.ElementsClass.DucRegion)                               |                                                                                                       |
| [`DucLayerOverrides`](#ducpy.classes.ElementsClass.DucLayerOverrides)               |                                                                                                       |
| [`DucLayer`](#ducpy.classes.ElementsClass.DucLayer)                                 |                                                                                                       |
| [`ElementWrapper`](#ducpy.classes.ElementsClass.ElementWrapper)                     |                                                                                                       |

## Module Contents

### *class* ducpy.classes.ElementsClass.DictionaryEntry

#### key *: str*

#### value *: str*

### *class* ducpy.classes.ElementsClass.StringValueEntry

#### key *: str*

#### value *: str*

### *class* ducpy.classes.ElementsClass.GeometricPoint

#### x *: float*

#### y *: float*

### *class* ducpy.classes.ElementsClass.DucPoint

#### x *: float*

#### y *: float*

#### mirroring *: [ducpy.enums.BEZIER_MIRRORING](../../enums/index.md#ducpy.enums.BEZIER_MIRRORING) | None* *= None*

### *class* ducpy.classes.ElementsClass.Margins

#### top *: float*

#### right *: float*

#### bottom *: float*

#### left *: float*

### *class* ducpy.classes.ElementsClass.Viewer3DClipPlane

#### enabled *: bool*

#### value *: float*

#### normal *: List[float] | None* *= None*

### *class* ducpy.classes.ElementsClass.Viewer3DMaterial

#### metalness *: float*

#### roughness *: float*

#### default_opacity *: float*

#### edge_color *: int*

#### ambient_intensity *: float*

#### direct_intensity *: float*

### *class* ducpy.classes.ElementsClass.Viewer3DZebra

#### active *: bool*

#### stripe_count *: int*

#### stripe_direction *: float*

#### color_scheme *: str*

#### opacity *: float*

#### mapping_mode *: str*

### *class* ducpy.classes.ElementsClass.Viewer3DCamera

#### control *: str*

#### ortho *: bool*

#### up *: str*

#### position *: List[float]*

#### quaternion *: List[float]*

#### target *: List[float]*

#### zoom *: float*

#### pan_speed *: float*

#### rotate_speed *: float*

#### zoom_speed *: float*

#### holroyd *: bool*

### *class* ducpy.classes.ElementsClass.Viewer3DGridPlanes

#### xy *: bool*

#### xz *: bool*

#### yz *: bool*

### *class* ducpy.classes.ElementsClass.Viewer3DGrid

Tagged union: {“type”: “uniform”, “value”: bool} or {“type”: “perPlane”, “value”: Viewer3DGridPlanes}

#### type *: str*

#### value *: Any*

### *class* ducpy.classes.ElementsClass.Viewer3DDisplay

#### wireframe *: bool*

#### transparent *: bool*

#### black_edges *: bool*

#### grid *: [Viewer3DGrid](#ducpy.classes.ElementsClass.Viewer3DGrid)*

#### axes_visible *: bool*

#### axes_at_origin *: bool*

### *class* ducpy.classes.ElementsClass.Viewer3DClipping

#### x *: [Viewer3DClipPlane](#ducpy.classes.ElementsClass.Viewer3DClipPlane)*

#### y *: [Viewer3DClipPlane](#ducpy.classes.ElementsClass.Viewer3DClipPlane)*

#### z *: [Viewer3DClipPlane](#ducpy.classes.ElementsClass.Viewer3DClipPlane)*

#### intersection *: bool*

#### show_planes *: bool*

#### object_color_caps *: bool*

### *class* ducpy.classes.ElementsClass.Viewer3DExplode

#### active *: bool*

#### value *: float*

### *class* ducpy.classes.ElementsClass.Viewer3DState

#### camera *: [Viewer3DCamera](#ducpy.classes.ElementsClass.Viewer3DCamera)*

#### display *: [Viewer3DDisplay](#ducpy.classes.ElementsClass.Viewer3DDisplay)*

#### material *: [Viewer3DMaterial](#ducpy.classes.ElementsClass.Viewer3DMaterial)*

#### clipping *: [Viewer3DClipping](#ducpy.classes.ElementsClass.Viewer3DClipping)*

#### explode *: [Viewer3DExplode](#ducpy.classes.ElementsClass.Viewer3DExplode)*

#### zebra *: [Viewer3DZebra](#ducpy.classes.ElementsClass.Viewer3DZebra)*

### *class* ducpy.classes.ElementsClass.TilingProperties

#### size_in_percent *: float*

#### angle *: float*

#### spacing *: float | None* *= None*

#### offset_x *: float | None* *= None*

#### offset_y *: float | None* *= None*

### *class* ducpy.classes.ElementsClass.HatchPatternLine

#### angle *: float*

#### origin *: [DucPoint](#ducpy.classes.ElementsClass.DucPoint)*

#### offset *: List[float]*

#### dash_pattern *: List[float]*

### *class* ducpy.classes.ElementsClass.CustomHatchPattern

#### name *: str*

#### lines *: List[[HatchPatternLine](#ducpy.classes.ElementsClass.HatchPatternLine)]*

#### description *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucHatchStyle

#### hatch_style *: [ducpy.enums.HATCH_STYLE](../../enums/index.md#ducpy.enums.HATCH_STYLE)*

#### pattern_name *: str*

#### pattern_scale *: float*

#### pattern_angle *: float*

#### pattern_origin *: [DucPoint](#ducpy.classes.ElementsClass.DucPoint)*

#### pattern_double *: bool*

#### custom_pattern *: [CustomHatchPattern](#ducpy.classes.ElementsClass.CustomHatchPattern) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucImageFilter

#### brightness *: float*

#### contrast *: float*

### *class* ducpy.classes.ElementsClass.ElementContentBase

#### src *: str*

#### visible *: bool*

#### opacity *: float*

#### preference *: [ducpy.enums.ELEMENT_CONTENT_PREFERENCE](../../enums/index.md#ducpy.enums.ELEMENT_CONTENT_PREFERENCE) | None* *= None*

#### tiling *: [TilingProperties](#ducpy.classes.ElementsClass.TilingProperties) | None* *= None*

#### hatch *: [DucHatchStyle](#ducpy.classes.ElementsClass.DucHatchStyle) | None* *= None*

#### image_filter *: [DucImageFilter](#ducpy.classes.ElementsClass.DucImageFilter) | None* *= None*

### *class* ducpy.classes.ElementsClass.StrokeStyle

#### preference *: [ducpy.enums.STROKE_PREFERENCE](../../enums/index.md#ducpy.enums.STROKE_PREFERENCE) | None* *= None*

#### cap *: [ducpy.enums.STROKE_CAP](../../enums/index.md#ducpy.enums.STROKE_CAP) | None* *= None*

#### join *: [ducpy.enums.STROKE_JOIN](../../enums/index.md#ducpy.enums.STROKE_JOIN) | None* *= None*

#### dash *: List[float] | None* *= None*

#### dash_line_override *: str | None* *= None*

#### dash_cap *: [ducpy.enums.STROKE_CAP](../../enums/index.md#ducpy.enums.STROKE_CAP) | None* *= None*

#### miter_limit *: float | None* *= None*

### *class* ducpy.classes.ElementsClass.StrokeSides

#### preference *: [ducpy.enums.STROKE_SIDE_PREFERENCE](../../enums/index.md#ducpy.enums.STROKE_SIDE_PREFERENCE) | None* *= None*

#### values *: List[float] | None* *= None*

### *class* ducpy.classes.ElementsClass.ElementStroke

#### content *: [ElementContentBase](#ducpy.classes.ElementsClass.ElementContentBase)*

#### width *: float*

#### style *: [StrokeStyle](#ducpy.classes.ElementsClass.StrokeStyle)*

#### placement *: [ducpy.enums.STROKE_PLACEMENT](../../enums/index.md#ducpy.enums.STROKE_PLACEMENT) | None* *= None*

#### stroke_sides *: [StrokeSides](#ducpy.classes.ElementsClass.StrokeSides) | None* *= None*

### *class* ducpy.classes.ElementsClass.ElementBackground

#### content *: [ElementContentBase](#ducpy.classes.ElementsClass.ElementContentBase)*

### *class* ducpy.classes.ElementsClass.DucElementStylesBase

#### roundness *: float*

#### background *: List[[ElementBackground](#ducpy.classes.ElementsClass.ElementBackground)]*

#### stroke *: List[[ElementStroke](#ducpy.classes.ElementsClass.ElementStroke)]*

#### opacity *: float*

#### blending *: [ducpy.enums.BLENDING](../../enums/index.md#ducpy.enums.BLENDING) | None* *= None*

### *class* ducpy.classes.ElementsClass.BoundElement

#### id *: str*

#### type *: str*

### *class* ducpy.classes.ElementsClass.DucElementBase

#### id *: str*

#### styles *: [DucElementStylesBase](#ducpy.classes.ElementsClass.DucElementStylesBase)*

#### x *: float*

#### y *: float*

#### width *: float*

#### height *: float*

#### angle *: float*

#### scope *: str*

#### label *: str*

#### is_visible *: bool*

#### seed *: int*

#### version *: int*

#### version_nonce *: int*

#### updated *: int*

#### is_plot *: bool*

#### is_deleted *: bool*

#### group_ids *: List[str]*

#### block_ids *: List[str]*

#### region_ids *: List[str]*

#### z_index *: float*

#### locked *: bool*

#### description *: str | None* *= None*

#### index *: str | None* *= None*

#### instance_id *: str | None* *= None*

#### layer_id *: str | None* *= None*

#### frame_id *: str | None* *= None*

#### bound_elements *: List[[BoundElement](#ducpy.classes.ElementsClass.BoundElement)] | None* *= None*

#### link *: str | None* *= None*

#### custom_data *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucHead

#### size *: float*

#### type *: [ducpy.enums.LINE_HEAD](../../enums/index.md#ducpy.enums.LINE_HEAD) | None* *= None*

#### block_id *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.PointBindingPoint

#### index *: int*

#### offset *: float*

### *class* ducpy.classes.ElementsClass.DucPointBinding

#### element_id *: str*

#### focus *: float*

#### gap *: float*

#### fixed_point *: [GeometricPoint](#ducpy.classes.ElementsClass.GeometricPoint) | None* *= None*

#### point *: [PointBindingPoint](#ducpy.classes.ElementsClass.PointBindingPoint) | None* *= None*

#### head *: [DucHead](#ducpy.classes.ElementsClass.DucHead) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucLineReference

#### index *: int*

#### handle *: [GeometricPoint](#ducpy.classes.ElementsClass.GeometricPoint) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucLine

#### start *: [DucLineReference](#ducpy.classes.ElementsClass.DucLineReference)*

#### end *: [DucLineReference](#ducpy.classes.ElementsClass.DucLineReference)*

### *class* ducpy.classes.ElementsClass.DucPath

#### line_indices *: List[int]*

#### background *: [ElementBackground](#ducpy.classes.ElementsClass.ElementBackground) | None* *= None*

#### stroke *: [ElementStroke](#ducpy.classes.ElementsClass.ElementStroke) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucLinearElementBase

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### points *: List[[DucPoint](#ducpy.classes.ElementsClass.DucPoint)]*

#### lines *: List[[DucLine](#ducpy.classes.ElementsClass.DucLine)]*

#### path_overrides *: List[[DucPath](#ducpy.classes.ElementsClass.DucPath)]*

#### last_committed_point *: [DucPoint](#ducpy.classes.ElementsClass.DucPoint) | None* *= None*

#### start_binding *: [DucPointBinding](#ducpy.classes.ElementsClass.DucPointBinding) | None* *= None*

#### end_binding *: [DucPointBinding](#ducpy.classes.ElementsClass.DucPointBinding) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucStackLikeStyles

#### opacity *: float*

### *class* ducpy.classes.ElementsClass.DucStackBase

#### label *: str*

#### is_collapsed *: bool*

#### is_plot *: bool*

#### is_visible *: bool*

#### locked *: bool*

#### styles *: [DucStackLikeStyles](#ducpy.classes.ElementsClass.DucStackLikeStyles)*

#### description *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucStackElementBase

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### stack_base *: [DucStackBase](#ducpy.classes.ElementsClass.DucStackBase)*

#### clip *: bool*

#### label_visible *: bool*

### *class* ducpy.classes.ElementsClass.LineSpacing

#### value *: float*

#### type *: [ducpy.enums.LINE_SPACING_TYPE](../../enums/index.md#ducpy.enums.LINE_SPACING_TYPE) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucTextStyle

#### is_ltr *: bool*

#### font_family *: str*

#### big_font_family *: str*

#### text_align *: [ducpy.enums.TEXT_ALIGN](../../enums/index.md#ducpy.enums.TEXT_ALIGN)*

#### vertical_align *: [ducpy.enums.VERTICAL_ALIGN](../../enums/index.md#ducpy.enums.VERTICAL_ALIGN)*

#### line_height *: float*

#### line_spacing *: [LineSpacing](#ducpy.classes.ElementsClass.LineSpacing)*

#### oblique_angle *: float*

#### font_size *: float*

#### width_factor *: float*

#### is_upside_down *: bool*

#### is_backwards *: bool*

### *class* ducpy.classes.ElementsClass.DucTableStyle

### *class* ducpy.classes.ElementsClass.DucDocStyle

### *class* ducpy.classes.ElementsClass.DucPlotStyle

### *class* ducpy.classes.ElementsClass.DucRectangleElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

### *class* ducpy.classes.ElementsClass.DucPolygonElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### sides *: int*

### *class* ducpy.classes.ElementsClass.DucEllipseElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### ratio *: float*

#### start_angle *: float*

#### end_angle *: float*

#### show_aux_crosshair *: bool*

### *class* ducpy.classes.ElementsClass.DucEmbeddableElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

### *class* ducpy.classes.ElementsClass.DocumentGridConfig

#### columns *: int*

#### gap_x *: float*

#### gap_y *: float*

#### first_page_alone *: bool*

#### scale *: float*

### *class* ducpy.classes.ElementsClass.DucPdfElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### grid_config *: [DocumentGridConfig](#ducpy.classes.ElementsClass.DocumentGridConfig)*

#### file_id *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucDocElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### style *: [DucDocStyle](#ducpy.classes.ElementsClass.DucDocStyle)*

#### text *: str*

#### grid_config *: [DocumentGridConfig](#ducpy.classes.ElementsClass.DocumentGridConfig)*

#### file_id *: str | None* *= None*

#### referenced_file_ids *: List[str] | None* *= None*

### *class* ducpy.classes.ElementsClass.DucTableElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### style *: [DucTableStyle](#ducpy.classes.ElementsClass.DucTableStyle)*

#### grid_config *: [DocumentGridConfig](#ducpy.classes.ElementsClass.DocumentGridConfig)*

#### file_id *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.ImageCrop

#### x *: float*

#### y *: float*

#### width *: float*

#### height *: float*

#### natural_width *: float*

#### natural_height *: float*

### *class* ducpy.classes.ElementsClass.DucImageElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### status *: [ducpy.enums.IMAGE_STATUS](../../enums/index.md#ducpy.enums.IMAGE_STATUS)*

#### scale *: List[float]*

#### file_id *: str | None* *= None*

#### crop *: [ImageCrop](#ducpy.classes.ElementsClass.ImageCrop) | None* *= None*

#### filter *: [DucImageFilter](#ducpy.classes.ElementsClass.DucImageFilter) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucTextElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### style *: [DucTextStyle](#ducpy.classes.ElementsClass.DucTextStyle)*

#### text *: str*

#### auto_resize *: bool*

#### original_text *: str*

#### container_id *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucLinearElement

#### linear_base *: [DucLinearElementBase](#ducpy.classes.ElementsClass.DucLinearElementBase)*

#### wipeout_below *: bool*

### *class* ducpy.classes.ElementsClass.DucArrowElement

#### linear_base *: [DucLinearElementBase](#ducpy.classes.ElementsClass.DucLinearElementBase)*

#### elbowed *: bool*

### *class* ducpy.classes.ElementsClass.DucFreeDrawEnds

#### cap *: bool*

#### taper *: float*

#### easing *: str*

### *class* ducpy.classes.ElementsClass.DucFreeDrawElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### points *: List[[DucPoint](#ducpy.classes.ElementsClass.DucPoint)]*

#### size *: float*

#### thinning *: float*

#### smoothing *: float*

#### streamline *: float*

#### easing *: str*

#### pressures *: List[float]*

#### simulate_pressure *: bool*

#### start *: [DucFreeDrawEnds](#ducpy.classes.ElementsClass.DucFreeDrawEnds) | None* *= None*

#### end *: [DucFreeDrawEnds](#ducpy.classes.ElementsClass.DucFreeDrawEnds) | None* *= None*

#### last_committed_point *: [DucPoint](#ducpy.classes.ElementsClass.DucPoint) | None* *= None*

#### svg_path *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucFrameElement

#### stack_element_base *: [DucStackElementBase](#ducpy.classes.ElementsClass.DucStackElementBase)*

### *class* ducpy.classes.ElementsClass.PlotLayout

#### margins *: [Margins](#ducpy.classes.ElementsClass.Margins)*

### *class* ducpy.classes.ElementsClass.DucPlotElement

#### stack_element_base *: [DucStackElementBase](#ducpy.classes.ElementsClass.DucStackElementBase)*

#### style *: [DucPlotStyle](#ducpy.classes.ElementsClass.DucPlotStyle)*

#### layout *: [PlotLayout](#ducpy.classes.ElementsClass.PlotLayout)*

### *class* ducpy.classes.ElementsClass.DucModelElement

#### base *: [DucElementBase](#ducpy.classes.ElementsClass.DucElementBase)*

#### file_ids *: List[str]*

#### model_type *: str | None* *= None*

#### code *: str | None* *= None*

#### thumbnail *: bytes | None* *= None*

#### viewer_state *: [Viewer3DState](#ducpy.classes.ElementsClass.Viewer3DState) | None* *= None*

#### \_\_post_init_\_()

### *class* ducpy.classes.ElementsClass.DucBlockDuplicationArray

#### rows *: int*

#### cols *: int*

#### row_spacing *: float*

#### col_spacing *: float*

### *class* ducpy.classes.ElementsClass.DucBlockMetadata

#### usage_count *: int*

#### created_at *: int*

#### updated_at *: int*

#### source *: str | None* *= None*

#### localization *: str | None* *= None*

### *class* ducpy.classes.ElementsClass.DucBlock

#### id *: str*

#### label *: str*

#### version *: int*

#### description *: str | None* *= None*

#### metadata *: [DucBlockMetadata](#ducpy.classes.ElementsClass.DucBlockMetadata) | None* *= None*

#### thumbnail *: bytes | None* *= None*

### *class* ducpy.classes.ElementsClass.DucBlockInstance

#### id *: str*

#### block_id *: str*

#### version *: int*

#### element_overrides *: List[[StringValueEntry](#ducpy.classes.ElementsClass.StringValueEntry)] | None* *= None*

#### duplication_array *: [DucBlockDuplicationArray](#ducpy.classes.ElementsClass.DucBlockDuplicationArray) | None* *= None*

### *class* ducpy.classes.ElementsClass.DucBlockCollectionEntry

#### id *: str*

#### is_collection *: bool*

### *class* ducpy.classes.ElementsClass.DucBlockCollection

#### id *: str*

#### label *: str*

#### children *: List[[DucBlockCollectionEntry](#ducpy.classes.ElementsClass.DucBlockCollectionEntry)]*

#### metadata *: [DucBlockMetadata](#ducpy.classes.ElementsClass.DucBlockMetadata) | None* *= None*

#### thumbnail *: bytes | None* *= None*

### *class* ducpy.classes.ElementsClass.DucGroup

#### id *: str*

#### stack_base *: [DucStackBase](#ducpy.classes.ElementsClass.DucStackBase)*

### *class* ducpy.classes.ElementsClass.DucRegion

#### id *: str*

#### stack_base *: [DucStackBase](#ducpy.classes.ElementsClass.DucStackBase)*

#### boolean_operation *: [ducpy.enums.BOOLEAN_OPERATION](../../enums/index.md#ducpy.enums.BOOLEAN_OPERATION)*

### *class* ducpy.classes.ElementsClass.DucLayerOverrides

#### stroke *: [ElementStroke](#ducpy.classes.ElementsClass.ElementStroke)*

#### background *: [ElementBackground](#ducpy.classes.ElementsClass.ElementBackground)*

### *class* ducpy.classes.ElementsClass.DucLayer

#### id *: str*

#### stack_base *: [DucStackBase](#ducpy.classes.ElementsClass.DucStackBase)*

#### readonly *: bool*

#### overrides *: [DucLayerOverrides](#ducpy.classes.ElementsClass.DucLayerOverrides) | None* *= None*

### ducpy.classes.ElementsClass.DucElement

### *class* ducpy.classes.ElementsClass.ElementWrapper

#### element *: DucElement*
