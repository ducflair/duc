use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Once;

static INIT_FIXTURES: Once = Once::new();

pub const FIXTURE_BASE_URL: &str = "https://raw.githubusercontent.com/ducflair/fixtures/main/src";

pub const OFFICIAL_DXF_FILES: &[&str] = &[
    "columns_R2007.dxf",
    "hatches_2.dxf",
    "house-plan.dxf",
    "mtext_complex_inline_codes.dxf",
    "text.dxf",
    "text_fonts.dxf",
    "text_mirror_shx_font.dxf",
    "text_mirror_true_type_font.dxf",
    "text_negative_extrusion.dxf",
    "uncommon.dxf",
    "wipeout_door.dxf",
];

pub const OFFICIAL_DWG_FILES: &[&str] = &[
    "Electrical-Plan-Legend.dwg",
    "People-and-Wheelchairs-Dimensions.dwg",
    "sample_AC1014.dwg",
    "sample_AC1015.dwg",
    "sample_AC1018.dwg",
    "sample_AC1021.dwg",
    "sample_AC1024.dwg",
    "sample_AC1027.dwg",
    "sample_AC1032.dwg",
];

pub const OFFICIAL_DWF_FILES: &[&str] = &[
    "FlyAshSystem.dwf",
];

pub fn fixtures_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures")
}

pub fn tests_output_dir() -> PathBuf {
    let out = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/tests_output");
    let _ = fs::create_dir_all(&out);
    out
}

pub fn save_test_output(name: &str, duc_bytes: &[u8]) {
    let out_path = tests_output_dir().join(name);
    if let Some(parent) = out_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(out_path, duc_bytes);
}

/// Ensures fixtures are available in `tests/fixtures/`.
pub fn ensure_fixtures() {
    INIT_FIXTURES.call_once(|| {
        let root = fixtures_root();
        let _ = fs::create_dir_all(root.join("dxf"));
        let _ = fs::create_dir_all(root.join("dwg"));
        let _ = fs::create_dir_all(root.join("dwf"));
        let _ = fs::create_dir_all(root.join("local"));

        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let local_src_candidates = [
            std::env::var("FIXTURES_DIR").ok().map(PathBuf::from),
            Some(manifest_dir.join("../../assets/testing")),
            Some(manifest_dir.join("../../../dwgpdf/tests/fixtures")),
            Some(manifest_dir.join("../../../fixtures/src")),
        ];

        let sync_group = |files: &[&str], subfolder: &str, remote_folder: &str| {
            let target_dir = root.join(subfolder);
            for file in files {
                let target_path = target_dir.join(file);
                if target_path.exists() && fs::metadata(&target_path).map(|m| m.len()).unwrap_or(0) > 0 {
                    continue;
                }

                // 1. Try local mirror
                let mut copied = false;
                for cand in local_src_candidates.iter().flatten() {
                    let direct_path = cand.join(subfolder).join(file);
                    let remote_path = cand.join(remote_folder).join(file);
                    let file_path = if direct_path.exists() {
                        Some(direct_path)
                    } else if remote_path.exists() {
                        Some(remote_path)
                    } else {
                        None
                    };

                    if let Some(src_file) = file_path {
                        if fs::metadata(&src_file).map(|m| m.len()).unwrap_or(0) > 0 {
                            if fs::copy(&src_file, &target_path).is_ok() {
                                copied = true;
                                break;
                            }
                        }
                    }
                }

                // 2. Download from GitHub if not found
                if !copied {
                    let url = format!("{}/{}/{}", FIXTURE_BASE_URL, remote_folder, file);
                    let status = Command::new("curl")
                        .args(["-fsSL", &url, "-o", target_path.to_str().unwrap()])
                        .status();
                    if let Ok(st) = status {
                        if !st.success() {
                            eprintln!("Warning: Failed to fetch fixture from {}", url);
                        }
                    }
                }
            }
        };

        sync_group(OFFICIAL_DXF_FILES, "dxf", "dxf-files");
        sync_group(OFFICIAL_DWG_FILES, "dwg", "dwg-files");
        sync_group(OFFICIAL_DWF_FILES, "dwf", "dwf-files");
    });
}

pub fn find_fixtures_with_ext(ext: &str) -> Vec<PathBuf> {
    ensure_fixtures();
    let root = fixtures_root();
    let mut results = Vec::new();

    let scan_dir = |dir: &Path, results: &mut Vec<PathBuf>| {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(file_ext) = path.extension() {
                        if file_ext.eq_ignore_ascii_case(ext) {
                            results.push(path);
                        }
                    }
                }
            }
        }
    };

    let target_sub = match ext.to_lowercase().as_str() {
        "dxf" => "dxf",
        "dwg" => "dwg",
        "dwf" => "dwf",
        _ => "",
    };

    if !target_sub.is_empty() {
        scan_dir(&root.join(target_sub), &mut results);
    }
    scan_dir(&root.join("local"), &mut results);

    results.sort();
    results
}

pub fn get_all_dxf_fixtures() -> Vec<PathBuf> {
    find_fixtures_with_ext("dxf")
}

pub fn get_all_dwg_fixtures() -> Vec<PathBuf> {
    find_fixtures_with_ext("dwg")
}

pub fn get_all_dwf_fixtures() -> Vec<PathBuf> {
    find_fixtures_with_ext("dwf")
}
