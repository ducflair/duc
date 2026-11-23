import { beforeAll, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { init } from '@embedpdf/pdfium';
import { newElement, newModelElement, newPdfElement, newPlotElement, newTableElement, STROKE_PLACEMENT, type DucElement, type ExternalFileId } from 'ducjs';
import { getFixtureBytes } from '../../ducjs/tests/fixtures';
import { convertDucToPdf, getCanvasPdfBindings, initWasmFromBinary } from '../src/duc2pdf';
import { CanvasPdfSession } from '../src/duc2pdf/canvas';

const utf8 = new TextEncoder();
let dxf: Uint8Array;
let workbook: Uint8Array;
let workbookWithSheets: Uint8Array;
let dwf: Uint8Array;

let wasm: Awaited<ReturnType<typeof getCanvasPdfBindings>>;
let engine: Awaited<ReturnType<typeof init>>;
beforeAll(async () => {
  [dxf, workbook, workbookWithSheets, dwf] = await Promise.all([
    getFixtureBytes('dxf-files', 'columns_R2007.dxf'),
    getFixtureBytes('xlsx-files', 'weekly_timesheet.xlsx'),
    getFixtureBytes('xlsx-files', 'gantt_project_tracker.xlsx'),
    getFixtureBytes('dwf-files', 'FlyAshSystem.dwf'),
  ]);
  await initWasmFromBinary(readFileSync(new URL('../pkg/duc2pdf_bg.wasm', import.meta.url)));
  wasm = await getCanvasPdfBindings();
  engine = await init({ wasmBinary: readFileSync(Bun.resolveSync('@embedpdf/pdfium/pdfium.wasm', import.meta.dir)) });
  engine.PDFiumExt_Init();
});

async function exported(elements: DucElement[], bytes: Uint8Array, mimeType: string) {
  const meta = { id: 'revision', created: 1, lastRetrieved: 1, sizeBytes: bytes.length, mimeType };
  return (await convertDucToPdf({ elements, files: { source: { id: 'source', updated: 1,
    activeRevisionId: meta.id, revisions: { revision: meta } } }, filesData: { revision: bytes } } as any)).data;
}

function readPage(bytes: Uint8Array, index = 0, samples: [number, number][] = []) {
  const malloc = engine.pdfium.wasmExports.malloc;
  const ptr = malloc(bytes.length), pixels = malloc(256 * 256 * 4);
  engine.pdfium.HEAPU8.set(bytes, ptr);
  const doc = engine.FPDF_LoadMemDocument(ptr, bytes.length, '');
  expect(doc).toBeTruthy();
  const page = engine.FPDF_LoadPage(doc, index);
  const text = engine.FPDFText_LoadPage(page);
  const bitmap = engine.FPDFBitmap_CreateEx(256, 256, 4, pixels, 1024);
  try {
    let content = '';
    for (let i = 0; i < engine.FPDFText_CountChars(text); i++) content += String.fromCodePoint(engine.FPDFText_GetUnicode(text, i));
    engine.FPDFBitmap_FillRect(bitmap, 0, 0, 256, 256, 0xffffffff);
    engine.FPDF_RenderPageBitmap(bitmap, page, 0, 0, 256, 256, 0, 0x10);
    const ink = [0, 0];
    const data = engine.pdfium.HEAPU8;
    for (let i = 0; i < 256 * 256; i++) if (Math.min(data[pixels + i * 4], data[pixels + i * 4 + 1], data[pixels + i * 4 + 2]) < 220) ink[(i % 256) < 128 ? 0 : 1]++;
    const colors = samples.map(([x, y]) => {
      const pixel = pixels + (y * 256 + x) * 4;
      return [data[pixel], data[pixel + 1], data[pixel + 2]];
    });
    return { content: content.replaceAll('\u00a0', ' '), ink, colors };
  } finally {
    engine.FPDFBitmap_Destroy(bitmap);
    engine.FPDFText_ClosePage(text); engine.FPDF_ClosePage(page); engine.FPDF_CloseDocument(doc);
    engine.pdfium.wasmExports.free(ptr); engine.pdfium.wasmExports.free(pixels);
  }
}

test('plot fill and stroke paint behind the child on the canvas and on the exported sheet', async () => {
  const plot = newPlotElement({ x: 140, y: 240, width: 100, height: 100, zIndex: 1 });
  const background = [{ content: { src: '#ff0000', opacity: 0.5, visible: true } }];
  const stroke = [{ ...plot.stroke[0], width: 8, placement: STROKE_PLACEMENT.INSIDE,
    content: { ...plot.stroke[0].content, src: '#0000ff', opacity: 1, visible: true } }];
  const child = newElement({ type: 'rectangle', x: 175, y: 275, width: 30, height: 30, frameId: plot.id, zIndex: 2,
    background: [{ content: { src: '#00ff00', opacity: 1, visible: true } }], stroke: [] });
  const elements = [{ ...plot, background, stroke }, child];
  const session = new CanvasPdfSession();
  try {
    await session.initialize({ elements });
    const tile = session.compileRegion(0, {
      id: 'plot', x: 140, y: 240, width: 100, height: 100, elementIds: elements.map(e => e.id), signature: 'style',
    });
    // A plot sheet must put its page decorations behind even lower z-index children.
    const sheet = await convertDucToPdf({ elements: [elements[0], { ...child, zIndex: 0 }] });
    for (const pdf of [tile.data, sheet.data]) {
      const [border, interior, content] = readPage(pdf, 0, [[15, 128], [40, 128], [128, 128]]).colors;
      expect(border).toEqual([0, 0, 255]);
      expect(interior[0]).toBe(255);
      expect(interior[1]).toBeGreaterThanOrEqual(127);
      expect(interior[1]).toBeLessThanOrEqual(128);
      expect(interior[2]).toBe(interior[1]);
      expect(content).toEqual([0, 255, 0]);
    }
  } finally {
    session.dispose();
  }
});

// Two identical pages, each containing one switchable black rectangle and a calibrated viewport.
function layeredPdf() {
  const stream = '/OC /Duct BDC 0 g 15 15 70 70 re f EMC\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R /OCProperties << /OCGs [6 0 R] /D << /ON [6 0 R] /Order [6 0 R] >> >> >>',
    '<< /Type /Pages /Count 2 /Kids [3 0 R 4 0 R] /MediaBox [0 0 100 100] >>',
    ...[0,1].map(() => '<< /Type /Page /Parent 2 0 R /Contents 5 0 R /Resources << /Properties << /Duct 6 0 R >> >> /VP [<< /BBox [10 20 90 80] /Measure << /Subtype /RL /X [<< /C 2 /U (cm) >>] >> >>] >>'),
    '<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream',
    '<< /Type /OCG /Name (Ductwork) >>',
  ];
  let pdf = '%PDF-1.7\n'; const offsets = [0];
  objects.forEach((obj,i) => { offsets.push(pdf.length); pdf += (i+1)+' 0 obj\n'+obj+'\nendobj\n'; });
  const xref = pdf.length;
  pdf += 'xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  return utf8.encode(pdf+'trailer\n<< /Root 1 0 R /Size '+offsets.length+' >>\nstartxref\n'+xref+'\n%%EOF\n');
}

test('XLSX cells stay searchable in both the conversion and the exported table', async () => {
  expect(readPage(wasm.source_document_pdf('xlsx', workbook)).content).toContain('Weekly Timesheet');
  const table = newTableElement({ x: 0, y: 0, width: 200, height: 300, fileId: 'source' as ExternalFileId });
  const output = await exported([table], workbook, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  expect(readPage(output).content).toContain('Weekly Timesheet');
});

test('a workbook exports every visible sheet in tab order', () => {
  const pdf = wasm.source_document_pdf('xlsx', workbookWithSheets);
  const pages = JSON.parse(wasm.source_document_info(pdf)).pages;
  expect(pages.map((page: { name: string; sheetIndex: number }) => [page.name, page.sheetIndex]))
    .toEqual([['Plan', 0], ['Tasks', 1], ['Settings', 2]]);
  for (const [index, page] of pages.entries()) {
    expect(page.width).toBeGreaterThan(0);
    expect(page.height).toBeGreaterThan(0);
    const ink = readPage(pdf, index).ink;
    expect(ink[0] + ink[1]).toBeGreaterThan(20);
  }
  expect(readPage(pdf, 0).content.trim().length).toBeGreaterThan(0);
  expect(readPage(pdf, 1).content).toContain('TASK INPUT');
  expect(readPage(pdf, 2).content).toContain('PROJECT SETTINGS');
});

test('workbook print options select a sheet and apply paper size, margins and orientation independently of inline layout', () => {
  const pdf = wasm.source_workbook_print(workbookWithSheets, JSON.stringify({
    scope: 'CurrentSheet', sheet_index: 2, paper_size: 'Letter', orientation: 'Landscape',
    scale: 'FitToPage', margins: 'Custom', margin_left_pt: 0, margin_top_pt: 0,
  }));
  const pages = JSON.parse(wasm.source_document_info(pdf)).pages;
  expect(pages).toHaveLength(1);
  expect(pages[0]).toMatchObject({ sheetIndex: 2 });
  expect(pages[0].width).toBeCloseTo(792, 0);
  expect(pages[0].height).toBeCloseTo(612, 0);
  expect(readPage(pdf).content).toContain('PROJECT SETTINGS');
  expect(readPage(pdf).content).not.toContain('TASK INPUT');
});

test('exported Python tables, workbooks and SVG outputs render inline as searchable vectors', async () => {
  const bounds = { x: 0, y: 0, width: 200, height: 200 };
  const model = newModelElement(bounds);
  const svg = utf8.encode(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="5" y="5" width="60" height="60"/><text x="5" y="90" font-family='"Arial", "Helvetica", sans-serif'>Generated artwork</text></svg>`);
  for (const { renderer, data, mime, text } of [
    { renderer: 'svg', data: svg, mime: 'image/svg+xml', text: 'Generated artwork' },
    { renderer: 'xlsx', data: workbook, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', text: 'Weekly Timesheet' },
    { renderer: 'table', data: utf8.encode('[{"Part":"Duct elbow","Width":450}]'), mime: 'application/json', text: 'Duct elbow' },
  ]) {
    const output = await exported([{ ...model, modelType: 'python', customData: { modelOutput: { renderer, fileId: 'source' } } }], data, mime);
    expect(readPage(output).content).toContain(text);
  }
});

test('DXF model and Python-generated DXF use inline vectors', async () => {
  const pdf = wasm.source_document_pdf('dxf', dxf);
  const info = JSON.parse(wasm.source_document_info(pdf));
  expect(info.pages.length).toBeGreaterThan(1);
  expect(info.pages.at(-1).name).toBe('Model');
  expect(info.layers.length).toBeGreaterThan(0);
  expect(info.pages.at(-1).mmPerPoint).toBeGreaterThan(0);
  const opts = { x: 0, y: 0, width: 200, height: 200 };
  const model = { ...newModelElement(opts), modelType: 'dxf', fileIds: ['source' as ExternalFileId] };
  const python = { ...model, modelType: 'python', fileIds: [], customData: { modelOutput: { renderer: 'dxf', fileId: 'source' } } };
  for (const element of [model, python]) {
    const output = await exported([element], dxf, 'application/dxf');
    expect(readPage(output).ink.reduce((a,b) => a+b,0)).toBeGreaterThan(5);
  }
});

test('DWF sheets retain their published names and order', () => {
  const pdf = wasm.source_document_pdf('dwf', dwf);
  const info = JSON.parse(wasm.source_document_info(pdf));
  expect(info.pages.map((p: { name: string }) => p.name))
    .toEqual(['GreencastleSite-pdf.iam (Option4_2 - New Equipment)']);
});

test('paper-space layouts retain their order and layer state in columns_R2007.dxf', () => {
  const pdf = wasm.source_document_pdf('dxf', dxf);
  const { pages, layers } = JSON.parse(wasm.source_document_info(pdf));
  expect(pages.length).toBeGreaterThan(1);
  expect(pages.at(-1).name).toBe('Model');
  expect(pages.slice(0, -1).every((page: { name: string }) => page.name.length > 0)).toBe(true);
  const measurements = pages.flatMap((page: { measurements?: { mmPerPoint: number }[] }) => page.measurements ?? []);
  for (const measurement of measurements) expect(measurement.mmPerPoint).toBeGreaterThan(0);
  expect(layers.length).toBeGreaterThan(0);
  const hidden = wasm.source_document_layers(pdf, JSON.stringify({ [layers[0].id]: false }));
  expect(JSON.parse(wasm.source_document_info(hidden)).layers.find((layer: { id: string }) => layer.id === layers[0].id).visible).toBe(false);
});

test('a hidden CAD attachment does not interrupt export while its source is unavailable or corrupt', async () => {
  const hidden = { ...newModelElement({ x: 0, y: 0, width: 50, height: 50 }), modelType: 'dxf' as const,
    fileIds: ['source' as ExternalFileId], isVisible: false };
  const footprint = newElement({ type: 'rectangle', x: 5, y: 5, width: 20, height: 20 });
  const pdf = await exported([hidden, footprint], utf8.encode('incomplete'), 'application/dxf');
  expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-');
});

test('PDF layer and space settings survive embedding, independently for each copy', async () => {
  const source = layeredPdf();
  const info = JSON.parse(wasm.source_document_info(source));
  expect(info.pages).toHaveLength(2);
  expect(info.pages[0].measurements).toEqual([{ bounds: [10,20,90,80], mmPerPoint: 20 }]);
  expect(info.layers).toEqual([{ id: '6:0', name: 'Ductwork', visible: true }]);
  const off = wasm.source_document_layers(source, '{"6:0":false}');
  expect(readPage(source).ink[0]).toBeGreaterThan(100);
  expect(readPage(off).ink).toEqual([0,0]);

  const base = { ...newPdfElement({ x: 0, y: 0, width: 100, height: 100 }), fileId: 'source' as ExternalFileId };
  const left = { ...base, id: 'left', customData: { pdfView: { hiddenPages: [1] } } };
  const right = { ...base, id: 'right', x: 100, customData: { pdfView: { hiddenPages: [0], layers: { '6:0': false } } } };
  const output = await exported([left, right], source, 'application/pdf');
  const { ink } = readPage(output);
  expect(ink[0]).toBeGreaterThan(100);
  expect(ink[1]).toBe(0);
  const hidden = { ...right, customData: { pdfView: { hiddenPages: [0, 1] } } };
  expect(readPage(await exported([hidden], source, 'application/pdf')).ink).toEqual([0,0]);
});

test('an existing PDF output from a model uses the same inline vector rendering as a PDF element', async () => {
  const element = { ...newModelElement({ x: 0, y: 0, width: 100, height: 100 }), modelType: 'python',
    customData: { modelOutput: { renderer: 'pdf', fileId: 'source' } } };
  const result = await exported([element], layeredPdf(), 'application/pdf');
  const pdf = { ...newPdfElement({ x: 0, y: 0, width: 100, height: 100 }), fileId: 'source' as ExternalFileId,
    gridConfig: { columns: 1, gapX: 0, gapY: 0, scale: 1, firstPageAlone: false } };
  expect(readPage(result).ink).toEqual(readPage(await exported([pdf], layeredPdf(), 'application/pdf')).ink);
  expect(readPage(result).ink[0]).toBeGreaterThan(0);
});

test('standalone selection export retains sheet size, order, names and layer visibility', () => {
  const pdf = wasm.source_document_pdf('dxf', dxf);
  const info = (data: Uint8Array) => JSON.parse(wasm.source_document_info(data));
  const layerId = info(pdf).layers[0].id;
  const selection = wasm.source_document_view(pdf, JSON.stringify({ hiddenPages: [0, 0, 99], layers: { [layerId]: false } }));
  expect(info(selection).pages).toEqual(info(pdf).pages.slice(1));
  expect(info(selection).layers.find((layer: { id: string }) => layer.id === layerId).visible).toBe(false);
  const pageCount = info(pdf).pages.length;
  expect(() => wasm.source_document_view(pdf, JSON.stringify({
    hiddenPages: Array.from({ length: pageCount }, (_, index) => index),
  }))).toThrow();
  expect(readPage(wasm.source_document_view(layeredPdf(), '{"hiddenPages":[0],"layers":{"6:0":false}}')).ink).toEqual([0,0]);
});
