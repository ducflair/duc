import pytest
from ducpy.classes.DataStateClass import (ExternalFileLocator,
                                          ExternalFileLocatorKind)
from ducpy.classes.locator import (ExternalFileResolutionResult,
                                   ExternalFileResolutionStatus,
                                   create_external_file_locator,
                                   get_owning_duc_directory,
                                   normalize_host_path,
                                   normalize_path_segments, resolve_locator,
                                   resolve_locator_path)


def test_normalize_host_path_posix():
    assert normalize_host_path("file:///Users/jane/models/part.step") == "/Users/jane/models/part.step"
    assert normalize_host_path("file://localhost/Users/jane/part.step") == "/Users/jane/part.step"


def test_normalize_host_path_windows():
    assert normalize_host_path("file:///C:/Users/jane/models/part.step") == "C:/Users/jane/models/part.step"
    assert normalize_host_path("file://C:/Users/jane/models/part.step") == "C:/Users/jane/models/part.step"
    assert normalize_host_path(r"C:\Users\jane\models\part.step") == "C:/Users/jane/models/part.step"


def test_normalize_percent_encoding():
    assert normalize_host_path("file:///Users/jane/My%20Documents/cad%20file.step") == "/Users/jane/My Documents/cad file.step"


def test_get_owning_duc_directory():
    assert get_owning_duc_directory("/home/user/drawings/assembly.duc") == "/home/user/drawings"
    assert get_owning_duc_directory("C:/CAD/Projects/main.duc") == "C:/CAD/Projects"
    assert get_owning_duc_directory("file:///Users/jane/projects/design.duc") == "/Users/jane/projects"


def test_normalize_path_segments():
    assert normalize_path_segments("/home/user/drawings/../shared/part.step") == "/home/user/shared/part.step"
    assert normalize_path_segments("/home/user/drawings/./parts/part.step") == "/home/user/drawings/parts/part.step"


def test_resolve_relative_locator():
    locator = ExternalFileLocator(
        kind=ExternalFileLocatorKind.RELATIVE,
        path="cad/bracket.step",
    )
    resolved, error = resolve_locator_path(locator, "/Users/jane/drawings/robot.duc")
    assert error is None
    assert resolved == "/Users/jane/drawings/cad/bracket.step"


def test_resolve_relative_missing_owning_path():
    locator = ExternalFileLocator(
        kind=ExternalFileLocatorKind.RELATIVE,
        path="bracket.step",
    )
    result = resolve_locator(locator, None, check_exists=False)
    assert result.status == ExternalFileResolutionStatus.UNRESOLVED
    assert "Owning .duc file location is required" in (result.error or "")
    assert result.locator.kind == ExternalFileLocatorKind.RELATIVE


def test_resolve_absolute_file_url():
    locator = ExternalFileLocator(
        kind=ExternalFileLocatorKind.ABSOLUTE,
        path="file:///opt/cad/parts/shaft.step",
    )
    resolved, error = resolve_locator_path(locator)
    assert error is None
    assert resolved == "/opt/cad/parts/shaft.step"


def test_resolve_missing_file_preserves_locator(tmp_path):
    missing_file = tmp_path / "does_not_exist.step"
    locator = ExternalFileLocator(
        kind=ExternalFileLocatorKind.ABSOLUTE,
        path=str(missing_file),
        original_path=f"file://{missing_file}",
    )
    result = resolve_locator(locator, check_exists=True)
    assert result.status == ExternalFileResolutionStatus.MISSING
    assert result.resolved_path == str(missing_file).replace("\\", "/")
    assert result.locator.original_path == f"file://{missing_file}"
    assert result.locator.kind == ExternalFileLocatorKind.ABSOLUTE


def test_resolve_existing_file(tmp_path):
    real_file = tmp_path / "real_model.step"
    real_file.write_bytes(b"STEP DATA")

    owning_duc = tmp_path / "drawing.duc"

    locator = ExternalFileLocator(
        kind=ExternalFileLocatorKind.RELATIVE,
        path="real_model.step",
    )
    result = resolve_locator(locator, str(owning_duc), check_exists=True)
    assert result.status == ExternalFileResolutionStatus.RESOLVED
    assert result.resolved_path == str(real_file).replace("\\", "/")
    assert result.locator == locator
