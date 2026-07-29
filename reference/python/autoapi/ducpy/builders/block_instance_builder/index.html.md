# ducpy.builders.block_instance_builder

## Classes

| [`BlockInstanceBuilder`](#ducpy.builders.block_instance_builder.BlockInstanceBuilder)   |    |
|-----------------------------------------------------------------------------------------|----|

## Module Contents

### *class* ducpy.builders.block_instance_builder.BlockInstanceBuilder(id: str, block_id: str, version: int)

#### \_id

#### \_block_id

#### \_version

#### \_element_overrides *: List[[ducpy.classes.ElementsClass.StringValueEntry](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.StringValueEntry)]* *= []*

#### \_duplication_array *: [ducpy.classes.ElementsClass.DucBlockDuplicationArray](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucBlockDuplicationArray) | None* *= None*

#### with_element_override(key: str, value: str) → [BlockInstanceBuilder](#ducpy.builders.block_instance_builder.BlockInstanceBuilder)

#### with_duplication_array(rows: int, cols: int, row_spacing: float, col_spacing: float) → [BlockInstanceBuilder](#ducpy.builders.block_instance_builder.BlockInstanceBuilder)

#### build() → [ducpy.classes.ElementsClass.DucBlockInstance](../../classes/ElementsClass/index.md#ducpy.classes.ElementsClass.DucBlockInstance)
