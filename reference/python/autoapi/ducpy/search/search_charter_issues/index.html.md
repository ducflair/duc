# ducpy.search.search_charter_issues

Search user-authored project Charter and Issue content in DUC files.

## Attributes

| [`DucCharterIssueSearchResult`](#ducpy.search.search_charter_issues.DucCharterIssueSearchResult)   |    |
|----------------------------------------------------------------------------------------------------|----|

## Classes

| [`DucCharterSearchResult`](#ducpy.search.search_charter_issues.DucCharterSearchResult)               | One matching Charter section or record.                             |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| [`DucIssueSearchResult`](#ducpy.search.search_charter_issues.DucIssueSearchResult)                   | One matching issue, aggregating matches from its discussion thread. |
| [`DucCharterIssueSearchResponse`](#ducpy.search.search_charter_issues.DucCharterIssueSearchResponse) | Combined Charter and Issue search response.                         |

## Functions

| [`search_duc_charter`](#ducpy.search.search_charter_issues.search_duc_charter)(→ DucCharterIssueSearchResponse)   | Search user-authored fields in the project Charter.                   |
|-------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| [`search_duc_issues`](#ducpy.search.search_charter_issues.search_duc_issues)(→ DucCharterIssueSearchResponse)     | Search issue titles, discussions, people, and exact reference fields. |
| [`search_duc_charter_and_issues`](#ducpy.search.search_charter_issues.search_duc_charter_and_issues)(...)         | Search the project Charter and Issues in one ranked response.         |

## Module Contents

### *class* ducpy.search.search_charter_issues.DucCharterSearchResult

One matching Charter section or record.

#### kind *: str*

#### record_id *: str*

#### matches *: list[str]*

#### match_fields *: list[str]*

#### score *: float*

#### to_dict() → dict[str, Any]

### *class* ducpy.search.search_charter_issues.DucIssueSearchResult

One matching issue, aggregating matches from its discussion thread.

#### issue_id *: str*

#### local_id *: int*

#### title *: str*

#### status *: str*

#### matches *: list[str]*

#### match_fields *: list[str]*

#### matched_message_ids *: list[str]*

#### score *: float*

#### anchor *: dict[str, Any] | None* *= None*

#### to_dict() → dict[str, Any]

### ducpy.search.search_charter_issues.DucCharterIssueSearchResult

### *class* ducpy.search.search_charter_issues.DucCharterIssueSearchResponse

Combined Charter and Issue search response.

#### query *: str*

#### results *: list[DucCharterIssueSearchResult]*

#### total_hits *: int*

#### charter_hits *: int*

#### issue_hits *: int*

#### all_issue_ids *: list[str]*

#### output_path *: str | None* *= None*

#### to_dict() → dict[str, Any]

### ducpy.search.search_charter_issues.search_duc_charter(duc_path: str | pathlib.Path, query: str, , output_path: str | pathlib.Path | None = None, limit: int = 50, phase: str | None = None) → [DucCharterIssueSearchResponse](#ducpy.search.search_charter_issues.DucCharterIssueSearchResponse)

Search user-authored fields in the project Charter.

### ducpy.search.search_charter_issues.search_duc_issues(duc_path: str | pathlib.Path, query: str, , output_path: str | pathlib.Path | None = None, limit: int = 50, status: str | None = None, include_deleted: bool = False) → [DucCharterIssueSearchResponse](#ducpy.search.search_charter_issues.DucCharterIssueSearchResponse)

Search issue titles, discussions, people, and exact reference fields.

### ducpy.search.search_charter_issues.search_duc_charter_and_issues(duc_path: str | pathlib.Path, query: str, , output_path: str | pathlib.Path | None = None, limit: int = 50, phase: str | None = None, status: str | None = None, include_deleted: bool = False) → [DucCharterIssueSearchResponse](#ducpy.search.search_charter_issues.DucCharterIssueSearchResponse)

Search the project Charter and Issues in one ranked response.
