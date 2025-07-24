"""
CSPMDS Test for Version Graph: Create-Serialize-Parse-Mutate-Delete-Serialize
Tests the full lifecycle of version control system including checkpoints, deltas, and history management.
"""
import io
import json
import os
import time
import random
import pytest

import ducpy as duc


def test_cspmds_version_graph(test_output_dir):
    """
    CSPMDS test for version graph (version control system):
    - Create: Create version graph with checkpoints and deltas
    - Serialize: Save to DUC file
    - Parse: Load the saved file
    - Mutate: Modify version graph structure
    - Delete: Remove some versions
    - Serialize: Save the final state
    """
    
    # === CREATE ===
    print("🔨 CREATE: Creating version graph with checkpoints and deltas...")
    
    # Create some basic elements for our document states
    elements = []
    
    # Create a simple rectangle to track through versions
    rect1 = duc.create_rectangle(
        x=50, y=50, width=100, height=60,
        styles=duc.create_simple_styles(),
        label="Version Tracked Rectangle"
    )
    elements.append(rect1)
    
    # Create a text element
    text1 = duc.create_text_element(
        x=200, y=100, text="Version 1.0",
        styles=duc.create_simple_styles(),
        label="Version Label"
    )
    elements.append(text1)
    
    # === CREATE VERSION GRAPH STRUCTURE ===
    
    # Create initial checkpoint (represents a complete document state)
    initial_data = duc.serialize_duc(
        name="VersionGraph_Initial",
        elements=elements
    )
    
    checkpoint1 = duc.create_checkpoint(
        id="checkpoint_v1_0_0",
        description="Initial version 1.0",
        is_manual_save=True,
        data=initial_data
    )
    
    # Create JSON patch operations for incremental changes (deltas)
    patch_ops_v1_1 = [
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/1/element/text",
            value="Version 1.1"
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/0/element/base/width",
            value=120
        ),
        duc.create_json_patch_operation(
            op="add",
            path="/elements/0/element/base/label",
            value="Updated Rectangle v1.1"
        )
    ]
    
    delta1 = duc.create_delta(
        id="delta_v1_0_to_v1_1",
        parent_id="checkpoint_v1_0_0",
        description="Minor update to v1.1: text change and resize",
        patch=patch_ops_v1_1,
        is_manual_save=False
    )
    
    # Create another set of changes for v1.2
    patch_ops_v1_2 = [
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/1/element/text",
            value="Version 1.2"
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/0/element/base/x",
            value=75
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/0/element/base/y",
            value=75
        ),
        duc.create_json_patch_operation(
            op="add",
            path="/duc_global_state/name",
            value="VersionGraph_v1.2"
        )
    ]
    
    delta2 = duc.create_delta(
        id="delta_v1_1_to_v1_2", 
        parent_id="delta_v1_0_to_v1_1",
        description="Update to v1.2: moved rectangle and global state",
        patch=patch_ops_v1_2,
        is_manual_save=False
    )
    
    # Create a major checkpoint for v2.0
    updated_elements = elements.copy()
    circle1 = duc.create_ellipse(
        x=300, y=150, width=80, height=80,
        styles=duc.create_simple_styles(),
        label="New Circle v2.0"
    )
    updated_elements.append(circle1)
    
    v2_data = duc.serialize_duc(
        name="VersionGraph_v2.0",
        elements=updated_elements
    )
    
    checkpoint2 = duc.create_checkpoint(
        id="checkpoint_v2_0_0",
        parent_id="delta_v1_1_to_v1_2", 
        description="Major version 2.0 with new features",
        is_manual_save=True,
        data=v2_data
    )
    
    # Create branch delta from v2.0
    patch_ops_v2_1 = [
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/1/element/text", 
            value="Version 2.1-beta"
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/2/element/base/width",
            value=100
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/2/element/base/height",
            value=100
        ),
        duc.create_json_patch_operation(
            op="add",
            path="/elements/2/element/base/label",
            value="Resized Circle v2.1-beta"
        )
    ]
    
    delta3 = duc.create_delta(
        id="delta_v2_0_to_v2_1_beta",
        parent_id="checkpoint_v2_0_0",
        description="Beta version 2.1: circle resize",
        patch=patch_ops_v2_1,
        is_manual_save=False
    )
    
    # Create experimental branch delta
    patch_ops_experimental = [
        duc.create_json_patch_operation(
            op="add",
            path="/elements/-",  # Append to array
            value={
                "element_type": "DucLineElement",
                "x1": 50, "y1": 200,
                "x2": 350, "y2": 200,
                "label": "Experimental Line"
            }
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/1/element/text",
            value="Version 2.1-experimental"
        )
    ]
    
    delta4 = duc.create_delta(
        id="delta_v2_0_to_experimental",
        parent_id="checkpoint_v2_0_0",
        description="Experimental branch: added line element", 
        patch=patch_ops_experimental,
        is_manual_save=False
    )
    
    # Create the version graph
    version_graph = duc.create_version_graph(
        checkpoints=[checkpoint1, checkpoint2],
        deltas=[delta1, delta2, delta3, delta4],
        pruning_level=duc.PRUNING_LEVEL.CONSERVATIVE,
        user_checkpoint_version_id="checkpoint_v2_0_0",
        latest_version_id="delta_v2_0_to_v2_1_beta"
    )
    
    # Update metadata with calculated sizes
    total_size = sum(len(c.data) for c in version_graph.checkpoints)
    version_graph.metadata.total_size = total_size
    
    # Create global state with version info
    global_state = duc.create_global_state(
        name="VersionGraph_CSPMDS",
        main_scope="mm",
        dimensions_associative_by_default=True
    )
    
    # === SERIALIZE ===
    print("💾 SERIALIZE: Saving initial version graph state...")
    
    initial_file = os.path.join(test_output_dir, "cspmds_version_graph_initial.duc")
    serialized_data = duc.serialize_duc(
        name="VersionGraph_CSPMDS_Initial",
        elements=updated_elements,  # Use v2.0 elements as current state
        duc_global_state=global_state,
        version_graph=version_graph
    )
    
    with open(initial_file, 'wb') as f:
        f.write(serialized_data)
    
    assert os.path.exists(initial_file)
    print(f"Saved initial version graph to {initial_file}")
    
    # === PARSE ===
    print("📖 PARSE: Loading saved file and validating version graph...")
    
    parsed_data = duc.parse_duc(io.BytesIO(serialized_data))
    loaded_elements = parsed_data.elements
    loaded_version_graph = parsed_data.version_graph
    
    assert loaded_version_graph is not None
    assert len(loaded_version_graph.checkpoints) == 2
    assert len(loaded_version_graph.deltas) == 4
    assert loaded_version_graph.user_checkpoint_version_id == "checkpoint_v2_0_0"
    assert loaded_version_graph.latest_version_id == "delta_v2_0_to_v2_1_beta"
    
    print(f"Loaded version graph with {len(loaded_version_graph.checkpoints)} checkpoints and {len(loaded_version_graph.deltas)} deltas")
    
    # Verify checkpoint data integrity
    for checkpoint in loaded_version_graph.checkpoints:
        assert len(checkpoint.data) > 0
        assert checkpoint.size_bytes == len(checkpoint.data)
        print(f"Checkpoint {checkpoint.id}: {checkpoint.size_bytes} bytes, manual_save={checkpoint.is_manual_save}")
    
    # Verify delta structure
    for delta in loaded_version_graph.deltas:
        assert len(delta.patch) > 0
        assert delta.parent_id is not None
        print(f"Delta {delta.id}: {len(delta.patch)} operations, parent={delta.parent_id}")
    
    # === MUTATE ===
    print("🔧 MUTATE: Modifying version graph structure...")
    
    mutations_count = 0
    
    # Add a new delta to the version graph
    new_patch_ops = [
        duc.create_json_patch_operation(
            op="replace",
            path="/elements/1/element/text",
            value="Version 2.2-MUTATED"
        ),
        duc.create_json_patch_operation(
            op="replace",
            path="/duc_global_state/name", 
            value="VersionGraph_MUTATED"
        ),
        duc.create_json_patch_operation(
            op="add",
            path="/elements/0/element/base/angle",
            value=15.0
        )
    ]
    
    new_delta = duc.create_delta(
        id="delta_v2_1_to_v2_2_mutated",
        parent_id="delta_v2_0_to_v2_1_beta",
        description="MUTATED: Post-parse modification to v2.2",
        patch=new_patch_ops,
        is_manual_save=False
    )
    
    loaded_version_graph.deltas.append(new_delta)
    loaded_version_graph.latest_version_id = "delta_v2_1_to_v2_2_mutated"
    mutations_count += 1
    
    # Mutate existing checkpoint metadata
    for checkpoint in loaded_version_graph.checkpoints:
        if checkpoint.id == "checkpoint_v1_0_0":
            duc.mutate_checkpoint(
                checkpoint,
                description="MUTATED: " + checkpoint.description,
                is_manual_save=True
            )
            mutations_count += 1
            
        elif checkpoint.id == "checkpoint_v2_0_0":
            duc.mutate_checkpoint(
                checkpoint,
                description="MUTATED: Enhanced " + checkpoint.description
            )
            mutations_count += 1
    
    # Mutate existing deltas 
    for delta in loaded_version_graph.deltas:
        if delta.id == "delta_v1_0_to_v1_1":
            # Add new patch operation
            additional_op = duc.create_json_patch_operation(
                op="add",
                path="/duc_global_state/dash_spacing_scale",
                value=1.5
            )
            delta.patch.append(additional_op)
            duc.mutate_delta(
                delta,
                description="MUTATED: " + delta.description + " + dash spacing"
            )
            mutations_count += 1
            
        elif delta.id == "delta_v2_0_to_experimental":
            # Modify existing patch operations
            for patch_op in delta.patch:
                if patch_op.path == "/elements/1/element/text":
                    patch_op.value = "Version 2.1-experimental-MUTATED"
                    
            duc.mutate_delta(
                delta,
                description="MUTATED: " + delta.description + " with enhanced experimental features"
            )
            mutations_count += 1
    
    # Update version graph metadata
    new_total_size = sum(len(c.data) for c in loaded_version_graph.checkpoints)
    loaded_version_graph.metadata.total_size = new_total_size
    loaded_version_graph.metadata.last_pruned = int(time.time() * 1000)
    mutations_count += 1
    
    print(f"Applied {mutations_count} mutations to version graph")
    
    # === DELETE ===
    print("🗑️ DELETE: Removing some versions and pruning history...")
    
    # Delete experimental branch delta
    deltas_to_delete = []
    for i, delta in enumerate(loaded_version_graph.deltas):
        if delta.id == "delta_v2_0_to_experimental":
            deltas_to_delete.append(i)
            print(f"Marking experimental delta for deletion: {delta.id}")
    
    for i in reversed(deltas_to_delete):
        del loaded_version_graph.deltas[i]
    
    # Delete old checkpoint (simulate pruning)
    checkpoints_to_delete = []
    for i, checkpoint in enumerate(loaded_version_graph.checkpoints):
        if checkpoint.id == "checkpoint_v1_0_0":
            checkpoints_to_delete.append(i)
            print(f"Pruning old checkpoint: {checkpoint.id}")
    
    for i in reversed(checkpoints_to_delete):
        del loaded_version_graph.checkpoints[i]
    
    # Delete orphaned deltas that referenced the deleted checkpoint
    orphaned_deltas = []
    for i, delta in enumerate(loaded_version_graph.deltas):
        if delta.parent_id == "checkpoint_v1_0_0":
            orphaned_deltas.append(i)
            print(f"Removing orphaned delta: {delta.id}")
    
    for i in reversed(orphaned_deltas):
        del loaded_version_graph.deltas[i]
    
    # Update latest version if it was deleted
    if loaded_version_graph.latest_version_id == "delta_v2_0_to_experimental":
        loaded_version_graph.latest_version_id = "delta_v2_1_to_v2_2_mutated" 
    
    # Update user checkpoint if it was deleted
    if loaded_version_graph.user_checkpoint_version_id == "checkpoint_v1_0_0":
        loaded_version_graph.user_checkpoint_version_id = "checkpoint_v2_0_0"
    
    deleted_count = len(deltas_to_delete) + len(checkpoints_to_delete) + len(orphaned_deltas)
    print(f"Deleted {deleted_count} version entries (pruning simulation)")
    
    # Update metadata after pruning
    pruned_total_size = sum(len(c.data) for c in loaded_version_graph.checkpoints)
    loaded_version_graph.metadata.total_size = pruned_total_size
    loaded_version_graph.metadata.last_pruned = int(time.time() * 1000)
    loaded_version_graph.metadata.pruning_level = duc.PRUNING_LEVEL.AGGRESSIVE
    
    # === SERIALIZE (FINAL) ===
    print("💾 SERIALIZE: Saving final mutated and pruned version graph...")
    
    # Update global state to reflect final mutations
    final_global_state = duc.create_global_state(
        name="VersionGraph_CSPMDS_Final",
        main_scope="mm",
        dimensions_associative_by_default=True,
        use_annotative_scaling=True
    )
    
    final_file = os.path.join(test_output_dir, "cspmds_version_graph_final.duc")
    final_serialized_data = duc.serialize_duc(
        name="VersionGraph_CSPMDS_Final",
        elements=loaded_elements,
        duc_global_state=final_global_state,
        version_graph=loaded_version_graph
    )
    
    with open(final_file, 'wb') as f:
        f.write(final_serialized_data)
    
    assert os.path.exists(final_file)
    print(f"Saved final version graph to {final_file}")
    
    # === FINAL VALIDATION ===
    print("✅ VALIDATE: Final validation of version graph integrity...")
    
    final_parsed = duc.parse_duc(io.BytesIO(final_serialized_data))
    final_version_graph = final_parsed.version_graph
    
    assert final_version_graph is not None
    assert len(final_version_graph.checkpoints) == 1  # Only checkpoint_v2_0_0 remains
    assert len(final_version_graph.deltas) == 3  # Original deltas + new mutated delta - deleted ones
    assert final_version_graph.metadata.pruning_level == duc.PRUNING_LEVEL.AGGRESSIVE
    assert final_version_graph.latest_version_id == "delta_v2_1_to_v2_2_mutated"
    assert final_version_graph.user_checkpoint_version_id == "checkpoint_v2_0_0"
    
    # Verify mutated data persisted
    mutated_delta_found = False
    for delta in final_version_graph.deltas:
        if delta.id == "delta_v2_1_to_v2_2_mutated":
            mutated_delta_found = True
            assert "MUTATED" in delta.description
            break
    assert mutated_delta_found
    
    print("🎉 CSPMDS Version Graph test completed successfully!")
    print(f"Final state: {len(final_version_graph.checkpoints)} checkpoints, {len(final_version_graph.deltas)} deltas")
    print(f"Total version graph size: {final_version_graph.metadata.total_size} bytes")
    print(f"Files created: {initial_file}, {final_file}")