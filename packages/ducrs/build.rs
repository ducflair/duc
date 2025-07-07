use std::env;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;

// Function to parse schema version from .fbs file
fn get_schema_version_from_fbs(fbs_file_path: &PathBuf) -> Result<String, Box<dyn std::error::Error>> {
    let file = File::open(fbs_file_path)?;
    let reader = BufReader::new(file);
    if let Some(line_result) = reader.lines().next() {
        let line = line_result?;
        const PREFIX: &str = "// SCHEMA_VERSION=";
        // Using simple string manipulation
        if line.starts_with(PREFIX) {
            let version_str = line.trim_start_matches(PREFIX).trim();
            return Ok(version_str.to_string());
        } else if let Some(capt_start) = line.find(PREFIX) { // More flexible check for leading spaces/tabs before comment
            let version_part = &line[capt_start + PREFIX.len()..];
            // Take the first part after '=', assuming it's the version string
            let version_str = version_part.split_whitespace().next().unwrap_or("").trim(); 
            if !version_str.is_empty() {
                return Ok(version_str.to_string());
            }
        }
    }
    eprintln!("cargo:warning=Could not parse schema version from {:?}. Defaulting to 0.0.0.", fbs_file_path);
    Ok("0.0.0".to_string())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Get the path to the current crate's manifest (Cargo.toml)
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);

    let fbs_path = manifest_dir.join("..").join("..").join("schema").join("duc.fbs");

    match get_schema_version_from_fbs(&fbs_path) {
        Ok(version) => {
            println!("cargo:rustc-env=DUC_SCHEMA_VERSION={}", version);
        }
        Err(e) => {
            eprintln!("cargo:warning=Failed to read or parse schema version from {:?}: {}. Defaulting to 0.0.0.", fbs_path, e);
            println!("cargo:rustc-env=DUC_SCHEMA_VERSION=0.0.0");
        }
    }

    // Tell Cargo to rerun this build script if duc.fbs changes.
    println!("cargo:rerun-if-changed={}", fbs_path.display());
    // Also rerun if build.rs itself changes
    println!("cargo:rerun-if-changed=build.rs");

    Ok(())
} 