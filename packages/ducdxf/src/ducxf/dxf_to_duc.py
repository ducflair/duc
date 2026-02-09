"""
This script provides a comprehensive conversion from DXF to DUC file format.

It aims for a high-fidelity conversion by processing the DXF structure in a
specific order: Header, Tables (Layers, Styles), Blocks, and finally Entities.
This ensures that all definitions and styles are available before the entities
that use them are processed.

The script uses 'ezdxf' for robust DXF parsing and 'ducpy' for building the
DUC file structure, referencing the patterns seen in the
'test_a_duc_with_everything.py' example for DUC object creation.
"""
import argparse
import os
import math
import ezdxf
from ezdxf.entities import Attrib, Insert
from ezdxf.enums import MTextLineAlignment
from ezdxf.math import OCS
import ducpy as duc
import ezdxf.enums

from ducpy.Duc.STROKE_PLACEMENT import STROKE_PLACEMENT
from ducpy.Duc.STROKE_PREFERENCE import STROKE_PREFERENCE
from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT
from ducpy.Duc.DECIMAL_SEPARATOR import DECIMAL_SEPARATOR
from ducpy.Duc.STROKE_CAP import STROKE_CAP
from ducpy.Duc.STROKE_JOIN import STROKE_JOIN
from ducpy.Duc.STROKE_SIDE_PREFERENCE import STROKE_SIDE_PREFERENCE
from ducpy.Duc.UNIT_SYSTEM import UNIT_SYSTEM
from .common import LinetypeConverter

# A comprehensive mapping of AutoCAD Color Index (ACI) to HEX values.
ACI_TO_HEX = {
    0: "#000000", 1: "#FF0000", 2: "#FFFF00", 3: "#00FF00", 4: "#00FFFF",
    5: "#0000FF", 6: "#FF00FF", 7: "#FFFFFF", 8: "#4D4D4D", 9: "#999999",
    # ... A more extensive list can be added for full coverage.
}

DXF_INSERT_UNITS = ezdxf.enums.InsertUnits
INSUNITS_TO_DUC_UNITS = {
    DXF_INSERT_UNITS.Unitless: "mm", DXF_INSERT_UNITS.Inches: "in", DXF_INSERT_UNITS.Feet: "ft", 
    DXF_INSERT_UNITS.Miles: "mi", DXF_INSERT_UNITS.Millimeters: "mm", DXF_INSERT_UNITS.Centimeters: "cm", DXF_INSERT_UNITS.Meters: "m", DXF_INSERT_UNITS.Kilometers: "km",DXF_INSERT_UNITS.Microinches: "µin", 
    DXF_INSERT_UNITS.Mils: "mil", DXF_INSERT_UNITS.Yards: "yd", DXF_INSERT_UNITS.Angstroms: "Å", 
    DXF_INSERT_UNITS.Nanometers: "nm",DXF_INSERT_UNITS.Microns: "µm", DXF_INSERT_UNITS.Decimeters: "dm", 
    DXF_INSERT_UNITS.Decameters: "dam", DXF_INSERT_UNITS.Hectometers: "hm", DXF_INSERT_UNITS.Gigameters: "Gm", DXF_INSERT_UNITS.AstronomicalUnits: "au", DXF_INSERT_UNITS.Lightyears: "ly", DXF_INSERT_UNITS.Parsecs: "pc", DXF_INSERT_UNITS.USSurveyFeet: "ft-us", DXF_INSERT_UNITS.USSurveyInch: "in-us", DXF_INSERT_UNITS.USSurveyYard: "yd-us", DXF_INSERT_UNITS.USSurveyMile: "mi-us",
}

DXF_LENGTH_UNITS = ezdxf.enums.LengthUnits
LUNITS_TO_DUC = {
  DXF_LENGTH_UNITS.Scientific: DIMENSION_UNITS_FORMAT.SCIENTIFIC,
  DXF_LENGTH_UNITS.Decimal: DIMENSION_UNITS_FORMAT.DECIMAL,
  DXF_LENGTH_UNITS.Engineering: DIMENSION_UNITS_FORMAT.ENGINEERING,
  DXF_LENGTH_UNITS.Architectural: DIMENSION_UNITS_FORMAT.ARCHITECTURAL,
  DXF_LENGTH_UNITS.Fractional: DIMENSION_UNITS_FORMAT.FRACTIONAL,
}

DXF_ANGULAR_UNITS = ezdxf.enums.AngularUnits
AUNITS_TO_DUC = {
  DXF_ANGULAR_UNITS.DecimalDegrees: ANGULAR_UNITS_FORMAT.DECIMAL_DEGREES,
  DXF_ANGULAR_UNITS.DegreesMinutesSeconds: ANGULAR_UNITS_FORMAT.DEGREES_MINUTES_SECONDS,
  DXF_ANGULAR_UNITS.Grad: ANGULAR_UNITS_FORMAT.GRADS,
  DXF_ANGULAR_UNITS.Radians: ANGULAR_UNITS_FORMAT.RADIANS,
}

def get_hex_from_aci(aci):
    """Converts an ACI color index to a HEX string with a fallback."""
    return ACI_TO_HEX.get(aci, "#FFFFFF") # Default to white

def convert_header(header, doc):
    """
    Convert DXF header variables to DUC global and local states.
    
    Returns:
        tuple: (duc_global_state, duc_local_state, conversion_context)
               conversion_context contains:
                 - current_layer: name of the current layer
                 - current_dimstyle: name of the current dimension style
                 - current_mleaderstyle: name of the current multileader style
                 - celtscale: current entity linetype scale
                 - standard_units: StandardUnits for use in Standards creation
                 - current_textstyle_name: name of the current text style
                 - font_family: extracted font family from text style
                 - font_size: extracted font size from text style
    """
    
    # Extract units and view information from the header
    units = header.get("$INSUNITS", 0)  # Default to unitless
    linear_units_dxf = header.get("$LUNITS", 1) # Default to scientific
    angular_units_dxf = header.get("$AUNITS", 0) # Default to decimal degrees
    measurement = header.get("$MEASUREMENT", 0)  # 0=English/Imperial, 1=Metric
    
    # Get the Standard dimension style for precision and suppression settings
    dimstyle = None
    try:
        dimstyle = doc.dimstyles.get('Standard')
    except:
        # Standard dimstyle might not exist, will use defaults
        pass
    
    if dimstyle:
        # Precision is stored in dimension style DIMTDEC (linear unit decimal places)
        precision = dimstyle.dxf.get('dimtdec', 2)  # Default to 2 decimal places
        
        # DIMTZIN is a bitfield controlling suppressions
        # Bit 0: suppress trailing zeros
        # Bit 1: suppress trailing inches
        # Bit 2: suppress leading zeros
        # Bit 3: suppress feet designation
        # Bit 4: suppress inches designation
        dimtzin = dimstyle.dxf.get('dimtzin', 0)
        suppress_trailing_zeros = bool(dimtzin & (1 << 0))
        suppress_leading_zeros = bool(dimtzin & (1 << 2))
        suppress_zero_feet = bool(dimtzin & (1 << 3))
        suppress_zero_inches = bool(dimtzin & (1 << 4))
        
        # Decimal separator from DIMDSEP (integer code: 46 = '.', 44 = ',')
        dimdsep_code = dimstyle.dxf.get('dimdsep', 46)
        decimal_sep = DECIMAL_SEPARATOR.COMMA if dimdsep_code == 44 else DECIMAL_SEPARATOR.DOT
    else:
        # Fallback defaults
        precision = 2
        suppress_trailing_zeros = False
        suppress_leading_zeros = False
        suppress_zero_feet = False
        suppress_zero_inches = False
        decimal_sep = DECIMAL_SEPARATOR.DOT
    
    # Determine unit system from $MEASUREMENT or $INSUNITS
    unit_system = UNIT_SYSTEM.METRIC if measurement == 1 else UNIT_SYSTEM.IMPERIAL

    # ============================================================================
    # UNIT SYSTEMS - Create linear and angular unit systems
    # ============================================================================
    
    linear_units = duc.create_linear_unit_system(
        precision=precision,
        suppress_leading_zeros=suppress_leading_zeros,
        suppress_trailing_zeros=suppress_trailing_zeros,
        system=unit_system,
        suppress_zero_feet=suppress_zero_feet,
        suppress_zero_inches=suppress_zero_inches,
        format=LUNITS_TO_DUC[linear_units_dxf],
        decimal_separator=decimal_sep,
    )
    
    # Angular precision (DIMALTTD in dimension style for angular decimal places)
    angular_precision = dimstyle.dxf.get('dimalttd', 2) if dimstyle else 2
    
    angular_units = duc.create_angular_unit_system(
        precision=angular_precision,
        suppress_leading_zeros=suppress_leading_zeros,
        suppress_trailing_zeros=suppress_trailing_zeros,
        system=unit_system,
        format=AUNITS_TO_DUC[angular_units_dxf],
    )

    primary_units = duc.create_primary_units(linear=linear_units, angular=angular_units)
    standard_units = duc.create_standard_units(primary_units=primary_units, alternate_units=None)
    
    # ============================================================================
    # GLOBAL STATE - Drawing-wide settings
    # ============================================================================
    
    # $LTSCALE: Global linetype scale
    ltscale = header.get("$LTSCALE", 1.0)
    
    # $CANNOSCALE: Current annotation scale (handle annotative scaling)
    # This is stored as a string like "1:1" or "1:2" 
    cannoscale = header.get("$CANNOSCALE", None)
    use_annotative = cannoscale is not None
    
    duc_global_state = (duc.StateBuilder().build_global_state()
        .with_main_scope(INSUNITS_TO_DUC_UNITS[units])
        .with_dash_spacing_scale(ltscale)
        .with_use_annotative_scaling(use_annotative)
        .build())
    
    # ============================================================================
    # LOCAL STATE - Session/user settings
    # ============================================================================
    
    # $FILLMODE: Fill mode (1=on, 0=off) - maps to outline_mode_enabled (inverse)
    fillmode = header.get("$FILLMODE", 1)
    outline_mode = not bool(fillmode)  # Inverse: fillmode=1 means fills are shown, outline_mode=False
    
    # $TEXTSTYLE: Current text style
    current_textstyle_name = header.get("$TEXTSTYLE", "Standard")
    # Get the actual text style from the document
    font_family = "Arial"  # Default fallback
    font_size = 2.5  # Default fallback
    if current_textstyle_name in doc.styles:
        textstyle = doc.styles.get(current_textstyle_name)
        # DXF text styles store font information
        if hasattr(textstyle.dxf, 'font'):
            font_family = textstyle.dxf.font
        if hasattr(textstyle.dxf, 'height') and textstyle.dxf.height > 0:
            font_size = textstyle.dxf.height
    
    # $CLAYER: Current layer name
    current_layer = header.get("$CLAYER", "0")
    
    # $DIMSTYLE: Current dimension style
    current_dimstyle = header.get("$DIMSTYLE", "Standard")
    
    # $MLEADERSTYLE: Current multileader style (DXF R2007+)
    current_mleaderstyle = header.get("$MLEADERSTYLE", "Standard")
    
    # $CELTSCALE: Current entity linetype scale
    # This affects individual entities, not stored in global/local state
    # but will be used when converting entities
    celtscale = header.get("$CELTSCALE", 1.0)
    
    duc_local_state = (duc.StateBuilder().build_local_state()
        .with_scope(INSUNITS_TO_DUC_UNITS[units])
        .with_outline_mode_enabled(outline_mode)
        .build())
    
    # Store conversion context for use when converting entities and styles
    conversion_context = {
        'current_layer': current_layer,
        'current_dimstyle': current_dimstyle,
        'current_mleaderstyle': current_mleaderstyle,
        'celtscale': celtscale,
        'standard_units': standard_units,
        'current_textstyle_name': current_textstyle_name,
        'font_family': font_family,
        'font_size': font_size,
    }
      
    return duc_global_state, duc_local_state, conversion_context


def linetype_to_dash_pattern(linetype_name):
    """
    Convert DXF linetype name to DUC stroke dash pattern.
    
    Args:
        linetype_name: Name of the DXF linetype
        
    Returns:
        list: Dash pattern as [dash, gap, dash, gap, ...] or empty list for solid
    """
    linetype_name = linetype_name.upper()
    
    # Common AutoCAD linetypes
    LINETYPE_PATTERNS = {
        'CONTINUOUS': [],
        'BYLAYER': [],
        'BYBLOCK': [],
        'DASHED': [5.0, 2.5],
        'DASHDOT': [5.0, 2.5, 0.5, 2.5],
        'DASHDOTX2': [10.0, 5.0, 1.0, 5.0],
        'DASHED2': [10.0, 5.0],
        'DASHEDX2': [10.0, 5.0],
        'DOT': [0.5, 2.5],
        'DOTX2': [1.0, 5.0],
        'HIDDEN': [2.5, 1.25],
        'HIDDENX2': [5.0, 2.5],
        'PHANTOM': [12.5, 2.5, 2.5, 2.5, 2.5, 2.5],
        'PHANTOMX2': [25.0, 5.0, 5.0, 5.0, 5.0, 5.0],
        'CENTER': [12.5, 2.5, 2.5, 2.5],
        'CENTERX2': [25.0, 5.0, 5.0, 5.0],
        'DIVIDE': [12.5, 2.5, 2.5, 2.5, 2.5, 2.5],
        'DIVIDEX2': [25.0, 5.0, 5.0, 5.0, 5.0, 5.0],
        'BORDER': [12.5, 2.5, 12.5, 2.5, 2.5, 2.5],
        'BORDERX2': [25.0, 5.0, 25.0, 5.0, 5.0, 5.0],
    }
    
    return LINETYPE_PATTERNS.get(linetype_name, [])  # Default to solid/continuous


def lineweight_to_width(lineweight):
    """
    Convert DXF lineweight to DUC stroke width in mm.
    
    Args:
        lineweight: DXF lineweight value (in 1/100 mm, or special values)
                   -1 = BYLAYER, -2 = BYBLOCK, -3 = DEFAULT
                   
    Returns:
        float: Stroke width in mm, or None for special values
    """
    if lineweight < 0:
        # Special values: -1 (BYLAYER), -2 (BYBLOCK), -3 (DEFAULT)
        return None
    
    # Convert from 1/100 mm to mm
    return lineweight / 100.0


def convert_layers(doc):
    """
    Convert DXF layer table to DUC layers.
    
    Args:
        doc: ezdxf document with layer table
        
    Returns:
        list: List of DucLayer objects
    """
    duc_layers = []
    
    for layer in doc.layers:
        # Get layer properties
        layer_name = layer.dxf.name
        
        # State flags
        is_on = layer.is_on()
        is_frozen = layer.is_frozen()
        is_locked = layer.is_locked()
        is_plot = not layer.dxf.get('plot', 1) == 0  # 0 = no plot, 1 = plot (default)
        is_visible = is_on and not is_frozen
        
        # Color: Try RGB first, fall back to ACI
        color_hex = "#FFFFFF"  # Default white
        if layer.rgb:
            r, g, b = layer.rgb
            color_hex = f"#{r:02X}{g:02X}{b:02X}"
        else:
            aci_color = layer.get_color()
            color_hex = get_hex_from_aci(aci_color)
        
        # Transparency: 0.0 = opaque, 1.0 = fully transparent
        transparency = layer.transparency if hasattr(layer, 'transparency') else 0.0
        opacity = 1.0 - transparency
        
        # Linetype and dash pattern
        linetype = layer.dxf.linetype if hasattr(layer.dxf, 'linetype') else 'CONTINUOUS'
        dash_pattern = linetype_to_dash_pattern(linetype)
        
        # Lineweight
        lineweight = layer.dxf.get('lineweight', -1)
        stroke_width = lineweight_to_width(lineweight)
        if stroke_width is None:
            stroke_width = 0.25  # Default to 0.25mm
        
        # Build DucLayer using ducpy builders
        duc_layer = (
            duc.StateBuilder()
            .with_id(layer_name)  # Use layer name as ID
            .build_layer()
            .with_label(layer_name)
            .with_is_visible(is_visible)
            .with_is_plot(is_plot)
            .with_locked(is_locked)
            .with_opacity(opacity)
            .with_stroke_color(color_hex)
            .with_background_color("#FFFFFF")  # Default background
            .build()
        )
        
        # Note: dash_pattern and stroke_width would need to be applied
        # during element creation, as layer overrides in DUC only store
        # basic stroke/background, not all stroke properties
        
        duc_layers.append(duc_layer)
    
    return duc_layers


def convert_linetypes(doc):
    """
    Convert DXF linetype table to DUC common styles with stroke patterns.
    
    Args:
        doc: ezdxf document with linetype table
        
    Returns:
        list: List of IdentifiedCommonStyle objects for use in StandardStyles
    """
    linetype_styles = []
    
    for linetype in doc.linetypes:
        linetype_name = linetype.dxf.name
        
        # Skip special linetypes that shouldn't be converted to styles
        if linetype_name.upper() in ['BYLAYER', 'BYBLOCK', 'CONTINUOUS']:
            continue
        
        # Get linetype properties
        description = linetype.dxf.get('description', '')
        
        # Get pattern data
        # In ezdxf, the pattern is accessed via pattern_tags
        pattern = []
        if hasattr(linetype, 'pattern_tags'):
            # Extract pattern from tags
            for tag in linetype.pattern_tags.tags:
                if tag[0] == 49:  # Dash/dot/gap length
                    pattern.append(tag[1])
                elif tag[0] == 74:  # Complex linetype flag
                    # This indicates a complex linetype with text/shapes
                    pass
        
        # If no pattern found, try to get it from the simple pattern attribute
        if not pattern and hasattr(linetype.dxf, 'pattern'):
            pattern = list(linetype.dxf.pattern) if linetype.dxf.pattern else []
        
        # Parse the pattern using our converter
        parsed = LinetypeConverter.parse_dxf_pattern(pattern)
        dash_pattern = parsed["dash_pattern"]
        is_complex = parsed["is_complex"]
        
        # Determine stroke preference based on pattern
        if not dash_pattern or len(dash_pattern) == 0:
            stroke_preference = STROKE_PREFERENCE.SOLID
        else:
            stroke_preference = getattr(STROKE_PREFERENCE, "DASHED", STROKE_PREFERENCE.SOLID)
        
        # Create stroke style with dash pattern
        stroke_style = duc.StrokeStyle(
            dash=dash_pattern,
            dash_line_override="",  # Could be used for complex linetypes in future
            preference=stroke_preference,
            cap=STROKE_CAP.BUTT,  # DXF typically uses butt caps
            join=STROKE_JOIN.MITER,
            dash_cap=STROKE_CAP.BUTT,
            miter_limit=4.0
        )
        
        # Create stroke sides (all sides by default)
        stroke_sides = duc.StrokeSides(
            values=[],
            preference=STROKE_SIDE_PREFERENCE.ALL
        )
        
        # Create solid black stroke content
        stroke_content = duc.create_solid_content("#000000", opacity=1.0, visible=True)
        
        # Create element stroke
        element_stroke = duc.ElementStroke(
            content=stroke_content,
            width=1.0,  # Default width, can be overridden per element
            style=stroke_style,
            stroke_sides=stroke_sides,
            placement=STROKE_PLACEMENT.CENTER
        )
        
        # Create transparent background
        background_content = duc.create_solid_content("#FFFFFF", opacity=0.0, visible=False)
        element_background = duc.ElementBackground(content=background_content)
        
        # Create common style
        common_style = duc.DucCommonStyle(
            background=element_background,
            stroke=element_stroke
        )
        
        # Create identifier for the style
        style_id = duc.create_identifier(
            id=f"linetype_{linetype_name.lower()}",
            name=linetype_name,
            description=description or LinetypeConverter.pattern_to_description(linetype_name, pattern)
        )
        
        # Create identified common style
        identified_style = duc.IdentifiedCommonStyle(
            id=style_id,
            style=common_style
        )
        
        linetype_styles.append(identified_style)
        
        # Log conversion info
        if is_complex:
            print(f"  ⚠ Linetype '{linetype_name}': Complex pattern simplified (text/shapes not fully supported)")
        else:
            print(f"  ✓ Linetype '{linetype_name}': Converted with {len(dash_pattern)} pattern elements")
    
    return linetype_styles


def convert_dxf_to_duc(dxf_path, duc_path):
    """
    Main conversion orchestration function.
    
    Args:
        dxf_path: Path to the input DXF file.
        duc_path: Path for the output DUC file.
    """
    print(f"Loading DXF file: {dxf_path}")
    try: 
        doc = ezdxf.readfile(dxf_path)
    except (IOError, ezdxf.DXFStructureError) as e:
        print(f"Error loading DXF file: {e}")
        return

    # Initialize lists to ensure they exist for the placeholder logic and file writing,
    # even if the main conversion sections are commented out during testing.
    elements = []
    duc_layers = []
    duc_blocks = []
    linetype_styles = []

    # 1. Convert Header
    header = doc.header
    duc_global_state, duc_local_state, conversion_context = convert_header(header, doc)

    # 2. Convert Tables (Layers, Styles, Linetypes)
    print("\nConverting layers...")
    duc_layers = convert_layers(doc)
    
    print("\nConverting linetypes...")
    linetype_styles = convert_linetypes(doc)
    print(f"Converted {len(linetype_styles)} linetypes to stroke styles")
    
    # 3. Convert Blocks
    
    # 4. Convert Entities

    # --- Placeholder data for testing header conversion ---
    # If no layers were converted (e.g., when testing header only), create a default one.
    if not duc_layers:
        print("Creating a default layer for testing purposes.")
        default_layer = duc.StateBuilder().build_layer().with_id("0").with_label("Default").build()
        duc_layers.append(default_layer)

    # If no elements were converted, create a single placeholder point to make the file valid.
    if not elements:
        print("Creating a placeholder element for testing purposes.")
        placeholder_element = (duc.ElementBuilder()
                               .with_layer_id(duc_layers[0].id) # Place it on the first available layer
                               .build_linear_element()
                               .with_points([(0, 0)])
                               .build())
        elements.append(placeholder_element)

    # 5. Serialize to DUC file
    print(f"\nWriting DUC file to: {duc_path}")
    
    # Create standard with linetype styles
    standards = []
    if linetype_styles:
        standard_styles = duc.create_standard_styles(
            common_styles=linetype_styles,
            text_styles=[],
            dimension_styles=[],
            leader_styles=[],
            feature_control_frame_styles=[],
            table_styles=[],
            doc_styles=[],
            viewport_styles=[],
            hatch_styles=[],
            xray_styles=[]
        )
        
        # Create a standard that contains these styles
        standard = (duc.StateBuilder()
            .build_standard()
            .with_id("dxf_linetypes")
            .with_name("DXF Linetypes")
            .with_description("Linetype styles converted from DXF")
            .with_units(conversion_context['standard_units'])
            .with_styles(standard_styles)
            .build())
        
        standards.append(standard)
    
    duc.write_duc_file(
        file_path=duc_path,
        name=os.path.splitext(os.path.basename(dxf_path))[0],
        elements=elements,
        blocks=duc_blocks,
        layers=duc_layers,
        duc_global_state=duc_global_state,
        duc_local_state=duc_local_state,
        standards=standards
    )
    print("✅ Conversion complete.")

def main():
    """Main function to parse arguments and run the conversion."""
    parser = argparse.ArgumentParser(description="Convert a DXF file to a DUC file.")
    parser.add_argument("dxf_file", help="Path to the input .dxf file.")
    parser.add_argument("-o", "--output", help="Path for the output .duc file (optional).")
    
    args = parser.parse_args()
    
    dxf_path = args.dxf_file
    duc_path = args.output

    if not duc_path:
        duc_path = os.path.splitext(dxf_path)[0] + ".duc"
        
    convert_dxf_to_duc(dxf_path, duc_path)

if __name__ == "__main__":
    main()

