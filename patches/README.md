# Local Patches

This directory contains the patched upstream crate used by the duc browser WASM build.

## Why patches exist

The upstream `sqlite-wasm-vfs` crate only imports and exports complete database buffers. Duc keeps a small browser-only fork to expose bounded OPFS import and export operations.

## Patches

### sqlite-wasm-vfs (v0.2.0)

Adds bounded `begin_import_db`, `import_db_chunk`, `finish_import_db`, and
`export_db_chunk` operations to the OPFS SAH-pool backend. The fork uses the
upstream `rsqlite-vfs` crate and retains its browser `usize` file-offset limit.

## Usage

The patch is applied via `[patch.crates-io]` in the workspace `Cargo.toml`:

```toml
[patch.crates-io]
sqlite-wasm-vfs = { path = "patches/sqlite-wasm-vfs" }
```

## Upstream tracking

The bounded OPFS operations should be submitted upstream once stable.
