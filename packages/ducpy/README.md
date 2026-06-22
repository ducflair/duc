# ducpy

<p align="center">
  <br/>
  <a href="https://duc.ducflair.com" target="_blank"><img width="256px" src="https://cdn.jsdelivr.net/gh/ducflair/assets@main/src/duc/duc-extended.png" /></a>
  <p align="center">2D CAD File Format</p>
  <p align="center" style="align: center;">
    <a href="https://pypi.org/project/ducpy/"><img src="https://shields.io/badge/Pip-blue?logo=Pypi&logoColor=white&style=round-square" alt="Pip" /></a>
    <a href="https://github.com/ducflair/duc/releases"><img src="https://img.shields.io/pypi/v/ducpy?style=round-square&label=latest%20stable" alt="PyPI ducpy@latest release" /></a>
    <a href="https://pypi.org/project/ducpy/"><img src="https://img.shields.io/pypi/dm/ducpy?style=round-square&color=salmon" alt="Downloads" /></a>
    <img src="https://shields.io/badge/Python-ffde57?logo=Python&logoColor=646464&style=round-square" alt="Python" />
  </p>
</p>

The `ducpy` package is the official Python implementation of the `.duc` 2D CAD file format. It is built on top of the [`duc`](../ducrs) Rust crate, exposed as the `ducpy_native` extension. A `.duc` file is a gzip-compressed SQLite database — `ducpy` gives you both a high-level builder DSL and direct low-level access to that schema, plus parsing, serialization, and search helpers.

## Installation

```bash
pip install ducpy
```

or with [`uv`](https://docs.astral.sh/uv/):

```bash
uv add ducpy
```

## Quick start

```python
import ducpy as duc
```

## API overview

`ducpy` is organised around four conceptual entry points, matching the structure of the full [API reference](https://duc.ducflair.com):

### Builders API (High-level)

The easy way to build and manage `.duc` files. Construct elements, apply styles, manage layers, build blocks, and handle document state through the `duc.builders` module.

See the worked examples:

- [Element creation](src/examples/element_creation_demo.py) — building rectangles, ellipses, polygons, lines, arrows, text, frames and plots with the fluent builder DSL.
- [Mutating elements](src/examples/mutation_demo.py) — updating element properties in place and observing version changes.
- [Document elements](src/examples/document_element_demo.py) and [model elements](src/examples/model_element_demo.py) — for the higher-level container / model element types.

### SQL Builder (Low-level)

A `.duc` file is a gzip-compressed SQLite database. Use `duc.builders.sql_builder` (`DucSQL`) for direct schema access, bulk queries, and low-level manipulation.

See the worked example: [SQL Builder](src/examples/sql_builder_demo.py) — `DucSQL.new()` to create a `.duc` from scratch, `DucSQL(path)` to query an existing one.

### Search

Query and search elements and files programmatically through the `duc.search` API.

### File I/O

Read and write `.duc` files using the `duc.parse` and `duc.serialize` modules.

See the worked examples:

- [Parsing](src/examples/parsing_demo.py) — `parse_duc` / `parse_duc_lazy` / `get_external_file` / `list_external_files`.
- [Serialization](src/examples/serialization_demo.py) — `serialize_duc` from builder-created elements.
- [External files](src/examples/external_files_demo.py) — attaching binary blobs (images, PDFs) to a `.duc` document.

## Documentation

For detailed documentation, including the full API reference, schema specification, and end-to-end examples, see:

- API reference & guides: [duc.ducflair.com](https://duc.ducflair.com)
- Source-level reference: [docs/](docs/index.rst)
- Full example index: [docs/examples.rst](docs/examples.rst)

## Tools

- [Playground](https://scopture.com): Experiment with the `duc` format in a live environment.

## Contributing

Feel free to open an issue or contact us at [Ducflair Support](https://www.ducflair.com/support).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.