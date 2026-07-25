#!/usr/bin/env python3
import os
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

def main():
    repo_root = Path(__file__).resolve().parent.parent
    schema_dir = repo_root / "schema"
    target_dir = repo_root / "target"
    out_dir = repo_root / "_site" / "reference" / "sql"

    target_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    db_path = target_dir / "duc_schema.sqlite"
    if db_path.exists():
        db_path.unlink()

    print(f"Creating SQLite schema database at {db_path}...")
    conn = sqlite3.connect(db_path)
    
    sql_files = ["duc.sql", "version_control.sql", "search.sql"]
    for file_name in sql_files:
        sql_file = schema_dir / file_name
        if not sql_file.exists():
            print(f"Warning: {sql_file} not found")
            continue
        print(f"→ Executing {file_name}...")
        with open(sql_file, "r", encoding="utf-8") as f:
            sql_script = f.read()
            conn.executescript(sql_script)
            
    conn.commit()
    conn.close()

    # Find sq CLI
    sq_bin = shutil.which("sq") or "/tmp/sq"
    if not Path(sq_bin).exists():
        # Try local brew or path
        candidate = Path("/opt/homebrew/bin/sq")
        if candidate.exists():
            sq_bin = str(candidate)

    out_file = out_dir / "index.html"

    if Path(sq_bin).exists() or shutil.which("sq"):
        sq_cmd = sq_bin if Path(sq_bin).exists() else "sq"
        print(f"Generating HTML documentation using {sq_cmd} inspect...")
        
        # Remove handle if exists
        subprocess.run([sq_cmd, "rm", "@duc_schema"], capture_output=True)
        
        # Add database source
        subprocess.run([sq_cmd, "add", str(db_path), "--handle", "@duc_schema"], check=True)
        
        # Inspect HTML output
        res = subprocess.run(
            [sq_cmd, "inspect", "@duc_schema", "--html", "-o", str(out_file)],
            check=True
        )
        print(f"✅ Generated SQL HTML documentation at {out_file}")
    else:
        print("Error: 'sq' CLI not found on system. Please install sq via 'brew install sq' or '/bin/sh -c \"$(curl -fsSL https://sq.io/install.sh)\"'.")
        sys.exit(1)

if __name__ == "__main__":
    main()
