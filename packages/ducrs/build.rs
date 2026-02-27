use std::env;
use std::fs;
use std::path::PathBuf;

/// Extract raw `PRAGMA user_version = <N>;` from `duc.sql`.
fn schema_user_version_from_sql(sql: &str) -> u32 {
    for line in sql.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("PRAGMA user_version") {
            let rest = rest.trim().trim_start_matches('=').trim().trim_end_matches(';').trim();
            if let Ok(v) = rest.parse::<u32>() {
                return v;
            }
        }
    }
    0
}

/// Convention: 3000000 → "3.0.0" (major * 1_000_000 + minor * 1_000 + patch).
fn decode_user_version_to_semver(user_version: u32) -> String {
    let major = user_version / 1_000_000;
    let minor = (user_version % 1_000_000) / 1_000;
    let patch = user_version % 1_000;
    format!("{major}.{minor}.{patch}")
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);
    let schema_dir = manifest_dir.join("..").join("..").join("schema");
    let out_dir = PathBuf::from(env::var("OUT_DIR")?);

    // Copy schema files into OUT_DIR so bootstrap.rs can include_str! them
    // even when the crate is built from an sdist in a temp directory.
    for name in ["duc.sql", "version_control.sql", "search.sql"] {
        let src = schema_dir.join(name);
        let dst = out_dir.join(name);
        match fs::read_to_string(&src) {
            Ok(contents) => fs::write(&dst, contents)?,
            Err(e) => {
                eprintln!("cargo:warning=Could not read {:?}: {e}. Writing empty stub.", src);
                fs::write(&dst, "")?;
            }
        }
        println!("cargo:rerun-if-changed={}", src.display());
    }

    let sql_path = schema_dir.join("duc.sql");
    let (user_version, semver_version) = match fs::read_to_string(&sql_path) {
        Ok(sql) => {
            let uv = schema_user_version_from_sql(&sql);
            (uv, decode_user_version_to_semver(uv))
        }
        Err(e) => {
            eprintln!("cargo:warning=Could not read {:?}: {e}. Defaulting to 0.0.0.", sql_path);
            (0, "0.0.0".to_string())
        }
    };

    // Semver string for human-readable build metadata.
    println!("cargo:rustc-env=DUC_SCHEMA_VERSION={semver_version}");
    // Raw integer for version-control schema comparisons/migrations.
    println!("cargo:rustc-env=DUC_SCHEMA_USER_VERSION={user_version}");

    // Generate a compile-time Rust literal for the current schema version.
    // Included by version_control.rs as a true `const i32`.
    fs::write(
        out_dir.join("schema_user_version.rs"),
        format!("{}i32", user_version),
    )?;

    println!("cargo:rerun-if-changed=build.rs");

    Ok(())
} 