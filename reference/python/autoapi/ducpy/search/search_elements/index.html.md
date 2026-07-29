# ducpy.search.search_elements

Element search helpers for `.duc` SQLite databases.

This module uses a hybrid strategy:

1. SQLite FTS5 narrows candidates quickly from the searchable DUC tables.
2. Python applies a second ranking pass that combines:
   : - FTS rank
     - exact / prefix / substring behavior
     - token coverage
     - string similarity

The JSON output is shaped for downstream consumers that need:

- the original query
- total raw element hits
- the ordered list of all matching element ids
- result rows for individual elements or grouped file-backed elements

## Attributes

| [`DucSearchResult`](#id0)   |    |
|-----------------------------|----|

## Classes

| [`DucSearchResult`](#id0)                                                        |                                                           |
|----------------------------------------------------------------------------------|-----------------------------------------------------------|
| [`DucElementSearchResult`](#ducpy.search.search_elements.DucElementSearchResult) | One result row for a single element.                      |
| [`DucFileSearchResult`](#ducpy.search.search_elements.DucFileSearchResult)       | One grouped result row for repeated file-backed elements. |
| [`DucSearchResponse`](#ducpy.search.search_elements.DucSearchResponse)           | Search response and JSON export metadata.                 |

## Functions

| [`search_duc_elements`](#ducpy.search.search_elements.search_duc_elements)(→ DucSearchResponse)   | Search DUC elements and export ordered results to JSON.   |
|---------------------------------------------------------------------------------------------------|-----------------------------------------------------------|

## Module Contents

### *class* ducpy.search.search_elements.DucSearchResult

Compatibility placeholder for exported result types.

### *class* ducpy.search.search_elements.DucElementSearchResult

One result row for a single element.

`match_pages[i]` is the starting page number (as a string) for the text
in `matches[i]`.  The two lists always have the same length, and
`match_pages` is `None` for results that are not backed by a
PDF/image external file.

#### element_id *: str*

#### element_type *: str*

#### matches *: list[str]*

#### score *: float*

#### match_pages *: list[str] | None* *= None*

#### to_dict() → dict[str, Any]

### *class* ducpy.search.search_elements.DucFileSearchResult

One grouped result row for repeated file-backed elements.

`match_pages[i]` is the starting page number (as a string) for the text
in `matches[i]`.  The two lists always have the same length, and
`match_pages` is `None` for results that are not backed by a
PDF/image external file.

#### file_id *: str*

#### element_type *: str*

#### matches *: list[str]*

#### score *: float*

#### hits *: int*

#### element_ids *: list[str]*

#### match_pages *: list[str] | None* *= None*

#### to_dict() → dict[str, Any]

### ducpy.search.search_elements.DucSearchResult

### *class* ducpy.search.search_elements.DucSearchResponse

Search response and JSON export metadata.

#### query *: str*

#### results *: list[DucSearchResult]*

#### total_hits *: int*

#### all_element_ids *: list[str]*

#### output_path *: str | None* *= None*

#### to_dict() → dict[str, Any]

Convert the response to a JSON-friendly dictionary.

### ducpy.search.search_elements.search_duc_elements(duc_path: str | pathlib.Path, query: str, , output_path: str | pathlib.Path | None = None, limit: int = 50, ocr_language: str = 'eng', search_all_external_files: bool = False, external_file_targets: list[[ducpy.search.search_external_files.ExternalFileSearchTarget](../search_external_files/index.md#ducpy.search.search_external_files.ExternalFileSearchTarget) | dict[str, Any] | tuple[Any, Ellipsis] | str] | None = None, external_file_element_ids: list[str] | None = None) → [DucSearchResponse](#ducpy.search.search_elements.DucSearchResponse)

Search DUC elements and export ordered results to JSON.
