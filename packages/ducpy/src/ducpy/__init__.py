"""Main module for duc_py package.

Import usage examples:
    import ducpy as duc
    
    # Access modules directly:
    duc.classes.SomeClass
    duc.parse.parse_function
    duc.serialize.serialize_function
    duc.utils.some_utility
"""

import sys
import importlib.util
from pathlib import Path
import os

# Get the absolute path to the Duc directory
duc_dir = os.path.join(os.path.dirname(__file__), 'Duc')

# Import all modules from Duc and make them available at top level
if 'Duc' not in sys.modules:
    # Create a new module for Duc
    import types
    duc_module = types.ModuleType('Duc')
    sys.modules['Duc'] = duc_module
    
    # Import all Python files from the Duc directory
    for file_path in Path(duc_dir).glob('*.py'):
        if file_path.name == '__init__.py':
            continue
        
        module_name = file_path.stem
        spec = importlib.util.spec_from_file_location(f"Duc.{module_name}", file_path)
        if spec:
            module = importlib.util.module_from_spec(spec)
            sys.modules[f"Duc.{module_name}"] = module
            spec.loader.exec_module(module)
            setattr(duc_module, module_name, module)

# Import modules for direct access
from .utils import *
from .parse import *
from .serialize import *
from .classes import *
from .builders import *
