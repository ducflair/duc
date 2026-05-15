from __future__ import annotations

import shutil
from pathlib import Path


def main() -> None:
    package_root = Path(__file__).resolve().parents[1]
    repo_root = package_root.parents[1]
    source = repo_root / "schema"
    destination = package_root / "schema"

    if not source.joinpath("duc.sql").exists():
        raise FileNotFoundError(f"Missing source schema at {source}")

    if destination.exists():
        shutil.rmtree(destination)

    shutil.copytree(source, destination)
    print(f"Synced schema: {source} -> {destination}")


if __name__ == "__main__":
    main()
