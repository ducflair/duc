# ducpy.builders.style_builders

Helper functions for creating element styles with a user-friendly API.
Each ELEMENT_CONTENT_PREFERENCE has its own dedicated method.

## Functions

| [`_create_default_tiling_properties`](#ducpy.builders.style_builders._create_default_tiling_properties)(...)     | Create default tiling settings used by content builders.             |
|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| [`_create_default_hatch_style`](#ducpy.builders.style_builders._create_default_hatch_style)(...)                 | Create a neutral/default hatch style.                                |
| [`_create_default_image_filter`](#ducpy.builders.style_builders._create_default_image_filter)(...)               | Create a neutral image filter (no brightness/contrast changes).      |
| [`create_solid_content`](#ducpy.builders.style_builders.create_solid_content)(...)                               | Create solid color content.                                          |
| [`create_fill_content`](#ducpy.builders.style_builders.create_fill_content)(...)                                 | Create generic fill content.                                         |
| [`create_image_content`](#ducpy.builders.style_builders.create_image_content)(...)                               | Create image content.                                                |
| [`create_hatch_content`](#ducpy.builders.style_builders.create_hatch_content)(...)                               | Create hatch pattern content.                                        |
| [`create_background`](#ducpy.builders.style_builders.create_background)(...)                                     | Create a background wrapper from content.                            |
| [`create_stroke`](#ducpy.builders.style_builders.create_stroke)(→ ducpy.classes.ElementsClass.ElementStroke)     | Create a stroke wrapper from content and stroke settings.            |
| [`create_simple_styles`](#ducpy.builders.style_builders.create_simple_styles)(...)                               | Create base element styles from backgrounds and strokes.             |
| [`create_fill_style`](#ducpy.builders.style_builders.create_fill_style)(...)                                     | Create styles configured with fill only.                             |
| [`create_stroke_style`](#ducpy.builders.style_builders.create_stroke_style)(...)                                 | Create styles configured with stroke only.                           |
| [`create_fill_and_stroke_style`](#ducpy.builders.style_builders.create_fill_and_stroke_style)(...)               | Create styles configured with both fill and stroke.                  |
| [`create_solid_style`](#ducpy.builders.style_builders.create_solid_style)(color[, opacity])                      | Convenience helper that returns solid content for style composition. |
| [`create_hatch_style`](#ducpy.builders.style_builders.create_hatch_style)(pattern[, opacity])                    | Convenience helper that returns hatch content for style composition. |
| [`create_text_style`](#ducpy.builders.style_builders.create_text_style)(...)                                     | Create a text style instance.                                        |
| [`create_doc_style`](#ducpy.builders.style_builders.create_doc_style)(→ ducpy.classes.ElementsClass.DucDocStyle) | DucDocStyle is empty in the current schema.                          |
| [`create_table_style`](#ducpy.builders.style_builders.create_table_style)(...)                                   | DucTableStyle is empty in the current schema.                        |
| [`create_margins`](#ducpy.builders.style_builders.create_margins)(→ ducpy.classes.ElementsClass.Margins)         | Create margin values in top/right/bottom/left order.                 |

## Module Contents

### ducpy.builders.style_builders.\_create_default_tiling_properties() → [ducpy.classes.ElementsClass.TilingProperties](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.TilingProperties)

Create default tiling settings used by content builders.

### ducpy.builders.style_builders.\_create_default_hatch_style() → [ducpy.classes.ElementsClass.DucHatchStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucHatchStyle)

Create a neutral/default hatch style.

### ducpy.builders.style_builders.\_create_default_image_filter() → [ducpy.classes.ElementsClass.DucImageFilter](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucImageFilter)

Create a neutral image filter (no brightness/contrast changes).

### ducpy.builders.style_builders.create_solid_content(color: str, opacity: float = 1.0, visible: bool = True) → [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase)

Create solid color content.

Args:
: color: Hex color string (for example, “#FF0000”).
  opacity: Content opacity from 0.0 to 1.0.
  visible: Whether content should be visible.

### ducpy.builders.style_builders.create_fill_content(color: str, opacity: float = 1.0, visible: bool = True) → [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase)

Create generic fill content.

Args:
: color: Color or fill source string.
  opacity: Content opacity from 0.0 to 1.0.
  visible: Whether content should be visible.

### ducpy.builders.style_builders.create_image_content(image_src: str, opacity: float = 1.0, visible: bool = True, fit_mode: str | None = None) → [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase)

Create image content.

Args:
: image_src: Image source (file id, URL, or supported element reference).
  opacity: Content opacity from 0.0 to 1.0.
  visible: Whether content should be visible.
  fit_mode: Reserved for fit mode behavior.

### ducpy.builders.style_builders.create_hatch_content(pattern: str, opacity: float = 1.0, visible: bool = True) → [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase)

Create hatch pattern content.

Args:
: pattern: Hatch pattern source/identifier.
  opacity: Content opacity from 0.0 to 1.0.
  visible: Whether content should be visible.

### ducpy.builders.style_builders.create_background(content: [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase) | None = None) → [ducpy.classes.ElementsClass.ElementBackground](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementBackground)

Create a background wrapper from content.

If no content is provided, a solid white background is used.

### ducpy.builders.style_builders.create_stroke(content: [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase) | None = None, width: float = 1.0, placement: [ducpy.enums.STROKE_PLACEMENT](../../enums/index.md#ducpy.enums.STROKE_PLACEMENT) = STROKE_PLACEMENT.INSIDE, style: [ducpy.classes.ElementsClass.StrokeStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.StrokeStyle) | None = None, sides: [ducpy.classes.ElementsClass.StrokeSides](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.StrokeSides) | None = None) → [ducpy.classes.ElementsClass.ElementStroke](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementStroke)

Create a stroke wrapper from content and stroke settings.

If content is omitted, a solid black stroke is used.

### ducpy.builders.style_builders.create_simple_styles(roundness: float = 0.0, opacity: float = 1.0, backgrounds: List[[ducpy.classes.ElementsClass.ElementBackground](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementBackground)] | None = None, strokes: List[[ducpy.classes.ElementsClass.ElementStroke](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementStroke)] | None = None, blending: [ducpy.enums.BLENDING](../../enums/index.md#ducpy.enums.BLENDING) | None = None) → [ducpy.classes.ElementsClass.DucElementStylesBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucElementStylesBase)

Create base element styles from backgrounds and strokes.

Falls back to one default background and one default stroke when omitted.

### ducpy.builders.style_builders.create_fill_style(content, roundness: float = 0.0, opacity: float = 1.0) → [ducpy.classes.ElementsClass.DucElementStylesBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucElementStylesBase)

Create styles configured with fill only.

### ducpy.builders.style_builders.create_stroke_style(content, width: float = 1.0, placement: [ducpy.enums.STROKE_PLACEMENT](../../enums/index.md#ducpy.enums.STROKE_PLACEMENT) = STROKE_PLACEMENT.INSIDE, opacity: float = 1.0) → [ducpy.classes.ElementsClass.DucElementStylesBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucElementStylesBase)

Create styles configured with stroke only.

### ducpy.builders.style_builders.create_fill_and_stroke_style(fill_content: [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase), stroke_content: [ducpy.classes.ElementsClass.ElementContentBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementContentBase), stroke_width: float = 1.0, roundness: float = 0.0, opacity: float = 1.0, placement: [ducpy.enums.STROKE_PLACEMENT](../../enums/index.md#ducpy.enums.STROKE_PLACEMENT) = STROKE_PLACEMENT.INSIDE) → [ducpy.classes.ElementsClass.DucElementStylesBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucElementStylesBase)

Create styles configured with both fill and stroke.

### ducpy.builders.style_builders.create_solid_style(color: str, opacity: float = 1.0)

Convenience helper that returns solid content for style composition.

### ducpy.builders.style_builders.create_hatch_style(pattern: str, opacity: float = 1.0)

Convenience helper that returns hatch content for style composition.

### ducpy.builders.style_builders.create_text_style(font_family: str = 'Arial', font_size: float = 12, is_ltr: bool = True, text_align: [ducpy.enums.TEXT_ALIGN](../../enums/index.md#ducpy.enums.TEXT_ALIGN) | None = None, vertical_align: [ducpy.enums.VERTICAL_ALIGN](../../enums/index.md#ducpy.enums.VERTICAL_ALIGN) | None = None, line_height: float = 1.0, line_spacing_value: float = 1.0, line_spacing_type: [ducpy.enums.LINE_SPACING_TYPE](../../enums/index.md#ducpy.enums.LINE_SPACING_TYPE) | None = None, oblique_angle: float = 0.0, width_factor: float = 1.0, is_upside_down: bool = False, is_backwards: bool = False) → [ducpy.classes.ElementsClass.DucTextStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucTextStyle)

Create a text style instance.

This helper provides safe defaults for alignment and line spacing.

### ducpy.builders.style_builders.create_doc_style() → [ducpy.classes.ElementsClass.DucDocStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucDocStyle)

DucDocStyle is empty in the current schema.

### ducpy.builders.style_builders.create_table_style() → [ducpy.classes.ElementsClass.DucTableStyle](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucTableStyle)

DucTableStyle is empty in the current schema.

### ducpy.builders.style_builders.create_margins(top: float = 0.0, right: float = 0.0, bottom: float = 0.0, left: float = 0.0) → [ducpy.classes.ElementsClass.Margins](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.Margins)

Create margin values in top/right/bottom/left order.
