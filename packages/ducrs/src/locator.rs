use crate::types::{ExternalFileLocator, ExternalFileLocatorKind};
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExternalFileResolutionStatus {
    Resolved,
    Missing,
    Inaccessible,
    Unresolved,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalFileResolutionResult {
    pub status: ExternalFileResolutionStatus,
    pub resolved_path: Option<String>,
    pub error: Option<String>,
    pub locator: ExternalFileLocator,
}

pub mod paths;
pub use paths::{normalize_host_path, normalize_path_segments, get_owning_duc_directory};

/// Creates an ExternalFileLocator with explicit kind.
pub fn create_external_file_locator(
    kind: ExternalFileLocatorKind,
    path: &str,
    original_path: Option<&str>,
) -> ExternalFileLocator {
    let normalized = normalize_host_path(path);
    let orig = original_path
        .map(|s| s.to_string())
        .or_else(|| if path != normalized { Some(path.to_string()) } else { None });

    ExternalFileLocator {
        kind,
        path: normalized,
        original_path: orig,
    }
}

/// Resolves the filesystem path string for an ExternalFileLocator without checking I/O.
pub fn resolve_locator_path(
    locator: &ExternalFileLocator,
    owning_duc_path: Option<&str>,
) -> Result<String, String> {
    paths::resolve_path(match locator.kind { ExternalFileLocatorKind::Absolute => "absolute", ExternalFileLocatorKind::Relative => "relative" }, &locator.path, owning_duc_path)
}

/// Resolves an ExternalFileLocator against an optional owning .duc path.
/// When `check_exists` is true, verifies that the file exists and is accessible.
/// Preserves the original locator untouched on all outcomes.
pub fn resolve_locator(
    locator: &ExternalFileLocator,
    owning_duc_path: Option<&str>,
    check_exists: bool,
) -> ExternalFileResolutionResult {
    let resolved = match resolve_locator_path(locator, owning_duc_path) {
        Ok(path) => path,
        Err(err) => {
            return ExternalFileResolutionResult {
                status: ExternalFileResolutionStatus::Unresolved,
                resolved_path: None,
                error: Some(err),
                locator: locator.clone(),
            };
        }
    };

    if check_exists {
        let path_obj = Path::new(&resolved);
        if !path_obj.exists() {
            return ExternalFileResolutionResult {
                status: ExternalFileResolutionStatus::Missing,
                resolved_path: Some(resolved.clone()),
                error: Some(format!("External file not found at {}", resolved)),
                locator: locator.clone(),
            };
        }

        // Check readability
        if std::fs::File::open(path_obj).is_err() {
            return ExternalFileResolutionResult {
                status: ExternalFileResolutionStatus::Inaccessible,
                resolved_path: Some(resolved.clone()),
                error: Some(format!("External file at {} is not accessible", resolved)),
                locator: locator.clone(),
            };
        }
    }

    ExternalFileResolutionResult {
        status: ExternalFileResolutionStatus::Resolved,
        resolved_path: Some(resolved),
        error: None,
        locator: locator.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_host_path_posix() {
        assert_eq!(
            normalize_host_path("file:///Users/jane/part.step"),
            "/Users/jane/part.step"
        );
        assert_eq!(
            normalize_host_path("file://localhost/Users/jane/part.step"),
            "/Users/jane/part.step"
        );
    }

    #[test]
    fn test_normalize_host_path_windows() {
        assert_eq!(
            normalize_host_path("file:///C:/Users/jane/part.step"),
            "C:/Users/jane/part.step"
        );
        assert_eq!(
            normalize_host_path("C:\\Users\\jane\\models\\part.step"),
            "C:/Users/jane/models/part.step"
        );
    }

    #[test]
    fn test_normalize_percent_encoding() {
        assert_eq!(
            normalize_host_path("file:///Users/jane/My%20Documents/cad%20file.step"),
            "/Users/jane/My Documents/cad file.step"
        );
    }

    #[test]
    fn test_get_owning_duc_directory() {
        assert_eq!(
            get_owning_duc_directory("/home/user/drawings/assembly.duc"),
            "/home/user/drawings"
        );
        assert_eq!(
            get_owning_duc_directory("C:/CAD/Projects/main.duc"),
            "C:/CAD/Projects"
        );
    }

    #[test]
    fn test_resolve_relative_locator() {
        let locator = ExternalFileLocator {
            kind: ExternalFileLocatorKind::Relative,
            path: "cad/bracket.step".to_string(),
            original_path: None,
        };
        let res = resolve_locator_path(&locator, Some("/home/user/doc.duc"));
        assert_eq!(res.unwrap(), "/home/user/cad/bracket.step");
    }

    #[test]
    fn test_resolve_relative_missing_owning_path() {
        let locator = ExternalFileLocator {
            kind: ExternalFileLocatorKind::Relative,
            path: "bracket.step".to_string(),
            original_path: None,
        };
        let res = resolve_locator(&locator, None, false);
        assert_eq!(res.status, ExternalFileResolutionStatus::Unresolved);
        assert!(res.error.unwrap().contains("Owning .duc file location is required"));
        assert_eq!(res.locator.kind, ExternalFileLocatorKind::Relative);
    }

    #[test]
    fn test_resolve_missing_file_preserves_locator() {
        let locator = ExternalFileLocator {
            kind: ExternalFileLocatorKind::Absolute,
            path: "/path/that/does/not/exist/part.step".to_string(),
            original_path: Some("file:///path/that/does/not/exist/part.step".to_string()),
        };
        let res = resolve_locator(&locator, None, true);
        assert_eq!(res.status, ExternalFileResolutionStatus::Missing);
        assert_eq!(res.locator.original_path, Some("file:///path/that/does/not/exist/part.step".to_string()));
    }
}
