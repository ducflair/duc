import { describe, it, expect } from 'bun:test';
import { convertDucToPdf } from '../src/duc2pdf/index';
import { loadDucFile, savePdfOutput, validatePdf, ensureDir } from './helpers';
import { join } from 'node:path';

const OUTPUT_DIR = 'tests_output/crop';
ensureDir(join(__dirname, OUTPUT_DIR));

function cropOpts(offsetX: number, offsetY: number, width?: number, height?: number) {
  const base: any = { offsetX, offsetY, metadata: { title: 'TS Crop Test', author: 'duc2pdf ts', subject: 'crop' } };
  if (width !== undefined) base.width = width;
  if (height !== undefined) base.height = height;
  return base;
}

describe('CROP mode conversions', () => {
  it('mixed_elements several crops', async () => {
    const duc = loadDucFile('mixed_elements.duc');
    const configs: Array<[string, number, number, number?, number?]> = [
      ['text_region', 0, -700, 25, 20],
      ['geometric_shapes', -500, -500, 20, 20],
      ['dimensions_area', 0, 30, 1500, 1000],
      ['central_elements', -250, -250, 30, 25],
    ];

    for (const [name, ox, oy, w, h] of configs) {
      const pdf = await convertDucToPdf(duc, cropOpts(ox, oy, w, h));
      validatePdf(pdf);
      savePdfOutput(`${OUTPUT_DIR}/mixed_elements_${name}.pdf`, pdf);
      expect(pdf.length).toBeGreaterThan(100);
    }
  });

  it('precision crops', async () => {
    const duc = loadDucFile('mixed_elements.duc');
    const configs: Array<[string, number, number, number?, number?]> = [
      ['micro_detail_1', -245.5, -245.5, 20, 15],
      ['micro_detail_2', -745.25, -245.75, 20, 15],
      ['narrow_strip', 0, -499.5, 25, 5],
      ['tiny_corner', -999, -999, 20, 15],
    ];

    for (const [name, ox, oy, w, h] of configs) {
      const pdf = await convertDucToPdf(duc, cropOpts(ox, oy, w, h));
      validatePdf(pdf);
      savePdfOutput(`${OUTPUT_DIR}/precision_${name}.pdf`, pdf);
    }
  });
});
