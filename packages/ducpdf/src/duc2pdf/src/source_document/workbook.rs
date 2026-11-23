use hipdf::lopdf::{text_string, Document};
use ironcalc::base::Model;
use serde::Deserialize;
use xlsx_to_pdf::pdf::{
    plan_export_layout, renderer::render_pdf, ExportScope, Margins, PageBreakPolicy, PagePlan,
    PdfExportOptions, PdfExportOptionsPayload, PrintAreaPolicy, PrintSettingsPolicy,
    RepeatTitlePolicy,
};

fn model(bytes: &[u8], name: &str) -> Result<Model<'static>, String> {
    let book = ironcalc::import::load_from_xlsx_bytes(bytes, name, "en", "UTC")
        .map_err(|err| err.to_string())?;
    Model::from_workbook(book, "en")
}

fn render(
    model: &Model,
    options: &PdfExportOptions,
    plans: &[PagePlan],
) -> Result<Vec<u8>, String> {
    let pdf = render_pdf(model, options, plans).map_err(|err| err.to_string())?;
    let mut doc = Document::load_mem(&pdf).map_err(|err| err.to_string())?;
    for (id, plan) in doc.get_pages().into_values().zip(plans) {
        let page = doc.get_dictionary_mut(id).map_err(|err| err.to_string())?;
        page.set("DucSpace", text_string(&plan.sheet_name));
        page.set("DucWorkbookSheet", i64::from(plan.sheet_index));
    }
    let mut output = Vec::new();
    doc.save_to(&mut output).map_err(|err| err.to_string())?;
    Ok(output)
}

pub(super) fn inline(bytes: &[u8]) -> Result<Vec<u8>, String> {
    inline_model(&model(bytes, "Workbook")?)
}

pub(super) fn inline_model(model: &Model) -> Result<Vec<u8>, String> {
    let mut options = PdfExportOptions::default()
        .with_scope(ExportScope::EntireWorkbook)
        .fit_to_page()
        .with_margins(Margins {
            top_mm: 0.,
            right_mm: 0.,
            bottom_mm: 0.,
            left_mm: 0.,
            header_mm: 0.,
            footer_mm: 0.,
        });
    options.print_settings = PrintSettingsPolicy::IgnoreWorkbookSettings;
    options.range.print_area = PrintAreaPolicy::IgnoreDefinedPrintAreas;
    options.layout.manual_page_breaks = PageBreakPolicy::Ignore;
    options.layout.allow_sheet_to_span_multiple_pages = false;
    options.repeat.titles = RepeatTitlePolicy::None;
    let mut plans = plan_export_layout(model, &options).map_err(|err| err.to_string())?;
    // Shrink each PDF page to the planned cells before emitting vector operations.
    for plan in &mut plans {
        plan.content_x = 0.;
        plan.content_y = 0.;
        plan.page_width = plan.content_width().max(1.);
        plan.page_height = plan.content_height().max(1.);
    }
    render(model, &options, &plans)
}

#[derive(Deserialize)]
struct WorkbookPrintSettings {
    #[serde(flatten)]
    options: PdfExportOptionsPayload,
    visible_sheets: Option<Vec<u32>>,
    workbook_name: Option<String>,
}

pub fn print(bytes: &[u8], settings: &str) -> Result<Vec<u8>, String> {
    let settings: WorkbookPrintSettings =
        serde_json::from_str(settings).map_err(|err| err.to_string())?;
    let model = model(
        bytes,
        settings.workbook_name.as_deref().unwrap_or("Workbook"),
    )?;
    let sheet_index = settings.options.sheet_index;
    let mut options = settings.options.into_options();
    if let Some(sheets) = settings.visible_sheets {
        if sheets.is_empty() {
            return Err("Select at least one visible worksheet".into());
        }
        options.scope = ExportScope::SelectedSheets(sheets);
    } else if let (ExportScope::ActiveSheet, Some(sheet)) = (&options.scope, sheet_index) {
        options.scope = ExportScope::SelectedSheets(vec![sheet]);
    }
    if let ExportScope::Selection { range, .. } = &options.scope {
        if range.start_row < 1
            || range.end_row > 1_048_576
            || range.start_col < 1
            || range.end_col > 16_384
        {
            return Err("Invalid Excel cell range".into());
        }
    }
    let plans = plan_export_layout(&model, &options).map_err(|err| err.to_string())?;
    render(&model, &options, &plans)
}
