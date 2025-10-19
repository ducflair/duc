import { describe, it, expect } from 'vitest';
import { convertPdfToSvg } from '../src/pdf2svg/src/pdf-to-svg';
import { ensureDir, loadPdfFile, saveSvgOutput, validateSvg } from './helpers';
import { join } from 'node:path';

const OUTPUT_DIR = 'output/pdf2svg';

ensureDir(join(__dirname, OUTPUT_DIR));

describe('pdf2svg Integration Tests', () => {
  const pdfAssets = [
    'test.pdf',
    'lines.pdf',
    'sample-tables.pdf'
  ];

  for (const file of pdfAssets) {
    it(`converts ${file} to SVG`, async () => {
      const pdf = loadPdfFile(file);
      const result = await convertPdfToSvg(pdf, {
        scale: 1,
        pdf: { fontExtraProperties: true }
      });

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.pages).toHaveLength(result.pageCount);

      // Save each page as a separate SVG file
      for (const page of result.pages) {
        expect(page.svg).toBeDefined();
        validateSvg(page.svg);

        const outName = file.replace(/\.pdf$/, `_page_${page.index}.svg`);
        saveSvgOutput(`${OUTPUT_DIR}/${outName}`, page.svg);
      }
    }, 30000); // 30 second timeout for PDF processing
  }
});