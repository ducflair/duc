# DUCXF

A Python library for converting between DUC (Ducflair) and DXF (AutoCAD) CAD formats.

## Features

- Convert DUC files to DXF files
- Convert DXF files to DUC files
- Support for various DXF versions
- Support for most common CAD elements:
  - Lines
  - Polylines
  - Rectangles
  - Ellipses/Circles
  - Text
  - Images
  - And more

## Installation

```bash
pip install ducxf
```

### Requirements

- Python 3.7+
- ducpy (automatically installed as a dependency)
- ezdxf (automatically installed as a dependency)

## Usage

### Command Line Interface

DUCXF provides a command-line tool for easy conversion between formats:

**Convert DUC to DXF:**

```bash
ducxf duc2dxf drawing.duc
```

With options:

```bash
ducxf duc2dxf drawing.duc -o output.dxf -v R2010
```

**Convert DXF to DUC:**

```bash
ducxf dxf2duc drawing.dxf
```

With options:

```bash
ducxf dxf2duc drawing.dxf -o output.duc
```

### Using as a Library

You can also use DUCXF as a library in your Python code:

```python
from ducxf import duc_to_dxf, dxf_to_duc

# Convert DUC to DXF
duc_to_dxf.convert_duc_to_dxf(
    duc_path="drawing.duc",
    dxf_path="output.dxf",
    dxf_version="R2018"
)

# Convert DXF to DUC
dxf_to_duc.convert_dxf_to_duc(
    dxf_path="drawing.dxf",
    duc_path="output.duc"
)
```

## Supported Elements

### DUC Elements

The library supports converting the following DUC element types:

- rectangle
- ellipse
- diamond
- triangle
- line
- arrow
- draw (freehand drawing)
- text
- image

### DXF Entities

The library supports converting the following DXF entity types:

- LINE
- LWPOLYLINE
- POLYLINE
- CIRCLE
- ELLIPSE
- TEXT
- MTEXT
- IMAGE
- HATCH

## Limitations

- 3D elements are not fully supported
- Some complex DXF features may not have direct equivalents in DUC
- Image conversion requires the image files to be accessible

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- [ducpy](https://python.duc.ducflair.com/) - Python library for working with DUC files
- [ezdxf](https://ezdxf.readthedocs.io/) - Python library for working with DXF files


