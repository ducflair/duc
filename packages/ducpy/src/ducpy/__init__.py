"""Python library for the DUC 2D CAD file format.

Usage::
    ``import ducpy as duc``

Builders API (High-level):
    The easy way to build, manage ``.duc`` files.
    Construct elements, apply styles, manage layers, build blocks,
    and handle document state with the ``duc.builders`` module.

SQL Builder (Low-level):
    A ``.duc`` file is a zlib-compressed SQLite database. Use
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
from .parse import (DucData, get_external_file, list_external_files, parse_duc,
                    parse_duc_lazy)
from .search import *
from .serialize import DUC_SCHEMA_VERSION, serialize_duc
from .utils import *
