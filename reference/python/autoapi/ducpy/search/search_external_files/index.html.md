# ducpy.search.search_external_files

Scoped external-file search helpers.

## Attributes

| [`logger`](#ducpy.search.search_external_files.logger)                                                       |    |
|--------------------------------------------------------------------------------------------------------------|----|
| [`_SUPPORTED_EXTERNAL_ELEMENT_TYPES`](#ducpy.search.search_external_files._SUPPORTED_EXTERNAL_ELEMENT_TYPES) |    |

## Classes

| [`ExternalFileSearchTarget`](#ducpy.search.search_external_files.ExternalFileSearchTarget)                 |    |
|------------------------------------------------------------------------------------------------------------|----|
| [`PageSpan`](#ducpy.search.search_external_files.PageSpan)                                                 |    |
| [`ExtractedExternalText`](#ducpy.search.search_external_files.ExtractedExternalText)                       |    |
| [`ResolvedExternalFileSearchTarget`](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget) |    |

## Functions

| [`_compress_whitespace`](#ducpy.search.search_external_files._compress_whitespace)(→ str)                                                               |    |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|----|
| [`element_file_id`](#ducpy.search.search_external_files.element_file_id)(→ str | None)                                                                  |    |
| [`_normalize_target`](#ducpy.search.search_external_files._normalize_target)(→ ExternalFileSearchTarget)                                                |    |
| [`_dedupe_targets`](#ducpy.search.search_external_files._dedupe_targets)(...)                                                                           |    |
| [`_has_table`](#ducpy.search.search_external_files._has_table)(→ bool)                                                                                  |    |
| [`_fetch_active_revision_ids`](#ducpy.search.search_external_files._fetch_active_revision_ids)(→ dict[str, str])                                        |    |
| [`_fetch_live_external_file_ids`](#ducpy.search.search_external_files._fetch_live_external_file_ids)(→ set[str])                                        |    |
| [`_fetch_element_external_refs`](#ducpy.search.search_external_files._fetch_element_external_refs)(→ list[tuple[str, str]])                             |    |
| [`resolve_external_file_search_targets`](#ducpy.search.search_external_files.resolve_external_file_search_targets)(...)                                 |    |
| [`_external_active_revision_id`](#ducpy.search.search_external_files._external_active_revision_id)(→ str | None)                                        |    |
| [`_external_revision_meta`](#ducpy.search.search_external_files._external_revision_meta)(→ dict[str, Any] | None)                                       |    |
| [`_external_revision_mime_type`](#ducpy.search.search_external_files._external_revision_mime_type)(→ str)                                               |    |
| [`extract_image_text_for_search`](#ducpy.search.search_external_files.extract_image_text_for_search)(→ ExtractedExternalText)                           |    |
| [`_stream_revision_bytes`](#ducpy.search.search_external_files._stream_revision_bytes)(→ bytes | None)                                                  |    |
| [`load_external_file_text`](#ducpy.search.search_external_files.load_external_file_text)(→ ExtractedExternalText)                                       |    |
| [`resolve_external_file_search_targets_from_parsed_duc`](#ducpy.search.search_external_files.resolve_external_file_search_targets_from_parsed_duc)(...) |    |
| [`_fetch_external_revision_row`](#ducpy.search.search_external_files._fetch_external_revision_row)(→ dict[str, Any] | None)                             |    |
| [`ensure_external_file_search_index`](#ducpy.search.search_external_files.ensure_external_file_search_index)(→ dict[tuple[str, ...)                     |    |
| [`query_external_file_search_rows`](#ducpy.search.search_external_files.query_external_file_search_rows)(→ list[sqlite3.Row])                           |    |

## Module Contents

### ducpy.search.search_external_files.logger

### ducpy.search.search_external_files.\_SUPPORTED_EXTERNAL_ELEMENT_TYPES

### *class* ducpy.search.search_external_files.ExternalFileSearchTarget

#### file_id *: str*

#### revision_id *: str | None* *= None*

### *class* ducpy.search.search_external_files.PageSpan

#### page *: int*

#### start *: int*

#### end *: int*

### *class* ducpy.search.search_external_files.ExtractedExternalText

#### text *: str*

#### pages *: tuple[[PageSpan](#ducpy.search.search_external_files.PageSpan), Ellipsis]* *= ()*

#### used_ocr *: bool* *= False*

### *class* ducpy.search.search_external_files.ResolvedExternalFileSearchTarget

#### file_id *: str*

#### revision_id *: str*

#### element_id *: str | None* *= None*

### ducpy.search.search_external_files.\_compress_whitespace(value: str | None) → str

### ducpy.search.search_external_files.element_file_id(element: dict[str, Any]) → str | None

### ducpy.search.search_external_files.\_normalize_target(value: [ExternalFileSearchTarget](#ducpy.search.search_external_files.ExternalFileSearchTarget) | dict[str, Any] | tuple[Any, Ellipsis] | str) → [ExternalFileSearchTarget](#ducpy.search.search_external_files.ExternalFileSearchTarget)

### ducpy.search.search_external_files.\_dedupe_targets(targets: Iterable[[ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget)]) → tuple[[ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget), Ellipsis]

### ducpy.search.search_external_files.\_has_table(conn: sqlite3.Connection, table_name: str) → bool

### ducpy.search.search_external_files.\_fetch_active_revision_ids(conn: sqlite3.Connection, file_ids: Iterable[str]) → dict[str, str]

### ducpy.search.search_external_files.\_fetch_live_external_file_ids(conn: sqlite3.Connection) → set[str]

### ducpy.search.search_external_files.\_fetch_element_external_refs(conn: sqlite3.Connection, element_ids: Iterable[str]) → list[tuple[str, str]]

### ducpy.search.search_external_files.resolve_external_file_search_targets(conn: sqlite3.Connection, , search_all_external_files: bool = False, external_file_targets: Iterable[[ExternalFileSearchTarget](#ducpy.search.search_external_files.ExternalFileSearchTarget) | dict[str, Any] | tuple[Any, Ellipsis] | str] | None = None, external_file_element_ids: Iterable[str] | None = None) → tuple[[ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget), Ellipsis]

### ducpy.search.search_external_files.\_external_active_revision_id(external: dict[str, Any]) → str | None

### ducpy.search.search_external_files.\_external_revision_meta(external: dict[str, Any], revision_id: str) → dict[str, Any] | None

### ducpy.search.search_external_files.\_external_revision_mime_type(external: dict[str, Any], revision_id: str, , fallback_element_type: str | None) → str

### ducpy.search.search_external_files.extract_image_text_for_search(image_bytes: bytes, , ocr_language: str) → [ExtractedExternalText](#ducpy.search.search_external_files.ExtractedExternalText)

### ducpy.search.search_external_files.\_stream_revision_bytes(duc_source: str | pathlib.Path, revision_id: str) → bytes | None

### ducpy.search.search_external_files.load_external_file_text(duc_source: str | pathlib.Path, target: [ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget), , fallback_element_type: str | None, ocr_language: str) → [ExtractedExternalText](#ducpy.search.search_external_files.ExtractedExternalText)

### ducpy.search.search_external_files.resolve_external_file_search_targets_from_parsed_duc(duc_source: str | pathlib.Path, duc_data: dict[str, Any], , search_all_external_files: bool = False, external_file_targets: Iterable[[ExternalFileSearchTarget](#ducpy.search.search_external_files.ExternalFileSearchTarget) | dict[str, Any] | tuple[Any, Ellipsis] | str] | None = None, external_file_element_ids: Iterable[str] | None = None) → tuple[[ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget), Ellipsis]

### ducpy.search.search_external_files.\_fetch_external_revision_row(conn: sqlite3.Connection, file_id: str, revision_id: str) → dict[str, Any] | None

### ducpy.search.search_external_files.ensure_external_file_search_index(conn: sqlite3.Connection, , targets: Iterable[[ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget)], ocr_language: str = 'eng') → dict[tuple[str, str], [ExtractedExternalText](#ducpy.search.search_external_files.ExtractedExternalText)]

### ducpy.search.search_external_files.query_external_file_search_rows(conn: sqlite3.Connection, , expression: str, limit: int, targets: Iterable[[ResolvedExternalFileSearchTarget](#ducpy.search.search_external_files.ResolvedExternalFileSearchTarget)]) → list[sqlite3.Row]
