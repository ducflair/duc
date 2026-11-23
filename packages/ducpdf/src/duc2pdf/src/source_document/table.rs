use ironcalc::{base::Model, export::save_xlsx_to_writer};
use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    io::Cursor,
};

pub(super) fn model(bytes: &[u8]) -> Result<Model<'static>, String> {
    let table: Value = serde_json::from_slice(bytes).map_err(|err| err.to_string())?;
    let rows = table
        .as_array()
        .or_else(|| table.get("rows").and_then(Value::as_array))
        .ok_or("Table output must contain an array of rows")?;
    if rows.len() >= 1_048_576 {
        return Err("Table exceeds the workbook row limit".into());
    }
    let records = !rows.is_empty() && rows.iter().all(Value::is_object);
    let declared = table.get("columns").and_then(Value::as_array);
    let mut seen = HashSet::new();
    let headers: Vec<String> = if let Some(columns) = declared {
        columns.iter().map(cell_text).collect()
    } else if records {
        rows.iter()
            .filter_map(Value::as_object)
            .flat_map(|row| row.keys())
            .filter(|key| seen.insert(*key))
            .cloned()
            .collect()
    } else {
        (1..=rows
            .iter()
            .filter_map(Value::as_array)
            .map(Vec::len)
            .max()
            .unwrap_or(0))
            .map(|column| column.to_string())
            .collect()
    };
    let mut book = Model::new_empty("Table", "en", "UTC", "en")?;
    if headers.len() > 16_384 {
        return Err("Table exceeds the workbook column limit".into());
    }
    for (column, heading) in headers.iter().enumerate() {
        book.set_user_input(0, 1, column as i32 + 1, format!("'{heading}"))?;
    }
    let columns: HashMap<_, _> = headers
        .iter()
        .enumerate()
        .map(|(index, name)| (name, index))
        .collect();
    for (row_index, row) in rows.iter().enumerate() {
        let mut write = |column: usize, value: &Value| {
            if value.is_null() {
                return Ok(());
            }
            let input = if value.is_number() || value.is_boolean() {
                value.to_string()
            } else {
                format!("'{}", cell_text(value))
            };
            book.set_user_input(0, row_index as i32 + 2, column as i32 + 1, input)
        };
        if let Some(cells) = row.as_array() {
            for (column, cell) in cells.iter().take(headers.len()).enumerate() {
                write(column, cell)?;
            }
        } else if let Some(cells) = row.as_object() {
            for (name, cell) in cells {
                if let Some(&column) = columns.get(name) {
                    write(column, cell)?;
                }
            }
        } else {
            return Err("Expected each table row to contain cells".into());
        }
    }
    Ok(book)
}

fn cell_text(value: &Value) -> String {
    value
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| value.to_string())
}

pub fn to_workbook(bytes: &[u8]) -> Result<Vec<u8>, String> {
    save_xlsx_to_writer(&model(bytes)?, Cursor::new(Vec::new()))
        .map(Cursor::into_inner)
        .map_err(|err| err.to_string())
}
