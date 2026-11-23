use hipdf::images::{Image, ImageManager};
use hipdf::lopdf::{content::Content, dictionary, Document, Object, Stream};
use std::sync::{Arc, OnceLock};
use svg2pdf::usvg;

pub(crate) fn svg_options() -> usvg::Options<'static> {
    const FALLBACK: &str = "Liberation Sans";
    static FONT_DB: OnceLock<Arc<usvg::fontdb::Database>> = OnceLock::new();
    let fontdb = FONT_DB.get_or_init(|| {
        let mut database = usvg::fontdb::Database::new();
        database.load_font_data(include_bytes!("../../fonts/LiberationSans-Regular.ttf").to_vec());
        database.set_sans_serif_family(FALLBACK);
        // usvg uses the generic serif family as its last-resort font.
        database.set_serif_family(FALLBACK);
        Arc::new(database)
    });
    usvg::Options { font_family: FALLBACK.into(), fontdb: Arc::clone(fontdb), ..Default::default() }
}

pub(super) fn svg(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let tree = usvg::Tree::from_data(bytes, &svg_options()).map_err(|e| e.to_string())?;
    svg2pdf::to_pdf(&tree, Default::default(), Default::default()).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn svg_preserves_text_from_css_font_stacks() {
        let pdf = svg(br#"<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
            <text x="5" y="20" font-family='"Arial", "Helvetica", sans-serif'>SVG label</text>
        </svg>"#).unwrap();
        let pdf = Document::load_mem(&pdf).unwrap();
        assert!(pdf.objects.values().any(|object| {
            object.as_dict().ok()
                .and_then(|dict| dict.get(b"BaseFont").ok())
                .and_then(|name| name.as_name().ok())
                .is_some_and(|name| String::from_utf8_lossy(name).contains("LiberationSans"))
        }));
    }
}

pub(super) fn image(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let image = Image::from_bytes(bytes.to_vec(), None).map_err(|e| e.to_string())?;
    let (width, height) = image.dimensions();
    let mut pdf = Document::with_version("1.5");
    let mut images = ImageManager::new();
    let image = images.embed_image(&mut pdf, image).map_err(|e| e.to_string())?;
    let mut resources = dictionary! {};
    let name = images.add_to_resources(&mut resources, image);
    let (width, height) = (width as f32, height as f32);
    let stream = Content { operations: ImageManager::draw_image(&name, 0., 0., width, height) };
    let contents = pdf.add_object(Stream::new(dictionary! {}, stream.encode().map_err(|e| e.to_string())?));
    let pages = pdf.new_object_id();
    let page = pdf.add_object(dictionary! {
        "Type" => "Page", "Parent" => pages, "Resources" => resources,
        "MediaBox" => vec![Object::Integer(0), Object::Integer(0), width.into(), height.into()],
        "Contents" => contents
    });
    pdf.objects.insert(pages, Object::Dictionary(dictionary! {
        "Type" => "Pages", "Kids" => vec![Object::Reference(page)], "Count" => 1
    }));
    let catalog = pdf.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages });
    pdf.trailer.set("Root", catalog);
    pdf.compress();
    let mut output = Vec::new();
    pdf.save_to(&mut output).map_err(|e| e.to_string())?;
    Ok(output)
}
