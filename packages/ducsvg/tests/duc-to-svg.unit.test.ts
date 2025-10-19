import { describe, it, expect } from 'vitest';
import { ducToSvg } from '../src/ducToSvg';
import { loadDucFile, saveSvgOutput, validateSvg, ensureDir } from './helpers';
import { join } from 'node:path';

const OUTPUT_DIR = 'output/duc-to-svg';

ensureDir(join(__dirname, OUTPUT_DIR));

describe('ducToSvg Integration Tests', () => {
  const assets = [
    'blocks_instances.duc',
    'complex_tables.duc',
    'hatching_patterns.duc',
    'mixed_elements.duc',
    'override_capabilities.duc',
    'pdf_image_elements.duc',
    'plot_elements.duc',
    'universal.duc',
  ];

  for (const file of assets) {
    it(`converts ${file} to SVG`, async () => {
      const duc = loadDucFile(file);
      const result = await ducToSvg(duc, {
        scale: 1,
        svg: {
          pdf: { fontExtraProperties: true }
        }
      });

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.pages).toHaveLength(result.pageCount);

      // Save each page as a separate SVG file
      for (const page of result.pages) {
        expect(page.svg).toBeDefined();
        validateSvg(page.svg);

        const outName = file.replace(/\.duc$/, `_page_${page.index}.svg`);
        saveSvgOutput(`${OUTPUT_DIR}/${outName}`, page.svg);
      }
    }, 30000); // 30 second timeout for PDF processing
  }
});