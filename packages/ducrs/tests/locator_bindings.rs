use duc::{locator::*, types::{ExternalFileLocator, ExternalFileLocatorKind}};

#[test]
fn shared_path_rules_cover_native_uri_and_explicit_kind_boundaries() {
    assert_eq!(normalize_host_path("file:///C:/My%20CAD/part.step"), "C:/My CAD/part.step");
    assert_eq!(normalize_host_path("/tmp/native%20name.step"), "/tmp/native%20name.step");
    assert_eq!(normalize_path_segments("//server/share/../part.step"), "//server/share/part.step");
    assert_eq!(paths::resolve_path("relative", "../parts/bolt.step", Some("/tmp/project/main.duc")).unwrap(), "/tmp/parts/bolt.step");
    assert!(paths::resolve_path("relative", "/tmp/bolt.step", Some("/tmp/main.duc")).is_err());
    assert!(paths::resolve_path("relative", "file:///tmp/bolt.step", Some("/tmp/main.duc")).is_err());
    assert!(paths::resolve_path("absolute", "parts/bolt.step", None).is_err());
    assert!(paths::resolve_path("relative", "bolt.step", None).is_err());
    assert!(paths::resolve_path("invalid", "bolt.step", None).is_err());
}

#[test]
fn native_resolution_checks_io_and_preserves_the_locator() {
    let locator = ExternalFileLocator { kind: ExternalFileLocatorKind::Absolute,
        path: std::env::temp_dir().join(format!("duc-missing-{}-part.step", std::process::id())).to_string_lossy().into_owned(),
        original_path: Some("original file reference".into()) };
    let result = resolve_locator(&locator, None, true);
    assert_eq!(result.status, ExternalFileResolutionStatus::Missing);
    assert_eq!(result.locator, locator);
    assert_eq!(resolve_locator(&locator, None, false).status, ExternalFileResolutionStatus::Resolved);
}
