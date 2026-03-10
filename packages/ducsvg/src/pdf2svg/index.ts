let wasmModule: any = null;
let wasmInitPromise: Promise<any> | null = null;

async function initWasm(): Promise<any> {
  if (wasmModule) return wasmModule;

  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    try {
      const wasmBindings: any = await import('../wasm');

      if (typeof wasmBindings.default === 'function') {
        await wasmBindings.default();
      } else {
        throw new Error('WASM module does not have a default initialization function');
      }

      if (typeof wasmBindings['convert_pdf_to_svg_rs'] !== 'function') {
        throw new Error("Required WASM function 'convert_pdf_to_svg_rs' not found");
      }

      wasmModule = wasmBindings;
      return wasmModule;
    } catch (error) {
      console.error('Failed to initialize pdf2svg WASM module:', error);
      wasmInitPromise = null;
      throw error;
    }
  })();

  return wasmInitPromise;
}

export interface SvgPage {
  svg: string;
}

export interface SvgDocument {
  pages: SvgPage[];
}

/**
 * Convert PDF bytes to SVG pages using hayro-svg WASM.
 */
export async function convertPdfToSvg(pdfData: Uint8Array): Promise<SvgDocument> {
  const wasm = await initWasm();

  const resultJson = wasm.convert_pdf_to_svg_rs(pdfData);
  const result: SvgDocument = JSON.parse(resultJson);

  return result;
}

export function isWasmInitialized(): boolean {
  return wasmModule !== null;
}

export function resetWasmModule(): void {
  wasmModule = null;
  wasmInitPromise = null;
}

/**
 * Fetch the raw pdf2svg WASM binary as an ArrayBuffer.
 * Must be called from the main thread where `import.meta.url` resolves correctly.
 */
export async function getSvgWasmBinary(): Promise<ArrayBuffer> {
  const url = new URL('../dist/pdf2svg_bg.wasm', import.meta.url);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch pdf2svg WASM: ${resp.status} ${resp.statusText}`);
  return resp.arrayBuffer();
}

/**
 * Initialize the pdf2svg WASM module from a pre-fetched binary (ArrayBuffer).
 * Used inside Web Workers where `import.meta.url` cannot resolve the .wasm file.
 */
export async function initSvgWasmFromBinary(wasmBinary: BufferSource): Promise<void> {
  if (wasmModule) return;
  const wasmBindings: any = await import('../wasm');
  if (typeof wasmBindings.initSync === 'function') {
    wasmBindings.initSync({ module: wasmBinary });
  } else if (typeof wasmBindings.default === 'function') {
    await wasmBindings.default(wasmBinary);
  } else {
    throw new Error('pdf2svg WASM module has no init function');
  }
  if (typeof wasmBindings['convert_pdf_to_svg_rs'] !== 'function') {
    throw new Error("Required WASM function 'convert_pdf_to_svg_rs' not found after binary init");
  }
  wasmModule = wasmBindings;
}
