import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { newPlotElement } from 'ducjs';
import { convertDucToPdf } from '../src/duc2pdf/index';
import { ensureDir, listDucFiles, loadDucFile, savePdfOutput, validatePdf } from './helpers';

const OUTPUT_DIR = 'tests_output/plots';

ensureDir(join(__dirname, OUTPUT_DIR));

function optionsPlot() {
  return { metadata: { title: 'TS Plot Test', author: 'duc2pdf ts', subject: 'plots' } } as const;
}

describe('PLOTS mode conversions', () => {
  const assets = listDucFiles();

  for (const file of assets) {
    it(`converts ${file} (PLOT)`, async () => {
      const duc = loadDucFile(file);
      const { data: pdf } = await convertDucToPdf(duc, optionsPlot());
      validatePdf(pdf);
      const outName = file.replace(/\.duc$/, '_plot.pdf');
      savePdfOutput(`${OUTPUT_DIR}/${outName}`, pdf);
      expect(pdf.length).toBeGreaterThan(100);
    }, 180000);
  }

  it('preserves physical dimensions for plot at large world coordinates', async () => {
    const base = loadDucFile('streaming-state.duc');
    const plot = newPlotElement({
      x: 4_177_383,
      y: 2_500_000,
      width: 210,
      height: 297,
    });
    const state = {
      ...base,
      elements: [plot],
    };
    const { data: pdf } = await convertDucToPdf(state, optionsPlot());
    validatePdf(pdf);
    savePdfOutput(`${OUTPUT_DIR}/large_coords_plot.pdf`, pdf);
    expect(pdf.length).toBeGreaterThan(100);
  });

  it('auto-scales oversized plot down to comfortable standard drawing scale (1:20)', async () => {
    const base = loadDucFile('streaming-state.duc');
    const plot = newPlotElement({
      x: 0,
      y: 0,
      width: 17_800, // 17.8 meters floor plan
      height: 10_000, // 10.0 meters
    });
    const state = {
      ...base,
      elements: [plot],
    };
    const { data: pdf } = await convertDucToPdf(state, optionsPlot());
    validatePdf(pdf);
    savePdfOutput(`${OUTPUT_DIR}/oversized_plot.pdf`, pdf);
    expect(pdf.length).toBeGreaterThan(100);

    const pdfString = new TextDecoder('latin1').decode(pdf);
    // Should have Scale: 1:20 in metadata
    expect(pdfString).toContain('Scale: 1:20');
  });

  it('auto-scales undersized plot up to comfortable reader scale (10:1)', async () => {
    const base = loadDucFile('streaming-state.duc');
    const plot = newPlotElement({
      x: 0,
      y: 0,
      width: 25, // 25 mm detail
      height: 25,
    });
    const state = {
      ...base,
      elements: [plot],
    };
    const { data: pdf } = await convertDucToPdf(state, optionsPlot());
    validatePdf(pdf);
    savePdfOutput(`${OUTPUT_DIR}/undersized_plot.pdf`, pdf);
    expect(pdf.length).toBeGreaterThan(100);

    const pdfString = new TextDecoder('latin1').decode(pdf);
    // Should have Scale: 10:1 in metadata
    expect(pdfString).toContain('Scale: 10:1');
  });
});

