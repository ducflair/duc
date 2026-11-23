use acadrust::objects::ObjectType;
use dwgpdf::pdf::builder::CadToPdfBuilder;
use hipdf::lopdf::{text_string, Document};
use std::collections::HashSet;

pub(super) fn convert(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let mut cad = dwgpdf::cad::load_cad_from_bytes(bytes).map_err(|e| e.to_string())?;
    if matches!(
        dwgpdf::cad::detect_format(bytes),
        dwgpdf::cad::CadFormat::Dxf
    ) {
        super::dxf_viewports::restore(&mut cad, bytes);
    }
    // Keep switchable geometry in the PDF, including initially off CAD layers.
    let mut off = HashSet::new();
    for layer in cad.layers.iter_mut() {
        if !layer.is_visible() {
            off.insert(layer.name.clone());
            layer.thaw();
            layer.turn_on();
        }
    }
    let options = dwgpdf::ConversionOptions::default();
    let margin = options.margin_pt;
    let builder = CadToPdfBuilder::new(&cad, options).map_err(|e| e.to_string())?;
    let bounds = *builder.bbox();
    let bytes = builder.build().map_err(|e| e.to_string())?;
    let mut doc = Document::load_mem(&bytes).map_err(|e| e.to_string())?;
    let mut layouts: Vec<_> = cad
        .objects
        .iter()
        .filter_map(|(_, obj)| match obj {
            ObjectType::Layout(l) if l.tab_order > 0 && !l.name.eq_ignore_ascii_case("model") => {
                Some(l)
            }
            _ => None,
        })
        .collect();
    layouts.sort_by_key(|l| (l.tab_order, &l.name));
    let pages = super::cad_spaces::ordered_pages(&cad, &layouts, &mut doc)?;
    let mm = super::cad_measure::millimetres(cad.header.insertion_units);
    for (index, id) in pages.into_iter().enumerate() {
        let page = doc.get_dictionary_mut(id).map_err(|e| e.to_string())?;
        if let Some(layout) = layouts.get(index) {
            page.set("DucSpace", text_string(&layout.name));
            if let Some(mm) = mm {
                super::cad_measure::paper(page, mm, &cad, layout);
            }
        } else {
            page.set("DucSpace", text_string("Model"));
            if let Some(mm) = mm {
                super::cad_measure::model(page, mm, bounds, margin);
            }
        }
    }
    // CAD parsing may assign different PDF object numbers on a subsequent conversion.
    for group in super::pdf::groups(&doc) {
        doc.get_dictionary_mut(group.id)
            .map_err(|e| e.to_string())?
            .set("DucLayerId", text_string(&format!("cad:{}", group.name)));
    }
    let layers = super::pdf::groups(&doc);
    let visibility = layers
        .iter()
        .filter(|g| off.contains(&g.name))
        .map(|g| (g.key(), false))
        .collect();
    super::pdf::set_layers(&mut doc, &layers, &visibility, false)?;
    super::pdf::save(&mut doc)
}
