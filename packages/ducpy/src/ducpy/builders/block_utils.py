from typing import List, Optional
import copy
from ducpy.classes.DataStateClass import ExportedDataState, DucBlockInstance
from ducpy.classes.ElementsClass import ElementWrapper, DucBlock
from ducpy.builders.block_instance_builder import BlockInstanceBuilder
from ducpy.utils.rand_utils import generate_random_id

def _get_base(element):
  if hasattr(element, "linear_base"):
      return element.linear_base.base
  return element.base

def instantiate_block(
    state: ExportedDataState,
    block_id: str,
    position_x: float,
    position_y: float,
    instance_id: Optional[str] = None
) -> DucBlockInstance:
    """
    Creates an instance of a block at a specific position.
    
    This function:
    1. Creates a DucBlockInstance metadata object.
    2. Finds all elements associated with the block_id.
    3. Clones those elements.
    4. Updates their positions relative to the new insertion point.
    5. Sets their instance_id.
    6. Adds the cloned elements and the block instance to the state.
    
    Args:
        state: The ExportedDataState object to modify.
        block_id: The ID of the block to instantiate.
        position_x: The X coordinate for the instance insertion point.
        position_y: The Y coordinate for the instance insertion point.
        instance_id: Optional custom ID for the instance. If None, one is generated.
        
    Returns:
        The created DucBlockInstance object.
    """
    if instance_id is None:
        instance_id = generate_random_id()

    # Find the block definition
    block: Optional[DucBlock] = next((b for b in state.blocks if b.id == block_id), None)
    if not block:
        raise ValueError(f"Block with ID {block_id} not found in state.")

    # Create Block Instance Metadata
    instance_builder = BlockInstanceBuilder(
        id=instance_id,
        block_id=block_id,
        version=block.version
    )
    block_instance = instance_builder.build()
    
    # Ensure lists exist
    if state.block_instances is None:
        state.block_instances = []
    state.block_instances.append(block_instance)

    # Find source elements (elements that define this block)
    # In the new model, block definitions don't "own" elements in a separate list,
    # but elements have 'block_ids' pointing to the blocks they belong to.
    source_elements: List[ElementWrapper] = []
    
    # We need to find elements that are part of the block definition.
    # These are elements that have block_id in their block_ids list AND instance_id is None.
    for wrapper in state.elements:
        element = wrapper.element
        block_ids = _get_base(element).block_ids
        instance_id_val = _get_base(element).instance_id
        # logical check: element belongs to block_id definition
        if block_ids and block_id in block_ids and not instance_id_val:
            source_elements.append(wrapper)

    if not source_elements:
        # It's possible a block has no elements yet, just return the empty instance
        return block_instance

    # Calculate bounding box of source elements to determine relative offsets
    # For simplicity, we assume the "origin" of the block is the top-left of its bounding box
    # or (0,0) if we want to be strict, but usually insertion implies some offset.
    # Let's align with the provided TS logic: calculate common bounds.
    
    min_x = float('inf')
    min_y = float('inf')
    
    for wrapper in source_elements:
        el = wrapper.element
        base = _get_base(el)
        if base.x < min_x: min_x = base.x
        if base.y < min_y: min_y = base.y
        
    # If no elements found (shouldn't happen given check above), handle gracefully
    if min_x == float('inf'):
        min_x = 0
        min_y = 0

    # Calculate delta
    delta_x = position_x - min_x
    delta_y = position_y - min_y

    # Clone and transform elements
    for wrapper in source_elements:
        # Deep copy the wrapper to duplicate the element
        cloned_wrapper = copy.deepcopy(wrapper)
        cloned_element = cloned_wrapper.element
        
        base = _get_base(cloned_element)
        
        # Generate new ID for the cloned element
        base.id = generate_random_id()
        
        # Update position
        base.x += delta_x
        base.y += delta_y
        
        # Set instance_id
        base.instance_id = instance_id
        
        # Clear block_ids for the instance (it belongs to the instance, not the block definition directly)
        base.block_ids = []
        
        # Add to state elements
        state.elements.append(cloned_wrapper)

    return block_instance
