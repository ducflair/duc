import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { init } from '@embedpdf/pdfium';
import { restore } from 'ducjs';
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
