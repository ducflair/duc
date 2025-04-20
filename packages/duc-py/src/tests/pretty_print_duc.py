# This test should:
# 1. Load a duc file (parse)
# 2. Print the duc file in a readable format

import argparse
from typing import Dict, Any

from ..ducpy.parse.parse_duc import parse_duc_flatbuffers
from rich.pretty import pprint as rich_pprint

def print_duc_file(input_path: str):
    try:
        with open(input_path, 'rb') as f:
            duc_data = parse_duc_flatbuffers(f)
            
        # Use Rich's pretty print which can handle arbitrary objects nicely
        rich_pprint(duc_data)
        
    except Exception as e:
        print(f"Error reading DUC file: {str(e)}")
        raise

def main():
    parser = argparse.ArgumentParser(description='Print DUC file contents in a readable format')
    parser.add_argument('input', help='Input DUC file path')
    
    args = parser.parse_args()
    print_duc_file(args.input)

if __name__ == '__main__':
    main()
