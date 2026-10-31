# Portable external-file locators

Each external revision may carry `locator: { kind, path, originalPath? }`.
`kind` is explicitly `relative` or `absolute`; readers never infer it from an
ambiguous string. Relative locators resolve against the owning `.duc` directory.
Absolute locators require a rooted native path, including Windows drives and UNC
shares. Only file URIs are percent-decoded; ordinary native percent signs remain
literal. Resolution preserves the original locator and reports resolved, missing,
inaccessible, or unresolved state.

Locators are serialized in the optional `external_file_locators` SQLite table,
keyed by revision ID, separately from embedded revision chunks. Native, WASM,
JavaScript, and Python document APIs use the same Rust storage mapping. Existing
documents without locators keep their embedded/cloud semantics. Readers predating
locator support ignore the optional table; saving through those older writers
does not preserve locator metadata. Applications should require a locator-aware
writer before saving a drawing that depends on local references.

Path resolution does not grant access. The host application must enforce native
permissions and must not upload local files to remote execution implicitly.
