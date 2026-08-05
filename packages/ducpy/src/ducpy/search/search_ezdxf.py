"""DXF text extraction for model-element search (the ``ezdxf`` engine).

This module pulls **user-authored text** out of a DXF drawing — the things a
person types as drawing content rather than the surrounding Python that loads
or builds the drawing. Per the agreed scope we "extract everything":

* annotation text — ``TEXT``, ``MTEXT``, block attributes (``ATTRIB`` /
  ``ATTDEF``), ``DIMENSION`` text overrides, ``MULTILEADER`` / ``LEADER`` notes,
  and ``ACAD_TABLE`` cells;
* structural names — layer, block and layout names;
* extended data — entity hyperlinks, ``XDATA`` strings and custom drawing
  properties.

Acquisition searches linked DXF/DWG files by default. For trusted DUC files,
:func:`extract_model_dxf_text` can opt into embedded Python execution to capture
generated entities such as ``msp.add_text("Room 101")``.

DWG is converted to DXF by :func:`convert_dwg_to_dxf`, using the standalone
Rust/wasm-bindgen module published by ``dwgdxf`` 2.0.1 and executed directly
from Python with ``wasmtime``.
"""

from __future__ import annotations

import base64
import builtins
import contextlib
import functools
import hashlib
import io
import logging
import os
import tempfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Iterator

from ._model_files import external_file_bytes as _external_file_bytes

logger = logging.getLogger(__name__)

__all__ = [
    "DWGDXF_WASM_PATH_ENV",
    "DWGDXF_WASM_URL",
    "DwgConversionNotAvailable",
    "DxfText",
    "DxfTextItem",
    "convert_dwg_to_dxf",
    "extract_dxf_text",
    "extract_drawing_text",
    "extract_model_dxf_text",
    "ezdxf_available",
]

# DXF text override sentinels that mean "use the measured value", not user text.
_DIMENSION_PLACEHOLDERS = {"", "<>"}
# DWG file signatures ("AC10xx" version tags) — used to spot a DWG masquerading
# as a DXF-backed model so we can route it through the converter.
_DWG_MAGIC = (b"AC10", b"AC1.", b"AC2.", b"MC0.")


# Keep the converter version and integrity digest pinned together. The digest
# is the SHA-256 value published by jsDelivr for this exact package file.
DWGDXF_WASM_URL = "https://cdn.jsdelivr.net/npm/dwgdxf@2.0.1/dist/wasm/dwgdxf_bg.wasm"
DWGDXF_WASM_PATH_ENV = "DUCPY_DWGDXF_WASM_PATH"
_DWGDXF_WASM_SHA256_BASE64 = "8trwHBhz6C1LyuPagrJqyakukWr/12eiurvhRDeT9yg="
_DWGDXF_WASM_CACHE_NAME = "dwgdxf-2.0.1-bg.wasm"


class DwgConversionNotAvailable(RuntimeError):
    """Raised when the DWG WASM converter cannot be loaded or executed."""


@dataclass(frozen=True, slots=True)
class DxfTextItem:
    """A single piece of text pulled from a drawing, with its provenance."""

    text: str
    kind: str  # text | mtext | attrib | attdef | dimension | mleader | table
    #            | layer | block | layout | hyperlink | xdata | doc_property
    owner: str | None = None  # owning layout / block name, when relevant
    layer: str | None = None  # entity layer, when relevant


@dataclass(frozen=True, slots=True)
class DxfText:
    """Result of extracting text from one or more drawings."""

    items: tuple[DxfTextItem, ...] = ()

    @property
    def text(self) -> str:
        """All item texts joined with newlines (handy for a quick search blob)."""
        return "\n".join(item.text for item in self.items)

    def texts_by_kind(self, kind: str) -> list[str]:
        return [item.text for item in self.items if item.kind == kind]


def ezdxf_available() -> bool:
    """Return ``True`` if the optional ``ezdxf`` dependency can be imported."""
    try:
        import ezdxf  # noqa: F401
    except Exception as exc:  # pragma: no cover - environment dependent
        logger.debug("ezdxf is unavailable: %s", exc)
        return False
    return True


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split())


def _dedupe(items: list[DxfTextItem]) -> tuple[DxfTextItem, ...]:
    seen: set[tuple[str, str, str | None, str | None]] = set()
    ordered: list[DxfTextItem] = []
    for item in items:
        if not item.text:
            continue
        key = (item.kind, item.text, item.owner, item.layer)
        if key in seen:
            continue
        seen.add(key)
        ordered.append(item)
    return tuple(ordered)


# --------------------------------------------------------------------------- #
# Per-entity extraction
# --------------------------------------------------------------------------- #
def _entity_layer(entity: Any) -> str | None:
    try:
        return str(entity.dxf.layer)
    except Exception:
        return None


def _iter_entity_text(entity: Any, owner: str | None) -> Iterator[DxfTextItem]:
    """Yield the user text carried by a single graphical entity."""

    try:
        dxftype = entity.dxftype()
    except Exception:
        return
    layer = _entity_layer(entity)

    if dxftype == "TEXT":
        yield DxfTextItem(_clean(entity.dxf.get("text", "")), "text", owner, layer)

    elif dxftype == "MTEXT":
        try:
            content = entity.plain_text()
        except Exception:
            content = entity.dxf.get("text", "")
        yield DxfTextItem(_clean(content), "mtext", owner, layer)

    elif dxftype == "ATTRIB":
        yield DxfTextItem(_clean(entity.dxf.get("text", "")), "attrib", owner, layer)

    elif dxftype == "ATTDEF":
        # tag + prompt + default value are all author-chosen.
        for value in (entity.dxf.get("tag", ""), entity.dxf.get("prompt", ""), entity.dxf.get("text", "")):
            yield DxfTextItem(_clean(value), "attdef", owner, layer)

    elif dxftype in ("DIMENSION", "ARC_DIMENSION", "LARGE_RADIAL_DIMENSION"):
        override = _clean(entity.dxf.get("text", ""))
        if override not in _DIMENSION_PLACEHOLDERS:
            yield DxfTextItem(override, "dimension", owner, layer)

    elif dxftype in ("MULTILEADER", "MLEADER"):
        yield from _iter_mleader_text(entity, owner, layer)

    elif dxftype == "INSERT":
        # Block references carry their filled-in attributes as sub-entities.
        for attrib in getattr(entity, "attribs", []) or []:
            yield DxfTextItem(_clean(attrib.dxf.get("text", "")), "attrib", owner, layer)

    elif dxftype == "ACAD_TABLE":
        yield from _iter_table_text(entity, owner, layer)

    # Extended data attached to *any* entity type.
    yield from _iter_hyperlink_text(entity, owner, layer)
    yield from _iter_xdata_text(entity, owner, layer)


def _iter_mleader_text(entity: Any, owner: str | None, layer: str | None) -> Iterator[DxfTextItem]:
    """Extract and de-format MTEXT content stored by a MULTILEADER entity."""

    try:
        getter = getattr(entity, "get_mtext_content", None)
        content = getter() if callable(getter) else None
        if not content:
            context = getattr(entity, "context", None)
            mtext = getattr(context, "mtext", None) if context is not None else None
            content = getattr(mtext, "default_content", None) if mtext is not None else None
        if content:
            try:
                from ezdxf.tools.text import plain_mtext

                content = plain_mtext(str(content))
            except Exception:
                content = str(content).replace(r"\P", "\n")
            cleaned = _clean(content)
            if cleaned:
                yield DxfTextItem(cleaned, "mleader", owner, layer)
    except Exception as exc:
        logger.debug("Failed to read MULTILEADER text: %s", exc)


def _iter_table_text(entity: Any, owner: str | None, layer: str | None) -> Iterator[DxfTextItem]:
    """Extract ACAD_TABLE cells using ezdxf's tag-storage reader."""

    try:
        from ezdxf.entities.acad_table import read_acad_table_content

        for row in read_acad_table_content(entity):
            for value in row:
                cleaned = _clean(value)
                if cleaned:
                    yield DxfTextItem(cleaned, "table", owner, layer)
    except Exception as exc:
        logger.debug("Failed to read ACAD_TABLE cells: %s", exc)


def _iter_hyperlink_text(entity: Any, owner: str | None, layer: str | None) -> Iterator[DxfTextItem]:
    getter: Callable[[], Any] | None = getattr(entity, "get_hyperlink", None)
    if not callable(getter):
        return
    try:
        link, description, _location = getter()
    except Exception:
        return
    for value in (link, description):
        cleaned = _clean(value)
        if cleaned:
            yield DxfTextItem(cleaned, "hyperlink", owner, layer)


def _iter_xdata_text(entity: Any, owner: str | None, layer: str | None) -> Iterator[DxfTextItem]:
    xdata = getattr(entity, "xdata", None)
    data = getattr(xdata, "data", None)
    if not data:
        return
    try:
        for tags in data.values():
            for code, value in tags:
                # 1000 = ASCII string, 1001 is the appid registration.
                if code == 1000 and isinstance(value, str):
                    cleaned = _clean(value)
                    if cleaned:
                        yield DxfTextItem(cleaned, "xdata", owner, layer)
    except Exception as exc:
        logger.debug("Failed to read XDATA strings: %s", exc)


# --------------------------------------------------------------------------- #
# Drawing-level extraction
# --------------------------------------------------------------------------- #
def _iter_drawing_names(doc: Any) -> Iterator[DxfTextItem]:
    try:
        for layer in doc.layers:
            yield DxfTextItem(_clean(layer.dxf.get("name", "")), "layer")
    except Exception as exc:
        logger.debug("Failed to read layer names: %s", exc)

    try:
        for block in doc.blocks:
            name = block.name or ""
            if not name.startswith("*"):  # skip space + anonymous blocks
                yield DxfTextItem(_clean(name), "block")
    except Exception as exc:
        logger.debug("Failed to read block names: %s", exc)

    try:
        for name in doc.layout_names():
            yield DxfTextItem(_clean(name), "layout")
    except Exception as exc:
        logger.debug("Failed to read layout names: %s", exc)


def _iter_custom_properties(doc: Any) -> Iterator[DxfTextItem]:
    try:
        for tag, value in doc.header.custom_vars:
            yield DxfTextItem(_clean(f"{tag}: {value}".strip(": ")), "doc_property")
    except Exception as exc:
        logger.debug("Failed to read custom drawing properties: %s", exc)


def extract_drawing_text(doc: Any) -> DxfText:
    """Extract every piece of user text from an in-memory ``ezdxf`` drawing."""

    items: list[DxfTextItem] = []

    # Placed entities: modelspace + every paperspace layout.
    try:
        for layout in doc.layouts:
            owner = getattr(layout, "name", None)
            for entity in layout:
                items.extend(_iter_entity_text(entity, owner))
    except Exception as exc:
        logger.debug("Failed iterating layouts: %s", exc)

    # Text defined *inside* named block definitions (e.g. ATTDEF / TEXT).
    try:
        for block in doc.blocks:
            name = block.name or ""
            if name.startswith("*"):
                continue
            for entity in block:
                items.extend(_iter_entity_text(entity, name))
    except Exception as exc:
        logger.debug("Failed iterating block definitions: %s", exc)

    items.extend(_iter_drawing_names(doc))
    items.extend(_iter_custom_properties(doc))
    return DxfText(_dedupe(items))


def _load_doc_from_bytes(dxf_bytes: bytes) -> Any:
    """Parse DXF bytes into an ``ezdxf`` drawing (tolerant fallback on failure)."""

    import ezdxf
    from ezdxf import recover

    with tempfile.NamedTemporaryFile(prefix="ducpy-dxf-", suffix=".dxf", delete=False) as handle:
        handle.write(dxf_bytes)
        tmp_path = handle.name
    try:
        try:
            return ezdxf.readfile(tmp_path)
        except Exception as exc:
            logger.debug("ezdxf.readfile failed (%s); retrying with recover", exc)
            doc, _auditor = recover.readfile(tmp_path)
            return doc
    finally:
        with contextlib.suppress(OSError):
            os.unlink(tmp_path)


def extract_dxf_text(dxf_bytes: bytes) -> DxfText:
    """Extract user text from raw DXF bytes. Returns empty on any failure."""

    if not dxf_bytes:
        return DxfText()
    if not ezdxf_available():
        return DxfText()
    try:
        if dxf_bytes[:4] in _DWG_MAGIC:
            dxf_bytes = convert_dwg_to_dxf(dxf_bytes)
        doc = _load_doc_from_bytes(dxf_bytes)
    except DwgConversionNotAvailable as exc:
        logger.info("Could not convert DWG data for text extraction: %s", exc)
        return DxfText()
    except Exception as exc:
        logger.debug("Failed to load DXF for search: %s", exc)
        return DxfText()
    return extract_drawing_text(doc)


# --------------------------------------------------------------------------- #
# DWG conversion
# --------------------------------------------------------------------------- #
def _validate_wasm_bytes(wasm_bytes: bytes) -> None:
    actual = base64.b64encode(hashlib.sha256(wasm_bytes).digest()).decode("ascii")
    if actual != _DWGDXF_WASM_SHA256_BASE64:
        raise DwgConversionNotAvailable(
            "Downloaded dwgdxf WASM failed its SHA-256 integrity check."
        )


def _cached_wasm_path() -> Path:
    return Path(tempfile.gettempdir()) / "ducpy-wasm" / _DWGDXF_WASM_CACHE_NAME


def _download_wasm(url: str, *, timeout_seconds: float) -> bytes:
    try:
        with urllib.request.urlopen(url, timeout=timeout_seconds) as response:
            return response.read()
    except Exception as exc:
        raise DwgConversionNotAvailable(
            f"Could not download the dwgdxf WASM module from {url}: {exc}"
        ) from exc


def _resolve_wasm_path(
    wasm_path: str | Path | None,
    *,
    wasm_url: str,
    timeout_seconds: float,
) -> Path:
    configured_path = wasm_path or os.environ.get(DWGDXF_WASM_PATH_ENV)
    if configured_path:
        path = Path(configured_path)
        try:
            wasm_bytes = path.read_bytes()
        except OSError as exc:
            raise DwgConversionNotAvailable(
                f"Could not read dwgdxf WASM at {path}: {exc}"
            ) from exc
        _validate_wasm_bytes(wasm_bytes)
        return path

    cache_path = _cached_wasm_path()
    try:
        cached = cache_path.read_bytes()
    except OSError:
        cached = b""
    if cached:
        try:
            _validate_wasm_bytes(cached)
            return cache_path
        except DwgConversionNotAvailable:
            logger.warning("Ignoring invalid cached dwgdxf WASM at %s", cache_path)

    wasm_bytes = _download_wasm(wasm_url, timeout_seconds=timeout_seconds)
    _validate_wasm_bytes(wasm_bytes)
    try:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(wasm_bytes)
    except OSError as exc:
        logger.debug("Could not cache dwgdxf WASM at %s: %s", cache_path, exc)
        handle = tempfile.NamedTemporaryFile(
            prefix="ducpy-dwgdxf-", suffix=".wasm", delete=False
        )
        with handle:
            handle.write(wasm_bytes)
        return Path(handle.name)
    return cache_path


@functools.lru_cache(maxsize=8)
def convert_dwg_to_dxf(
    dwg_bytes: bytes,
    *,
    wasm_path: str | Path | None = None,
    wasm_url: str = DWGDXF_WASM_URL,
    timeout_seconds: float = 30.0,
) -> bytes:
    """Convert DWG bytes to DXF bytes.

    By default the pinned ``dwgdxf`` 2.0.1 module is downloaded from
    :data:`DWGDXF_WASM_URL`, verified against its published SHA-256 digest,
    and cached under the system temporary directory. Pass ``wasm_path`` or set
    :data:`DWGDXF_WASM_PATH_ENV` to use an already-downloaded copy; local copies
    are still integrity checked.
    """
    if not dwg_bytes:
        raise ValueError("dwg_bytes must not be empty")
    try:
        import wasmtime
    except Exception as exc:  # pragma: no cover - dependency installation issue
        raise DwgConversionNotAvailable(
            "DWG conversion requires the 'wasmtime' Python package."
        ) from exc

    module_path = _resolve_wasm_path(
        wasm_path,
        wasm_url=wasm_url,
        timeout_seconds=timeout_seconds,
    )

    try:
        engine = wasmtime.Engine()
        module = wasmtime.Module.from_file(engine, os.fspath(module_path))
        store = wasmtime.Store(engine)
        linker = wasmtime.Linker(engine)

        linker.define_func(
            "./dwgdxf_bg.js",
            "__wbindgen_init_externref_table",
            wasmtime.FuncType([], []),
            lambda: None,
        )
        linker.define_func(
            "./dwgdxf_bg.js",
            "__wbindgen_cast_0000000000000001",
            wasmtime.FuncType(
                [wasmtime.ValType.i32(), wasmtime.ValType.i32()],
                [wasmtime.ValType.externref()],
            ),
            lambda _ptr, _length: None,
        )

        instance = linker.instantiate(store, module)
        exports = instance.exports(store)
        start = exports.get("__wbindgen_start")
        if start is not None:
            start(store)

        malloc = exports["__wbindgen_malloc"]
        free = exports["__wbindgen_free"]
        memory = exports["memory"]
        convert = exports["convertDwgToDxf"]

        input_ptr = malloc(store, len(dwg_bytes), 1)
        memory.write(store, dwg_bytes, input_ptr)
        result = convert(store, input_ptr, len(dwg_bytes))
        output_ptr, output_len, _error_index, has_error = result
        if has_error:
            raise DwgConversionNotAvailable(
                "dwgdxf WASM rejected or could not convert the DWG data."
            )

        dxf_bytes = bytes(memory.read(store, output_ptr, output_ptr + output_len))
        free(store, output_ptr, output_len, 1)
    except DwgConversionNotAvailable:
        raise
    except Exception as exc:
        raise DwgConversionNotAvailable(f"dwgdxf WASM conversion failed: {exc}") from exc

    if not dxf_bytes:
        raise DwgConversionNotAvailable("dwgdxf WASM returned an empty DXF.")
    return dxf_bytes


# --------------------------------------------------------------------------- #
# Hybrid acquisition from a parsed model element
# --------------------------------------------------------------------------- #
def _run_and_capture_drawings(
    code: str,
    duc_source: str | Path,
    file_ids: list[str],
) -> list[Any]:
    """Execute embedded ``ezdxf`` code, returning every drawing it opens/creates.

    Runs in-process with both ``resolve_external_file`` and the legacy
    ``external_files[id]["path"]`` mapping wired to temporary linked files. This
    executes arbitrary embedded Python and must only be enabled for trusted DUC
    files. Common ``ezdxf`` entry points are wrapped to capture drawings.
    """

    import ezdxf
    from ezdxf import recover

    captured: list[Any] = []

    with tempfile.TemporaryDirectory(prefix="ducpy-ezdxf-") as tmpdir:
        resolved: dict[str, str] = {}
        for file_id in file_ids:
            blob = _external_file_bytes(duc_source, file_id)
            if blob is None:
                continue
            target = Path(tmpdir) / str(file_id)
            target.write_bytes(blob)
            resolved[file_id] = str(target)

        def resolve_external_file(file_id: str) -> str:
            if file_id in resolved:
                return resolved[file_id]
            raise FileNotFoundError(f"External file '{file_id}' not found for model search.")

        def _record(doc: Any) -> Any:
            captured.append(doc)
            return doc

        originals: list[tuple[Any, str, Any]] = []

        def patch(module: Any, name: str, wrapper_factory: Callable[[Any], Any]) -> None:
            original = getattr(module, name, None)
            if original is None:
                return
            originals.append((module, name, original))
            setattr(module, name, wrapper_factory(original))

        def simple(original: Any) -> Any:
            return lambda *a, **k: _record(original(*a, **k))

        def recover_pair(original: Any) -> Any:
            def wrapper(*a: Any, **k: Any) -> Any:
                doc, auditor = original(*a, **k)
                _record(doc)
                return doc, auditor
            return wrapper

        previous_resolverr = getattr(builtins, "resolve_external_file", None)
        had_resolver = hasattr(builtins, "resolve_external_file")
        previous_cwd = os.getcwd()
        try:
            patch(ezdxf, "new", simple)
            patch(ezdxf, "read", simple)
            patch(ezdxf, "readfile", simple)
            patch(recover, "read", recover_pair)
            patch(recover, "readfile", recover_pair)

            builtins.resolve_external_file = resolve_external_file
            os.chdir(tmpdir)
            external_files = {
                file_id: {"id": file_id, "path": path}
                for file_id, path in resolved.items()
            }
            globals_dict: dict[str, Any] = {
                "__name__": "__main__",
                "external_files": external_files,
                "resolve_external_file": resolve_external_file,
            }
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                exec(compile(code, "<ducpy-ezdxf-model>", "exec"), globals_dict)
        except Exception as exc:
            logger.debug("Embedded ezdxf code did not run cleanly: %s", exc)
        finally:
            os.chdir(previous_cwd)
            for module, name, original in originals:
                setattr(module, name, original)
            if had_resolver:
                builtins.resolve_external_file = previous_resolver
            elif hasattr(builtins, "resolve_external_file"):
                delattr(builtins, "resolve_external_file")

    return captured


def extract_model_dxf_text(
    duc_source: str | Path,
    element: dict[str, Any],
    *,
    run_code: bool = False,
) -> DxfText:
    """Hybrid extraction of user text from an ``ezdxf`` model element.

    Linked DXF/DWG files are searched without executing code. If ``run_code`` is
    explicitly enabled, trusted Python model code is executed and text is read
    from the resulting drawing(s), including generated entities such as
    ``add_text("Room 101")``. Never enable this for untrusted DUC files.
    """

    if not ezdxf_available():
        logger.debug("ezdxf unavailable; cannot extract model DXF text")
        return DxfText()

    model_type = (element.get("model_type") or "python").strip().lower()
    code = element.get("code")
    file_ids = [str(fid) for fid in (element.get("file_ids") or []) if fid]

    # Hybrid: prefer running the code (covers loaded + generated entities).
    if run_code and model_type == "python" and isinstance(code, str) and "ezdxf" in code:
        items: list[DxfTextItem] = []
        for doc in _run_and_capture_drawings(code, duc_source, file_ids):
            items.extend(extract_drawing_text(doc).items)
        if items:
            return DxfText(_dedupe(items))
        logger.debug("Code execution captured no drawings; falling back to external files")

    # Direct file path: read each linked external DXF/DWG file.
    items = []
    for file_id in file_ids:
        blob = _external_file_bytes(duc_source, file_id)
        if not blob:
            continue
        try:
            if model_type == "dwg" or blob[:4] in _DWG_MAGIC:
                blob = convert_dwg_to_dxf(blob)
            items.extend(extract_dxf_text(blob).items)
        except DwgConversionNotAvailable as exc:
            logger.info("Skipping DWG model file %s: %s", file_id, exc)
        except Exception as exc:
            logger.debug("Failed to extract text from external file %s: %s", file_id, exc)
    return DxfText(_dedupe(items))
