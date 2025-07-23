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
    last_retrieved: Optional[int] = None,
) -> DucExternalFileEntry:
    file_data = DucExternalFileData(
        mime_type=mime_type,
        id=id or generate_random_id(),
        data=data,
        created=int(time.time() * 1000),
        last_retrieved=last_retrieved
    )
    return DucExternalFileEntry(
        key=key,
        value=file_data
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
