---
name: duc-fixtures
description: >
  Use this skill whenever fetching, referencing, or adding test fixtures and binary assets from
  the ducflair/fixtures repository. Triggers when using CDN/raw GitHub fallback utilities, loading
  sample files (.pdf, .ifc, .dxf, .stp, .jpg, .png, .duc) in tests or examples, or managing assets
  in the monorepo's assets/testing directory.
---

# Using Fixtures from `ducflair/fixtures`

The `ducflair/fixtures` repository ([github.com/ducflair/fixtures](https://github.com/ducflair/fixtures)) hosts binary test assets (PDFs, 3D CAD models, images, sample `.duc` databases) to avoid bloating the core `duc` monorepo git history.

---

## 1. Asset Storage & Path Structure

Fixtures live under the `src/` directory of `ducflair/fixtures`, organized by file category:

```
ducflair/fixtures/src/
├── pdf-files/
│   └── test.pdf
├── ifc-files/
│   └── NVW_DCR-LOD100_Arch.ifc
├── dxf-files/
│   └── columns_R2007.dxf
├── step-files/
│   └── cis/MainSteel_structural.stp
├── png-files/
│   ├── thumbnail.png
│   └── infinite-zoom-math.png
├── jpeg-files/
│   └── test.jpg
└── duc-files/
    └── universal.duc
```

---

## 2. CDN & Fallback Resolution Strategy

When loading remote fixtures dynamically:

1. **Primary CDN (jsDelivr)**:
   `https://cdn.jsdelivr.net/gh/ducflair/fixtures@main/src/<path>`
   Fast, edge-cached delivery for general test runs, demos, and examples.
2. **Fallback (GitHub Raw)**:
   `https://raw.githubusercontent.com/ducflair/fixtures/main/src/<path>`
   Used automatically if jsDelivr returns a non-2xx status or an error response (such as jsDelivr's HTTP 200 text response for files exceeding 20 MB).
3. **Local Cache (`assets/testing/`)**:
   Local monorepo tests check for relative paths under `duc/assets/testing/<path>` first before falling back to network fetch (`prefer_local=True`).

---

## 3. Usage in Python (`ducpy`)

In `ducpy`, import helper utilities from `_dev.dev_utils`:

```python
from _dev.dev_utils import (
    get_asset_bytes,             # Prefers local assets/testing/<path>, falls back to CDN
    download_fixture_from_cdn,   # Downloads directly from CDN with GitHub raw fallback
)

# Fetch binary content:
pdf_bytes = download_fixture_from_cdn("pdf-files/test.pdf")
ifc_bytes = get_asset_bytes("ifc-files/NVW_DCR-LOD100_Arch.ifc", prefer_local=True)
```

In `pytest` suites (`conftest.py`), use the `load_test_asset` fixture:

```python
def test_my_feature(load_test_asset):
    pdf_bytes = load_test_asset("pdf-files/test.pdf")
    ...
```

---

## 4. Usage in TypeScript / JavaScript & Rust

### TypeScript (`ducjs` / `ducpdf` / `ducsvg`)

For local monorepo integration tests:
```ts
import { join } from "path";
const fixturePath = join(__dirname, "../../../assets/testing/duc-files/universal.duc");
```

For dynamic fetch in runtime environments:
```ts
async function fetchFixture(relativePath: string): Promise<Uint8Array> {
  const primaryUrl = `https://cdn.jsdelivr.net/gh/ducflair/fixtures@main/src/${relativePath}`;
  const rawUrl = `https://raw.githubusercontent.com/ducflair/fixtures/main/src/${relativePath}`;

  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const textPrefix = new TextDecoder().decode(buf.slice(0, 30));
    if (textPrefix.startsWith("File size exceeded") || textPrefix.startsWith("Package size exceeded")) {
      const rawRes = await fetch(rawUrl);
      return new Uint8Array(await rawRes.arrayBuffer());
    }
    return new Uint8Array(buf);
  } catch {
    const rawRes = await fetch(rawUrl);
    return new Uint8Array(await rawRes.arrayBuffer());
  }
}
```

### Rust (`ducrs`)

For local monorepo integration tests:
```rust
use std::path::PathBuf;

let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
    .join("../../assets/testing/duc-files/universal.duc");
```

---

## 5. Adding New Fixtures

1. Push your test asset to the `ducflair/fixtures` repository under `src/<type>-files/<name>`.
2. Once merged to `main`, the file is immediately available via jsDelivr CDN and raw GitHub.
3. If needed for offline test suites, copy key fixtures into `assets/testing/<type>-files/<name>` inside the `duc` monorepo. For multi-gigabyte `.duc` fixtures, stream external-file revisions into chunk rows instead of using an in-memory serializer; verify element/file/revision counts, revision and chunk byte totals, foreign keys, SQLite integrity, and the final gzip container.
