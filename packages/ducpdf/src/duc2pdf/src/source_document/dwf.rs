use hipdf::lopdf::{text_string, Document};
use std::io::{Cursor, Read};

/// dwgpdf renders published graphics in manifest order but omits their sheet titles from the PDF.
fn sheet_titles(bytes: &[u8]) -> Option<Vec<Option<String>>> {
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes)).ok()?;
    let manifest = archive.by_name("manifest.xml").ok()?;
    if manifest.size() > 4 * 1024 * 1024 {
        return None;
    }
    let mut xml = String::new();
    manifest
        .take(4 * 1024 * 1024)
        .read_to_string(&mut xml)
        .ok()?;
    let doc = roxmltree::Document::parse(&xml).ok()?;
    Some(
        doc.descendants()
            .filter(|node| {
                node.has_tag_name("Section")
                    && !node.attribute("type").unwrap_or("").ends_with(".Data")
            })
            .filter(|section| {
                section.descendants().any(|res| {
                    if !res.has_tag_name("Resource") {
                        return false;
                    }
                    let mime = res.attribute("mime").unwrap_or("");
                    let role = res.attribute("role").unwrap_or("");
                    mime == "application/x-w2d"
                        || role == "2d streaming graphics"
                        || res
                            .attribute("href")
                            .is_some_and(|href| href.ends_with(".w2d"))
                        || (mime.starts_with("image/") && role != "texture")
                })
            })
            .map(|section| {
                section
                    .attribute("title")
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .map(str::to_owned)
            })
            .collect(),
    )
}

pub(super) fn convert(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let output =
        dwgpdf::convert_dwf_to_pdf(bytes, &Default::default()).map_err(|e| e.to_string())?;
    let Some(names) = sheet_titles(bytes).filter(|names| names.iter().any(Option::is_some)) else {
        return Ok(output);
    };
    let mut doc = Document::load_mem(&output).map_err(|e| e.to_string())?;
    let pages = doc.get_pages();
    // An unreadable graphic or a legacy archive can make the converter use a different sequence.
    if pages.len() != names.len() {
        return Ok(output);
    }
    for (id, title) in pages.into_values().zip(names) {
        if let Some(title) = title {
            doc.get_dictionary_mut(id)
                .map_err(|e| e.to_string())?
                .set("DucSpace", text_string(&title));
        }
    }
    super::pdf::save(&mut doc)
}
