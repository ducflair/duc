"""
Example demonstrating the mutation of elements within a DUC object.
"""

import ducpy as duc
from ducpy.classes.DataStateClass import ExportedDataState

def demonstrate_element_mutation():
    """
    Creates a DUC object with an element, then mutates its properties
    and prints the changes.
    
    """
    print("Demonstrating element mutation...")

    # 1. Create a simple Rectangle element
    initial_rect = (duc.ElementBuilder()
        .at_position(0, 0).with_size(100, 50)
        .with_label("Initial Rectangle")
        .build_rectangle()
        .build())

    elements = [initial_rect]

    # 2. Create minimal Global and Local States
    global_state = (duc.StateBuilder().build_global_state().build())
    local_state = (duc.StateBuilder().build_local_state().build())

    print("Initial Rectangle Properties:")
    print(f"  X: {initial_rect.element.base.x}, Y: {initial_rect.element.base.y}")
    print(f"  Width: {initial_rect.element.base.width}, Height: {initial_rect.element.base.height}")
    print(f"  Label: {initial_rect.element.base.label}")
    print(f"  Version: {initial_rect.element.base.version}")
    print()

    # 4. Mutate the rectangle element
    print("Mutating the rectangle element...")
    duc.mutate_element(initial_rect, 
                       x=20, 
                       y=30, 
                       width=150, 
                       label="Mutated Rectangle", 
                       is_visible=False)

    print("Mutated Rectangle Properties:")
    print(f"  X: {initial_rect.element.base.x}, Y: {initial_rect.element.base.y}")
    print(f"  Width: {initial_rect.element.base.width}, Height: {initial_rect.element.base.height}")
    print(f"  Label: {initial_rect.element.base.label}")
    print(f"  Is Visible: {initial_rect.element.base.is_visible}")
    print(f"  New Version: {initial_rect.element.base.version}") # Version should have changed

    print("\nElement mutation demo complete!")

def main():
    """Run the mutation demo."""
    print("Mutation Demo")
    print("=" * 30)
    demonstrate_element_mutation()


if __name__ == "__main__":
    main()
