# ducpy.builders.state_builders

Helper functions for creating DUC state-related objects with a user-friendly API.
Follows the same hierarchical builder pattern as element_builders.py.
Only types from types.rs / duc.sql are supported.

## Classes

| [`BaseStateParams`](#ducpy.builders.state_builders.BaseStateParams)           |    |
|-------------------------------------------------------------------------------|----|
| [`StateBuilder`](#ducpy.builders.state_builders.StateBuilder)                 |    |
| [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder) |    |
| [`GlobalStateBuilder`](#ducpy.builders.state_builders.GlobalStateBuilder)     |    |
| [`LocalStateBuilder`](#ducpy.builders.state_builders.LocalStateBuilder)       |    |
| [`GroupBuilder`](#ducpy.builders.state_builders.GroupBuilder)                 |    |
| [`LayerBuilder`](#ducpy.builders.state_builders.LayerBuilder)                 |    |
| [`RegionBuilder`](#ducpy.builders.state_builders.RegionBuilder)               |    |
| [`VersionGraphBuilder`](#ducpy.builders.state_builders.VersionGraphBuilder)   |    |
| [`CheckpointBuilder`](#ducpy.builders.state_builders.CheckpointBuilder)       |    |
| [`DeltaBuilder`](#ducpy.builders.state_builders.DeltaBuilder)                 |    |
| [`ExternalFileBuilder`](#ducpy.builders.state_builders.ExternalFileBuilder)   |    |
| [`StackBaseBuilder`](#ducpy.builders.state_builders.StackBaseBuilder)         |    |
| [`CharterBuilder`](#ducpy.builders.state_builders.CharterBuilder)             |    |
| [`IssueBuilder`](#ducpy.builders.state_builders.IssueBuilder)                 |    |

## Functions

| [`now_ms`](#ducpy.builders.state_builders.now_ms)(→ int)                                                            | Current Unix timestamp in milliseconds.   |
|---------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| [`create_global_state_from_base`](#ducpy.builders.state_builders.create_global_state_from_base)(...)                |                                           |
| [`create_local_state_from_base`](#ducpy.builders.state_builders.create_local_state_from_base)(...)                  |                                           |
| [`create_group_from_base`](#ducpy.builders.state_builders.create_group_from_base)(...)                              |                                           |
| [`create_layer_from_base`](#ducpy.builders.state_builders.create_layer_from_base)(...)                              |                                           |
| [`create_region_from_base`](#ducpy.builders.state_builders.create_region_from_base)(...)                            |                                           |
| [`create_version_graph_from_base`](#ducpy.builders.state_builders.create_version_graph_from_base)(...)              |                                           |
| [`create_checkpoint_from_base`](#ducpy.builders.state_builders.create_checkpoint_from_base)(...)                    |                                           |
| [`create_delta_from_base`](#ducpy.builders.state_builders.create_delta_from_base)(...)                              |                                           |
| [`create_external_file_from_base`](#ducpy.builders.state_builders.create_external_file_from_base)(...)              |                                           |
| [`create_stack_base_from_base`](#ducpy.builders.state_builders.create_stack_base_from_base)(...)                    |                                           |
| [`create_actor`](#ducpy.builders.state_builders.create_actor)(→ ducpy.classes.DataStateClass.Actor)                 |                                           |
| [`create_viewer3d_grid_uniform`](#ducpy.builders.state_builders.create_viewer3d_grid_uniform)(→ Dict[str, Any])     |                                           |
| [`create_viewer3d_grid_per_plane`](#ducpy.builders.state_builders.create_viewer3d_grid_per_plane)(→ Dict[str, Any]) |                                           |
| [`create_block`](#ducpy.builders.state_builders.create_block)(→ ducpy.classes.ElementsClass.DucBlock)               |                                           |
| [`create_string_value_entry`](#ducpy.builders.state_builders.create_string_value_entry)(...)                        |                                           |

## Module Contents

### ducpy.builders.state_builders.now_ms() → int

Current Unix timestamp in milliseconds.

### *class* ducpy.builders.state_builders.BaseStateParams

#### id *: str | None* *= None*

#### name *: str* *= ''*

#### description *: str* *= ''*

#### version *: str* *= '1.0'*

#### readonly *: bool* *= False*

### *class* ducpy.builders.state_builders.StateBuilder

#### base

#### extra

#### with_id(id: str)

#### with_name(name: str)

#### with_description(description: str)

#### with_version(version: str)

#### with_readonly(readonly: bool)

#### with_extra(\*\*kwargs)

#### build_global_state()

#### build_local_state()

#### build_group()

#### build_layer()

#### build_region()

#### build_version_graph()

#### build_checkpoint()

#### build_delta()

#### build_external_file()

#### build_stack_base()

#### build_charter()

#### build_issue()

### *class* ducpy.builders.state_builders.StateSpecificBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

#### base

#### extra

### *class* ducpy.builders.state_builders.GlobalStateBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_name(name: str)

#### with_view_background_color(color: str)

#### with_main_scope(scope: str)

#### with_scope_exponent_threshold(threshold: int)

#### build() → [ducpy.classes.DataStateClass.DucGlobalState](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucGlobalState)

### *class* ducpy.builders.state_builders.LocalStateBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_scope(scope: str)

#### with_scroll_x(scroll_x: float)

#### with_scroll_y(scroll_y: float)

#### with_zoom(zoom: float)

#### with_is_binding_enabled(enabled: bool)

#### with_pen_mode(pen_mode: bool)

#### with_view_mode_enabled(enabled: bool)

#### with_objects_snap_mode_enabled(enabled: bool)

#### with_grid_mode_enabled(enabled: bool)

#### with_outline_mode_enabled(enabled: bool)

#### with_manual_save_mode(enabled: bool)

#### with_decimal_places(places: int)

#### with_current_item_opacity(opacity: float)

#### with_current_item_font_family(font_family: str)

#### with_current_item_font_size(font_size: float)

#### with_current_item_text_align(text_align: [ducpy.enums.TEXT_ALIGN](../../enums/index.md#ducpy.enums.TEXT_ALIGN))

#### with_current_item_roundness(roundness: float)

#### build() → [ducpy.classes.DataStateClass.DucLocalState](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucLocalState)

### *class* ducpy.builders.state_builders.GroupBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_label(label: str)

#### with_is_collapsed(is_collapsed: bool)

#### with_is_plot(is_plot: bool)

#### with_is_visible(is_visible: bool)

#### with_locked(locked: bool)

#### with_opacity(opacity: float)

#### with_id(id: str)

#### build() → [ducpy.classes.ElementsClass.DucGroup](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucGroup)

### *class* ducpy.builders.state_builders.LayerBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_label(label: str)

#### with_readonly(readonly: bool)

#### with_is_collapsed(is_collapsed: bool)

#### with_is_plot(is_plot: bool)

#### with_is_visible(is_visible: bool)

#### with_locked(locked: bool)

#### with_opacity(opacity: float)

#### with_stroke_color(color: str)

#### with_background_color(color: str)

#### with_id(id: str)

#### build() → [ducpy.classes.ElementsClass.DucLayer](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucLayer)

### *class* ducpy.builders.state_builders.RegionBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_label(label: str)

#### with_boolean_operation(operation: [ducpy.enums.BOOLEAN_OPERATION](../../enums/index.md#ducpy.enums.BOOLEAN_OPERATION))

#### with_is_collapsed(is_collapsed: bool)

#### with_is_plot(is_plot: bool)

#### with_is_visible(is_visible: bool)

#### with_locked(locked: bool)

#### with_opacity(opacity: float)

#### with_id(id: str)

#### build() → [ducpy.classes.ElementsClass.DucRegion](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucRegion)

### *class* ducpy.builders.state_builders.VersionGraphBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_checkpoints(checkpoints: List[[ducpy.classes.DataStateClass.Checkpoint](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Checkpoint)])

#### with_deltas(deltas: List[[ducpy.classes.DataStateClass.Delta](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Delta)])

#### with_user_checkpoint_version_id(version_id: str)

#### with_latest_version_id(version_id: str)

#### build() → [ducpy.classes.DataStateClass.VersionGraph](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.VersionGraph)

### *class* ducpy.builders.state_builders.CheckpointBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_id(id: str)

#### with_parent_id(parent_id: str)

#### with_is_manual_save(is_manual: bool)

#### with_data(data: bytes)

#### with_description(description: str)

#### build() → [ducpy.classes.DataStateClass.Checkpoint](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Checkpoint)

### *class* ducpy.builders.state_builders.DeltaBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_id(id: str)

#### with_payload(payload: bytes)

#### with_parent_id(parent_id: str)

#### with_is_manual_save(is_manual: bool)

#### with_description(description: str)

#### build() → [ducpy.classes.DataStateClass.Delta](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Delta)

### *class* ducpy.builders.state_builders.ExternalFileBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_key(key: str)

#### with_mime_type(mime_type: str)

#### with_data(data: bytes)

#### with_last_retrieved(last_retrieved: int)

#### build() → [ducpy.classes.DataStateClass.DucExternalFile](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucExternalFile)

### *class* ducpy.builders.state_builders.StackBaseBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### with_label(label: str)

#### with_is_collapsed(is_collapsed: bool)

#### with_is_plot(is_plot: bool)

#### with_is_visible(is_visible: bool)

#### with_locked(locked: bool)

#### with_styles(styles: [ducpy.classes.ElementsClass.DucStackLikeStyles](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucStackLikeStyles))

#### build() → [ducpy.classes.ElementsClass.DucStackBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucStackBase)

### ducpy.builders.state_builders.create_global_state_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.DataStateClass.DucGlobalState](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucGlobalState)

### ducpy.builders.state_builders.create_local_state_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.DataStateClass.DucLocalState](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucLocalState)

### ducpy.builders.state_builders.create_group_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.ElementsClass.DucGroup](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucGroup)

### ducpy.builders.state_builders.create_layer_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.ElementsClass.DucLayer](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucLayer)

### ducpy.builders.state_builders.create_region_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.ElementsClass.DucRegion](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucRegion)

### ducpy.builders.state_builders.create_version_graph_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.DataStateClass.VersionGraph](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.VersionGraph)

### ducpy.builders.state_builders.create_checkpoint_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.DataStateClass.Checkpoint](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Checkpoint)

### ducpy.builders.state_builders.create_delta_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.DataStateClass.Delta](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Delta)

### ducpy.builders.state_builders.create_external_file_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.DataStateClass.DucExternalFile](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucExternalFile)

### ducpy.builders.state_builders.create_stack_base_from_base(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), \*\*kwargs) → [ducpy.classes.ElementsClass.DucStackBase](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucStackBase)

### *class* ducpy.builders.state_builders.CharterBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### requirements *: List[[ducpy.classes.DataStateClass.DucCharterRequirement](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucCharterRequirement)]* *= []*

#### constraints *: List[[ducpy.classes.DataStateClass.DucCharterConstraint](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucCharterConstraint)]* *= []*

#### decisions *: List[[ducpy.classes.DataStateClass.DucCharterDecision](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucCharterDecision)]* *= []*

#### stakeholders *: List[[ducpy.classes.DataStateClass.DucCharterStakeholder](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucCharterStakeholder)]* *= []*

#### with_title(title: str)

#### with_description(description: str)

#### with_objective(objective: str)

#### with_phase(phase: str)

#### with_closed_reason(reason: str)

#### with_updated_at(updated_at: int)

#### add_requirement(statement: str, must: bool = True, , id: str | None = None, acceptance_criteria: List[str] | None = None)

#### add_constraint(statement: str, hard: bool = True, , id: str | None = None)

#### add_decision(decision: str, rationale: str, accepted: bool = True, , id: str | None = None, issue_ids: List[str] | None = None, decided_at: int | None = None)

#### add_stakeholder(identifier: str, role: str, , name: str | None = None)

#### build() → [ducpy.classes.DataStateClass.DucCharter](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucCharter)

### *class* ducpy.builders.state_builders.IssueBuilder(base: [BaseStateParams](#ducpy.builders.state_builders.BaseStateParams), extra: dict)

Bases: [`StateSpecificBuilder`](#ducpy.builders.state_builders.StateSpecificBuilder)

#### messages *: List[[ducpy.classes.DataStateClass.DucIssueMessage](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucIssueMessage)]* *= []*

#### assignees *: List[str]* *= []*

#### followers *: List[str]* *= []*

#### with_local_id(local_id: int)

#### with_title(title: str)

#### with_status(status: str)

#### with_author_id(author_id: str)

#### with_dismissed_reason(reason: str)

#### with_due_date(due_date: int)

#### with_created_at(created_at: int)

#### with_updated_at(updated_at: int)

#### with_deleted_at(deleted_at: int)

#### add_assignee(actor_identifier: str)

#### add_follower(actor_identifier: str)

#### add_message(author_id: str, content: str, , name: str | None = None, reply_to_id: str | None = None, reactions: Dict[str, List[str]] | None = None, created_at: int | None = None, edited_at: int | None = None, deleted_at: int | None = None)

#### with_canvas_anchor(x: float, y: float, , scope: str | None = None)

#### with_element_anchor(element_id: str, , anchor_x: float | None = None, anchor_y: float | None = None)

#### with_model_anchor(element_id: str, point: List[float], , normal: List[float] | None = None, viewer_state: [ducpy.classes.ElementsClass.Viewer3DState](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.Viewer3DState) | None = None, topology_id: str | None = None)

#### build() → [ducpy.classes.DataStateClass.DucIssue](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucIssue)

### ducpy.builders.state_builders.create_actor(identifier: str, name: str | None = None) → [ducpy.classes.DataStateClass.Actor](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Actor)

### ducpy.builders.state_builders.create_viewer3d_grid_uniform(value: bool = True) → Dict[str, Any]

### ducpy.builders.state_builders.create_viewer3d_grid_per_plane(xy: bool = True, xz: bool = False, yz: bool = False) → Dict[str, Any]

### ducpy.builders.state_builders.create_block(id: str, label: str, elements: List[[ducpy.classes.ElementsClass.ElementWrapper](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)] | None = None, description: str | None = None) → [ducpy.classes.ElementsClass.DucBlock](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucBlock)

### ducpy.builders.state_builders.create_string_value_entry(key: str, value: str) → [ducpy.classes.ElementsClass.StringValueEntry](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.StringValueEntry)
