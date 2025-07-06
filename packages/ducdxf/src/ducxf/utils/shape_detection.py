"""
Shape detection utilities for DUCXF.
"""

import math
from typing import List, Dict, Tuple, Set, Union, Any


def detect_shape(points: List[Dict[str, float]]) -> str:
    """
    Detect common shapes from a list of points.
    
    Args:
        points: List of points with x, y coordinates
    
    Returns:
        DUC element type based on shape detection
    """
    # Need at least 3 points for shape detection
    if len(points) < 3:
        return "line" if len(points) == 2 else "draw"
    
    # Check if points form a closed shape
    is_closed = is_shape_closed(points)
    
    # Get unique points (excluding duplicates)
    unique_points = get_unique_points(points)
    
    # Rectangle detection
    if is_rectangle(unique_points, is_closed):
        return "rectangle"
    
    # Triangle detection
    if is_triangle(unique_points, is_closed):
        return "triangle"
    
    # Diamond detection
    if is_diamond(unique_points, is_closed):
        return "diamond"
    
    # Default to draw for unrecognized shapes
    return "draw"

def is_shape_closed(points: List[Dict[str, float]]) -> bool:
    """
    Check if a shape is closed (first and last points match).
    
    Args:
        points: List of points with x, y coordinates
    
    Returns:
        True if the shape is closed
    """
    if len(points) < 3:
        return False
    
    first = points[0]
    last = points[-1]
    # If first and last points are very close, consider it closed
    return abs(first["x"] - last["x"]) < 0.001 and abs(first["y"] - last["y"]) < 0.001

def get_unique_points(points: List[Dict[str, float]]) -> Set[Tuple[float, float]]:
    """
    Get unique points from a list, eliminating duplicates.
    
    Args:
        points: List of points with x, y coordinates
    
    Returns:
        Set of unique points as tuples (x, y)
    """
    unique_points = set()
    for p in points:
        unique_points.add((round(p["x"], 3), round(p["y"], 3)))
    return unique_points

def is_rectangle(unique_points: Set[Tuple[float, float]], is_closed: bool) -> bool:
    """
    Check if points form a rectangle.
    
    Args:
        unique_points: Set of unique points
        is_closed: Whether the shape is closed
    
    Returns:
        True if the points form a rectangle
    """
    if len(unique_points) != 4 or not is_closed:
        return False
    
    # Check if points form a rectangle (parallel sides)
    # First, check if the points form an axis-aligned rectangle
    x_coords = sorted([p[0] for p in unique_points])
    y_coords = sorted([p[1] for p in unique_points])
    
    # For an axis-aligned rectangle, there should be exactly 2 unique x and y values
    if len(set(x_coords)) == 2 and len(set(y_coords)) == 2:
        return True
    
    # If not axis-aligned, check if it's a rotated rectangle
    # This is more complex - we need to check for right angles
    # Convert to list for easier indexing
    points_list = list(unique_points)
    
    # For a rectangle, opposite sides should be parallel and adjacent sides perpendicular
    # Calculate vectors between points
    vectors = []
    for i in range(4):
        p1 = points_list[i]
        p2 = points_list[(i + 1) % 4]
        vectors.append((p2[0] - p1[0], p2[1] - p1[1]))
    
    # Check if opposite vectors are parallel and of equal length
    v0_dot_v2 = vectors[0][0] * vectors[2][0] + vectors[0][1] * vectors[2][1]
    v1_dot_v3 = vectors[1][0] * vectors[3][0] + vectors[1][1] * vectors[3][1]
    
    # For parallel vectors, their dot product should be negative and magnitudes equal
    v0_mag = math.sqrt(vectors[0][0]**2 + vectors[0][1]**2)
    v2_mag = math.sqrt(vectors[2][0]**2 + vectors[2][1]**2)
    v1_mag = math.sqrt(vectors[1][0]**2 + vectors[1][1]**2)
    v3_mag = math.sqrt(vectors[3][0]**2 + vectors[3][1]**2)
    
    parallel_opposite = (abs(v0_dot_v2 + v0_mag * v2_mag) < 0.01 and 
                         abs(v1_dot_v3 + v1_mag * v3_mag) < 0.01 and
                         abs(v0_mag - v2_mag) < 0.01 and
                         abs(v1_mag - v3_mag) < 0.01)
    
    # Check for perpendicular adjacent sides
    v0_dot_v1 = vectors[0][0] * vectors[1][0] + vectors[0][1] * vectors[1][1]
    v1_dot_v2 = vectors[1][0] * vectors[2][0] + vectors[1][1] * vectors[2][1]
    v2_dot_v3 = vectors[2][0] * vectors[3][0] + vectors[2][1] * vectors[3][1]
    v3_dot_v0 = vectors[3][0] * vectors[0][0] + vectors[3][1] * vectors[0][1]
    
    perpendicular_adjacent = (abs(v0_dot_v1) < 0.01 and
                              abs(v1_dot_v2) < 0.01 and
                              abs(v2_dot_v3) < 0.01 and
                              abs(v3_dot_v0) < 0.01)
    
    return parallel_opposite and perpendicular_adjacent

def is_triangle(unique_points: Set[Tuple[float, float]], is_closed: bool) -> bool:
    """
    Check if points form a triangle.
    
    Args:
        unique_points: Set of unique points
        is_closed: Whether the shape is closed
    
    Returns:
        True if the points form a triangle
    """
    return len(unique_points) == 3 and is_closed

def is_diamond(unique_points: Set[Tuple[float, float]], is_closed: bool) -> bool:
    """
    Check if points form a diamond (rhombus).
    
    Args:
        unique_points: Set of unique points
        is_closed: Whether the shape is closed
    
    Returns:
        True if the points form a diamond
    """
    if len(unique_points) != 4 or not is_closed:
        return False
    
    # Check if points form a rhombus
    points_list = list(unique_points)
    
    # Calculate distances between all pairs of points
    distances = []
    for i in range(4):
        for j in range(i + 1, 4):
            p1 = points_list[i]
            p2 = points_list[j]
            dist = math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
            distances.append((dist, (i, j)))
    
    # Sort by distance
    distances.sort()
    
    # For a rhombus, there should be 4 equal sides and 2 different diagonals
    # The 4 shortest distances should be equal (sides)
    # The 2 longest distances should be different (diagonals)
    sides = distances[:4]
    diagonals = distances[4:]
    
    # Check if all sides are equal
    side_lengths = [side[0] for side in sides]
    equal_sides = all(abs(side - side_lengths[0]) < 0.01 for side in side_lengths)
    
    # Check if diagonals are different
    different_diagonals = abs(diagonals[0][0] - diagonals[1][0]) > 0.01
    
    return equal_sides and different_diagonals 