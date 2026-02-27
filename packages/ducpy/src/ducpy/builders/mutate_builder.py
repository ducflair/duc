from ducpy.classes.DataStateClass import (Checkpoint, Delta,
                                          DucExternalFileEntry, DucGlobalState,
                                          DucLocalState, VersionGraph)
from ducpy.classes.ElementsClass import ElementWrapper
from ducpy.utils import recursive_mutate
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
    
    if hasattr(target_obj, 'base') or isinstance(el, ElementWrapper):
        versioning = random_versioning()
        kwargs.update(versioning)
    
    recursive_mutate(target_obj, kwargs)
    return el


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
