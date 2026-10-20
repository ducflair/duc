"""CLI entry point for ducpy CAD and BIM tessellation sidecar."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from ducpy.tessellate.runner import (
    tessellate_duc_element,
    tessellate_external_file,
    tessellate_model_code,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Tessellate 3D CAD/BIM elements and models into model cache JSON payloads."
    )
    parser.add_argument("--duc", help="Path to .duc file containing model elements")
    parser.add_argument("--element", help="ID of model element inside .duc file")
    parser.add_argument("--file", help="Path to standalone CAD or BIM file (.step, .stl, .ifc, .dxf)")
    parser.add_argument("--code", help="Inline Python CAD script to execute")
    parser.add_argument("--model-type", default="python", help="Model type (python, step, stl, ifc, dxf)")
    parser.add_argument("--input-json", help="Path to JSON request file (or '-' for stdin)")
    parser.add_argument("--output", help="Path to output file for tessellation payload")

    args = parser.parse_args()

    try:
        if args.input_json:
            raw_input = sys.stdin.read() if args.input_json == "-" else Path(args.input_json).read_text(encoding="utf-8")
            data = json.loads(raw_input)
            if "duc" in data and "element" in data:
                result = tessellate_duc_element(
                    duc_file_path=data["duc"],
                    element_id=data["element"],
                    output_path=args.output,
                )
            elif "file" in data:
                result = tessellate_external_file(
                    file_path=data["file"],
                    model_type=data.get("modelType"),
                )
            else:
                result = tessellate_model_code(
                    code=data.get("code", ""),
                    model_type=data.get("modelType", "python"),
                    external_files=data.get("externalFiles"),
                    model_modules=data.get("modelModules"),
                )
        elif args.duc and args.element:
            result = tessellate_duc_element(
                duc_file_path=args.duc,
                element_id=args.element,
                output_path=args.output,
            )
        elif args.file:
            result = tessellate_external_file(
                file_path=args.file,
                model_type=args.model_type,
            )
        elif args.code:
            result = tessellate_model_code(
                code=args.code,
                model_type=args.model_type,
            )
        else:
            parser.print_help(sys.stderr)
            return 1

        if args.output:
            out_path = Path(args.output).resolve()
            out_path.parent.mkdir(parents=True, exist_ok=True)
            payload = result["payload"]
            if isinstance(payload, str):
                out_path.write_text(payload, encoding="utf-8")
            else:
                out_path.write_text(json.dumps(payload), encoding="utf-8")
            sys.stdout.write(json.dumps({
                "success": True,
                "kind": result["kind"],
                "modelType": result.get("modelType"),
                "elementId": result.get("elementId"),
                "outputPath": str(out_path),
            }) + "\n")
        else:
            sys.stdout.write(json.dumps(result) + "\n")

        return 0

    except Exception as exc:
        err_dict = {
            "success": False,
            "error": str(exc),
            "type": exc.__class__.__name__,
        }
        sys.stderr.write(json.dumps(err_dict) + "\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
