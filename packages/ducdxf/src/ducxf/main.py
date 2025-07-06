"""
Command-line interface for ducxf - DUC/DXF conversion utility.
"""

import os
import argparse
import sys
from pathlib import Path

from . import duc_to_dxf
from . import dxf_to_duc
from .common import DXF_SUPPORTED_VERSIONS, DEFAULT_DXF_VERSION

def main():
    """Entry point for the ducxf tool."""
    parser = argparse.ArgumentParser(
        description="Convert between DUC and DXF file formats",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert DUC to DXF
  ducxf duc2dxf drawing.duc
  
  # Convert DUC to DXF with specific output path
  ducxf duc2dxf drawing.duc -o output.dxf
  
  # Convert DUC to DXF with specific DXF version
  ducxf duc2dxf drawing.duc -v R2010
  
  # Convert DXF to DUC
  ducxf dxf2duc drawing.dxf
  
  # Convert DXF to DUC with specific output path
  ducxf dxf2duc drawing.dxf -o output.duc
"""
    )
    
    # Create subparsers for the different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # duc2dxf command
    duc2dxf_parser = subparsers.add_parser("duc2dxf", help="Convert DUC to DXF")
    duc2dxf_parser.add_argument("input", help="Input DUC file path")
    duc2dxf_parser.add_argument("-o", "--output", help="Output DXF file path (default: same name with .dxf extension)")
    duc2dxf_parser.add_argument(
        "-v", "--version", 
        choices=DXF_SUPPORTED_VERSIONS,
        default=DEFAULT_DXF_VERSION,
        help=f"DXF version to use (default: {DEFAULT_DXF_VERSION})"
    )
    
    # dxf2duc command
    dxf2duc_parser = subparsers.add_parser("dxf2duc", help="Convert DXF to DUC")
    dxf2duc_parser.add_argument("input", help="Input DXF file path")
    dxf2duc_parser.add_argument("-o", "--output", help="Output DUC file path (default: same name with .duc extension)")
    
    # Parse arguments
    args = parser.parse_args()
    
    # If no command is provided, show help
    if not args.command:
        parser.print_help()
        return 0
    
    try:
        # Execute the requested command
        if args.command == "duc2dxf":
            output_path = duc_to_dxf.convert_duc_to_dxf(
                duc_path=args.input,
                dxf_path=args.output,
                dxf_version=args.version
            )
            print(f"Successfully converted DUC to DXF: {output_path}")
            
        elif args.command == "dxf2duc":
            output_path = dxf_to_duc.convert_dxf_to_duc(
                dxf_path=args.input,
                duc_path=args.output
            )
            print(f"Successfully converted DXF to DUC: {output_path}")
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
