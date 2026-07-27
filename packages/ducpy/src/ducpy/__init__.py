"""Python library for the .duc project-state format for physical-engineering work before execution.

Usage:
    ``import ducpy as duc``

Builders API (High-level):
    The easy way to build, manage ``.duc`` files.
    Construct elements, apply styles, manage layers, build blocks,
    and handle document state with the ``duc.builders`` module.

SQL Builder (Low-level):
    A ``.duc`` file is a gzip-compressed SQLite database. Use
    ``duc.builders.sql_builder`` for direct schema access, bulk
    queries, and low-level manipulation.

Search:
    Query/search elements and files programmatically via the
    ``duc.search`` API.

File I/O:
    Read and write ``.duc`` files using the ``duc.parse`` 
    and ``duc.serialize`` modules.
"""

from .builders import *
from .classes import *
from .enums import *
from .parse import (DucData, list_external_files, parse_duc,
                    stream_checkpoint_data_to_path,
                    stream_delta_changeset_to_path,
                    stream_external_file_revision_to_path)
from .serialize import DUC_SCHEMA_VERSION, DucSerializationValidationError, serialize_duc
from .search import *
from .utils import *
