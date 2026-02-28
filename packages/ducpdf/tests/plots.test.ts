import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { convertDucToPdf } from '../src/duc2pdf/index';
import { ensureDir, loadDucFile, savePdfOutput, validatePdf } from './helpers';

const OUTPUT_DIR = 'tests_output/plots';

ensureDir(join(__dirname, OUTPUT_DIR));

function optionsPlot() {
  return { metadata: { title: 'TS Plot Test', author: 'duc2pdf ts', subject: 'plots' } } as const;
}

describe('PLOTS mode conversions', () => {
  const assets = [
    'blocks_instances.duc',
    'universal.duc',
  ];

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
