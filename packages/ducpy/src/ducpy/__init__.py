"""Main module for duc_py package.

Import usage examples:
    import ducpy as duc
    
    duc.classes.SomeClass
    duc.parse_duc(source)
    duc.serialize_duc(name=..., elements=...)
    duc.utils.some_utility
"""

from .builders import *
from .classes import *
from .enums import *
from .parse import (DucData, get_external_file, list_external_files, parse_duc,
                    parse_duc_lazy)
from .serialize import DUC_SCHEMA_VERSION, serialize_duc
from .utils import *
