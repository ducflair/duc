from dataclasses import dataclass
from enum import Enum
from typing import Optional, Tuple, Union
import ducpy_native as _native

from ducpy.classes.DataStateClass import (ExternalFileLocator,
                                          ExternalFileLocatorKind)


class ExternalFileResolutionStatus(str, Enum):
    RESOLVED = "resolved"
    MISSING = "missing"
    INACCESSIBLE = "inaccessible"
    UNRESOLVED = "unresolved"


@dataclass
class ExternalFileResolutionResult:
    status: ExternalFileResolutionStatus
    resolved_path: Optional[str]
    error: Optional[str]
    locator: ExternalFileLocator


def normalize_host_path(raw_path: str) -> str:
    return _native.normalize_host_path(raw_path or "")


def normalize_path_segments(path_str: str) -> str:
    return _native.normalize_path_segments(path_str)


def get_owning_duc_directory(owning_duc_path: str) -> str:
    return _native.get_owning_duc_directory(owning_duc_path)


def create_external_file_locator(
    kind: Union[ExternalFileLocatorKind, str],
    path: str,
    original_path: Optional[str] = None,
) -> ExternalFileLocator:
    """Creates an ExternalFileLocator with explicit kind."""
    locator_kind = (
        kind if isinstance(kind, ExternalFileLocatorKind) else ExternalFileLocatorKind(kind)
    )
    normalized = normalize_host_path(path)
    orig = original_path if original_path is not None else (path if path != normalized else None)

    return ExternalFileLocator(
        kind=locator_kind,
        path=normalized,
        original_path=orig,
    )


def resolve_locator_path(locator: ExternalFileLocator, owning_duc_path: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
    if not locator:
        return None, "Locator path is missing or empty"
    kind = locator.kind.value if isinstance(locator.kind, ExternalFileLocatorKind) else locator.kind
    return _native.resolve_locator_path(kind, locator.path or "", owning_duc_path)


def resolve_locator(locator: ExternalFileLocator, owning_duc_path: Optional[str] = None, check_exists: bool = False) -> ExternalFileResolutionResult:
    if not locator:
        return ExternalFileResolutionResult(ExternalFileResolutionStatus.UNRESOLVED, None, "Locator path is missing or empty", locator)
    kind = locator.kind.value if isinstance(locator.kind, ExternalFileLocatorKind) else locator.kind
    result = _native.resolve_locator(kind, locator.path, locator.original_path, owning_duc_path, check_exists)
    return ExternalFileResolutionResult(ExternalFileResolutionStatus(result["status"]), result.get("resolvedPath"), result.get("error"), locator)
