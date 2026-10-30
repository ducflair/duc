import { describe, expect, it } from 'bun:test';
import { newFreeDrawElement, restore } from 'ducjs';
import { convertDucToPdf, prepareDucPdfSource } from '../src/duc2pdf';
import { validatePdf } from './helpers';

describe('prepared PDF state', () => {
  it('adds the document envelope and removes non-cloneable easing functions', async () => {
    const restored = restore(
      {
        elements: [newFreeDrawElement({
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          zIndex: 0,
          label: 'Clone-safe stroke',
          isPlot: true,
          regionIds: [],
          layerId: null,
          simulatePressure: true,
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        })],
      },
      { syncInvalidIndices: (elements) => elements as any },
    );

    const prepared = await prepareDucPdfSource(restored);
    const cloned = structuredClone(prepared);
    const rustState = cloned.state as any;

    expect(rustState.type).toBe('duc');
    expect(typeof rustState.version).toBe('string');
    expect(rustState.source).toBe('ducpdf');
    expect(typeof rustState.elements[0].easing).toBe('string');

    const { data } = await convertDucToPdf(cloned);
    validatePdf(data);
  }, 180000);
});
