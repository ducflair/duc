# ducpy.enums

Native enum definitions for DUC types.
Source of truth: types.rs / duc.sql

## Classes

| [`VERTICAL_ALIGN`](#ducpy.enums.VERTICAL_ALIGN)                         | Enum where members are also (and must be) ints   |
|-------------------------------------------------------------------------|--------------------------------------------------|
| [`TEXT_ALIGN`](#ducpy.enums.TEXT_ALIGN)                                 | Enum where members are also (and must be) ints   |
| [`LINE_SPACING_TYPE`](#ducpy.enums.LINE_SPACING_TYPE)                   | Enum where members are also (and must be) ints   |
| [`STROKE_PLACEMENT`](#ducpy.enums.STROKE_PLACEMENT)                     | Enum where members are also (and must be) ints   |
| [`STROKE_PREFERENCE`](#ducpy.enums.STROKE_PREFERENCE)                   | Enum where members are also (and must be) ints   |
| [`STROKE_SIDE_PREFERENCE`](#ducpy.enums.STROKE_SIDE_PREFERENCE)         | Enum where members are also (and must be) ints   |
| [`STROKE_CAP`](#ducpy.enums.STROKE_CAP)                                 | Enum where members are also (and must be) ints   |
| [`STROKE_JOIN`](#ducpy.enums.STROKE_JOIN)                               | Enum where members are also (and must be) ints   |
| [`LINE_HEAD`](#ducpy.enums.LINE_HEAD)                                   | Enum where members are also (and must be) ints   |
| [`BEZIER_MIRRORING`](#ducpy.enums.BEZIER_MIRRORING)                     | Enum where members are also (and must be) ints   |
| [`BLENDING`](#ducpy.enums.BLENDING)                                     | Enum where members are also (and must be) ints   |
| [`ELEMENT_CONTENT_PREFERENCE`](#ducpy.enums.ELEMENT_CONTENT_PREFERENCE) | Enum where members are also (and must be) ints   |
| [`HATCH_STYLE`](#ducpy.enums.HATCH_STYLE)                               | Enum where members are also (and must be) ints   |
| [`IMAGE_STATUS`](#ducpy.enums.IMAGE_STATUS)                             | Enum where members are also (and must be) ints   |
| [`BOOLEAN_OPERATION`](#ducpy.enums.BOOLEAN_OPERATION)                   | Enum where members are also (and must be) ints   |

## Module Contents

### *class* ducpy.enums.VERTICAL_ALIGN

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### TOP *= 10*

#### MIDDLE *= 11*

#### BOTTOM *= 12*

### *class* ducpy.enums.TEXT_ALIGN

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### LEFT *= 10*

#### CENTER *= 11*

#### RIGHT *= 12*

### *class* ducpy.enums.LINE_SPACING_TYPE

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### AT_LEAST *= 10*

#### EXACTLY *= 11*

#### MULTIPLE *= 12*

### *class* ducpy.enums.STROKE_PLACEMENT

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### INSIDE *= 10*

#### CENTER *= 11*

#### OUTSIDE *= 12*

### *class* ducpy.enums.STROKE_PREFERENCE

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### SOLID *= 10*

#### DASHED *= 11*

#### DOTTED *= 12*

#### CUSTOM *= 13*

### *class* ducpy.enums.STROKE_SIDE_PREFERENCE

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### TOP *= 10*

#### BOTTOM *= 11*

#### LEFT *= 12*

#### RIGHT *= 13*

#### CUSTOM *= 14*

#### ALL *= 15*

### *class* ducpy.enums.STROKE_CAP

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### BUTT *= 10*

#### ROUND *= 11*

#### SQUARE *= 12*

### *class* ducpy.enums.STROKE_JOIN

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### MITER *= 10*

#### ROUND *= 11*

#### BEVEL *= 12*

### *class* ducpy.enums.LINE_HEAD

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### ARROW *= 10*

#### BAR *= 11*

#### CIRCLE *= 12*

#### CIRCLE_OUTLINED *= 13*

#### TRIANGLE *= 14*

#### TRIANGLE_OUTLINED *= 15*

#### DIAMOND *= 16*

#### DIAMOND_OUTLINED *= 17*

#### CROSS *= 18*

#### OPEN_ARROW *= 19*

#### REVERSED_ARROW *= 20*

#### REVERSED_TRIANGLE *= 21*

#### REVERSED_TRIANGLE_OUTLINED *= 22*

#### CONE *= 23*

#### HALF_CONE *= 24*

### *class* ducpy.enums.BEZIER_MIRRORING

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### NONE *= 10*

#### ANGLE *= 11*

#### ANGLE_LENGTH *= 12*

### *class* ducpy.enums.BLENDING

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### MULTIPLY *= 11*

#### SCREEN *= 12*

#### OVERLAY *= 13*

#### DARKEN *= 14*

#### LIGHTEN *= 15*

#### DIFFERENCE *= 16*

#### EXCLUSION *= 17*

### *class* ducpy.enums.ELEMENT_CONTENT_PREFERENCE

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### SOLID *= 12*

#### FILL *= 14*

#### FIT *= 15*

#### TILE *= 16*

#### STRETCH *= 17*

#### HATCH *= 18*

### *class* ducpy.enums.HATCH_STYLE

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### NORMAL *= 10*

#### OUTER *= 11*

#### IGNORE *= 12*

### *class* ducpy.enums.IMAGE_STATUS

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### PENDING *= 10*

#### SAVED *= 11*

#### ERROR *= 12*

### *class* ducpy.enums.BOOLEAN_OPERATION

Bases: `enum.IntEnum`

Enum where members are also (and must be) ints

Initialize self.  See help(type(self)) for accurate signature.

#### UNION *= 10*

#### SUBTRACT *= 11*

#### INTERSECT *= 12*

#### EXCLUDE *= 13*
