# ducpy.utils.convert

Utilities for converting between Python snake_case and Rust/JSON camelCase naming,
and for flattening/nesting element structures to match the Rust serde layout.

## Attributes

| [`_CAMEL_RE1`](#ducpy.utils.convert._CAMEL_RE1)                               |    |
|-------------------------------------------------------------------------------|----|
| [`_CAMEL_RE2`](#ducpy.utils.convert._CAMEL_RE2)                               |    |
| [`_SNAKE_TO_CAMEL_OVERRIDES`](#ducpy.utils.convert._SNAKE_TO_CAMEL_OVERRIDES) |    |
| [`_FLATTEN_KEYS`](#ducpy.utils.convert._FLATTEN_KEYS)                         |    |

## Functions

| [`camel_to_snake`](#ducpy.utils.convert.camel_to_snake)(→ str)               |                                                                                  |
|------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [`snake_to_camel`](#ducpy.utils.convert.snake_to_camel)(→ str)               |                                                                                  |
| [`deep_camel_to_snake`](#ducpy.utils.convert.deep_camel_to_snake)(→ Any)     |                                                                                  |
| [`deep_snake_to_camel`](#ducpy.utils.convert.deep_snake_to_camel)(→ Any)     |                                                                                  |
| [`_flatten_dict`](#ducpy.utils.convert._flatten_dict)(→ dict)                | Recursively flatten keys that Rust serde #[serde(flatten)] would flatten.        |
| [`to_serializable`](#ducpy.utils.convert.to_serializable)(→ Any)             | Convert a value to a JSON-serializable form suitable for the Rust native module. |
| [`extract_embedded_code`](#ducpy.utils.convert.extract_embedded_code)(→ str) | Extracts the body of a Python function as a clean standalone script.             |

## Module Contents

### ducpy.utils.convert.\_CAMEL_RE1

### ducpy.utils.convert.\_CAMEL_RE2

### ducpy.utils.convert.camel_to_snake(name: str) → str

### ducpy.utils.convert.snake_to_camel(name: str) → str

### ducpy.utils.convert.\_SNAKE_TO_CAMEL_OVERRIDES *: Dict[str, str]*

### ducpy.utils.convert.\_FLATTEN_KEYS

### ducpy.utils.convert.deep_camel_to_snake(obj: Any) → Any

### ducpy.utils.convert.deep_snake_to_camel(obj: Any) → Any

### ducpy.utils.convert.\_flatten_dict(d: dict) → dict

Recursively flatten keys that Rust serde #[serde(flatten)] would flatten.

Walks the entire dict so that nested flatten keys (e.g. `stack_element_base`
-> `stack_base` -> `styles`) are all merged into the appropriate level.

### ducpy.utils.convert.to_serializable(obj: Any) → Any

Convert a value to a JSON-serializable form suitable for the Rust native module.

Handles:
- Dataclass instances → dict (recursively)
- bytes → bytes (native serializer accepts PyBytes for binary fields)
- Nested base/styles/linear_base/stack_element_base → flattened
- snake_case keys → camelCase keys

### ducpy.utils.convert.extract_embedded_code(func) → str

Extracts the body of a Python function as a clean standalone script.

This is highly useful for defining CAD/BIM model generation code as actual,
syntax-highlighted Python functions inside examples/tests, and then serializing
them to DUC.

Args:
: func: The Python function/callable to extract the body from.

Returns:
: The body of the function as a clean, dedented string.
