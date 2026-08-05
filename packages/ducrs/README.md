# duc (Rust)

<p align="center">
  <br/>
  <a href="https://duc.ducflair.com" target="_blank"><img width="256px" src="https://cdn.jsdelivr.net/gh/ducflair/assets@main/src/duc/duc-extended.png" /></a>
  <p align="center">SQLite-backed project-state format for physical-engineering work before execution</p>
  <p align="center" style="align: center;">
    <a href="https://crates.io/crates/duc"><img src="https://shields.io/badge/Crates-FFC933?logo=Rust&logoColor=646464&style=round-square" alt="Crates" /></a>
    <a href="https://github.com/ducflair/duc/releases"><img src="https://img.shields.io/crates/v/duc?style=round-square&label=latest%20stable" alt="crates.io duc@latest release" /></a>
    <a href="https://crates.io/crates/duc"><img src="https://img.shields.io/crates/d/duc?style=round-square&color=salmon" alt="Downloads" /></a>
    <img src="https://shields.io/badge/Rust-CE412B?logo=Rust&logoColor=fff&style=round-square" alt="Rust" />
  </p>
</p>

The `duc` crate is the canonical Rust implementation of the `.duc` project-state format and the **root of the entire Duc ecosystem**. [`ducpy`](https://pypi.org/project/ducpy/), [`ducjs`](https://www.npmjs.com/package/ducjs), and the rest of the toolchain are all built on top of the types, parsers and storage layer defined here.

A `.duc` file is a standard gzip-compressed **SQLite database file** following the schema in `schema/duc.sql`. This crate wraps that database in a strongly-typed Rust API for reading, writing and manipulating `.duc` documents.


----
<br/>
<br/>
<br/>

## Schema and migrations

The canonical SQL lives at `schema/duc.sql` (plus `schema/version_control.sql` and `schema/search.sql`) and is **embedded at compile time** by [`build.rs`](build.rs)

Migrations are ran and handled **automatically** upon usage of the library. Each migration is a SQL file named `<from>_to_<to>.sql` in `schema/migrations/`. `build.rs` scans that directory, sorts by `from_version` and emits a static `MIGRATIONS` array. Adding a new migration requires **no Rust changes** — drop the file in and rebuild.

## Features

| Feature | Default | Description |
|---------|---------|-------------|
| `default` | ✅ | Native build with bundled SQLite |
| `opfs` | ❌ | OPFS SAH-pool VFS for `wasm32-unknown-unknown` (browser persistence) |


## Documentation

- Full API reference: [docs.rs/duc](https://docs.rs/duc)
- Format specification, concepts and guides: [duc.ducflair.com](https://duc.ducflair.com)

## Tools

- [Playground](https://ducflair.com/core): Experiment with the `.duc` format in the browser.

## Contributing

Feel free to open an issue or contact us at [Ducflair Support](https://www.ducflair.com/support).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.