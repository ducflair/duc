"""
Utility function for recursively mutating dataclass objects.
"""

from dataclasses import is_dataclass, fields

def recursive_mutate(obj, updates):
    """
    Recursively set attributes on dataclass objects matching keys in updates.
    """
    if not is_dataclass(obj):
        return
    for f in fields(obj):
        fname = f.name
        if fname in updates:
            setattr(obj, fname, updates[fname])
        else:
            val = getattr(obj, fname)
            if is_dataclass(val):
                recursive_mutate(val, updates)
            elif isinstance(val, list):
                for item in val:
                    if is_dataclass(item):
                        recursive_mutate(item, updates)
