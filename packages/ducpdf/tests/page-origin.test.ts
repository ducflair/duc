import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { init } from '@embedpdf/pdfium';
import { newPlotElement, restore } from 'ducjs';
import { convertDucToPdf, initWasmFromBinary } from '../src/duc2pdf';

test('PDF text at a positive world origin stays within the page including the footer', async () => {
  await initWasmFromBinary(readFileSync(new URL('../pkg/duc2pdf_bg.wasm', import.meta.url)));
  const state = restore({ elements: [
    ({ id: 'header', type: 'text', x: 30, y: 12, width: 200, height: 22, text: 'HEADER', fontFamily: 'Arial', fontSize: 12 } as any),
    ({ id: 'footer', type: 'text', x: 42, y: 655, width: 880, height: 22, text: 'CONCEPT FOOTER', fontFamily: 'Arial', fontSize: 12 }),
  ] }, { syncInvalidIndices: elements => elements as any });
  const { data, warnings } = await convertDucToPdf(state);
  expect(warnings).toEqual([]);
  const pdf = await init({ wasmBinary: readFileSync(Bun.resolveSync('@embedpdf/pdfium/pdfium.wasm', import.meta.dir)) });
  pdf.PDFiumExt_Init();
  const malloc = (size: number) => pdf.pdfium.wasmExports.malloc(size);
  const bytes = malloc(data.length), box = malloc(32);
  pdf.pdfium.HEAPU8.set(data, bytes);
  const doc = pdf.FPDF_LoadMemDocument(bytes, data.length, '');
  const page = pdf.FPDF_LoadPage(doc, 0), text = pdf.FPDFText_LoadPage(page);
  try {
    let value = '';
    for (let i=0; i<pdf.FPDFText_CountChars(text); i++) {
      const code = pdf.FPDFText_GetUnicode(text, i);
      value += String.fromCodePoint(code);
      if (code < 32) continue;
      expect(pdf.FPDFText_GetCharBox(text, i, box, box+8, box+16, box+24)).toBe(true);
      expect(pdf.pdfium.getValue(box+16, 'double')).toBeGreaterThanOrEqual(0);
      expect(pdf.pdfium.getValue(box+24, 'double')).toBeLessThanOrEqual(pdf.FPDF_GetPageHeight(page));
    }
    expect(value.replaceAll("\u00a0", " ")).toContain('CONCEPT FOOTER');
  } finally {
    pdf.FPDFText_ClosePage(text); pdf.FPDF_ClosePage(page); pdf.FPDF_CloseDocument(doc);
    pdf.pdfium.wasmExports.free(bytes); pdf.pdfium.wasmExports.free(box);
  }
});

test('mixed-size plot sheets fit independently and keep their text on the page', async () => {
  await initWasmFromBinary(readFileSync(new URL('../pkg/duc2pdf_bg.wasm', import.meta.url)));
  const detail = { ...newPlotElement({ x: 0, y: 0, width: 7, height: 3 }), id: 'detail' };
  const plan = { ...newPlotElement({ x: 1800, y: -2000, width: 17800, height: 10000 }), id: 'plan' };
  const state = restore({ elements: [
    detail,
    plan,
    { id: 'detail-label', type: 'text', frameId: detail.id, x: 1, y: 1, width: 5, height: 1,
      text: 'DETAIL', fontFamily: 'Arial', fontSize: 0.5 },
    { id: 'plan-label', type: 'text', frameId: plan.id, x: 2000, y: -1800, width: 2000, height: 200,
      text: 'PLAN', fontFamily: 'Arial', fontSize: 100 },
  ] }, { syncInvalidIndices: elements => elements as any });
  const { data } = await convertDucToPdf(state);
  const pdf = await init({ wasmBinary: readFileSync(Bun.resolveSync('@embedpdf/pdfium/pdfium.wasm', import.meta.dir)) });
  pdf.PDFiumExt_Init();
  const bytes = pdf.pdfium.wasmExports.malloc(data.length);
  const box = pdf.pdfium.wasmExports.malloc(32);
  pdf.pdfium.HEAPU8.set(data, bytes);
  const doc = pdf.FPDF_LoadMemDocument(bytes, data.length, '');
  try {
    expect(pdf.FPDF_GetPageCount(doc)).toBe(2);
    for (const [index, label, width, height] of [
      [0, 'DETAIL', 350, 150],
      [1, 'PLAN', 890, 500],
    ] as const) {
      const page = pdf.FPDF_LoadPage(doc, index);
      const text = pdf.FPDFText_LoadPage(page);
      try {
        const pageWidth = pdf.FPDF_GetPageWidth(page);
        const pageHeight = pdf.FPDF_GetPageHeight(page);
        expect(pageWidth * 25.4 / 72).toBeCloseTo(width, 2);
        expect(pageHeight * 25.4 / 72).toBeCloseTo(height, 2);
        let value = '';
        for (let character = 0; character < pdf.FPDFText_CountChars(text); character++) {
          value += String.fromCodePoint(pdf.FPDFText_GetUnicode(text, character));
          expect(pdf.FPDFText_GetCharBox(text, character, box, box+8, box+16, box+24)).toBe(true);
          expect(pdf.pdfium.getValue(box, 'double')).toBeGreaterThanOrEqual(0);
          expect(pdf.pdfium.getValue(box+8, 'double')).toBeLessThanOrEqual(pageWidth);
          expect(pdf.pdfium.getValue(box+16, 'double')).toBeGreaterThanOrEqual(0);
          expect(pdf.pdfium.getValue(box+24, 'double')).toBeLessThanOrEqual(pageHeight);
        }
        expect(value).toBe(label);
      } finally {
        pdf.FPDFText_ClosePage(text);
        pdf.FPDF_ClosePage(page);
      }
    }
  } finally {
    pdf.FPDF_CloseDocument(doc);
    pdf.pdfium.wasmExports.free(bytes);
    pdf.pdfium.wasmExports.free(box);
  }
});
