# ducpy.builders.mutate_builder

## Functions

| [`mutate_element`](#ducpy.builders.mutate_builder.mutate_element)(el, \*\*kwargs)                     | Mutate any property of an element (ElementWrapper or direct dataclass instance) using keyword arguments.   |
|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| [`mutate_version_graph`](#ducpy.builders.mutate_builder.mutate_version_graph)(graph, \*\*kwargs)      |                                                                                                            |
| [`mutate_checkpoint`](#ducpy.builders.mutate_builder.mutate_checkpoint)(checkpoint, \*\*kwargs)       |                                                                                                            |
| [`mutate_delta`](#ducpy.builders.mutate_builder.mutate_delta)(delta, \*\*kwargs)                      |                                                                                                            |
| [`mutate_global_state`](#ducpy.builders.mutate_builder.mutate_global_state)(state, \*\*kwargs)        |                                                                                                            |
| [`mutate_local_state`](#ducpy.builders.mutate_builder.mutate_local_state)(state, \*\*kwargs)          |                                                                                                            |
| [`mutate_external_file`](#ducpy.builders.mutate_builder.mutate_external_file)(file_entry, \*\*kwargs) |                                                                                                            |

## Module Contents

### ducpy.builders.mutate_builder.mutate_element(el, \*\*kwargs)

Mutate any property of an element (ElementWrapper or direct dataclass instance) using keyword arguments.
Recursively traverses all nested dataclasses and sets matching properties.
Applies versioning updates (seed, updated, version, version_nonce) to top-level elements or elements with a ‘base’ attribute.
Example: mutate_element(el, x=…, label=…, points=[…], style=…, …)

### ducpy.builders.mutate_builder.mutate_version_graph(graph: [ducpy.classes.DataStateClass.VersionGraph](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.VersionGraph), \*\*kwargs)

### ducpy.builders.mutate_builder.mutate_checkpoint(checkpoint: [ducpy.classes.DataStateClass.Checkpoint](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Checkpoint), \*\*kwargs)

### ducpy.builders.mutate_builder.mutate_delta(delta: [ducpy.classes.DataStateClass.Delta](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.Delta), \*\*kwargs)

### ducpy.builders.mutate_builder.mutate_global_state(state: [ducpy.classes.DataStateClass.DucGlobalState](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucGlobalState), \*\*kwargs)

### ducpy.builders.mutate_builder.mutate_local_state(state: [ducpy.classes.DataStateClass.DucLocalState](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucLocalState), \*\*kwargs)

### ducpy.builders.mutate_builder.mutate_external_file(file_entry: [ducpy.classes.DataStateClass.DucExternalFile](../../classes/DataStateClass/index.md#ducpy.classes.DataStateClass.DucExternalFile), \*\*kwargs)
