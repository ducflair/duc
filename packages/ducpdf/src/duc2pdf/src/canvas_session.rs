//! A document-scoped compiler. PDF object references never cross region boundaries.
use crate::{builder::DucToPdfBuilder, ConversionMode, ConversionOptions};
use duc::types::{DucElementEnum, ExportedDataState};
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct CanvasPdfSession {
    state: ExportedDataState,
    sequence: u32,
    fonts: HashMap<String, Vec<u8>>,
}

#[wasm_bindgen]
impl CanvasPdfSession {
    #[wasm_bindgen(constructor)]
    pub fn new(state: JsValue, fonts: JsValue) -> Result<CanvasPdfSession, JsValue> {
        Ok(Self {
            state: crate::deserialize_exported_data(state).map_err(|e| JsValue::from_str(&e))?,
            sequence: 0,
            fonts: crate::deserialize_font_map(fonts),
        })
    }

    /// Metadata is replaced; element and revision bodies are upserted independently.
    pub fn apply_patch(
        &mut self,
        expected: u32,
        sequence: u32,
        patch: JsValue,
        removed: Vec<String>,
        fonts: JsValue,
        retained_revisions: Option<Vec<String>>,
    ) -> Result<(), JsValue> {
        if expected != self.sequence || expected.checked_add(1) != Some(sequence) {
            return Err(JsValue::from_str("Canvas PDF sequence mismatch"));
        }
        let mut next =
            crate::deserialize_exported_data(patch).map_err(|e| JsValue::from_str(&e))?;
        let replaced: HashSet<_> = next
            .elements
            .iter()
            .map(|e| DucToPdfBuilder::get_element_base(&e.element).id.clone())
            .chain(removed)
            .collect();
        self.state
            .elements
            .retain(|e| !replaced.contains(&DucToPdfBuilder::get_element_base(&e.element).id));
        self.state.elements.append(&mut next.elements);
        next.elements = std::mem::take(&mut self.state.elements);
        let mut data = self.state.external_files_data.take().unwrap_or_default();
        data.extend(next.external_files_data.take().unwrap_or_default());
        // Retain only active revisions still referenced by the current metadata.
        let active: HashSet<_> = next
            .external_files
            .as_ref()
            .into_iter()
            .flat_map(|m| m.values())
            .map(|f| f.active_revision_id.clone())
            .collect();
        data.retain(|revision, _| active.contains(revision));
        if let Some(retained) = retained_revisions {
            let retained: HashSet<_> = retained.into_iter().collect();
            data.retain(|revision, _| retained.contains(revision));
        }
        next.external_files_data = Some(data);
        self.state = next;
        self.fonts.extend(crate::deserialize_font_map(fonts));
        self.sequence = sequence;
        Ok(())
    }

    pub fn compile_region(
        &self,
        sequence: u32,
        ids: Vec<String>,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    ) -> Result<Vec<u8>, JsValue> {
        if sequence != self.sequence
            || ![x, y, width, height].iter().all(|n| n.is_finite())
            || width <= 0.0
            || height <= 0.0
        {
            return Err(JsValue::from_str("Invalid canvas region or sequence"));
        }
        let wanted: HashSet<_> = ids.into_iter().collect();
        let elements: Vec<_> = self
            .state
            .elements
            .iter()
            .filter(|e| wanted.contains(&DucToPdfBuilder::get_element_base(&e.element).id))
            .cloned()
            .collect();
        let mut resources = HashSet::new();
        for e in &elements {
            match &e.element {
                DucElementEnum::DucImageElement(e) => {
                    if let Some(id) = &e.file_id {
                        resources.insert(id.clone());
                    }
                }
                DucElementEnum::DucPdfElement(e) => {
                    if let Some(id) = &e.file_id {
                        resources.insert(id.clone());
                    }
                }
                DucElementEnum::DucDocElement(e) => {
                    if let Some(id) = crate::utils::document_pdf::get_renderable_doc_pdf_file_id(e)
                    {
                        resources.insert(id);
                    }
                }
                _ => {}
            }
        }
        let files: HashMap<_, _> = self
            .state
            .external_files
            .as_ref()
            .into_iter()
            .flat_map(|m| m.iter())
            .filter(|(id, _)| resources.contains(*id))
            .map(|(id, f)| (id.clone(), f.clone()))
            .collect();
        let revisions: HashSet<_> = files.values().map(|f| &f.active_revision_id).collect();
        let data = self
            .state
            .external_files_data
            .as_ref()
            .into_iter()
            .flat_map(|m| m.iter())
            .filter(|(id, _)| revisions.contains(id))
            .map(|(id, data)| (id.clone(), data.clone()))
            .collect();
        // Construct explicitly: cloning the full state would duplicate every binary asset per tile.
        let state = ExportedDataState {
            id: self.state.id.clone(),
            version: self.state.version.clone(),
            source: self.state.source.clone(),
            data_type: self.state.data_type.clone(),
            dictionary: self.state.dictionary.clone(),
            thumbnail: None,
            charter: self.state.charter.clone(),
            issues: vec![],
            elements,
            blocks: self.state.blocks.clone(),
            block_instances: self.state.block_instances.clone(),
            block_collections: self.state.block_collections.clone(),
            groups: self.state.groups.clone(),
            regions: self.state.regions.clone(),
            layers: self.state.layers.clone(),
            duc_local_state: self.state.duc_local_state.clone(),
            duc_global_state: self.state.duc_global_state.clone(),
            version_graph: None,
            external_files: Some(files),
            external_files_data: Some(data),
        };
        let options = ConversionOptions {
            mode: ConversionMode::Crop {
                offset_x: -x,
                offset_y: -y,
                width: Some(width),
                height: Some(height),
            },
            scale: Some(1.0),
            background_color: None,
            ..Default::default()
        };
        crate::convert_exported_data_to_pdf_with_fonts_and_options(
            state,
            options,
            self.fonts.clone(),
        )
        .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn emit_tile_commands(
        &self,
        sequence: u32,
        ids: Vec<String>,
        tile_x: f64,
        tile_y: f64,
        tile_w: f64,
        tile_h: f64,
        scale: f64,
    ) -> Result<Vec<u32>, JsValue> {
        if sequence != self.sequence
            || ![tile_x, tile_y, tile_w, tile_h, scale].iter().all(|n| n.is_finite())
            || tile_w <= 0.0
            || tile_h <= 0.0
            || scale <= 0.0
        {
            return Err(JsValue::from_str("Invalid tile region or sequence"));
        }

        let filter_by_ids = !ids.is_empty();
        let wanted: HashSet<_> = ids.into_iter().collect();
        let mut elements: Vec<&duc::types::ElementWrapper> = self
            .state
            .elements
            .iter()
            .filter(|e| !filter_by_ids || wanted.contains(&DucToPdfBuilder::get_element_base(&e.element).id))
            .collect();

        elements.sort_by(|a, b| {
            let base_a = DucToPdfBuilder::get_element_base(&a.element);
            let base_b = DucToPdfBuilder::get_element_base(&b.element);
            base_a
                .z_index
                .partial_cmp(&base_b.z_index)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        crate::streaming::tile_streamer::stream_tile_commands(
            &elements,
            &self.state.block_instances,
            tile_x,
            tile_y,
            tile_w,
            tile_h,
            scale,
        )
        .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

