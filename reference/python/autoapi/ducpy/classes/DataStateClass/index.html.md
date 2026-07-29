# ducpy.classes.DataStateClass

## Attributes

| [`DucIssueAnchor`](#ducpy.classes.DataStateClass.DucIssueAnchor)   |    |
|--------------------------------------------------------------------|----|

## Classes

| [`DictionaryEntry`](#ducpy.classes.DataStateClass.DictionaryEntry)             |    |
|--------------------------------------------------------------------------------|----|
| [`Actor`](#ducpy.classes.DataStateClass.Actor)                                 |    |
| [`DucCharterRequirement`](#ducpy.classes.DataStateClass.DucCharterRequirement) |    |
| [`DucCharterConstraint`](#ducpy.classes.DataStateClass.DucCharterConstraint)   |    |
| [`DucCharterDecision`](#ducpy.classes.DataStateClass.DucCharterDecision)       |    |
| [`DucCharterStakeholder`](#ducpy.classes.DataStateClass.DucCharterStakeholder) |    |
| [`DucCharter`](#ducpy.classes.DataStateClass.DucCharter)                       |    |
| [`DucIssueMessage`](#ducpy.classes.DataStateClass.DucIssueMessage)             |    |
| [`DucIssueCanvasAnchor`](#ducpy.classes.DataStateClass.DucIssueCanvasAnchor)   |    |
| [`DucIssueElementAnchor`](#ducpy.classes.DataStateClass.DucIssueElementAnchor) |    |
| [`DucIssueModelAnchor`](#ducpy.classes.DataStateClass.DucIssueModelAnchor)     |    |
| [`DucIssue`](#ducpy.classes.DataStateClass.DucIssue)                           |    |
| [`DucGlobalState`](#ducpy.classes.DataStateClass.DucGlobalState)               |    |
| [`DucLocalState`](#ducpy.classes.DataStateClass.DucLocalState)                 |    |
| [`VersionBase`](#ducpy.classes.DataStateClass.VersionBase)                     |    |
| [`Checkpoint`](#ducpy.classes.DataStateClass.Checkpoint)                       |    |
| [`Delta`](#ducpy.classes.DataStateClass.Delta)                                 |    |
| [`SchemaMigration`](#ducpy.classes.DataStateClass.SchemaMigration)             |    |
| [`VersionChain`](#ducpy.classes.DataStateClass.VersionChain)                   |    |
| [`VersionGraphMetadata`](#ducpy.classes.DataStateClass.VersionGraphMetadata)   |    |
| [`VersionGraph`](#ducpy.classes.DataStateClass.VersionGraph)                   |    |
| [`DisplayPrecision`](#ducpy.classes.DataStateClass.DisplayPrecision)           |    |
| [`ExternalFileRevision`](#ducpy.classes.DataStateClass.ExternalFileRevision)   |    |
| [`DucExternalFile`](#ducpy.classes.DataStateClass.DucExternalFile)             |    |
| [`ExportedDataState`](#ducpy.classes.DataStateClass.ExportedDataState)         |    |

## Module Contents

### *class* ducpy.classes.DataStateClass.DictionaryEntry

#### key *: str*

#### value *: str*

### *class* ducpy.classes.DataStateClass.Actor

#### identifier *: str*

#### name *: str | None* *= None*

### *class* ducpy.classes.DataStateClass.DucCharterRequirement

#### id *: str*

#### statement *: str*

#### must *: bool*

#### acceptance_criteria *: List[str] | None* *= None*

### *class* ducpy.classes.DataStateClass.DucCharterConstraint

#### id *: str*

#### statement *: str*

#### hard *: bool*

### *class* ducpy.classes.DataStateClass.DucCharterDecision

#### id *: str*

#### decision *: str*

#### rationale *: str*

#### accepted *: bool*

#### decided_at *: int*

#### issue_ids *: List[str] | None* *= None*

### *class* ducpy.classes.DataStateClass.DucCharterStakeholder

#### actor *: [Actor](#ducpy.classes.DataStateClass.Actor)*

#### role *: str*

### *class* ducpy.classes.DataStateClass.DucCharter

#### title *: str*

#### objective *: str*

#### phase *: str*

#### requirements *: List[[DucCharterRequirement](#ducpy.classes.DataStateClass.DucCharterRequirement)]*

#### constraints *: List[[DucCharterConstraint](#ducpy.classes.DataStateClass.DucCharterConstraint)]*

#### decisions *: List[[DucCharterDecision](#ducpy.classes.DataStateClass.DucCharterDecision)]*

#### updated_at *: int*

#### description *: str | None* *= None*

#### closed_reason *: str | None* *= None*

#### stakeholders *: List[[DucCharterStakeholder](#ducpy.classes.DataStateClass.DucCharterStakeholder)] | None* *= None*

### *class* ducpy.classes.DataStateClass.DucIssueMessage

#### id *: str*

#### author *: [Actor](#ducpy.classes.DataStateClass.Actor)*

#### content *: str*

#### created_at *: int*

#### reply_to_id *: str | None* *= None*

#### reactions *: Dict[str, List[str]] | None* *= None*

#### edited_at *: int | None* *= None*

#### deleted_at *: int | None* *= None*

### *class* ducpy.classes.DataStateClass.DucIssueCanvasAnchor

#### x *: float*

#### y *: float*

#### scope *: str | None* *= None*

#### type *: str* *= 'canvas'*

### *class* ducpy.classes.DataStateClass.DucIssueElementAnchor

#### element_id *: str*

#### anchor_x *: float | None* *= None*

#### anchor_y *: float | None* *= None*

#### type *: str* *= 'element'*

### *class* ducpy.classes.DataStateClass.DucIssueModelAnchor

#### element_id *: str*

#### point *: List[float]*

#### normal *: List[float] | None* *= None*

#### viewer_state *: [ducpy.classes.ElementsClass.Viewer3DState](../ElementsClass/index.md#ducpy.classes.ElementsClass.Viewer3DState) | None* *= None*

#### topology_id *: str | None* *= None*

#### type *: str* *= 'model'*

### ducpy.classes.DataStateClass.DucIssueAnchor

### *class* ducpy.classes.DataStateClass.DucIssue

#### id *: str*

#### local_id *: int*

#### title *: str*

#### status *: str*

#### messages *: List[[DucIssueMessage](#ducpy.classes.DataStateClass.DucIssueMessage)]*

#### author_id *: str*

#### created_at *: int*

#### updated_at *: int*

#### dismissed_reason *: str | None* *= None*

#### due_date *: int | None* *= None*

#### anchor *: DucIssueAnchor | None* *= None*

#### assignee_ids *: List[str] | None* *= None*

#### follower_ids *: List[str] | None* *= None*

#### deleted_at *: int | None* *= None*

### *class* ducpy.classes.DataStateClass.DucGlobalState

#### view_background_color *: str*

#### main_scope *: str*

#### scope_exponent_threshold *: int*

### *class* ducpy.classes.DataStateClass.DucLocalState

#### scope *: str*

#### scroll_x *: float*

#### scroll_y *: float*

#### zoom *: float*

#### is_binding_enabled *: bool*

#### pen_mode *: bool*

#### view_mode_enabled *: bool*

#### objects_snap_mode_enabled *: bool*

#### grid_mode_enabled *: bool*

#### outline_mode_enabled *: bool*

#### current_item_stroke *: [ducpy.classes.ElementsClass.ElementStroke](../ElementsClass/index.md#ducpy.classes.ElementsClass.ElementStroke) | None*

#### current_item_background *: [ducpy.classes.ElementsClass.ElementBackground](../ElementsClass/index.md#ducpy.classes.ElementsClass.ElementBackground) | None*

#### current_item_opacity *: float | None*

#### current_item_font_family *: str | None*

#### current_item_font_size *: float | None*

#### current_item_text_align *: [ducpy.enums.TEXT_ALIGN](../../enums/index.md#ducpy.enums.TEXT_ALIGN) | None*

#### current_item_roundness *: float | None*

#### current_item_start_line_head *: [ducpy.classes.ElementsClass.DucHead](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucHead) | None*

#### current_item_end_line_head *: [ducpy.classes.ElementsClass.DucHead](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucHead) | None*

#### manual_save_mode *: bool | None* *= None*

#### decimal_places *: int* *= 2*

### *class* ducpy.classes.DataStateClass.VersionBase

#### id *: str*

#### timestamp *: int*

#### is_manual_save *: bool*

#### parent_id *: str | None*

#### description *: str | None*

#### user_id *: str | None*

### *class* ducpy.classes.DataStateClass.Checkpoint

Bases: [`VersionBase`](#ducpy.classes.DataStateClass.VersionBase)

#### version_number *: int* *= 0*

#### schema_version *: int* *= 0*

#### is_schema_boundary *: bool* *= False*

#### data *: bytes* *= b''*

#### size_bytes *: int* *= 0*

#### type *: str* *= 'checkpoint'*

### *class* ducpy.classes.DataStateClass.Delta

Bases: [`VersionBase`](#ducpy.classes.DataStateClass.VersionBase)

#### version_number *: int* *= 0*

#### schema_version *: int* *= 0*

#### base_checkpoint_id *: str* *= ''*

#### payload *: bytes* *= b''*

#### size_bytes *: int* *= 0*

#### type *: str* *= 'delta'*

### *class* ducpy.classes.DataStateClass.SchemaMigration

#### from_schema_version *: int*

#### to_schema_version *: int*

#### migration_name *: str*

#### applied_at *: int*

#### migration_checksum *: str | None* *= None*

#### boundary_checkpoint_id *: str | None* *= None*

### *class* ducpy.classes.DataStateClass.VersionChain

#### id *: str*

#### schema_version *: int*

#### start_version *: int*

#### end_version *: int | None* *= None*

#### migration *: [SchemaMigration](#ducpy.classes.DataStateClass.SchemaMigration) | None* *= None*

#### root_checkpoint_id *: str | None* *= None*

### *class* ducpy.classes.DataStateClass.VersionGraphMetadata

#### current_version *: int*

#### current_schema_version *: int*

#### chain_count *: int*

#### total_size *: int*

### *class* ducpy.classes.DataStateClass.VersionGraph

#### checkpoints *: List[[Checkpoint](#ducpy.classes.DataStateClass.Checkpoint)]*

#### deltas *: List[[Delta](#ducpy.classes.DataStateClass.Delta)]*

#### chains *: List[[VersionChain](#ducpy.classes.DataStateClass.VersionChain)]*

#### metadata *: [VersionGraphMetadata](#ducpy.classes.DataStateClass.VersionGraphMetadata)*

#### user_checkpoint_version_id *: str*

#### latest_version_id *: str*

### *class* ducpy.classes.DataStateClass.DisplayPrecision

#### linear *: int* *= 2*

#### angular *: int* *= 2*

### *class* ducpy.classes.DataStateClass.ExternalFileRevision

#### id *: str*

#### size_bytes *: int*

#### mime_type *: str*

#### created *: int*

#### checksum *: str | None* *= None*

#### source_name *: str | None* *= None*

#### message *: str | None* *= None*

#### last_retrieved *: int | None* *= None*

### *class* ducpy.classes.DataStateClass.DucExternalFile

#### id *: str*

#### active_revision_id *: str*

#### updated *: int*

#### revisions *: Dict[str, [ExternalFileRevision](#ducpy.classes.DataStateClass.ExternalFileRevision)]*

#### version *: int | None* *= None*

### *class* ducpy.classes.DataStateClass.ExportedDataState

#### type *: str*

#### version *: str*

#### source *: str*

#### thumbnail *: bytes*

#### elements *: List[[ducpy.classes.ElementsClass.ElementWrapper](../ElementsClass/index.md#ducpy.classes.ElementsClass.ElementWrapper)]*

#### blocks *: List[[ducpy.classes.ElementsClass.DucBlock](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucBlock)]*

#### block_instances *: List[[ducpy.classes.ElementsClass.DucBlockInstance](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucBlockInstance)]*

#### block_collections *: List[[ducpy.classes.ElementsClass.DucBlockCollection](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucBlockCollection)]*

#### groups *: List[[ducpy.classes.ElementsClass.DucGroup](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucGroup)]*

#### regions *: List[[ducpy.classes.ElementsClass.DucRegion](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucRegion)]*

#### layers *: List[[ducpy.classes.ElementsClass.DucLayer](../ElementsClass/index.md#ducpy.classes.ElementsClass.DucLayer)]*

#### dictionary *: Dict[str, str]*

#### duc_local_state *: [DucLocalState](#ducpy.classes.DataStateClass.DucLocalState) | None*

#### duc_global_state *: [DucGlobalState](#ducpy.classes.DataStateClass.DucGlobalState) | None*

#### version_graph *: [VersionGraph](#ducpy.classes.DataStateClass.VersionGraph) | None*

#### files *: Dict[str, [DucExternalFile](#ducpy.classes.DataStateClass.DucExternalFile)] | None*

#### charter *: [DucCharter](#ducpy.classes.DataStateClass.DucCharter) | None* *= None*

#### issues *: List[[DucIssue](#ducpy.classes.DataStateClass.DucIssue)] | None* *= None*

#### files_data *: Dict[str, bytes] | None* *= None*

#### id *: str | None* *= None*
