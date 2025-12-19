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
