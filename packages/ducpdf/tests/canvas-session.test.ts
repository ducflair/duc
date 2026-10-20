import { beforeAll, describe, expect, test } from 'bun:test';
import { CanvasPdfSession } from '../src/duc2pdf/canvas';
import { initWasmFromBinary } from '../src/duc2pdf';
import { restore, type ExportedDataState } from 'ducjs';

const state = (x: number): Partial<ExportedDataState> => ({
  ...restore({ elements: [{ id: 'rect', type: 'rectangle', x, y: 10, width: 80, height: 50,
    isVisible: true, isDeleted: false, version: 1, zIndex: 0,
    background: [{ content: { src: '#ff0000', visible: true, opacity: 1 } }],
  }] } as any, { syncInvalidIndices: elements => elements as any }),
  type: 'duc', version: '1', source: 'canvas-test',
});
beforeAll(async () => {
  await initWasmFromBinary(await Bun.file(new URL('../pkg/duc2pdf_bg.wasm', import.meta.url)).arrayBuffer());
});
describe('persistent canvas PDF compiler', () => {
  test('compiles populated output and applies revision-checked move/delete/undo patches', async () => {
    const session = new CanvasPdfSession();
    await session.initialize(state(10));
    const region = { id: 'test', x: 0, y: 0, width: 200, height: 200, elementIds: ['rect'], signature: '1' };
    const initial = session.compileRegion(0, region);
    expect(new TextDecoder().decode(initial.data.slice(0, 5))).toBe('%PDF-');
    expect(initial.data.length).toBeGreaterThan(1000);
    await session.applyPatch(0, 1, state(100), []);
    const moved = session.compileRegion(1, region);
    expect(moved.data).not.toEqual(initial.data);
    await expect(session.applyPatch(0, 2, state(10), [])).rejects.toThrow('sequence');
    await expect(session.applyPatch(1, 3, state(10), [])).rejects.toThrow('sequence');
    const empty = state(0); empty.elements = [];
    await session.applyPatch(1, 2, empty, ['rect']);
    expect(session.compileRegion(2, region).data).not.toEqual(moved.data);
    await session.applyPatch(2, 3, state(10), []);
    expect(session.compileRegion(3, region).data.length).toBe(initial.data.length);
    session.dispose();
    expect(() => session.compileRegion(3, region)).toThrow();
  });
});
