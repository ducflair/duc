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

from ducpy.Duc.DIMENSION_UNITS_FORMAT import DIMENSION_UNITS_FORMAT
from ducpy.Duc.ANGULAR_UNITS_FORMAT import ANGULAR_UNITS_FORMAT

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

def convert_header(header):
    
    # Extract units and view information from the header
    units = header.get("$INSUNITS", 0)  # Default to unitless
    linear_units_dxf = header.get("$LUNITS", 1) # Default to scientific
    angular_units_dxf = header.get("$AUNITS", 0) # Default to decimal degrees

    duc_global_state = (duc.StateBuilder().build_global_state()
        .with_main_scope(INSUNITS_TO_DUC_UNITS[units])
        .with_dash_spacing_scale(header.get("$LTSCALE", 1.0))
        .build())
    
    linear_units = duc.create_linear_unit_system(
        format=LUNITS_TO_DUC[linear_units_dxf],

    )
    angular_units = duc.create_angular_unit_system(
        format=AUNITS_TO_DUC[angular_units_dxf],
    )

    primary_units = duc.create_primary_units(linear=linear_units, angular=angular_units)
    standard_units = duc.create_standard_units(primary_units=primary_units, alternate_units=None)
      
    return duc_global_state


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

    # 1. Convert Header
    header = doc.header
    duc_global_state = convert_header(header)

    # 2. Convert Tables (Layers, Styles)
    
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
    print(f"Writing DUC file to: {duc_path}")
    duc.write_duc_file(
        file_path=duc_path,
        name=os.path.splitext(os.path.basename(dxf_path))[0],
        elements=elements,
        blocks=duc_blocks,
        layers=duc_layers,
        duc_global_state=duc_global_state,
        duc_local_state=duc_local_state
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

