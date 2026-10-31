"""CAD and BIM tessellation and capture shims for ducpy.

Matches the exact tessellation and geometry extraction logic used across
Scopture and Ducflair runtimes (three-cad-viewer buffer JSON, ifcopenshell triangulation).
"""

from __future__ import annotations

import base64
import builtins
import importlib.abc
import importlib.util
import inspect
import json
import math
import os
import re
import sys
import types
from pathlib import Path
from typing import Any, Callable


def scopture_is_model_dependency_call() -> bool:
    """Return whether the current call stack is executing a duc_model module."""
    frame = inspect.currentframe()
    try:
        frame = frame.f_back if frame is not None else None
        while frame is not None:
            module_name = str(frame.f_globals.get("__name__") or "")
            if module_name.startswith("duc_model."):
                return True
            frame = frame.f_back
        return False
    finally:
        del frame


def scopture_install_model_modules(
    model_modules: list[dict[str, Any]] | None,
    runtime_globals: dict[str, Any],
) -> None:
    """Install one execution's model-element sources as a lazy Python package."""
    for finder in list(sys.meta_path):
        if getattr(finder, "__scopture_model_finder__", False):
            sys.meta_path.remove(finder)

    for module_name in list(sys.modules):
        if module_name == "duc_model" or module_name.startswith("duc_model."):
            sys.modules.pop(module_name, None)

    package = types.ModuleType("duc_model")
    package.__path__ = []
    package.__package__ = "duc_model"
    sys.modules["duc_model"] = package

    descriptors = {
        str(module["elementId"]): module
        for module in (model_modules or [])
        if module.get("elementId") and module.get("moduleName")
    }
    descriptor_by_name: dict[str, dict[str, Any]] = {}
    for descriptor in descriptors.values():
        names = [descriptor.get("moduleName"), *(descriptor.get("aliases") or [])]
        for name in names:
            if isinstance(name, str) and re.fullmatch(r"[A-Za-z_]\w*", name):
                descriptor_by_name.setdefault(name, descriptor)

    modules_by_element_id: dict[str, types.ModuleType] = {}

    class _ModelModuleLoader(importlib.abc.Loader):
        def create_module(self, spec):
            descriptor = descriptor_by_name[spec.name.removeprefix("duc_model.")]
            element_id = str(descriptor["elementId"])
            module = modules_by_element_id.get(element_id)
            if module is None:
                module = types.ModuleType(spec.name)
                modules_by_element_id[element_id] = module
            return module

        def exec_module(self, module):
            if module.__dict__.get("__duc_executed__"):
                return

            descriptor = descriptor_by_name[module.__spec__.name.removeprefix("duc_model.")]
            element_id = str(descriptor["elementId"])
            for alias, alias_descriptor in descriptor_by_name.items():
                if str(alias_descriptor["elementId"]) == element_id:
                    sys.modules[f"duc_model.{alias}"] = module

            preserved = {
                "__name__": module.__spec__.name,
                "__package__": "duc_model",
                "__loader__": module.__loader__,
                "__spec__": module.__spec__,
            }
            module.__dict__.update(runtime_globals)
            module.__dict__.update(preserved)
            module.__dict__["__duc_element_id__"] = element_id
            module.__dict__["__duc_is_root__"] = False
            module.__dict__["__duc_executed__"] = True
            source_name = f"<duc_model.{descriptor['moduleName']}>"
            try:
                exec(compile(str(descriptor.get("code") or ""), source_name, "exec"), module.__dict__)
            except Exception:
                module.__dict__.pop("__duc_executed__", None)
                for alias, alias_descriptor in descriptor_by_name.items():
                    if str(alias_descriptor["elementId"]) == element_id:
                        sys.modules.pop(f"duc_model.{alias}", None)
                modules_by_element_id.pop(element_id, None)
                raise

    class _ModelModuleFinder(importlib.abc.MetaPathFinder):
        __scopture_model_finder__ = True

        def find_spec(self, fullname, path=None, target=None):
            if not fullname.startswith("duc_model."):
                return None
            module_name = fullname.removeprefix("duc_model.")
            if module_name not in descriptor_by_name:
                return None
            return importlib.util.spec_from_loader(fullname, _ModelModuleLoader())

    sys.meta_path.insert(0, _ModelModuleFinder())


class FontEnum:
    """Immutable font manifest with sequence, key, and attribute access."""

    def __init__(self, values: Any) -> None:
        self._values = tuple(str(value).strip() for value in values if str(value).strip())
        self._by_name = {value.casefold(): value for value in self._values}
        self._by_attribute: dict[str, str] = {}
        for value in self._values:
            attribute = re.sub(r"\W+", "_", value, flags=re.UNICODE).strip("_")
            if attribute and not attribute[0].isdigit():
                self._by_attribute[attribute.casefold()] = value

    def __iter__(self):
        return iter(self._values)

    def __len__(self) -> int:
        return len(self._values)

    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, str):
            try:
                return self._by_name[key.strip().casefold()]
            except KeyError as exc:
                raise KeyError(f"Unknown font '{key}'") from exc
        return self._values[key]

    def __getattr__(self, name: str) -> str:
        if name.startswith("_"):
            raise AttributeError(name)
        try:
            return self._by_attribute[name.casefold()]
        except KeyError as exc:
            raise AttributeError(f"Unknown font '{name}'") from exc

    def __repr__(self) -> str:
        return f"FontEnum({list(self._values)!r})"


def scopture_install_fonts(mounted_external_files: dict[str, dict[str, str]]) -> None:
    """Register mounted TTF files with OCCT and expose name-based resolution."""
    font_paths: dict[str, str] = {}

    def add_font_aliases(name: str, path: str) -> None:
        stem = Path(name).stem.strip()
        if not stem:
            return

        aliases = {stem}
        family = re.sub(
            r"(?:[-\s](?:regular|bold|italic|light|medium|semi-?bold|extra-?bold|thin|black))+$",
            "",
            stem,
            flags=re.IGNORECASE,
        ).strip()
        if family:
            aliases.add(family)

        for alias in aliases:
            font_paths[alias.casefold()] = path

    for entry in mounted_external_files.values():
        mime_type = str(entry.get("mime_type") or "").lower()
        path = str(entry.get("path") or "")
        name = str(entry.get("name") or Path(path).name)
        if mime_type not in ("font/ttf", "font/truetype") and not path.lower().endswith(".ttf"):
            continue
        if path:
            add_font_aliases(name, path)

    if font_paths:
        try:
            from OCP.Font import Font_FA_Regular, Font_FontMgr, Font_SystemFont  # type: ignore
            from OCP.TCollection import TCollection_AsciiString  # type: ignore

            manager = Font_FontMgr.GetInstance_s()
            for path in set(font_paths.values()):
                ascii_path = TCollection_AsciiString(path)
                system_font = Font_SystemFont(ascii_path)
                system_font.SetFontPath(Font_FA_Regular, ascii_path)
                manager.RegisterFont(system_font, True)
                try:
                    registered_name = system_font.FontName().ToCString()
                    if registered_name:
                        add_font_aliases(str(registered_name), path)
                except Exception:
                    pass
        except Exception:
            pass

    def resolve_font(family: str = "Arial") -> str:
        requested = str(family).strip()
        path = font_paths.get(requested.casefold())
        if path is not None:
            return path

        available = ", ".join(sorted(font_paths)) or "none"
        raise ValueError(
            f"Font '{requested}' is not mounted. Available fonts: {available}"
        )

    builtins.resolve_font = resolve_font
    builtins.FontEnum = FontEnum

    try:
        from build123d import Compound  # type: ignore

        if getattr(Compound.make_text, "__scopture_font_resolver__", False):
            return

        original_make_text = Compound.make_text

        def make_text_with_resolved_font(cls, *args: Any, **kwargs: Any):
            has_positional_font_path = len(args) >= 4
            if not has_positional_font_path and not kwargs.get("font_path"):
                family = kwargs.get("font") or (args[2] if len(args) >= 3 else "Arial")
                kwargs["font_path"] = builtins.resolve_font(str(family))
            return original_make_text(*args, **kwargs)

        make_text_with_resolved_font.__scopture_font_resolver__ = True
        Compound.make_text = classmethod(make_text_with_resolved_font)
    except Exception:
        return


def scopture_flatten_candidates(*objs: Any) -> list[Any]:
    """Recursively flatten nested lists/tuples/sets of objects into a flat list."""
    flattened: list[Any] = []
    for obj in objs:
        if obj is None:
            continue
        if isinstance(obj, (list, tuple, set)):
            flattened.extend(scopture_flatten_candidates(*list(obj)))
            continue
        flattened.append(obj)
    return flattened


def scopture_tessellate_to_buffer_json(*objs: Any, **kwargs: Any) -> str:
    """Tessellate CAD objects and return a compact JSON payload using base64 buffers.

    Uses the instanced format {instances, shapes} with numpy_to_buffer_json encoding.
    The client-side three-cad-viewer renderer handles this format via decodeInstancedFormat().
    """
    from ocp_tessellate.convert import (  # type: ignore
        numpy_to_buffer_json,
        tessellate_group,
        to_ocpgroup,
    )

    if "names" not in kwargs and "name" in kwargs:
        kwargs["names"] = [kwargs["name"]]

    if kwargs.get("default_color") is None:
        kwargs["default_color"] = "#2650fe"
    part_group, instances = to_ocpgroup(*objs, **kwargs)
    meshed_instances, shapes, _map = tessellate_group(part_group, instances)

    return json.dumps(
        numpy_to_buffer_json({"instances": meshed_instances, "shapes": shapes})
    )


def scopture_install_ipython_stub() -> None:
    """Install a stub for IPython.lib.pretty so build123d can import it."""
    if "IPython" in sys.modules:
        return

    ipython = types.ModuleType("IPython")
    ipython.__path__ = []
    ipython.get_ipython = lambda: None
    sys.modules["IPython"] = ipython

    ipython_lib = types.ModuleType("IPython.lib")
    ipython_lib.__path__ = []
    sys.modules["IPython.lib"] = ipython_lib

    pretty_mod = types.ModuleType("IPython.lib.pretty")

    class RepresentationPrinter:
        def __init__(self, *args: Any, **kwargs: Any):
            self._buffer: list[str] = []

        def text(self, text: Any) -> None:
            self._buffer.append(str(text))

        def breakable(self, sep: str = " ") -> None:
            self._buffer.append(sep)

        def begin_group(self, indent: int = 0, open: str = "") -> None:
            self._buffer.append(open)

        def end_group(self, dedent: int = 0, close: str = "") -> None:
            self._buffer.append(close)

        def flush(self) -> None:
            return None

    pretty_mod.RepresentationPrinter = RepresentationPrinter
    pretty_mod.pretty = repr
    sys.modules["IPython.lib.pretty"] = pretty_mod


def scopture_install_ifc_output_capture(
    output_path: str,
    sandbox_path: Callable[[str | os.PathLike[str], str | Path], Path] | None = None,
) -> None:
    """Patch ifcopenshell.file.write to also write to output_path."""
    if not output_path:
        return

    try:
        import ifcopenshell  # type: ignore
    except Exception:
        return

    file_class = getattr(ifcopenshell, "file", None)
    if file_class is None or getattr(file_class, "_scopture_write_patched", False):
        return

    original_write = file_class.write

    def _scopture_write(self: Any, filename: Any = None, *args: Any, **kwargs: Any) -> Any:
        requested = filename or output_path
        requested_path = (
            os.fspath(sandbox_path(requested, os.getcwd()))
            if sandbox_path is not None
            else os.fspath(requested)
        )
        requested_dir = os.path.dirname(requested_path)
        if requested_dir:
            os.makedirs(requested_dir, exist_ok=True)

        result = original_write(self, requested, *args, **kwargs)

        if output_path and os.path.abspath(requested_path) != os.path.abspath(output_path):
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            original_write(self, output_path, *args, **kwargs)

        return result

    file_class.write = _scopture_write
    file_class._scopture_write_patched = True


def scopture_install_dxf_output_capture(
    output_path: str,
    sandbox_path: Callable[[str | os.PathLike[str], str | Path], Path] | None = None,
) -> None:
    """Patch ezdxf.document.Drawing.saveas to also write to output_path."""
    if not output_path:
        return

    try:
        import ezdxf.document  # type: ignore
    except Exception:
        return

    drawing_class = getattr(ezdxf.document, "Drawing", None)
    if drawing_class is None or getattr(drawing_class, "_scopture_saveas_patched", False):
        return

    original_saveas = drawing_class.saveas

    def _scopture_saveas(self: Any, filename: Any, *args: Any, **kwargs: Any) -> Any:
        requested_path = (
            os.fspath(sandbox_path(filename, os.getcwd()))
            if sandbox_path is not None
            else os.fspath(filename)
        )
        requested_dir = os.path.dirname(requested_path)
        if requested_dir:
            os.makedirs(requested_dir, exist_ok=True)

        result = original_saveas(self, requested_path, *args, **kwargs)

        if output_path and os.path.abspath(requested_path) != os.path.abspath(output_path):
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            original_saveas(self, output_path, *args, **kwargs)

        return result

    drawing_class.saveas = _scopture_saveas
    drawing_class._scopture_saveas_patched = True


def scopture_collect_model_file(
    globals_dict: dict[str, Any],
    fmt: str,
    output_path: str | Path,
    max_model_file_bytes: int = 0,
    now_fn: Callable[[], int] | None = None,
) -> dict[str, Any]:
    """Find an ifcopenshell or ezdxf object in globals and write it to output_path."""
    import time as _time

    _now = now_fn if now_fn is not None else (lambda: int(_time.time() * 1000))
    _output = Path(output_path) if isinstance(output_path, str) else output_path

    if fmt == "ifc":
        candidates = []
        for value in globals_dict.values():
            if hasattr(value, "write") and value.__class__.__name__ == "file":
                module = getattr(value.__class__, "__module__", "")
                if module.startswith("ifcopenshell"):
                    candidates.append(value)
        if candidates and not _output.exists():
            candidates[-1].write(str(_output))
    elif fmt == "dxf":
        candidates = []
        for value in globals_dict.values():
            if hasattr(value, "saveas") and hasattr(value, "modelspace"):
                module = getattr(value.__class__, "__module__", "")
                if module.startswith("ezdxf"):
                    candidates.append(value)
        if candidates and not _output.exists():
            candidates[-1].saveas(str(_output))

    if not _output.exists():
        raise RuntimeError(f"{fmt.upper()} Python script did not produce an output file.")

    data = _output.read_bytes()
    if not data:
        raise RuntimeError(f"{fmt.upper()} Python script produced an empty file.")
    if max_model_file_bytes > 0 and len(data) > max_model_file_bytes:
        raise RuntimeError(
            f"{fmt.upper()} Python script produced a file that exceeds the limit."
        )

    return {
        "type": "modelFile",
        "timestamp": _now(),
        "format": fmt,
        "mimeType": "application/x-ifc" if fmt == "ifc" else "application/dxf",
        "filename": f"python-model.{fmt}",
        "content": f"Generated {fmt.upper()} file ({len(data)} bytes)",
        "dataBase64": base64.b64encode(data).decode("ascii"),
    }


def scopture_collect_ifc_preview(
    globals_dict: dict[str, Any],
    output_path: str | Path | None = None,
    max_preview_bytes: int = 0,
) -> str | None:
    """Tessellate an IFC model and return a compact JSON preview payload.

    Searches globals_dict for ifcopenshell.file objects, falls back to
    reading from output_path. Uses ifcopenshell.geom for triangulation.
    """
    candidates = []

    def _is_ifc_file(value: Any) -> bool:
        return (
            hasattr(value, "by_type")
            and hasattr(value, "by_id")
            and value.__class__.__name__ == "file"
        )

    for candidate in globals_dict.get("__scopture_ifc_show_candidates__", []):
        if _is_ifc_file(candidate):
            candidates.append(candidate)
    for value in globals_dict.values():
        if _is_ifc_file(value):
            candidates.append(value)

    model = candidates[-1] if candidates else None
    if model is None and output_path and Path(output_path).exists():
        import ifcopenshell  # type: ignore

        model = ifcopenshell.open(str(output_path))
    if model is None:
        raise RuntimeError("IFC Python script did not produce an ifcopenshell model.")

    try:
        import ifcopenshell.geom  # type: ignore
    except Exception as exc:
        raise RuntimeError(f"IfcOpenShell geometry support is unavailable: {exc}") from exc

    default_color = "#2650fe"

    def safe_string(value: Any, fallback: str) -> str:
        if value is None:
            return fallback
        text = str(value).strip()
        return text if text else fallback

    def resolve_callable(value: Any) -> Any:
        if callable(value):
            try:
                return value()
            except TypeError:
                return value
            except Exception:
                return None
        return value

    def safe_number(value: Any, fallback: float = 0.0) -> float:
        value = resolve_callable(value)
        try:
            if hasattr(value, "wrappedValue"):
                value = value.wrappedValue
        except Exception:
            pass
        try:
            number = float(value)
            return number if math.isfinite(number) else fallback
        except Exception:
            return fallback

    def css_color_from_rgb(rgb: list[float]) -> str:
        red_value = safe_number(rgb[0])
        green_value = safe_number(rgb[1])
        blue_value = safe_number(rgb[2])
        if max(red_value, green_value, blue_value) > 1.0:
            red_value /= 255.0
            green_value /= 255.0
            blue_value /= 255.0
        red = max(0, min(255, int(round(max(0.0, min(1.0, red_value)) * 255))))
        green = max(0, min(255, int(round(max(0.0, min(1.0, green_value)) * 255))))
        blue = max(0, min(255, int(round(max(0.0, min(1.0, blue_value)) * 255))))
        return f"#{red:02x}{green:02x}{blue:02x}"

    def extract_rgb(value: Any) -> list[float] | None:
        value = resolve_callable(value)
        if value is None:
            return None
        if isinstance(value, (list, tuple)) and len(value) >= 3:
            return [safe_number(value[0]), safe_number(value[1]), safe_number(value[2])]
        for attr in ("components", "components_"):
            try:
                components = resolve_callable(getattr(value, attr, None))
                if isinstance(components, (list, tuple)) and len(components) >= 3:
                    return [
                        safe_number(components[0]),
                        safe_number(components[1]),
                        safe_number(components[2]),
                    ]
            except Exception:
                pass
        for keys in (
            ("Red", "Green", "Blue"),
            ("red", "green", "blue"),
            ("r", "g", "b"),
            ("R", "G", "B"),
        ):
            try:
                if all(hasattr(value, key) for key in keys):
                    return [
                        safe_number(getattr(value, keys[0])),
                        safe_number(getattr(value, keys[1])),
                        safe_number(getattr(value, keys[2])),
                    ]
            except Exception:
                pass
        try:
            info = value.get_info() if hasattr(value, "get_info") else None
            if isinstance(info, dict):
                for keys in (
                    ("Red", "Green", "Blue"),
                    ("red", "green", "blue"),
                    ("r", "g", "b"),
                ):
                    if all(key in info for key in keys):
                        return [
                            safe_number(info[keys[0]]),
                            safe_number(info[keys[1]]),
                            safe_number(info[keys[2]]),
                        ]
        except Exception:
            pass
        return None

    def extract_alpha(style: Any) -> float:
        alpha = 1.0
        for attr in ("transparency", "Transparency"):
            try:
                if hasattr(style, attr):
                    alpha = 1.0 - safe_number(getattr(style, attr), 0.0)
                    break
            except Exception:
                pass
        try:
            info = style.get_info() if hasattr(style, "get_info") else None
            if isinstance(info, dict) and "Transparency" in info:
                alpha = 1.0 - safe_number(info.get("Transparency"), 0.0)
        except Exception:
            pass
        return max(0.0, min(1.0, alpha))

    def style_to_color_alpha(style: Any) -> tuple[str, float] | None:
        alpha = extract_alpha(style)
        for attr in (
            "get_color",
            "diffuse",
            "surface",
            "surface_colour",
            "surfaceColor",
            "SurfaceColour",
            "color",
            "Colour",
            "DiffuseColour",
        ):
            try:
                rgb = extract_rgb(getattr(style, attr, None))
                if rgb is not None:
                    return css_color_from_rgb(rgb), alpha
            except Exception:
                pass
        try:
            if hasattr(style, "Styles"):
                for child_style in getattr(style, "Styles") or []:
                    resolved = style_to_color_alpha(child_style)
                    if resolved is not None:
                        child_color, child_alpha = resolved
                        return child_color, min(alpha, child_alpha)
        except Exception:
            pass
        rgb = extract_rgb(style)
        if rgb is not None:
            return css_color_from_rgb(rgb), alpha
        return None

    def walk_style_candidates(value: Any, seen: set[int] | None = None, depth: int = 0):
        if value is None or depth > 5:
            return
        if seen is None:
            seen = set()
        if isinstance(value, (list, tuple, set)):
            for item in value:
                yield from walk_style_candidates(item, seen, depth + 1)
            return
        marker = id(value)
        if marker in seen:
            return
        seen.add(marker)
        try:
            type_name = value.is_a() if hasattr(value, "is_a") else ""
        except Exception:
            type_name = ""
        if "Style" in type_name or style_to_color_alpha(value) is not None:
            yield value
        for attr in (
            "Styles",
            "SurfaceStyles",
            "StyledByItem",
            "HasRepresentation",
            "Representations",
            "Items",
            "Material",
            "Materials",
            "RelatingMaterial",
            "MaterialLayers",
            "MaterialProfiles",
            "MaterialConstituents",
            "ForLayerSet",
            "ForProfileSet",
            "RepresentationMaps",
        ):
            try:
                if hasattr(value, attr):
                    yield from walk_style_candidates(
                        getattr(value, attr), seen, depth + 1
                    )
            except Exception:
                pass

    def element_style_candidates(element: Any):
        try:
            yield from walk_style_candidates(getattr(element, "Representation", None))
        except Exception:
            pass
        try:
            yield from walk_style_candidates(getattr(element, "HasAssociations", None))
        except Exception:
            pass

    def style_name(style: Any) -> str | None:
        name = safe_string(getattr(style, "Name", None), "") or safe_string(
            getattr(style, "name", None), ""
        )
        return name or None

    def material_color_resolution(
        materials: list[Any], index: int, element: Any
    ) -> tuple[str, float, str | None]:
        if 0 <= index < len(materials):
            resolved = style_to_color_alpha(materials[index])
            if resolved is not None:
                color, alpha = resolved
                return color, alpha, style_name(materials[index])
        for style in element_style_candidates(element):
            resolved = style_to_color_alpha(style)
            if resolved is not None:
                color, alpha = resolved
                return color, alpha, style_name(style)
        return default_color, 1.0, None

    def identity_loc() -> list[list[float]]:
        return [[0, 0, 0], [0, 0, 0, 1]]

    def element_label(element: Any) -> str:
        name = safe_string(getattr(element, "Name", None), "")
        element_type = safe_string(
            getattr(element, "is_a", lambda: "IfcElement")(), "IfcElement"
        )
        return f"{name} ({element_type})" if name else f"{element_type} #{element.id()}"

    def ifc_metadata(
        element: Any,
        color: str | None = None,
        alpha: float | None = None,
        material_name: str | None = None,
    ) -> dict[str, Any]:
        express_id = int(element.id())
        metadata = {
            "expressID": express_id,
            "globalId": safe_string(
                getattr(element, "GlobalId", None), str(express_id)
            ),
            "type": element.is_a(),
            "name": getattr(element, "Name", None),
            "description": getattr(element, "Description", None),
            "objectType": getattr(element, "ObjectType", None),
            "tag": getattr(element, "Tag", None),
            "predefinedType": getattr(element, "PredefinedType", None),
            "color": color,
            "alpha": alpha,
            "material": material_name,
        }
        return {
            key: value for key, value in metadata.items() if value not in (None, "", {})
        }

    def get_edges_from_faces(faces: list[int]) -> set[tuple[int, int]]:
        edge_set: set[tuple[int, int]] = set()
        for index in range(0, len(faces), 3):
            if index + 2 >= len(faces):
                break
            a, b, c = int(faces[index]), int(faces[index + 1]), int(faces[index + 2])
            for u, v in ((a, b), (b, c), (c, a)):
                if u == v:
                    continue
                edge_set.add((u, v) if u < v else (v, u))
        return edge_set

    def edge_points_from_indices(
        verts: list[float], edge_pairs: list[tuple[int, int]]
    ) -> list[float]:
        edges: list[float] = []
        for a, b in edge_pairs:
            ai = int(a) * 3
            bi = int(b) * 3
            if ai + 2 >= len(verts) or bi + 2 >= len(verts):
                continue
            edges.extend(
                [
                    safe_number(verts[ai]),
                    safe_number(verts[ai + 1]),
                    safe_number(verts[ai + 2]),
                    safe_number(verts[bi]),
                    safe_number(verts[bi + 1]),
                    safe_number(verts[bi + 2]),
                ]
            )
        return edges

    def get_ifc_thread_count() -> int:
        try:
            configured = int(os.environ.get("PYTHON_SANDBOX_IFC_THREADS", "0"))
        except Exception:
            configured = 0
        if configured > 0:
            return max(1, min(16, configured))
        try:
            cpu_count = os.cpu_count() or 1
        except Exception:
            cpu_count = 1
        return max(1, min(8, int(cpu_count)))

    ifc_edge_budget = 20000

    def shape_payload(
        verts: list[float],
        faces: list[int],
        normals: list[float],
        triangle_count: int,
        edges: list[float] | None = None,
        edge_count: int = 0,
    ) -> dict[str, Any]:
        safe_edges = edges or []
        return {
            "vertices": verts,
            "triangles": faces,
            "normals": normals if len(normals) == len(verts) else [0.0] * len(verts),
            "edges": safe_edges,
            "obj_vertices": verts,
            "face_types": [0],
            "edge_types": [0] * max(1, edge_count),
            "triangles_per_face": [triangle_count],
            "segments_per_edge": [1] * edge_count,
        }

    def shape_to_parts(shape: Any, element: Any) -> list[dict[str, Any]]:
        geometry = shape.geometry
        verts = [
            safe_number(value) for value in list(getattr(geometry, "verts", []) or [])
        ]
        faces = [int(value) for value in list(getattr(geometry, "faces", []) or [])]
        if len(verts) < 9 or len(faces) < 3:
            return []

        normals = [
            safe_number(value) for value in list(getattr(geometry, "normals", []) or [])
        ]
        if len(normals) != len(verts):
            normals = [0.0] * len(verts)

        raw_edge_indices = list(getattr(geometry, "edges", []) or [])
        edge_pairs: list[tuple[int, int]] = []
        for index in range(0, len(raw_edge_indices), 2):
            if index + 1 < len(raw_edge_indices):
                edge_pairs.append(
                    (int(raw_edge_indices[index]), int(raw_edge_indices[index + 1]))
                )

        materials = list(getattr(geometry, "materials", []) or [])
        material_ids_raw = list(getattr(geometry, "material_ids", []) or [])
        triangle_count = len(faces) // 3
        if not edge_pairs and triangle_count <= ifc_edge_budget:
            edge_pairs = sorted(get_edges_from_faces(faces))
        if len(edge_pairs) > ifc_edge_budget:
            edge_pairs = []
        edges = edge_points_from_indices(verts, edge_pairs) if edge_pairs else []

        material_ids = []
        for index in range(triangle_count):
            if index < len(material_ids_raw):
                try:
                    material_ids.append(int(material_ids_raw[index]))
                except Exception:
                    material_ids.append(-1)
            else:
                material_ids.append(-1)

        order: list[int] = []
        by_material: dict[int, list[int]] = {}
        for triangle_index, material_id in enumerate(material_ids):
            if material_id not in by_material:
                by_material[material_id] = []
                order.append(material_id)
            by_material[material_id].append(triangle_index)

        express_id = int(element.id())
        base_id = f"ifc/{element.is_a()}/{express_id}"
        label = element_label(element)

        if len(order) <= 1:
            material_id = order[0] if order else -1
            color, alpha, material_name = material_color_resolution(
                materials, material_id, element
            )
            return [
                {
                    "version": 2,
                    "name": label,
                    "id": base_id,
                    "loc": identity_loc(),
                    "type": "shapes",
                    "subtype": "solid",
                    "color": color,
                    "alpha": alpha,
                    "state": [1, 1],
                    "ifc": ifc_metadata(element, color, alpha, material_name),
                    "shape": shape_payload(
                        verts, faces, normals, triangle_count, edges, len(edge_pairs)
                    ),
                }
            ]

        parts = []
        edges_assigned = False
        for index, material_id in enumerate(order):
            triangle_indices = by_material[material_id]
            sub_faces: list[int] = []
            for triangle_index in triangle_indices:
                face_base = triangle_index * 3
                sub_faces.extend(
                    [faces[face_base], faces[face_base + 1], faces[face_base + 2]]
                )

            color, alpha, material_name = material_color_resolution(
                materials, material_id, element
            )
            sub_edges = edges if not edges_assigned else []
            sub_edge_count = len(edge_pairs) if not edges_assigned else 0
            edges_assigned = True
            parts.append(
                {
                    "version": 2,
                    "name": f"{label} [mat {index + 1}]",
                    "id": f"{base_id}/m{material_id}",
                    "loc": identity_loc(),
                    "type": "shapes",
                    "subtype": "solid",
                    "color": color,
                    "alpha": alpha,
                    "state": [1, 1],
                    "ifc": ifc_metadata(element, color, alpha, material_name),
                    "shape": shape_payload(
                        verts,
                        sub_faces,
                        normals,
                        len(sub_faces) // 3,
                        sub_edges,
                        sub_edge_count,
                    ),
                }
            )
        return parts

    def should_render_element(element: Any) -> bool:
        try:
            return not (
                element.is_a("IfcOpeningElement") or element.is_a("IfcVirtualElement")
            )
        except Exception:
            return True

    settings = ifcopenshell.geom.settings()
    for key, value in (
        ("use-world-coords", True),
        ("weld-vertices", True),
        ("generate-uvs", False),
    ):
        try:
            settings.set(key, value)
        except Exception:
            pass

    parts = []
    try:
        iterator = ifcopenshell.geom.iterator(settings, model, get_ifc_thread_count())
    except TypeError:
        iterator = ifcopenshell.geom.iterator(settings, model)
    if iterator.initialize():
        while True:
            shape = iterator.get()
            element = model.by_id(shape.id)
            if element is not None and should_render_element(element):
                parts.extend(shape_to_parts(shape, element))
            if not iterator.next():
                break

    project_name = "IFC Model"
    projects = model.by_type("IfcProject")
    if projects:
        project_name = safe_string(getattr(projects[0], "Name", None), "IFC Model")

    payload = json.dumps(
        {
            "version": 2,
            "name": project_name,
            "id": "ifc-model",
            "loc": identity_loc(),
            "parts": parts,
            "metadata": {
                "source": "ifcopenshell",
                "elementCount": len(parts),
                "schema": getattr(model, "schema", None),
                "hasRenderableGeometry": bool(parts),
            },
        },
        separators=(",", ":"),
    )

    if max_preview_bytes > 0 and len(payload.encode("utf-8")) > max_preview_bytes:
        return None
    return payload
