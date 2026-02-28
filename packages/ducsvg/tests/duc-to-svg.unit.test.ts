import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ducToSvg } from '../src/ducToSvg';
import { ensureDir, loadDucFile, saveSvgOutput, validateSvg } from './helpers';

const OUTPUT_DIR = 'output/duc-to-svg';

ensureDir(join(__dirname, OUTPUT_DIR));

describe('ducToSvg Integration Tests', () => {
  const assets = [
    'blocks_instances.duc',
    'universal.duc',
  ];

  for (const file of assets) {
    it(`converts ${file} to SVG`, async () => {
      const duc = loadDucFile(file);
      const result = await ducToSvg(duc, {
        scale: 1,
      });

      expect(result.pages.length).toBeGreaterThan(0);
      // expect(result.pages).toHaveLength(result.pageCount);

      // Save each page as a separate SVG file
      for (const page of result.pages) {
        expect(page.svg).toBeDefined();
        validateSvg(page.svg);

        const outName = file.replace(/\.duc$/, `_page_${page.svg.pageIndex}.svg`);
        saveSvgOutput(`${OUTPUT_DIR}/${outName}`, page.svg);
      }
    }, 180000); // 3 minute timeout for large file processing
  }
});