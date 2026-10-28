import type { ExportedDataState } from 'ducjs';
import { getCanvasPdfBindings, prepareDucPdfSource } from './index';
import { fetchFontsForFamilies } from './fonts';

export const CANVAS_PDF_PROTOCOL = 1;

export interface CanvasRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elementIds: string[];
  signature: string;
  /** Compiler halo; compositor displays only the region's interior. */
  padding?: number;
}

/** One instance per drawing/worker. Only immutable patches cross the worker boundary. */
export class CanvasPdfSession {
  private native: any = null;
  private sequence = 0;
  private warnings: string[] = [];
  private unsupported = new Set<string>();
  private fontFamilies = new Set<string>();

  constructor(private readonly suppliedFonts: ReadonlyMap<string, Uint8Array> = new Map()) {}

  private async resolveFonts(families: readonly string[]) {
    const fetched = await fetchFontsForFamilies(families.filter(family => !this.suppliedFonts.has(family)));
    for (const family of families) {
      const bytes = this.suppliedFonts.get(family);
      if (bytes) fetched.fontMap.set(family, bytes);
    }
    return fetched;
  }

  async initialize(state: Partial<ExportedDataState>): Promise<void> {
    this.dispose();
    const prepared = await prepareDucPdfSource(state);
    const fonts = await this.resolveFonts(prepared.fontFamilies);
    const wasm = await getCanvasPdfBindings();
    if (!wasm.CanvasPdfSession) throw new Error('Canvas PDF compiler version mismatch');
    this.native = new wasm.CanvasPdfSession(prepared.state, fonts.fontMap);
    this.warnings = fonts.warnings;
    this.fontFamilies = new Set(prepared.fontFamilies);
    this.unsupported = new Set((state.elements ?? []).filter(element => element.type === 'table').map(element => element.id));
    this.sequence = 0;
  }

  async applyPatch(expected: number, sequence: number, state: Partial<ExportedDataState>, removed: string[], retainedRevisions?: string[]): Promise<void> {
    if (!this.native || expected !== this.sequence || sequence !== expected + 1) {
      throw new Error('Canvas PDF sequence mismatch');
    }
    const prepared = await prepareDucPdfSource(state);
    const missingFonts = prepared.fontFamilies.filter(family => !this.fontFamilies.has(family));
    const fonts = await this.resolveFonts(missingFonts);
    this.native.apply_patch(expected, sequence, prepared.state, removed, fonts.fontMap, retainedRevisions ?? null);
    for (const id of removed) this.unsupported.delete(id);
    for (const element of state.elements ?? []) {
      if (element.type === 'table') this.unsupported.add(element.id);
      else this.unsupported.delete(element.id);
    }
    this.sequence = sequence;
    for (const family of missingFonts) this.fontFamilies.add(family);
    this.warnings = [...new Set([...this.warnings, ...fonts.warnings])];
  }

  compileRegion(sequence: number, region: CanvasRegion) {
    if (!this.native || sequence !== this.sequence) throw new Error('Canvas PDF sequence mismatch');
    const started = performance.now();
    const padding = region.padding ?? 0;
    const pageBounds = { x: region.x - padding, y: region.y - padding,
      width: region.width + 2 * padding, height: region.height + 2 * padding };
    const data: Uint8Array = this.native.compile_region(sequence, region.elementIds,
      pageBounds.x, pageBounds.y, pageBounds.width, pageBounds.height);
    const warnings = [...this.warnings];
    return { data, warnings, sequence, region, pageBounds,
      compileMs: performance.now() - started };
  }

  emitTileCommands(sequence: number, region: CanvasRegion, scale = 1) {
    if (!this.native || sequence !== this.sequence) throw new Error('Canvas PDF sequence mismatch');
    const started = performance.now();
    const padding = region.padding ?? 0;
    const pageBounds = {
      x: region.x - padding,
      y: region.y - padding,
      width: region.width + 2 * padding,
      height: region.height + 2 * padding,
    };
    const commands: Uint32Array = this.native.emit_tile_commands(
      sequence,
      region.elementIds,
      pageBounds.x,
      pageBounds.y,
      pageBounds.width,
      pageBounds.height,
      scale,
    );
    const warnings = [...this.warnings];
    return {
      commands,
      warnings,
      sequence,
      region,
      pageBounds,
      compileMs: performance.now() - started,
    };
  }

  dispose(): void {
    this.native?.free();
    this.native = null;
    this.sequence = 0;
    this.fontFamilies.clear();
    this.warnings = [];
    this.unsupported.clear();
  }
}
