"""
Helper functions for creating DUC state-related objects with a user-friendly API.
Follows the same hierarchical builder pattern as element_builders.py.
Only types from types.rs / duc.sql are supported.
"""
import time
from dataclasses import dataclass
from typing import Any, List, Optional

from ducpy.utils.rand_utils import generate_random_id

from ..classes.DataStateClass import (Checkpoint, Delta, DucExternalFileData,
                                      DucExternalFileEntry, DucGlobalState,
                                      DucLocalState, VersionGraph,
                                      VersionGraphMetadata)
from ..classes.ElementsClass import (DucBlock, DucBlockMetadata, DucGroup,
                                     DucLayer, DucLayerOverrides, DucRegion,
                                     DucStackBase, DucStackLikeStyles,
                                     ElementWrapper, StringValueEntry)
from ..enums import BOOLEAN_OPERATION, PRUNING_LEVEL, TEXT_ALIGN


@dataclass
class BaseStateParams:
    id: Optional[str] = None
    name: str = ""
    description: str = ""
    version: str = "1.0"
    readonly: bool = False


class StateBuilder:
    def __init__(self):
        self.base = BaseStateParams()
        self.extra = {}

    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_name(self, name: str):
        self.base.name = name
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def with_version(self, version: str):
        self.base.version = version
        return self

    def with_readonly(self, readonly: bool):
        self.base.readonly = readonly
        return self

    def with_extra(self, **kwargs):
        self.extra.update(kwargs)
        return self

    def build_global_state(self):
        return GlobalStateBuilder(self.base, self.extra)

    def build_local_state(self):
        return LocalStateBuilder(self.base, self.extra)

    def build_group(self):
        return GroupBuilder(self.base, self.extra)

    def build_layer(self):
        return LayerBuilder(self.base, self.extra)

    def build_region(self):
        return RegionBuilder(self.base, self.extra)

    def build_version_graph(self):
        return VersionGraphBuilder(self.base, self.extra)

    def build_checkpoint(self):
        return CheckpointBuilder(self.base, self.extra)

    def build_delta(self):
        return DeltaBuilder(self.base, self.extra)

    def build_external_file(self):
        return ExternalFileBuilder(self.base, self.extra)

    def build_stack_base(self):
        return StackBaseBuilder(self.base, self.extra)


class StateSpecificBuilder:
    def __init__(self, base: BaseStateParams, extra: dict):
        self.base = base
        self.extra = extra.copy()


class GlobalStateBuilder(StateSpecificBuilder):
    def with_name(self, name: str):
        self.base.name = name
        return self

    def with_view_background_color(self, color: str):
        self.extra["view_background_color"] = color
        return self

    def with_main_scope(self, scope: str):
        self.extra["main_scope"] = scope
        return self

    def with_scope_exponent_threshold(self, threshold: int):
        self.extra["scope_exponent_threshold"] = threshold
        return self

    def with_pruning_level(self, level: PRUNING_LEVEL):
        self.extra["pruning_level"] = level
        return self

    def build(self) -> DucGlobalState:
        return create_global_state_from_base(self.base, **self.extra)


class LocalStateBuilder(StateSpecificBuilder):
    def with_scope(self, scope: str):
        self.extra["scope"] = scope
        return self

    def with_scroll_x(self, scroll_x: float):
        self.extra["scroll_x"] = scroll_x
        return self

    def with_scroll_y(self, scroll_y: float):
        self.extra["scroll_y"] = scroll_y
        return self

    def with_zoom(self, zoom: float):
        self.extra["zoom"] = zoom
        return self

    def with_is_binding_enabled(self, enabled: bool):
        self.extra["is_binding_enabled"] = enabled
        return self

    def with_pen_mode(self, pen_mode: bool):
        self.extra["pen_mode"] = pen_mode
        return self

    def with_view_mode_enabled(self, enabled: bool):
        self.extra["view_mode_enabled"] = enabled
        return self

    def with_objects_snap_mode_enabled(self, enabled: bool):
        self.extra["objects_snap_mode_enabled"] = enabled
        return self

    def with_grid_mode_enabled(self, enabled: bool):
        self.extra["grid_mode_enabled"] = enabled
        return self

    def with_outline_mode_enabled(self, enabled: bool):
        self.extra["outline_mode_enabled"] = enabled
        return self

    def with_manual_save_mode(self, enabled: bool):
        self.extra["manual_save_mode"] = enabled
        return self

    def with_decimal_places(self, places: int):
        self.extra["decimal_places"] = places
        return self

    def with_current_item_opacity(self, opacity: float):
        self.extra["current_item_opacity"] = opacity
        return self

    def with_current_item_font_family(self, font_family: str):
        self.extra["current_item_font_family"] = font_family
        return self

    def with_current_item_font_size(self, font_size: float):
        self.extra["current_item_font_size"] = font_size
        return self

    def with_current_item_text_align(self, text_align: TEXT_ALIGN):
        self.extra["current_item_text_align"] = text_align
        return self

    def with_current_item_roundness(self, roundness: float):
        self.extra["current_item_roundness"] = roundness
        return self

    def build(self) -> DucLocalState:
        return create_local_state_from_base(self.base, **self.extra)


class GroupBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_opacity(self, opacity: float):
        self.extra["opacity"] = opacity
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def build(self) -> DucGroup:
        return create_group_from_base(self.base, **self.extra)


class LayerBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_readonly(self, readonly: bool):
        self.extra["readonly"] = readonly
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_opacity(self, opacity: float):
        self.extra["opacity"] = opacity
        return self

    def with_stroke_color(self, color: str):
        self.extra["stroke_color"] = color
        return self

    def with_background_color(self, color: str):
        self.extra["background_color"] = color
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def build(self) -> DucLayer:
        return create_layer_from_base(self.base, **self.extra)


class RegionBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_boolean_operation(self, operation: BOOLEAN_OPERATION):
        self.extra["boolean_operation"] = operation
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_opacity(self, opacity: float):
        self.extra["opacity"] = opacity
        return self

    def with_id(self, id: str):
        self.base.id = id
        return self

    def build(self) -> DucRegion:
        return create_region_from_base(self.base, **self.extra)


class VersionGraphBuilder(StateSpecificBuilder):
    def with_checkpoints(self, checkpoints: List[Checkpoint]):
        self.extra["checkpoints"] = checkpoints
        return self

    def with_deltas(self, deltas: List[Delta]):
        self.extra["deltas"] = deltas
        return self

    def with_user_checkpoint_version_id(self, version_id: str):
        self.extra["user_checkpoint_version_id"] = version_id
        return self

    def with_latest_version_id(self, version_id: str):
        self.extra["latest_version_id"] = version_id
        return self

    def build(self) -> VersionGraph:
        return create_version_graph_from_base(self.base, **self.extra)


class CheckpointBuilder(StateSpecificBuilder):
    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_parent_id(self, parent_id: str):
        self.extra["parent_id"] = parent_id
        return self

    def with_is_manual_save(self, is_manual: bool):
        self.extra["is_manual_save"] = is_manual
        return self

    def with_data(self, data: bytes):
        self.extra["data"] = data
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def build(self) -> Checkpoint:
        return create_checkpoint_from_base(self.base, **self.extra)


class DeltaBuilder(StateSpecificBuilder):
    def with_id(self, id: str):
        self.base.id = id
        return self

    def with_payload(self, payload: bytes):
        self.extra["payload"] = payload
        return self

    def with_parent_id(self, parent_id: str):
        self.extra["parent_id"] = parent_id
        return self

    def with_is_manual_save(self, is_manual: bool):
        self.extra["is_manual_save"] = is_manual
        return self

    def with_description(self, description: str):
        self.base.description = description
        return self

    def build(self) -> Delta:
        return create_delta_from_base(self.base, **self.extra)


class ExternalFileBuilder(StateSpecificBuilder):
    def with_key(self, key: str):
        self.extra["key"] = key
        return self

    def with_mime_type(self, mime_type: str):
        self.extra["mime_type"] = mime_type
        return self

    def with_data(self, data: bytes):
        self.extra["data"] = data
        return self

    def with_last_retrieved(self, last_retrieved: int):
        self.extra["last_retrieved"] = last_retrieved
        return self

    def build(self) -> DucExternalFileEntry:
        return create_external_file_from_base(self.base, **self.extra)


class StackBaseBuilder(StateSpecificBuilder):
    def with_label(self, label: str):
        self.extra["label"] = label
        return self

    def with_is_collapsed(self, is_collapsed: bool):
        self.extra["is_collapsed"] = is_collapsed
        return self

    def with_is_plot(self, is_plot: bool):
        self.extra["is_plot"] = is_plot
        return self

    def with_is_visible(self, is_visible: bool):
        self.extra["is_visible"] = is_visible
        return self

    def with_locked(self, locked: bool):
        self.extra["locked"] = locked
        return self

    def with_styles(self, styles: DucStackLikeStyles):
        self.extra["styles"] = styles
        return self

    def build(self) -> DucStackBase:
        return create_stack_base_from_base(self.base, **self.extra)


# =============== CREATE FUNCTIONS ===============

def create_global_state_from_base(base: BaseStateParams, **kwargs) -> DucGlobalState:
    return DucGlobalState(
        name=base.name or None,
        view_background_color=kwargs.get('view_background_color', "#FFFFFF"),
        main_scope=kwargs.get('main_scope', "mm"),
        scope_exponent_threshold=kwargs.get('scope_exponent_threshold', 6),
        pruning_level=kwargs.get('pruning_level', None),
    )


def create_local_state_from_base(base: BaseStateParams, **kwargs) -> DucLocalState:
    return DucLocalState(
        scope=kwargs.get('scope', "mm"),
        scroll_x=kwargs.get('scroll_x', 0.0),
        scroll_y=kwargs.get('scroll_y', 0.0),
        zoom=kwargs.get('zoom', 1.0),
        is_binding_enabled=kwargs.get('is_binding_enabled', True),
        current_item_stroke=kwargs.get('current_item_stroke', None),
        current_item_background=kwargs.get('current_item_background', None),
        current_item_opacity=kwargs.get('current_item_opacity', 1.0),
        current_item_font_family=kwargs.get('current_item_font_family', "Virgil"),
        current_item_font_size=kwargs.get('current_item_font_size', 20.0),
        current_item_text_align=kwargs.get('current_item_text_align', None),
        current_item_roundness=kwargs.get('current_item_roundness', 0.0),
        current_item_start_line_head=kwargs.get('current_item_start_line_head', None),
        current_item_end_line_head=kwargs.get('current_item_end_line_head', None),
        pen_mode=kwargs.get('pen_mode', False),
        view_mode_enabled=kwargs.get('view_mode_enabled', False),
        objects_snap_mode_enabled=kwargs.get('objects_snap_mode_enabled', True),
        grid_mode_enabled=kwargs.get('grid_mode_enabled', True),
        outline_mode_enabled=kwargs.get('outline_mode_enabled', False),
        manual_save_mode=kwargs.get('manual_save_mode', None),
        decimal_places=kwargs.get('decimal_places', 2),
    )


def create_group_from_base(base: BaseStateParams, **kwargs) -> DucGroup:
    if base.id is None:
        base.id = generate_random_id()

    stack_base = DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=DucStackLikeStyles(
            opacity=kwargs.get('opacity', 1.0)
        ),
        description=base.description
    )

    return DucGroup(
        id=base.id,
        stack_base=stack_base
    )


def create_layer_from_base(base: BaseStateParams, **kwargs) -> DucLayer:
    if base.id is None:
        base.id = generate_random_id()

    stack_base = DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=DucStackLikeStyles(
            opacity=kwargs.get('opacity', 1.0)
        ),
        description=base.description
    )

    from .style_builders import (create_background, create_solid_content,
                                 create_stroke)

    stroke_content = create_solid_content(
        color=kwargs.get('stroke_color', "#000000"),
        opacity=1.0,
        visible=True
    )

    background_content = create_solid_content(
        color=kwargs.get('background_color', "#FFFFFF"),
        opacity=1.0,
        visible=True
    )

    stroke = create_stroke(content=stroke_content, width=1.0)
    background = create_background(background_content)

    overrides = DucLayerOverrides(
        stroke=stroke,
        background=background
    )

    return DucLayer(
        id=base.id,
        stack_base=stack_base,
        readonly=kwargs.get('readonly', False),
        overrides=overrides
    )


def create_region_from_base(base: BaseStateParams, **kwargs) -> DucRegion:
    if base.id is None:
        base.id = generate_random_id()

    stack_base = DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=DucStackLikeStyles(
            opacity=kwargs.get('opacity', 1.0)
        ),
        description=base.description
    )

    return DucRegion(
        id=base.id,
        stack_base=stack_base,
        boolean_operation=kwargs.get('boolean_operation', BOOLEAN_OPERATION.UNION)
    )


def create_version_graph_from_base(base: BaseStateParams, **kwargs) -> VersionGraph:
    metadata = VersionGraphMetadata(
        current_version=0,
        current_schema_version=0,
        chain_count=0,
        last_pruned=int(time.time() * 1000),
        total_size=0,
    )
    return VersionGraph(
        checkpoints=kwargs.get('checkpoints', []),
        deltas=kwargs.get('deltas', []),
        chains=kwargs.get('chains', []),
        metadata=metadata,
        user_checkpoint_version_id=kwargs.get('user_checkpoint_version_id', ""),
        latest_version_id=kwargs.get('latest_version_id', "")
    )


def create_checkpoint_from_base(base: BaseStateParams, **kwargs) -> Checkpoint:
    return Checkpoint(
        id=base.id or generate_random_id(),
        timestamp=int(time.time() * 1000),
        is_manual_save=kwargs.get('is_manual_save', False),
        parent_id=kwargs.get('parent_id'),
        description=base.description,
        user_id=kwargs.get('user_id'),
        type=kwargs.get('type', "checkpoint"),
        data=kwargs.get('data', b""),
        size_bytes=len(kwargs.get('data', b""))
    )


def create_delta_from_base(base: BaseStateParams, **kwargs) -> Delta:
    return Delta(
        id=base.id or generate_random_id(),
        timestamp=int(time.time() * 1000),
        is_manual_save=kwargs.get('is_manual_save', False),
        parent_id=kwargs.get('parent_id'),
        description=base.description,
        user_id=kwargs.get('user_id'),
        type=kwargs.get('type', "delta"),
        payload=kwargs.get('payload', b""),
        size_bytes=len(kwargs.get('payload', b""))
    )


def create_external_file_from_base(base: BaseStateParams, **kwargs) -> DucExternalFileEntry:
    file_data = DucExternalFileData(
        mime_type=kwargs.get('mime_type', ""),
        id=base.id or generate_random_id(),
        data=kwargs.get('data', b""),
        created=int(time.time() * 1000),
        last_retrieved=kwargs.get('last_retrieved')
    )
    return DucExternalFileEntry(
        key=kwargs.get('key', ""),
        value=file_data
    )


def create_stack_base_from_base(base: BaseStateParams, **kwargs) -> DucStackBase:
    return DucStackBase(
        label=kwargs.get('label', ""),
        is_collapsed=kwargs.get('is_collapsed', False),
        is_plot=kwargs.get('is_plot', False),
        is_visible=kwargs.get('is_visible', True),
        locked=kwargs.get('locked', False),
        styles=kwargs.get('styles', DucStackLikeStyles(opacity=1.0)),
        description=base.description
    )


def create_block(
    id: str,
    label: str,
    elements: Optional[List[ElementWrapper]] = None,
    description: Optional[str] = None
) -> DucBlock:
    metadata = DucBlockMetadata(
        source="ducpy",
        usage_count=0,
        created_at=int(time.time() * 1000),
        updated_at=int(time.time() * 1000),
        localization=None
    )

    return DucBlock(
        id=id,
        label=label,
        version=1,
        description=description,
        metadata=metadata,
        thumbnail=None
    )


def create_string_value_entry(key: str, value: str) -> StringValueEntry:
    return StringValueEntry(key=key, value=value)

