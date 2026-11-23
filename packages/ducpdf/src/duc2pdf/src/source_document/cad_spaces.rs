//! Fill gaps in dwgpdf's default layout export using its named-layout converter.
use super::{layout_names::emitted_name_candidates, pdf::groups};
use acadrust::{document::CadDocument, objects::Layout};
use dwgpdf::{pdf::builder::CadToPdfBuilder, ConversionOptions};
use hipdf::lopdf::{Document, Object, ObjectId};
use std::collections::HashMap;

pub(super) fn ordered_pages(
    cad: &CadDocument,
    layouts: &[&Layout],
    pdf: &mut Document,
) -> Result<Vec<ObjectId>, String> {
    let mut existing: Vec<_> = pdf.get_pages().into_values().collect();
    let model = existing
        .pop()
        .ok_or("CAD conversion produced no model page")?;
    if existing.len() == layouts.len() {
        existing.push(model);
        return Ok(existing);
    }

    let names = emitted_name_candidates(cad, layouts, existing.len());
    let mut retained: HashMap<_, _> = if names.len() == existing.len() {
        names.into_iter().zip(existing).collect()
    } else {
        HashMap::new()
    };
    let parent = pdf
        .get_dictionary(model)
        .and_then(|d| d.get(b"Parent"))
        .and_then(Object::as_reference)
        .map_err(|e| e.to_string())?;
    let layers = groups(pdf).into_iter().map(|g| (g.name, g.id)).collect();
    let mut pages = Vec::with_capacity(layouts.len() + 1);
    for layout in layouts {
        let id = match retained.remove(&layout.name) {
            Some(id) => id,
            None => import_named_page(cad, &layout.name, pdf, parent, &layers)?,
        };
        pages.push(id);
    }
    pages.push(model);
    let tree = pdf.get_dictionary_mut(parent).map_err(|e| e.to_string())?;
    tree.set(
        "Kids",
        pages
            .iter()
            .copied()
            .map(Object::Reference)
            .collect::<Vec<_>>(),
    );
    tree.set("Count", pages.len() as i64);
    pdf.prune_objects();
    Ok(pages)
}

fn import_named_page(
    cad: &CadDocument,
    name: &str,
    pdf: &mut Document,
    parent: ObjectId,
    layers: &HashMap<String, ObjectId>,
) -> Result<ObjectId, String> {
    let options = ConversionOptions {
        layout: Some(name.into()),
        ..Default::default()
    };
    let bytes = CadToPdfBuilder::new(cad, options)
        .and_then(|builder| builder.build())
        .map_err(|e| e.to_string())?;
    let mut source = Document::load_mem(&bytes).map_err(|e| e.to_string())?;
    source.renumber_objects_with(
        pdf.max_id
            .checked_add(1)
            .ok_or("PDF object limit exceeded")?,
    );
    let page = *source.get_pages().get(&1).ok_or("CAD layout has no page")?;
    // References in the imported page must point to the same switchable layers as the model.
    let redirects: HashMap<_, _> = groups(&source)
        .into_iter()
        .filter_map(|g| layers.get(&g.name).map(|id| (g.id, *id)))
        .collect();
    source.traverse_objects(|obj| {
        if let Object::Reference(id) = obj {
            if let Some(shared) = redirects.get(id) {
                *id = *shared;
            }
        }
    });
    source
        .get_dictionary_mut(page)
        .map_err(|e| e.to_string())?
        .set("Parent", parent);
    pdf.max_id = pdf.max_id.max(source.max_id);
    pdf.objects.append(&mut source.objects);
    Ok(page)
}
