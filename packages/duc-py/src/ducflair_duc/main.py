import sys
import os
import flatbuffers

# Add the path to core/canvas/duc/duc-py/ where Duc is located
sys.path.append(os.path.abspath('../../core/canvas/duc/duc-py'))

# Now import Duc and AppState
from Duc import AppState


def serializeAppState():
    """
    Serializes the AppState object into a FlatBuffer byte array.

    Returns:
        bytes: The serialized AppState object as bytes.
    """
    # Create a FlatBuffer builder object
    builder = flatbuffers.Builder(1024)

    # Start constructing the AppState object
    AppState.Start(builder)

    # Add fields to AppState (assuming boolean fields in schema)
    AppState.AddDisplayRootAxis(builder, True)
    AppState.AddDisplayAllPointInfoSelected(builder, True)

    # Finish construction of AppState and return the serialized buffer
    app_state = AppState.End(builder)

    # Finalize the buffer by calling `Finish`
    builder.Finish(app_state)

    # Return the serialized data as bytes
    return builder.Output()

def deserializeAppState(buffer):
    """
    Deserializes a FlatBuffer byte array back into an AppState object.

    Args:
        buffer (bytes): The serialized AppState buffer.

    Returns:
        dict: A dictionary containing the AppState field values.
    """
    # Get the root object from the FlatBuffer
    app_state = AppState.AppState.GetRootAsAppState(buffer, 0)

    # Access the fields in AppState
    display_root_axis = app_state.DisplayRootAxis()  # Access boolean value for DisplayRootAxis
    display_all_point_info_selected = app_state.DisplayAllPointInfoSelected()  # Access boolean value for DisplayAllPointInfoSelected

    # Return the parsed data as a dictionary
    return {
        "DisplayRootAxis": display_root_axis,
        "DisplayAllPointInfoSelected": display_all_point_info_selected
    }


# Just for demo purposes
if __name__ == "__main__":
    # Example usage: Serialize the AppState
    serialized_data = serializeAppState()
    print("Serialized Data:", serialized_data)

    # Example usage: Deserialize the AppState
    parsed_data = deserializeAppState(serialized_data)
    print("Parsed Data:", parsed_data)
    
    
    

# Expose all public methods for external use
__all__ = ['serializeAppState', 'deserializeAppState']
