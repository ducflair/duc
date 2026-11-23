//! Native storage for multi-sheet source geometry. The rasterizer receives one page's resources.
use super::pdf::{groups, inherited_raw, inspect_document, save, set_layers, PdfInfo};
use hipdf::lopdf::{dictionary, Dictionary, Document, Object, ObjectId};
use std::collections::BTreeMap;

pub struct PageSource {
    doc: Document,
    pages: Vec<ObjectId>,
    pub info: PdfInfo,
    pub retained_bytes: usize,
}

impl PageSource {
    pub fn open(kind: &str, input: &[u8]) -> Result<Self, String> {
        let converted;
        let pdf = if kind == "pdf" {
            input
        } else {
            converted = super::convert(kind, input)?;
            &converted
        };
        let doc = Document::load_mem(pdf).map_err(|e| e.to_string())?;
        if doc.is_encrypted() {
            return Err("Cannot open an encrypted source PDF".into());
        }
        let info = inspect_document(&doc)?;
        let pages: Vec<_> = doc.get_pages().into_values().collect();
        if pages.is_empty() {
            return Err("PDF has no pages".into());
        }
        let retained_bytes = pdf
            .len()
            .saturating_add(doc.objects.len().saturating_mul(160));
        Ok(Self {
            doc,
            pages,
            info,
            retained_bytes,
        })
    }

    pub fn page(&self, index: usize, layers: &BTreeMap<String, bool>) -> Result<Vec<u8>, String> {
        let id = *self.pages.get(index).ok_or("Invalid PDF page index")?;
        let mut target = Document::with_version(&self.doc.version);
        self.doc
            .max_id
            .checked_add(2)
            .ok_or("Invalid PDF object range")?;
        target.max_id = self.doc.max_id;
        let parent = target.new_object_id();
        let root = target.new_object_id();
        let mut page = dictionary! { "Type" => "Page", "Parent" => parent };
        for key in [
            b"MediaBox".as_slice(),
            b"CropBox",
            b"Rotate",
            b"Resources",
            b"UserUnit",
            b"Contents",
            b"Group",
        ] {
            if let Some(value) = inherited_raw(&self.doc, id, key) {
                page.set(key, value.clone());
            }
        }
        // Scene PDFium renders page content, without annotations or navigation.
        let catalog = self.doc.catalog().map_err(|e| e.to_string())?;
        let mut metadata = dictionary! { "Type" => "Catalog", "Pages" => parent };
        for key in [b"OCProperties".as_slice(), b"OutputIntents", b"Version"] {
            if let Ok(value) = catalog.get(key) {
                metadata.set(key, value.clone());
            }
        }
        let mut pending = vec![];
        collect_dict_refs(&page, &mut pending);
        collect_dict_refs(&metadata, &mut pending);
        target.set_object(root, metadata);
        target.set_object(id, page);
        target.set_object(
            parent,
            dictionary! { "Type" => "Pages", "Count" => 1, "Kids" => vec![id.into()] },
        );
        target.trailer.set("Root", root);
        while let Some(reference) = pending.pop() {
            if target.objects.contains_key(&reference) {
                continue;
            }
            if let Some(object) = self.doc.objects.get(&reference) {
                collect_refs(object, &mut pending);
                target.set_object(reference, object.clone());
            }
        }
        if !layers.is_empty() {
            let ocgs = groups(&target);
            set_layers(&mut target, &ocgs, layers, false)?;
        }
        target.renumber_objects();
        save(&mut target)
    }
}

fn collect_dict_refs(dict: &Dictionary, pending: &mut Vec<ObjectId>) {
    for (_, value) in dict.iter() {
        collect_refs(value, pending);
    }
}

fn collect_refs(object: &Object, pending: &mut Vec<ObjectId>) {
    match object {
        Object::Reference(id) => pending.push(*id),
        Object::Dictionary(dict) => collect_dict_refs(dict, pending),
        Object::Stream(stream) => collect_dict_refs(&stream.dict, pending),
        Object::Array(array) => {
            for value in array {
                collect_refs(value, pending);
            }
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hipdf::lopdf::Stream;

    #[test]
    fn viewport_page_keeps_inherited_geometry_and_omits_other_sheet_streams() {
        let mut doc = Document::with_version("1.6");
        let parent = doc.new_object_id();
        let mut ids = vec![];
        for data in [b"0 0 7 9 re f".to_vec(), vec![b' '; 2 * 1024 * 1024]] {
            let stream = doc.add_object(Stream::new(Dictionary::new(), data));
            ids.push(doc.add_object(
                dictionary! { "Type" => "Page", "Parent" => parent, "Contents" => stream },
            ));
        }
        doc.set_object(parent, dictionary! { "Type" => "Pages", "Count" => 2, "Kids" => ids.into_iter().map(Object::from).collect::<Vec<_>>(),
            "MediaBox" => vec![0.into(), 0.into(), 32.into(), 48.into()], "Rotate" => 90 });
        let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => parent });
        doc.trailer.set("Root", catalog);
        let source = PageSource::open("pdf", &save(&mut doc).unwrap()).unwrap();
        let data = source.page(0, &BTreeMap::new()).unwrap();
        assert!(data.len() < 2048);
        let one = Document::load_mem(&data).unwrap();
        assert_eq!(one.get_pages().len(), 1);
        let page = one.get_pages()[&1];
        assert_eq!(
            one.get_page_content(page).unwrap(),
            source.doc.get_page_content(source.pages[0]).unwrap()
        );
        assert_eq!(
            inherited_raw(&one, page, b"Rotate")
                .unwrap()
                .as_i64()
                .unwrap(),
            90
        );
        assert_eq!(
            inherited_raw(&one, page, b"MediaBox")
                .unwrap()
                .as_array()
                .unwrap()
                .len(),
            4
        );
        assert!(source.page(2, &BTreeMap::new()).is_err());
    }
}
