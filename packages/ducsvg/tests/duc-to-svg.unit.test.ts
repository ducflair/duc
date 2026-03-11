import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ducToSvg } from '../src/ducToSvg';
import { ensureDir, listDucFiles, loadDucFile, saveSvgOutput, validateSvg } from './helpers';

const CROP_DIR = join(__dirname, 'tests_output/crop');
const PLOTS_DIR = join(__dirname, 'tests_output/plots');

ensureDir(CROP_DIR);
ensureDir(PLOTS_DIR);

describe('ducToSvg — crop mode', () => {
  const assets = listDucFiles();

  for (const file of assets) {
    it(`crop: ${file}`, async () => {
      const duc = loadDucFile(file);
      const result = await ducToSvg(duc, { scale: 1 });

      expect(result.pages.length).toBeGreaterThan(0);

      const firstPage = result.pages[0];
      expect(firstPage.svg).toBeDefined();
      validateSvg(firstPage.svg);

      const baseName = file.replace(/\.duc$/, '_crop.svg');
      saveSvgOutput(join('tests_output/crop', baseName), firstPage.svg);
    }, 180000);
  }
});

describe('ducToSvg — plot mode (all pages)', () => {
  const assets = listDucFiles();

  for (const file of assets) {
    it(`plot: ${file}`, async () => {
      const duc = loadDucFile(file);
      const result = await ducToSvg(duc, { scale: 1 });

      expect(result.pages.length).toBeGreaterThan(0);

      const subDir = file.replace(/\.duc$/, '');
      ensureDir(join(PLOTS_DIR, subDir));

      for (const page of result.pages) {
        expect(page.svg).toBeDefined();
        validateSvg(page.svg);

        const outName = join('tests_output/plots', subDir, `page_${page.pageIndex}.svg`);
        saveSvgOutput(outName, page.svg);
      }
    }, 180000);
  }
});