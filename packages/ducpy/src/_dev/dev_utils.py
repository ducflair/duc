"""
Development and testing utilities for DUC repository paths.

This module is dev-only and is NOT shipped with the published ducpy
wheel. It is consumed by the local test suite, examples, and CI scripts.
"""

from pathlib import Path


def get_testing_assets_dir() -> str:
    """Dynamically resolve the assets/testing directory within the repository.

    This walks up the directory tree starting from the location of this file
    until it finds the `assets/testing` folder. If not found, it checks
    from the current working directory, ensuring robust relative resolution.
    """
    # Start at the location of this utility file
    path = Path(__file__).resolve().parent

    # Walk up the tree looking for assets/testing
    for parent in path.parents:
        candidate = parent / "assets" / "testing"
        if candidate.is_dir():
            return str(candidate.resolve())

    # Fallback to checking the current working directory
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        candidate = parent / "assets" / "testing"
        if candidate.is_dir():
            return str(candidate.resolve())

    raise FileNotFoundError("Could not locate repository 'assets/testing' directory.")
