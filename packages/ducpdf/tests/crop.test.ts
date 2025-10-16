import { describe, it, expect } from 'bun:test';
import { convertDucToPdf, type ConversionOptions } from '../src/duc2pdf';
import { loadDucFile, savePdfOutput, validatePdf, ensureDir } from './helpers';
import { join } from 'node:path';

const OUTPUT_DIR = 'tests_output/crop';
ensureDir(join(__dirname, OUTPUT_DIR));

const cropOpts = (
  offsetX: number,
  offsetY: number,
  width?: number,
  height?: number,
  zoom?: number,
): ConversionOptions => {
  // In this test we use meters, so we need to multiply by 1000 to convert to mm (PDF units)
  const base: ConversionOptions = {
    offsetX: offsetX * 1000,
    offsetY: offsetY * 1000,
    metadata: { title: 'TS Crop Test', author: 'duc2pdf ts', subject: 'crop' },
  };
  if (width !== undefined) base.width = width * 1000;
  if (height !== undefined) base.height = height * 1000;
  if (zoom !== undefined) base.zoom = zoom;
  return base;
};

describe('CROP mode conversions', () => {
  it('universal several crops', async () => {
    const duc = loadDucFile('universal.duc');
    const configs: Array<[string, number, number, number?, number?, number?]> = [
      ['dimensions_area', -8200, -2200, 2000, 2000, 0.2],
    ];

    for (const [name, ox, oy, w, h, z] of configs) {
      const pdf = await convertDucToPdf(duc, cropOpts(ox, oy, w, h, z));
      validatePdf(pdf);
      savePdfOutput(`${OUTPUT_DIR}/universal_${name}.pdf`, pdf);
      expect(pdf.length).toBeGreaterThan(100);
    }
  });

  it('precision crops', async () => {
    const duc = loadDucFile('universal.duc');
    const configs: Array<[string, number, number, number?, number?, number?]> = [
      ['micro_detail_1', -245.5, -245.5, 20, 15, 0.3],
      ['micro_detail_2', -745.25, -245.75, 20, 15, 2.5],
      ['narrow_strip', 0, -499.5, 25, 5, 1.2],
      ['tiny_corner', -999, -999, 20, 15, 3.0],
    ];

    for (const [name, ox, oy, w, h, z] of configs) {
      const pdf = await convertDucToPdf(duc, cropOpts(ox, oy, w, h, z));
      validatePdf(pdf);
      savePdfOutput(`${OUTPUT_DIR}/precision_${name}.pdf`, pdf);
    }
  });


    it('applies viewport background color when provided', async () => {
    const duc = loadDucFile('universal.duc');
    const baseConfig = cropOpts(-1600, -1200, 2000, 2000, 0.5);
    const pdfWithDefaultBackground = await convertDucToPdf(duc, baseConfig);
    const pdfWithoutBackground = await convertDucToPdf(duc, {
      ...baseConfig,
      backgroundColor: 'transparent',
    });
    const pdfWithBackground = await convertDucToPdf(duc, {
      ...baseConfig,
      backgroundColor: '#1a1f36',
    });

    validatePdf(pdfWithDefaultBackground);
    validatePdf(pdfWithoutBackground);
    validatePdf(pdfWithBackground);

    expect(pdfWithBackground.length).toBeGreaterThan(pdfWithDefaultBackground.length);
    savePdfOutput(`${OUTPUT_DIR}/background_default.pdf`, pdfWithDefaultBackground);
    savePdfOutput(`${OUTPUT_DIR}/background_off.pdf`, pdfWithoutBackground);
    savePdfOutput(`${OUTPUT_DIR}/background_on.pdf`, pdfWithBackground);
  });
});
