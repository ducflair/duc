# ducpy

Python library for the .duc project-state format for physical-engineering work before execution.

Usage:
: `import ducpy as duc`

Builders API (High-level):
: The easy way to build, manage `.duc` files.
  Construct elements, apply styles, manage layers, build blocks,
  and handle document state with the `duc.builders` module.

SQL Builder (Low-level):
: A `.duc` file is a gzip-compressed SQLite database. Use
  `duc.builders.sql_builder` for direct schema access, bulk
  queries, and low-level manipulation.

Search:
: Query/search elements and files programmatically via the
  `duc.search` API.

File I/O:
: Read and write `.duc` files using the `duc.parse`
  and `duc.serialize` modules.

## Submodules

* [ducpy.builders](builders/index.html.md)
* [ducpy.classes](classes/index.html.md)
* [ducpy.enums](enums/index.html.md)
* [ducpy.model_output](model_output/index.html.md)
* [ducpy.parse](parse/index.html.md)
* [ducpy.search](search/index.html.md)
* [ducpy.serialize](serialize/index.html.md)
* [ducpy.tessellate](tessellate/index.html.md)
* [ducpy.utils](utils/index.html.md)
