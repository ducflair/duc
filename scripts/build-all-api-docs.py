#!/usr/bin/env python3
"""Local simulation script matching .github/workflows/deploy-api-docs.yml step-by-step."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

def main():
    repo_root = Path(__file__).resolve().parent.parent
    site_dir = repo_root / "_site"
    site_dir.mkdir(parents=True, exist_ok=True)

    print("=========================================")
    print(" Running Local GitHub Actions Dry-Run ")
    print(" Workflow: .github/workflows/deploy-api-docs.yml")
    print("=========================================")

def get_latest_tag_version(repo_root: Path, pattern: str) -> str:
    try:
        res = subprocess.run(
            f"git tag -l '{pattern}' | sed -E 's/({pattern.replace('*', '')})//' | sort -V | tail -n1",
            shell=True,
            cwd=repo_root,
            capture_output=True,
            text=True
        )
        val = res.stdout.strip()
        if val:
            return val
    except Exception:
        pass
    return ""

def main():
    repo_root = Path(__file__).resolve().parent.parent
    site_dir = repo_root / "_site"
    site_dir.mkdir(parents=True, exist_ok=True)

    print("=========================================")
    print(" Running Local GitHub Actions Dry-Run ")
    print(" Workflow: .github/workflows/deploy-api-docs.yml")
    print("=========================================")

    # Step 0. SQL API Docs (sq inspect -> /reference/sql/)
    print("\n--> Step 0: SQL API Docs (gen-sql-docs.py)")
    gen_sql_script = repo_root / "scripts" / "gen-sql-docs.py"
    sql_ver = get_latest_tag_version(repo_root, "duc.sql@*") or get_latest_tag_version(repo_root, "duc@*") or "1.0.0"
    print(f"  Resolved SQL version: {sql_ver}")
    env = os.environ.copy()
    env["SQL_DOCS_VERSION"] = sql_ver
    subprocess.run([sys.executable, str(gen_sql_script)], cwd=repo_root, env=env, check=True)

    # Step 1. Python API Docs (Sphinx -> /reference/python/)
    print("\n--> Step 1: Python API Docs (Sphinx)")
    ducpy_docs_dir = repo_root / "packages" / "ducpy" / "docs"
    py_ver = get_latest_tag_version(repo_root, "ducpy@*") or "0.0.0"
    print(f"  Resolved ducpy version: {py_ver}")
    if ducpy_docs_dir.exists():
        subprocess.run(
            ["uv", "run", "--with", "sphinx", "--with", "furo", "--with", "sphinx-autoapi", "sphinx-build", "-D", f"version={py_ver}", "-D", f"release={py_ver}", "-M", "html", ".", "_build"],
            cwd=ducpy_docs_dir,
            check=False
        )
        py_build = ducpy_docs_dir / "_build" / "html"
        py_site = site_dir / "reference" / "python"
        if py_build.exists():
            py_site.mkdir(parents=True, exist_ok=True)
            shutil.copytree(py_build, py_site, dirs_exist_ok=True)
            print(f"  Staged Python API Docs -> {py_site}")

    # Step 2. TypeScript API Docs (ducjs TypeDoc -> /reference/typescript/)
    print("\n--> Step 2: TypeScript API Docs (ducjs TypeDoc)")
    ducjs_dir = repo_root / "packages" / "ducjs"
    ducjs_ver = get_latest_tag_version(repo_root, "ducjs@*")
    if ducjs_dir.exists():
        typedoc_cmd = ["npx", "typedoc"]
        if ducjs_ver:
            print(f"  Setting TypeDoc project version to {ducjs_ver}")
            typedoc_cmd.extend(["--projectVersion", ducjs_ver])
        subprocess.run(typedoc_cmd, cwd=ducjs_dir, check=False)
        ts_build = ducjs_dir / "docs"
        ts_site = site_dir / "reference" / "typescript"
        if ts_build.exists():
            ts_site.mkdir(parents=True, exist_ok=True)
            shutil.copytree(ts_build, ts_site, dirs_exist_ok=True)
            print(f"  Staged TypeScript API Docs (ducjs) -> {ts_site}")

    # Step 3. TypeScript API Docs (ducpdf TypeDoc -> /reference/pdf/)
    print("\n--> Step 3: TypeScript API Docs (ducpdf TypeDoc)")
    ducpdf_dir = repo_root / "packages" / "ducpdf"
    ducpdf_ver = get_latest_tag_version(repo_root, "ducpdf@*")
    if ducpdf_dir.exists():
        typedoc_cmd = ["npx", "typedoc"]
        if ducpdf_ver:
            print(f"  Setting TypeDoc project version to {ducpdf_ver}")
            typedoc_cmd.extend(["--projectVersion", ducpdf_ver])
        subprocess.run(typedoc_cmd, cwd=ducpdf_dir, check=False)
        pdf_build = ducpdf_dir / "docs"
        pdf_site = site_dir / "reference" / "pdf"
        if pdf_build.exists():
            pdf_site.mkdir(parents=True, exist_ok=True)
            shutil.copytree(pdf_build, pdf_site, dirs_exist_ok=True)
            print(f"  Staged PDF API Docs (ducpdf) -> {pdf_site}")

    # Step 4. TypeScript API Docs (ducsvg TypeDoc -> /reference/svg/)
    print("\n--> Step 4: TypeScript API Docs (ducsvg TypeDoc)")
    ducsvg_dir = repo_root / "packages" / "ducsvg"
    ducsvg_ver = get_latest_tag_version(repo_root, "ducsvg@*")
    if ducsvg_dir.exists():
        typedoc_cmd = ["npx", "typedoc"]
        if ducsvg_ver:
            print(f"  Setting TypeDoc project version to {ducsvg_ver}")
            typedoc_cmd.extend(["--projectVersion", ducsvg_ver])
        subprocess.run(typedoc_cmd, cwd=ducsvg_dir, check=False)
        svg_build = ducsvg_dir / "docs"
        svg_site = site_dir / "reference" / "svg"
        if svg_build.exists():
            svg_site.mkdir(parents=True, exist_ok=True)
            shutil.copytree(svg_build, svg_site, dirs_exist_ok=True)
            print(f"  Staged SVG API Docs (ducsvg) -> {svg_site}")

    # Step 5. Rust API Docs (cargo doc -> /reference/rust/)
    print("\n--> Step 5: Rust API Docs (cargo doc)")
    ducrs_dir = repo_root / "packages" / "ducrs"
    ducrs_ver = get_latest_tag_version(repo_root, "ducrs@*")
    if ducrs_dir.exists():
        if ducrs_ver and os.environ.get("CI"):
            print(f"  [CI] Setting ducrs version to {ducrs_ver}")
            subprocess.run(["node", str(repo_root / "scripts" / "cargo-set-pkg-version.js"), "packages/ducrs/Cargo.toml", ducrs_ver], cwd=repo_root, check=False)
        subprocess.run(["cargo", "doc", "--no-deps"], cwd=ducrs_dir, check=False)
        rust_target_doc = repo_root / "target" / "doc"
        rust_site = site_dir / "reference" / "rust"
        if rust_target_doc.exists():
            rust_site.mkdir(parents=True, exist_ok=True)
            shutil.copytree(rust_target_doc, rust_site, dirs_exist_ok=True)
            
            static_files_src = rust_target_doc / "static.files"
            static_files_dst = site_dir / "reference" / "static.files"
            if static_files_src.exists():
                static_files_dst.mkdir(parents=True, exist_ok=True)
                shutil.copytree(static_files_src, static_files_dst, dirs_exist_ok=True)
                
            print(f"  Staged Rust API Docs -> {rust_site}")

    # Step 6. PEP 503 Simple Package Index (build-ducpy-simple-index.py)
    print("\n--> Step 6: Simple Package Index (build-ducpy-simple-index.py)")
    build_index_script = repo_root / "scripts" / "build-ducpy-simple-index.py"
    if build_index_script.exists():
        subprocess.run([sys.executable, str(build_index_script), str(site_dir)], check=False)

    print("\n=========================================")
    print(" ✅ Dry-Run Build Complete!")
    print(f" Output directory: {site_dir}")
    print("=========================================")

if __name__ == "__main__":
    main()
