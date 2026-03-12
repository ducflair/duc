import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
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
});
