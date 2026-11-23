use duc::types::DocumentGridConfig;
use std::collections::HashSet;

pub struct PageLayout {
    pub page_index: usize,
    pub local_x: f32,
    pub local_y: f32,
    pub scaled_w: f32,
    pub scaled_h: f32,
    pub page_scale: f32,
}

pub fn layout(
    pages: &[(f32, f32)],
    grid: &DocumentGridConfig,
    hidden: &[usize],
    width: f32,
    height: f32,
) -> Vec<PageLayout> {
    let hidden: HashSet<_> = hidden.iter().collect();
    let visible: Vec<_> = (0..pages.len()).filter(|i| !hidden.contains(i)).collect();
    if visible.is_empty() {
        return vec![];
    }
    let cover = usize::from(grid.first_page_alone);
    let columns = (grid.columns.max(1) as usize).min((visible.len() - cover).max(1));
    let scale = if grid.scale > 0. {
        grid.scale as f32
    } else {
        1.
    };
    let (gap_x, gap_y) = (
        grid.gap_x.max(0.) as f32 * scale,
        grid.gap_y.max(0.) as f32 * scale,
    );
    let max_w = visible.iter().map(|&i| pages[i].0).fold(0., f32::max);
    let mut rows: Vec<&[usize]> = vec![];
    if cover == 1 {
        rows.push(&visible[..1]);
    }
    rows.extend(visible[cover..].chunks(columns));
    let row_height = |row: &[usize]| row.iter().map(|&i| pages[i].1).fold(0., f32::max);
    let scale = ((width - (columns - 1) as f32 * gap_x) / (columns as f32 * max_w)).min(
        (height - (rows.len() - 1) as f32 * gap_y)
            / rows.iter().map(|r| row_height(r)).sum::<f32>(),
    );
    if !scale.is_finite() || scale <= 0. {
        return vec![];
    }
    let mut layouts = vec![];
    let mut y = 0.;
    for (r, row) in rows.iter().enumerate() {
        for (col, &i) in row.iter().enumerate() {
            let (w, h) = pages[i];
            let x = if r == 0 && cover == 1 {
                (max_w * columns as f32 - w) * scale / 2.
            } else {
                col as f32 * (max_w * scale + gap_x) + (max_w - w) * scale / 2.
            };
            layouts.push(PageLayout {
                page_index: i,
                local_x: x,
                local_y: y,
                scaled_w: w * scale,
                scaled_h: h * scale,
                page_scale: scale,
            });
        }
        y += row_height(row) * scale + gap_y;
    }
    layouts
}
