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
            
    cur = conn.cursor()
    cur.execute("PRAGMA user_version;")
    row = cur.fetchone()
    pragma_user_version = row[0] if row else 0
    conn.commit()
    conn.close()

    pragma_version_str = ""
    if pragma_user_version > 0:
        major = pragma_user_version // 1000000
        minor = (pragma_user_version // 1000) % 1000
        patch = pragma_user_version % 1000
        pragma_version_str = f"{major}.{minor}.{patch}"
        print(f"→ SQLite PRAGMA user_version: {pragma_user_version} ({pragma_version_str})")

    # Find sq CLI
    candidates = [
        shutil.which("sq"),
        str(Path.home() / ".local" / "bin" / "sq"),
        str(Path.home() / "bin" / "sq"),
        str(repo_root / "bin" / "sq"),
        "/usr/local/bin/sq",
        "/opt/homebrew/bin/sq",
    ]
    sq_bin = None
    for cand in candidates:
        if cand and Path(cand).exists():
            sq_bin = cand
            break

    out_file = out_dir / "index.html"

    if sq_bin:
        sq_cmd = sq_bin
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

        version = os.environ.get("SQL_DOCS_VERSION", "").strip()
        if len(sys.argv) > 1 and sys.argv[1]:
            version = sys.argv[1].strip()
        if not version and pragma_version_str:
            version = pragma_version_str

        if version and out_file.exists():
            content = out_file.read_text(encoding="utf-8")
            content = content.replace("<title>@duc_schema</title>", f"<title>DUC SQL Schema Reference (v{version})</title>")
            version_badge = f'<div style="background:#1e1e2e;color:#cdd6f4;padding:8px 16px;font-family:sans-serif;font-size:14px;border-bottom:1px solid #313244;">DUC SQL Schema Reference &mdash; <strong>Version {version}</strong></div>'
            if "<body>" in content:
                content = content.replace("<body>", f"<body>\n{version_badge}")
            out_file.write_text(content, encoding="utf-8")
            print(f"✅ Injected version v{version} into SQL HTML documentation")

        print(f"✅ Generated SQL HTML documentation at {out_file}")
    else:
        print("Error: 'sq' CLI not found on system. Please install sq via 'brew install sq' or '/bin/sh -c \"$(curl -fsSL https://sq.io/install.sh)\"'.")
        sys.exit(1)

if __name__ == "__main__":
    main()
