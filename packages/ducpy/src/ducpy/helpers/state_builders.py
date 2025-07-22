"""
Helper functions for creating DUC state-related objects with a user-friendly API.
Includes robust mutate_* functions for all state classes.
"""
from typing import List, Optional, Dict, Any
import time
import uuid
from ducpy.utils.mutate_utils import recursive_mutate

from ..classes.DataStateClass import (
    DucGlobalState, DucLocalState, DisplayPrecision,
    VersionGraph, VersionGraphMetadata, Checkpoint, Delta, JSONPatchOperation,
    DucExternalFileData, DucExternalFileEntry
)
from ..classes.StandardsClass import (
    GridSettings, SnapSettings, GridStyle, PolarGridSettings, IsometricGridSettings,
    SnapOverride, DynamicSnapSettings, PolarTrackingSettings, TrackingLineStyle,
    LayerSnapFilters, SnapMarkerSettings, SnapMarkerStyle, SnapMarkerStyleEntry
)
from ..classes.ElementsClass import (
    DucView, DucUcs, DucPoint, GeometricPoint
)
from ..Duc.PRUNING_LEVEL import PRUNING_LEVEL
from ..Duc.GRID_TYPE import GRID_TYPE
from ..Duc.GRID_DISPLAY_TYPE import GRID_DISPLAY_TYPE
from ..Duc.SNAP_MODE import SNAP_MODE
from ..Duc.OBJECT_SNAP_MODE import OBJECT_SNAP_MODE
from ..Duc.SNAP_MARKER_SHAPE import SNAP_MARKER_SHAPE
from ..utils.rand_utils import generate_random_id

def create_view(
    scroll_x: float = 0.0,
    scroll_y: float = 0.0,
    zoom: float = 1.0,
    twist_angle: float = 0.0,
    center_x: float = 0.0,
    center_y: float = 0.0,
    center_point: Optional[DucPoint] = None,
    scope: str = "mm"
) -> DucView:
    if center_point is None:
        center_point = DucPoint(x=center_x, y=center_y)
    return DucView(
        scroll_x=scroll_x,
        scroll_y=scroll_y,
        zoom=zoom,
        twist_angle=twist_angle,
        center_point=center_point,
        scope=scope
    )

def create_ucs(
    origin_x: float = 0.0,
    origin_y: float = 0.0,
    angle: float = 0.0
) -> DucUcs:
    origin = GeometricPoint(x=origin_x, y=origin_y)
    return DucUcs(
        origin=origin,
        angle=angle
    )

def create_global_state(
    view_background_color: str = "#FFFFFF",
    main_scope: str = "mm",
    dash_spacing_scale: float = 1.0,
    is_dash_spacing_affected_by_viewport_scale: bool = False,
    scope_exponent_threshold: int = 6,
    dimensions_associative_by_default: bool = True,
    use_annotative_scaling: bool = False,
    linear_precision: int = 2,
    angular_precision: int = 2,
    name: Optional[str] = None
) -> DucGlobalState:
    display_precision = DisplayPrecision(
        linear=linear_precision,
        angular=angular_precision
    )
    return DucGlobalState(
        view_background_color=view_background_color,
        main_scope=main_scope,
        dash_spacing_scale=dash_spacing_scale,
        is_dash_spacing_affected_by_viewport_scale=is_dash_spacing_affected_by_viewport_scale,
        scope_exponent_threshold=scope_exponent_threshold,
        dimensions_associative_by_default=dimensions_associative_by_default,
        use_annotative_scaling=use_annotative_scaling,
        display_precision=display_precision,
        name=name
    )

def create_local_state(
    scope: str = "mm",
    active_standard_id: str = "default",
    scroll_x: float = 0.0,
    scroll_y: float = 0.0,
    zoom: float = 1.0,
    is_binding_enabled: bool = True,
    pen_mode: bool = False,
    view_mode_enabled: bool = False,
    objects_snap_mode_enabled: bool = True,
    grid_mode_enabled: bool = True,
    outline_mode_enabled: bool = False,
) -> DucLocalState:
    return DucLocalState(
        scope=scope,
        active_standard_id=active_standard_id,
        scroll_x=scroll_x,
        scroll_y=scroll_y,
        zoom=zoom,
        is_binding_enabled=is_binding_enabled,
        pen_mode=pen_mode,
        view_mode_enabled=view_mode_enabled,
        objects_snap_mode_enabled=objects_snap_mode_enabled,
        grid_mode_enabled=grid_mode_enabled,
        outline_mode_enabled=outline_mode_enabled
    )

def create_version_graph(
    checkpoints: Optional[List[Checkpoint]] = None,
    deltas: Optional[List[Delta]] = None,
    pruning_level: PRUNING_LEVEL = PRUNING_LEVEL.CONSERVATIVE,
    user_checkpoint_version_id: Optional[str] = None,
    latest_version_id: Optional[str] = None
) -> VersionGraph:
    metadata = VersionGraphMetadata(
        last_pruned=int(time.time() * 1000),
        total_size=0,
        pruning_level=pruning_level
    )
    return VersionGraph(
        checkpoints=checkpoints or [],
        deltas=deltas or [],
        metadata=metadata,
        user_checkpoint_version_id=user_checkpoint_version_id or "",
        latest_version_id=latest_version_id or ""
    )

def create_checkpoint(
    id: Optional[str] = None,
    parent_id: Optional[str] = None,
    description: Optional[str] = None,
    is_manual_save: bool = False,
    data: bytes = b""
) -> Checkpoint:
    return Checkpoint(
        id=id or generate_random_id(),
        timestamp=int(time.time() * 1000),
        is_manual_save=is_manual_save,
        parent_id=parent_id,
        description=description,
        data=data,
        size_bytes=len(data)
    )

def create_delta(
    patch: List[JSONPatchOperation],
    id: Optional[str] = None,
    parent_id: Optional[str] = None,
    description: Optional[str] = None,
    is_manual_save: bool = False
) -> Delta:
    return Delta(
        id=id or generate_random_id(),
        timestamp=int(time.time() * 1000),
        is_manual_save=is_manual_save,
        parent_id=parent_id,
        description=description,
        patch=patch
    )

def create_external_file(
    key: str,
    mime_type: str,
    data: bytes,
    id: Optional[str] = None,
) -> DucExternalFileEntry:
    file_data = DucExternalFileData(
        mime_type=mime_type,
        id=id or generate_random_id(),
        data=data,
        created=int(time.time() * 1000)
    )
    return DucExternalFileEntry(
        key=key,
        value=file_data
    )

def create_grid_settings(
    is_adaptive: bool = True,
    x_spacing: float = 10.0,
    y_spacing: float = 10.0,
    subdivisions: int = 10,
    origin_x: float = 0.0,
    origin_y: float = 0.0,
    rotation: float = 0.0,
    follow_ucs: bool = True,
    major_color: str = "#808080",
    minor_color: str = "#E0E0E0",
    type: GRID_TYPE = GRID_TYPE.RECTANGULAR,
    display_type: GRID_DISPLAY_TYPE = GRID_DISPLAY_TYPE.LINES
) -> GridSettings:
    origin = GeometricPoint(x=origin_x, y=origin_y)
    major_style = GridStyle(color=major_color, opacity=0.5)
    minor_style = GridStyle(color=minor_color, opacity=0.5)
    return GridSettings(
        is_adaptive=is_adaptive,
        x_spacing=x_spacing,
        y_spacing=y_spacing,
        subdivisions=subdivisions,
        origin=origin,
        rotation=rotation,
        follow_ucs=follow_ucs,
        major_style=major_style,
        minor_style=minor_style,
        show_minor=True,
        min_zoom=0.1,
        max_zoom=10.0,
        auto_hide=False,
        enable_snapping=True,
        readonly=False,
        type=type,
        display_type=display_type
    )

def create_snap_settings(
    readonly: bool = False,
    twist_angle: float = 0.0,
    snap_tolerance: int = 10,
    object_snap_aperture: int = 10,
    is_ortho_mode_on: bool = False,
    is_object_snap_on: bool = True,
    active_object_snap_modes: Optional[List[OBJECT_SNAP_MODE]] = None,
    snap_mode: SNAP_MODE = SNAP_MODE.RUNNING
) -> SnapSettings:
    if active_object_snap_modes is None:
        active_object_snap_modes = [OBJECT_SNAP_MODE.ENDPOINT, OBJECT_SNAP_MODE.MIDPOINT]
    polar_tracking = PolarTrackingSettings(
        enabled=True,
        angles=[0, 90, 180, 270],
        track_from_last_point=True,
        show_polar_coordinates=True
    )
    dynamic_snap = DynamicSnapSettings(
        enabled_during_drag=True,
        enabled_during_rotation=True,
        enabled_during_scale=True
    )
    snap_markers = SnapMarkerSettings(
        enabled=True,
        size=8,
        styles=[
            SnapMarkerStyleEntry(key=OBJECT_SNAP_MODE.ENDPOINT, value=SnapMarkerStyle(shape=SNAP_MARKER_SHAPE.SQUARE, color="#FF0000")),
            SnapMarkerStyleEntry(key=OBJECT_SNAP_MODE.MIDPOINT, value=SnapMarkerStyle(shape=SNAP_MARKER_SHAPE.TRIANGLE, color="#00FF00"))
        ]
    )
    return SnapSettings(
        readonly=readonly,
        twist_angle=twist_angle,
        snap_tolerance=snap_tolerance,
        object_snap_aperture=object_snap_aperture,
        is_ortho_mode_on=is_ortho_mode_on,
        polar_tracking=polar_tracking,
        is_object_snap_on=is_object_snap_on,
        active_object_snap_modes=active_object_snap_modes,
        snap_priority=[],
        show_tracking_lines=True,
        dynamic_snap=dynamic_snap,
        snap_markers=snap_markers,
        construction_snap_enabled=True,
        snap_mode=snap_mode
    )

# --- Mutate helpers for state classes ---

def mutate_version_graph(graph, **kwargs):
    recursive_mutate(graph, kwargs)
    return graph

def mutate_checkpoint(checkpoint, **kwargs):
    recursive_mutate(checkpoint, kwargs)
    return checkpoint

def mutate_delta(delta, **kwargs):
    recursive_mutate(delta, kwargs)
    return delta

def mutate_global_state(state, **kwargs):
    recursive_mutate(state, kwargs)
    return state

def mutate_local_state(state, **kwargs):
    recursive_mutate(state, kwargs)
    return state

def mutate_external_file(file_entry, **kwargs):
    recursive_mutate(file_entry, kwargs)
    return file_entry

def mutate_grid_settings(grid, **kwargs):
    recursive_mutate(grid, kwargs)
    return grid

def mutate_snap_settings(snap, **kwargs):
    recursive_mutate(snap, kwargs)
    return snap

def mutate_view(view, **kwargs):
    recursive_mutate(view, kwargs)
    return view

def mutate_ucs(ucs, **kwargs):
    recursive_mutate(ucs, kwargs)
    return ucs
