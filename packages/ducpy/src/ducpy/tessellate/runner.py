"""CAD and BIM model tessellation execution engine for ducpy.

Compiles and tessellates model elements into canonical model cache payloads:
- parametric-json: compact { instances, shapes } numpy buffer JSON for build123d, cadquery, STEP, STL.
- ifc-json: triangulated { version: 2, parts: [...] } scene graph via ifcopenshell.geom.
- python-dxf: 2D/3D DXF drawings via ezdxf.
"""

from __future__ import annotations

import base64
import builtins
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile
import types
from pathlib import Path
from typing import Any, Callable
from ducpy.model_output import ModelOutputCollector

from ducpy.tessellate.shims import (
    scopture_collect_ifc_preview,
    scopture_collect_model_file,
    scopture_flatten_candidates,
    scopture_install_dxf_output_capture,
    scopture_install_fonts,
    scopture_install_ifc_output_capture,
    scopture_install_ipython_stub,
    scopture_install_model_modules,
    scopture_is_model_dependency_call,
    scopture_tessellate_to_buffer_json,
)


def _normalize_model_type(model_type: str | None) -> str:
    if not model_type:
        return "python"
    return model_type.strip().lower()


def _deduce_model_output_kind(model_type: str) -> str:
    normalized = _normalize_model_type(model_type)
    if normalized == "ifc":
        return "ifc"
    if normalized in ("dxf", "dwg"):
        return "dxf"
    return "parametric"


def _build_external_file_code(model_type: str, file_id: str) -> str:
    """Generate canonical model code loading an external file reference."""
    normalized = _normalize_model_type(model_type)
    if normalized == "ifc":
        return f"""from ocp_vscode import show
import ifcopenshell

MODEL_FILE_ID = "{file_id}"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

model = ifcopenshell.open(MODEL_PATH)
show(model)
"""
    if normalized == "step":
        return f"""from ocp_vscode import show
from build123d import *

MODEL_FILE_ID = "{file_id}"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

part = import_step(MODEL_PATH)
show(part)
"""
    if normalized == "stl":
        return f"""from ocp_vscode import show
from build123d import *

MODEL_FILE_ID = "{file_id}"
MODEL_PATH = resolve_external_file(MODEL_FILE_ID)

mesh = import_stl(MODEL_PATH)
show(mesh)
"""
    raise ValueError(f"Unsupported external model type: {model_type}")


def tessellate_external_file(
    file_path: str | Path,
    model_type: str | None = None,
) -> dict[str, Any]:
    """Directly tessellates a local CAD/BIM file (STEP, STL, IFC, DXF).

    Args:
        file_path: Path to the CAD or IFC file.
        model_type: Optional explicit type ('step', 'stl', 'ifc', 'dxf').
            If not specified, inferred from file extension.

    Returns:
        Dict with "success", "kind", "payload" (JSON string or dict).
    """
    path = Path(file_path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    ext = path.suffix.lower()
    inferred_type = model_type or ("step" if ext in (".step", ".stp") else ext.lstrip("."))
    normalized_type = _normalize_model_type(inferred_type)

    if normalized_type in ("step", "stp"):
        from build123d import import_step  # type: ignore

        part = import_step(str(path))
        payload_str = scopture_tessellate_to_buffer_json(part)
        return {
            "success": True,
            "kind": "parametric-json",
            "modelType": "step",
            "payload": payload_str,
        }

    if normalized_type == "stl":
        from build123d import import_stl  # type: ignore

        part = import_stl(str(path))
        payload_str = scopture_tessellate_to_buffer_json(part)
        return {
            "success": True,
            "kind": "parametric-json",
            "modelType": "stl",
            "payload": payload_str,
        }

    if normalized_type == "ifc":
        import ifcopenshell  # type: ignore

        model = ifcopenshell.open(str(path))
        payload_str = scopture_collect_ifc_preview(
            {"__scopture_ifc_show_candidates__": [model]},
            output_path=path,
        )
        if not payload_str:
            raise RuntimeError("Failed to generate IFC preview geometry.")
        return {
            "success": True,
            "kind": "ifc-json",
            "modelType": "ifc",
            "payload": payload_str,
        }

    if normalized_type == "dxf":
        content = path.read_text(encoding="utf-8", errors="replace")
        return {
            "success": True,
            "kind": "python-dxf",
            "modelType": "dxf",
            "payload": content,
        }

    raise ValueError(f"Unsupported model type for direct tessellation: {inferred_type}")


def tessellate_model_code(
    code: str,
    model_type: str = "python",
    model_output_kind: str | None = None,
    external_files: dict[str, Any] | list[dict[str, Any]] | None = None,
    model_modules: list[dict[str, Any]] | None = None,
    workspace_dir: str | Path | None = None,
) -> dict[str, Any]:
    """Executes CAD Python code and captures the tessellated preview payload.

    Args:
        code: Python source code defining CAD/BIM elements and calling show().
        model_type: "python", "step", "stl", "ifc", "dxf", "dwg".
        model_output_kind: "parametric", "ifc", or "dxf". Inferred if None.
        external_files: Map or list of external files available to the script.
        model_modules: Lazy dependency modules for duc_model.* imports.
        workspace_dir: Working directory for execution and output files.

    Returns:
        Dict with "success", "kind", "payload" (JSON string or dict), "stdout", "stderr".
    """
    clean_type = _normalize_model_type(model_type)
    resolved_kind = model_output_kind or _deduce_model_output_kind(clean_type)

    created_temp = False
    if workspace_dir is None:
        work_path = Path(tempfile.mkdtemp(prefix="duc-tessellate-"))
        created_temp = True
    else:
        work_path = Path(workspace_dir)
        work_path.mkdir(parents=True, exist_ok=True)

    try:
        # Normalize external_files into { id: { "path": str, "name": str, "mime_type": str } }
        mounted_files: dict[str, dict[str, str]] = {}
        if isinstance(external_files, dict):
            for fid, item in external_files.items():
                if isinstance(item, dict):
                    mounted_files[str(fid)] = {
                        "path": str(item.get("path") or ""),
                        "name": str(item.get("name") or Path(str(item.get("path") or "")).name),
                        "mime_type": str(item.get("mime_type") or "application/octet-stream"),
                    }
                elif isinstance(item, str):
                    mounted_files[str(fid)] = {
                        "path": item,
                        "name": Path(item).name,
                        "mime_type": "application/octet-stream",
                    }
        elif isinstance(external_files, list):
            for item in external_files:
                fid = str(item.get("id") or "")
                if fid:
                    mounted_files[fid] = {
                        "path": str(item.get("path") or item.get("localPath") or ""),
                        "name": str(item.get("name") or item.get("sourceName") or fid),
                        "mime_type": str(item.get("mime_type") or item.get("mimeType") or "application/octet-stream"),
                    }

        preview_payload: str | None = None
        output_file_event: dict[str, Any] | None = None
        output_path = work_path / f"output.{resolved_kind}"

        globals_dict: dict[str, Any] = {}

        def show(*objs: Any, **kwargs: Any) -> None:
            nonlocal preview_payload
            if scopture_is_model_dependency_call():
                return None

            if resolved_kind == "ifc":
                globals_dict["__scopture_ifc_show_candidates__"] = scopture_flatten_candidates(*objs)
                return None

            payload = scopture_tessellate_to_buffer_json(*objs, **kwargs)
            preview_payload = payload
            return None

        # Build execution environment
        scopture_install_ipython_stub()

        ocp_vscode = types.ModuleType("ocp_vscode")
        ocp_vscode.__version__ = "duc-tessellate-runner"
        ocp_vscode.show = show
        ocp_vscode.show_object = show

        class Camera:
            RESET = "reset"
            CENTER = "center"
            KEEP = "keep"

        ocp_vscode.Camera = Camera
        ocp_show_mod = types.ModuleType("ocp_vscode.show")
        ocp_show_mod.show = show
        ocp_show_mod.show_object = show

        sys.modules["ocp_vscode"] = ocp_vscode
        sys.modules["ocp_vscode.show"] = ocp_show_mod

        def resolve_external_file(file_id: str) -> str:
            entry = mounted_files.get(str(file_id))
            if entry is None:
                avail = ", ".join(sorted(mounted_files.keys())) or "none"
                raise KeyError(f"External file '{file_id}' not found. Available IDs: {avail}")
            return entry["path"]

        globals_dict.update({
            "__name__": "__main__",
            "__builtins__": builtins,
            "external_files": mounted_files,
            "show": show,
            "show_object": show,
            "resolve_external_file": resolve_external_file,
            "SCOPTURE_MODEL_OUTPUT_PATH": str(output_path),
            "SCOPTURE_MODEL_OUTPUT_KIND": resolved_kind,
            "__scopture_ifc_show_candidates__": [],
        })

        output_collector = ModelOutputCollector({"code": code, "modelModules": model_modules or []}, mounted_files, work_path, 50 * 1024 * 1024, 1024 * 1024 * 1024)
        globals_dict["emit_output"] = output_collector.emit_output
        builtins.emit_output = output_collector.emit_output
        builtins.resolve_external_file = resolve_external_file  # type: ignore
        builtins.show = show  # type: ignore

        scopture_install_fonts(mounted_files)
        scopture_install_ifc_output_capture(output_path=str(output_path))
        scopture_install_dxf_output_capture(output_path=str(output_path))
        scopture_install_model_modules(model_modules, globals_dict)

        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()

        with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
            exec(compile(code, "<duc-model-code>", "exec"), globals_dict)

        if output_collector.declaration is not None:
            events = []
            artifact = output_collector.collect(events, globals_dict, output_path, resolved_kind, "")
            renderer = artifact["envelope"]["renderer"]
            kind = {"parametric": "parametric-json", "ifc": "ifc-json", "dxf": "python-dxf"}.get(renderer, "model-artifact")
            if renderer == "parametric":
                payload = artifact["content"]
            elif renderer == "ifc":
                payload = next(event["content"] for event in events if event["type"] == "preview")
            elif renderer == "dxf":
                payload = base64.b64decode(artifact["dataBase64"]).decode("utf-8")
            else:
                payload = json.dumps(artifact)
            return {"success": True, "kind": kind, "modelType": renderer, "payload": payload, "artifact": artifact, "stdout": stdout_buf.getvalue(), "stderr": stderr_buf.getvalue()}

        if resolved_kind == "ifc":
            preview_payload = scopture_collect_ifc_preview(globals_dict, output_path=output_path)
            if not preview_payload:
                raise RuntimeError("IFC script completed but failed to produce preview geometry.")
            return {
                "success": True,
                "kind": "ifc-json",
                "modelType": clean_type,
                "payload": preview_payload,
                "stdout": stdout_buf.getvalue(),
                "stderr": stderr_buf.getvalue(),
            }

        if resolved_kind == "dxf":
            output_file_event = scopture_collect_model_file(globals_dict, "dxf", output_path)
            raw_dxf = ""
            if output_path.exists():
                raw_dxf = output_path.read_text(encoding="utf-8", errors="replace")
            return {
                "success": True,
                "kind": "python-dxf",
                "modelType": clean_type,
                "payload": raw_dxf,
                "modelFile": output_file_event,
                "stdout": stdout_buf.getvalue(),
                "stderr": stderr_buf.getvalue(),
            }

        # Parametric (CAD) output
        if preview_payload is None:
            # Check if an IFC model was created or written
            try:
                ifc_payload = scopture_collect_ifc_preview(globals_dict, output_path=output_path)
                if ifc_payload:
                    return {
                        "success": True,
                        "kind": "ifc-json",
                        "modelType": clean_type,
                        "payload": ifc_payload,
                        "stdout": stdout_buf.getvalue(),
                        "stderr": stderr_buf.getvalue(),
                    }
            except Exception:
                pass

            # Check if a DXF drawing was created
            try:
                has_dxf = any(
                    hasattr(v, "saveas") and hasattr(v, "modelspace")
                    for v in globals_dict.values()
                )
                if has_dxf:
                    output_file_event = scopture_collect_model_file(globals_dict, "dxf", output_path)
                    raw_dxf = output_path.read_text(encoding="utf-8", errors="replace") if output_path.exists() else ""
                    return {
                        "success": True,
                        "kind": "python-dxf",
                        "modelType": clean_type,
                        "payload": raw_dxf,
                        "modelFile": output_file_event,
                        "stdout": stdout_buf.getvalue(),
                        "stderr": stderr_buf.getvalue(),
                    }
            except Exception:
                pass

        if preview_payload is None:
            raise RuntimeError(
                f"Model code executed successfully but did not call show() to yield a preview. "
                f"stdout: {stdout_buf.getvalue()!r}, stderr: {stderr_buf.getvalue()!r}"
            )

        return {
            "success": True,
            "kind": "parametric-json",
            "modelType": clean_type,
            "payload": preview_payload,
            "stdout": stdout_buf.getvalue(),
            "stderr": stderr_buf.getvalue(),
        }

    finally:
        if created_temp:
            shutil.rmtree(work_path, ignore_errors=True)


def tessellate_duc_element(
    duc_file_path: str | Path,
    element_id: str,
    output_path: str | Path | None = None,
) -> dict[str, Any]:
    """Extracts a model element and its external files from a .duc file and tessellates it.

    Args:
        duc_file_path: Path to the .duc file.
        element_id: ID of the model element inside the .duc file.
        output_path: Optional path to write the resulting JSON model cache payload.

    Returns:
        Dict with "success", "kind", "payload", "elementId", "modelType".
    """
    import ducpy as duc

    duc_path = Path(duc_file_path).resolve()
    if not duc_path.exists():
        raise FileNotFoundError(f"DUC file not found: {duc_path}")

    data = duc.parse_duc(str(duc_path))
    elements = data.get("elements", [])
    element = next((e for e in elements if e.get("id") == element_id), None)
    if element is None:
        avail_ids = [e.get("id") for e in elements if e.get("type") == "model"]
        raise KeyError(
            f"Model element '{element_id}' not found in {duc_path.name}. "
            f"Available model IDs: {avail_ids}"
        )

    model_type = _normalize_model_type(element.get("model_type"))
    file_ids = element.get("file_ids") or []
    files_meta = data.get("files") or {}

    # Extract required external file revisions to a temporary directory
    temp_dir = Path(tempfile.mkdtemp(prefix="duc-extract-"))
    try:
        mounted_files: dict[str, dict[str, str]] = {}
        primary_file_path: Path | None = None

        for fid in file_ids:
            fentry = files_meta.get(fid)
            if not fentry:
                continue

            active_rev = fentry.get("active_revision_id")
            revs = fentry.get("revisions") or {}
            source_name = fentry.get("name") or f"{fid}.bin"
            mime_type = "application/octet-stream"

            if active_rev and active_rev in revs:
                rev_info = revs[active_rev]
                source_name = rev_info.get("source_name") or source_name
                mime_type = rev_info.get("mime_type") or mime_type
            elif revs:
                first_rev = next(iter(revs.values()))
                active_rev = first_rev.get("id") or active_rev
                source_name = first_rev.get("source_name") or source_name
                mime_type = first_rev.get("mime_type") or mime_type

            if not active_rev:
                continue

            dest_path = temp_dir / source_name
            try:
                duc.stream_external_file_revision_to_path(str(duc_path), active_rev, str(dest_path))
            except Exception as exc:
                raise RuntimeError(
                    f"Failed to stream external file revision '{active_rev}' for file '{fid}': {exc}"
                ) from exc

            mounted_files[fid] = {
                "path": str(dest_path),
                "name": source_name,
                "mime_type": mime_type,
            }
            if primary_file_path is None:
                primary_file_path = dest_path

        code = (element.get("code") or "").strip()
        result: dict[str, Any]

        if code:
            result = tessellate_model_code(
                code=code,
                model_type=model_type,
                external_files=mounted_files,
                workspace_dir=temp_dir,
            )
        elif primary_file_path is not None:
            result = tessellate_external_file(
                file_path=primary_file_path,
                model_type=model_type,
            )
        else:
            raise ValueError(
                f"Model element '{element_id}' has neither embedded Python code nor external files."
            )

        result["elementId"] = element_id

        if output_path:
            out_file = Path(output_path).resolve()
            out_file.parent.mkdir(parents=True, exist_ok=True)
            payload_data = result["payload"]
            if isinstance(payload_data, str):
                out_file.write_text(payload_data, encoding="utf-8")
            else:
                out_file.write_text(json.dumps(payload_data), encoding="utf-8")
            result["outputPath"] = str(out_file)

        return result

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
