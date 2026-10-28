/// Normalizes a host filesystem path or file:// URI string into a standard path string.
/// Handles:
/// - `file://` and `file:///` schemes
/// - `file://localhost/` prefixes
/// - Windows drive letters in file URIs (e.g. `file:///C:/path` -> `C:/path`)
/// - URL percent-decoding (e.g. `%20` -> space)
/// - Backslash to forward slash normalization
pub fn normalize_host_path(raw_path: &str) -> String {
    let mut clean = raw_path.trim();
    let is_file_uri = clean.starts_with("file:");

    if let Some(stripped) = clean.strip_prefix("file://") {
        clean = stripped;
        if let Some(without_host) = clean.strip_prefix("localhost") {
            clean = without_host;
        }
        // If on Windows style: /C:/path -> C:/path
        if clean.len() >= 3 && clean.starts_with('/') && clean.as_bytes()[2] == b':' {
            clean = &clean[1..];
        }
    } else if let Some(stripped) = clean.strip_prefix("file:") {
        clean = stripped;
        if clean.len() >= 3 && clean.starts_with('/') && clean.as_bytes()[2] == b':' {
            clean = &clean[1..];
        }
    }

    // URL percent decode
    let decoded = if is_file_uri { percent_decode_str(clean) } else { clean.to_string() };

    // Normalize backslashes to forward slashes
    let mut normalized = decoded.replace('\\', "/");

    // Deduplicate multiple forward slashes (preserving leading UNC //)
    let is_unc = normalized.starts_with("//");
    while normalized.contains("//") {
        normalized = normalized.replace("//", "/");
    }
    if is_unc && !normalized.starts_with("//") {
        normalized = format!("/{}", normalized);
    }

    normalized
}

fn percent_decode_str(input: &str) -> String {
    let mut bytes = Vec::with_capacity(input.len());
    let input_bytes = input.as_bytes();
    let mut i = 0;
    while i < input_bytes.len() {
        if input_bytes[i] == b'%' && i + 2 < input_bytes.len() {
            if let Ok(val) = u8::from_str_radix(
                std::str::from_utf8(&input_bytes[i + 1..i + 3]).unwrap_or(""),
                16,
            ) {
                bytes.push(val);
                i += 3;
                continue;
            }
        }
        bytes.push(input_bytes[i]);
        i += 1;
    }
    String::from_utf8(bytes).unwrap_or_else(|_| input.to_string())
}

/// Normalizes path segments (resolving `.` and `..`).
pub fn normalize_path_segments(path_str: &str) -> String {
    let is_absolute_posix = path_str.starts_with('/');
    let has_windows_drive = path_str.len() >= 2
        && path_str.as_bytes()[1] == b':'
        && path_str.as_bytes()[0].is_ascii_alphabetic();

    let (prefix, remainder) = if has_windows_drive {
        let (drv, rest) = path_str.split_at(2);
        let rest = rest.strip_prefix('/').unwrap_or(rest);
        (format!("{}/", drv), rest)
    } else if is_absolute_posix {
        (if path_str.starts_with("//") { "//" } else { "/" }.to_string(), &path_str[1..])
    } else {
        (String::new(), path_str)
    };

    let parts = remainder.split('/').filter(|p| !p.is_empty());
    let mut stack: Vec<&str> = Vec::new();

    for part in parts {
        if part == "." {
            continue;
        }
        if part == ".." {
            if stack.len() > (if prefix == "//" { 2 } else { 0 }) && *stack.last().unwrap() != ".." {
                stack.pop();
            } else if prefix.is_empty() {
                stack.push("..");
            }
        } else {
            stack.push(part);
        }
    }

    let joined = stack.join("/");
    if !prefix.is_empty() {
        format!("{}{}", prefix, joined)
    } else if joined.is_empty() && path_str == "." {
        ".".to_string()
    } else {
        joined
    }
}

/// Extracts the directory component from an owning .duc file path.
pub fn get_owning_duc_directory(owning_duc_path: &str) -> String {
    let normalized = normalize_host_path(owning_duc_path);
    if normalized.is_empty() {
        return String::new();
    }

    if normalized.ends_with('/') {
        return normalized.trim_end_matches('/').to_string();
    }

    match normalized.rfind('/') {
        None => ".".to_string(),
        Some(0) => "/".to_string(),
        Some(2) if normalized.as_bytes()[1] == b':' => normalized[..3].to_string(),
        Some(idx) => normalized[..idx].to_string(),
    }
}

/// Resolve a locator using portable path rules, without host filesystem access.
pub fn resolve_path(kind: &str, path: &str, owning_duc_path: Option<&str>) -> Result<String, String> {
    if path.trim().is_empty() {
        return Err("Locator path is missing or empty".to_string());
    }

    match kind {
        "absolute" => {
            let normalized = normalize_host_path(&path);
            if !normalized.starts_with('/') && !(normalized.len() >= 3 && normalized.as_bytes()[0].is_ascii_alphabetic() && &normalized[1..3] == ":/") {
                return Err("Absolute locators require a rooted native path".into());
            }
            Ok(normalize_path_segments(&normalized))
        }
        "relative" => {
            let owning = owning_duc_path.unwrap_or("").trim();
            if owning.is_empty() {
                return Err("Owning .duc file location is required to resolve relative locators".to_string());
            }

            let base_dir = get_owning_duc_directory(owning);
            let rel = normalize_host_path(&path);
            if rel.starts_with('/') || rel.split('/').next().unwrap_or("").contains(':') {
                return Err("Relative locators cannot contain an absolute path or URI".into());
            }
            let combined = if base_dir == "." {
                rel
            } else {
                format!("{}/{}", base_dir, rel)
            };
            Ok(normalize_path_segments(&combined))
        }
        _ => Err(format!("Unsupported locator kind: {kind}")),
    }
}
