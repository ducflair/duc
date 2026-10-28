"""Typed model artifacts shared by desktop and cloud Python workers."""
import base64
import hashlib
import json
import platform
import importlib
from pathlib import Path
from typing import Any

KINDS = {
    "parametric": ("application/json", "json"),
    "ifc": ("application/x-ifc", "ifc"),
    "dxf": ("application/dxf", "dxf"),
    "image": ("image/png", "png"),
    "svg": ("image/svg+xml", "svg"),
    "pdf": ("application/pdf", "pdf"),
    "table": ("application/json", "json"),
}


def _shims():
    try:
        return importlib.import_module("scopture_shims")
    except ModuleNotFoundError:
        return importlib.import_module("ducpy.tessellate.shims")


class ModelOutputCollector:
    def __init__(self, payload: dict, mounted_files: dict, workspace: Path, limit: int, preview_limit: int | None = None):
        self.payload = payload
        self.files = mounted_files
        self.workspace = workspace.resolve()
        self.limit = limit
        self.preview_limit = preview_limit or limit
        self.declaration: dict | None = None

    def emit_output(self, value: Any = None, *, kind: str, data: Any = None,
                    path: str | None = None, mime_type: str | None = None,
                    filename: str | None = None) -> None:
        if _shims().scopture_is_model_dependency_call():
            return
        if kind not in KINDS:
            raise ValueError(f"Unsupported model output kind: {kind}")
        if self.declaration is not None:
            raise ValueError("Declare exactly one model output artifact per execution")
        self.declaration = dict(value=value, kind=kind, data=data, path=path,
                                mime_type=mime_type, filename=filename)

    def collect(self, events: list[dict], globals_dict: dict, output_path: Path,
                legacy_kind: str, now: str) -> dict | None:
        declaration = self.declaration
        if declaration:
            kind = declaration["kind"]
            value = declaration["value"]
            data = declaration["data"]
            path = declaration["path"]
            if kind == "parametric" and data is None and path is None:
                data = _shims().scopture_tessellate_to_buffer_json(value)
            elif kind == "table" and data is None and path is None:
                data = value.to_dict(orient="records") if hasattr(value, "to_dict") else value
                data = json.dumps(data, allow_nan=False)
            elif path is None and data is None and isinstance(value, (str, bytes, bytearray)):
                data = value
            elif kind in ("ifc", "dxf") and data is None and path is None:
                target = self.workspace / f"declared-output.{kind}"
                if kind == "dxf" and hasattr(value, "saveas"):
                    value.saveas(str(target))
                elif kind == "ifc" and hasattr(value, "write"):
                    value.write(str(target))
                else:
                    raise ValueError(f"{kind} output requires bytes, a path, or a writable model")
                path = str(target)
            if path:
                target = Path(path)
                target = (target if target.is_absolute() else self.workspace / target).resolve()
                if not target.is_relative_to(self.workspace):
                    raise PermissionError("Model output must be inside the execution workspace")
                if target.stat().st_size > self.limit:
                    raise ValueError("Model output exceeds the artifact size limit")
                data = target.read_bytes()
            if isinstance(data, str):
                data = data.encode("utf-8")
            if not isinstance(data, (bytes, bytearray)):
                raise ValueError("Model output requires bytes or a workspace file")
            if kind == "ifc":
                target = self.workspace / "declared-preview.ifc"
                target.write_bytes(data)
                preview = _shims().scopture_collect_ifc_preview(globals_dict, output_path=target, max_preview_bytes=self.preview_limit)
                if preview:
                    events.append({"type": "preview", "content": preview, "timestamp": now})
            elif kind == "parametric":
                events.append({"type": "preview", "content": data.decode("utf-8"), "timestamp": now})
        else:
            model_file = next((event for event in reversed(events) if event.get("type") == "modelFile"), None)
            preview = next((event for event in reversed(events) if event.get("type") == "preview"), None)
            if model_file:
                kind, data = model_file["format"], base64.b64decode(model_file["dataBase64"])
            elif legacy_kind == "ifc" and output_path.is_file():
                kind, data = "ifc", output_path.read_bytes()
            elif preview:
                kind, data = "parametric", preview["content"].encode("utf-8")
            else:
                return None
            declaration = {}

        if not data or len(data) > (self.preview_limit if kind == "parametric" else self.limit):
            raise ValueError("Model output is empty or exceeds the artifact size limit")
        mime, extension = KINDS[kind]
        fingerprints = {}
        for file_id, file in self.files.items():
            digest = hashlib.sha256()
            with Path(file["path"]).open("rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(chunk)
            fingerprints[file_id] = digest.hexdigest()
        source = json.dumps({"code": self.payload.get("code", ""), "modules": self.payload.get("modelModules") or []}, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        envelope = {
            "version": 1, "kind": kind, "renderer": kind,
            "mimeType": declaration.get("mime_type") or mime,
            "format": extension,
            "filename": Path(declaration.get("filename") or f"model-output.{extension}").name,
            "contentHash": hashlib.sha256(data).hexdigest(),
            "sourceFingerprint": hashlib.sha256(source.encode()).hexdigest(),
            "inputFingerprints": fingerprints,
            "runtime": {"python": platform.python_version(), "contractVersion": 1},
            "status": "fresh",
        }
        event = {"type": "artifact", "content": "Model output", "timestamp": now, "envelope": envelope}
        if kind == "parametric":
            events[:] = [item for item in events if item.get("type") != "preview"]
            event["content"] = data.decode("utf-8")
        else:
            event["dataBase64"] = base64.b64encode(data).decode("ascii")
        return event
