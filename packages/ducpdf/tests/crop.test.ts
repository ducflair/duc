import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { convertDucToPdf, type ConversionOptions } from '../src/duc2pdf';
import { ensureDir, loadDucFile, savePdfOutput, validatePdf } from './helpers';

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
  it('multiple blocks crops', async () => {
    const duc = loadDucFile('blocks_instances.duc');
    const configs: Array<[string, number, number, number?, number?, number?]> = [
      ['dimensions_area', 6.5, 2.5, 6, 1.4, 0.2],
    ];

    for (const [name, ox, oy, w, h, z] of configs) {
      const { data: pdf } = await convertDucToPdf(duc, cropOpts(ox, oy, w, h, z));
      validatePdf(pdf);
      savePdfOutput(`${OUTPUT_DIR}/multiple_blocks_${name}.pdf`, pdf);
      expect(pdf.length).toBeGreaterThan(100);
    }
  }, 180000);

  it('blocks_instances several crops', async () => {
    const duc = loadDucFile('blocks_instances.duc');
    const configs: Array<[string, number, number, number?, number?, number?]> = [
      ['dimensions_area', 6.5, 2.5, 2, 2, 0.2],
    ];

    for (const [name, ox, oy, w, h, z] of configs) {
      const { data: pdf } = await convertDucToPdf(duc, cropOpts(ox, oy, w, h, z));
      validatePdf(pdf);
      savePdfOutput(`${OUTPUT_DIR}/universal_${name}.pdf`, pdf);
      expect(pdf.length).toBeGreaterThan(100);
    }
  }, 180000);


  it('applies viewport background color when provided', async () => {
    const duc = loadDucFile('blocks_instances.duc');
    const baseConfig = cropOpts(10, 7, 2, 2, 0.1);
    const { data: pdfWithDefaultBackground } = await convertDucToPdf(duc, baseConfig);
    const { data: pdfWithoutBackground } = await convertDucToPdf(duc, {
      ...baseConfig,
      backgroundColor: 'transparent',
    });
    const { data: pdfWithBackground } = await convertDucToPdf(duc, {
      ...baseConfig,
      backgroundColor: '#1a1f36',
    });

    validatePdf(pdfWithDefaultBackground);
    validatePdf(pdfWithoutBackground);
    validatePdf(pdfWithBackground);

    expect(pdfWithBackground.length).toBeGreaterThan(100);
    expect(pdfWithDefaultBackground.length).toBeGreaterThan(100);
    expect(pdfWithoutBackground.length).toBeGreaterThan(100);
    savePdfOutput(`${OUTPUT_DIR}/background_default.pdf`, pdfWithDefaultBackground);
    savePdfOutput(`${OUTPUT_DIR}/background_off.pdf`, pdfWithoutBackground);
    savePdfOutput(`${OUTPUT_DIR}/background_on.pdf`, pdfWithBackground);
  }, 180000);
});
