use duc::types::DucDocElement;

const DOC_PDF_CACHE_FILE_ID_PREFIX: &str = "doc_pdf_cache_";
const DOC_TYPST_SOURCE_FILE_ID_PREFIX: &str = "doc_typst_source_";

pub fn get_renderable_doc_pdf_file_id(doc: &DucDocElement) -> Option<String> {
    resolve_doc_pdf_file_id(
        &doc.base.id,
        doc.file_id.as_deref(),
        &doc.referenced_file_ids,
    )
}

fn resolve_doc_pdf_file_id(
    element_id: &str,
    file_id: Option<&str>,
    referenced_file_ids: &[String],
) -> Option<String> {
    let cache_id = format!("{}{}", DOC_PDF_CACHE_FILE_ID_PREFIX, element_id);
    if referenced_file_ids.iter().any(|id| id == &cache_id) {
        return Some(cache_id);
    }

    file_id
        .filter(|id| !id.starts_with(DOC_TYPST_SOURCE_FILE_ID_PREFIX))
        .map(str::to_owned)
}

#[cfg(test)]
mod tests {
    use super::resolve_doc_pdf_file_id;

    #[test]
    fn resolves_compiled_pdf_cache_before_typst_source() {
        assert_eq!(
            resolve_doc_pdf_file_id(
                "doc-1",
                Some("doc_typst_source_doc-1"),
                &["doc_pdf_cache_doc-1".to_owned()],
            ),
            Some("doc_pdf_cache_doc-1".to_owned()),
        );
    }

    #[test]
    fn rejects_uncompiled_typst_source() {
        assert_eq!(
            resolve_doc_pdf_file_id("doc-1", Some("doc_typst_source_doc-1"), &[]),
            None,
        );
    }

    #[test]
    fn keeps_legacy_document_pdf_file_id() {
        assert_eq!(
            resolve_doc_pdf_file_id("doc-1", Some("legacy-document.pdf"), &[]),
            Some("legacy-document.pdf".to_owned()),
        );
    }
}
