from ducpy.utils import recursive_mutate
from ducpy.classes.DataStateClass import VersionGraph, Checkpoint, Delta, DucGlobalState, DucLocalState, DucExternalFileEntry, GridSettings, SnapSettings
from ducpy.classes.ElementsClass import DucView, DucUcs, ElementWrapper
from ducpy.utils.rand_utils import random_versioning


def mutate_element(el, **kwargs):
    """
    Mutate any property of an element (ElementWrapper or direct dataclass instance) using keyword arguments.
    Recursively traverses all nested dataclasses and sets matching properties.
    Applies versioning updates (seed, updated, version, version_nonce) to top-level elements or elements with a 'base' attribute.
    Example: mutate_element(el, x=..., label=..., points=[...], style=..., ...)
    """
    target_obj = el
    if isinstance(el, ElementWrapper):
        target_obj = el.element
    
    # Apply versioning updates only if the target object has a 'base' attribute
    # or is a top-level element (ElementWrapper itself, which has base via .element)
    if hasattr(target_obj, 'base') or isinstance(el, ElementWrapper):
        versioning = random_versioning()
        kwargs.update(versioning)
    
    recursive_mutate(target_obj, kwargs)
    return el

# Mutate helpers for state classes
def mutate_version_graph(graph: VersionGraph, **kwargs):
    recursive_mutate(graph, kwargs)
    return graph

def mutate_checkpoint(checkpoint: Checkpoint, **kwargs):
    recursive_mutate(checkpoint, kwargs)
    return checkpoint

def mutate_delta(delta: Delta, **kwargs):
    recursive_mutate(delta, kwargs)
    return delta

def mutate_global_state(state: DucGlobalState, **kwargs):
    recursive_mutate(state, kwargs)
    return state

def mutate_local_state(state: DucLocalState, **kwargs):
    recursive_mutate(state, kwargs)
    return state

def mutate_external_file(file_entry: DucExternalFileEntry, **kwargs):
    recursive_mutate(file_entry, kwargs)
    return file_entry

def mutate_grid_settings(grid: GridSettings, **kwargs):
    recursive_mutate(grid, kwargs)
    return grid

def mutate_snap_settings(snap: SnapSettings, **kwargs):
    recursive_mutate(snap, kwargs)
    return snap

def mutate_view(view: DucView, **kwargs):
    recursive_mutate(view, kwargs)
    return view

def mutate_ucs(ucs: DucUcs, **kwargs):
    recursive_mutate(ucs, kwargs)
    return ucs
