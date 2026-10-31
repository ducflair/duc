# ducpy.classes.locator

## Classes

| [`ExternalFileResolutionStatus`](#ducpy.classes.locator.ExternalFileResolutionStatus)   | str(object='') -> str   |
|---------------------------------------------------------------------------------|-------------------------|
| [`ExternalFileResolutionResult`](#ducpy.classes.locator.ExternalFileResolutionResult)   |                         |

## Functions

| [`normalize_host_path`](#ducpy.classes.locator.normalize_host_path)(→ str)                                  |                                                    |
|--------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| [`normalize_path_segments`](#ducpy.classes.locator.normalize_path_segments)(→ str)                              |                                                    |
| [`get_owning_duc_directory`](#ducpy.classes.locator.get_owning_duc_directory)(→ str)                             |                                                    |
| [`create_external_file_locator`](#ducpy.classes.locator.create_external_file_locator)(...)                           | Creates an ExternalFileLocator with explicit kind. |
| [`resolve_locator_path`](#ducpy.classes.locator.resolve_locator_path)(→ Tuple[Optional[str], Optional[str]]) |                                                    |
| [`resolve_locator`](#ducpy.classes.locator.resolve_locator)(→ ExternalFileResolutionResult)             |                                                    |

## Module Contents

### *class* ducpy.classes.locator.ExternalFileResolutionStatus

Bases: `str`, `enum.Enum`

str(object=’’) -> str
str(bytes_or_buffer[, encoding[, errors]]) -> str

Create a new string object from the given object. If encoding or
errors is specified, then the object must expose a data buffer
that will be decoded using the given encoding and error handler.
Otherwise, returns the result of object._\_str_\_() (if defined)
or repr(object).
encoding defaults to sys.getdefaultencoding().
errors defaults to ‘strict’.

Initialize self.  See help(type(self)) for accurate signature.

#### RESOLVED *= 'resolved'*

#### MISSING *= 'missing'*

#### INACCESSIBLE *= 'inaccessible'*

#### UNRESOLVED *= 'unresolved'*

### *class* ducpy.classes.locator.ExternalFileResolutionResult

#### status *: [ExternalFileResolutionStatus](#ducpy.classes.locator.ExternalFileResolutionStatus)*

#### resolved_path *: str | None*

#### error *: str | None*

#### locator *: [ducpy.classes.DataStateClass.ExternalFileLocator](../DataStateClass/index.html.md#ducpy.classes.DataStateClass.ExternalFileLocator)*

### ducpy.classes.locator.normalize_host_path(raw_path: str) → str

### ducpy.classes.locator.normalize_path_segments(path_str: str) → str

### ducpy.classes.locator.get_owning_duc_directory(owning_duc_path: str) → str

### ducpy.classes.locator.create_external_file_locator(kind: [ducpy.classes.DataStateClass.ExternalFileLocatorKind](../DataStateClass/index.html.md#ducpy.classes.DataStateClass.ExternalFileLocatorKind) | str, path: str, original_path: str | None = None) → [ducpy.classes.DataStateClass.ExternalFileLocator](../DataStateClass/index.html.md#ducpy.classes.DataStateClass.ExternalFileLocator)

Creates an ExternalFileLocator with explicit kind.

### ducpy.classes.locator.resolve_locator_path(locator: [ducpy.classes.DataStateClass.ExternalFileLocator](../DataStateClass/index.html.md#ducpy.classes.DataStateClass.ExternalFileLocator), owning_duc_path: str | None = None) → Tuple[str | None, str | None]

### ducpy.classes.locator.resolve_locator(locator: [ducpy.classes.DataStateClass.ExternalFileLocator](../DataStateClass/index.html.md#ducpy.classes.DataStateClass.ExternalFileLocator), owning_duc_path: str | None = None, check_exists: bool = False) → [ExternalFileResolutionResult](#ducpy.classes.locator.ExternalFileResolutionResult)
