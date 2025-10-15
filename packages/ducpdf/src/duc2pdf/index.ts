import { ExportedDataState, getFreeDrawSvgPath, getNormalizedZoom, isFreeDrawElement, parseDuc, serializeDuc, traverseAndUpdatePrecisionValues } from 'ducjs';

let wasmModule: any = null;
let wasmInitPromise: Promise<any> | null = null;

async function initWasm(): Promise<any> {
  if (wasmModule) return wasmModule;

  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    try {
      // Dynamically import the WASM JS bindings
      const wasmBindings: any = await import('../wasm');
      
      // The wasm-pack generated module exports a default init function
      // that handles loading the WASM file using import.meta.url
      // This is the same pattern used by duc_renderer_bin
      if (typeof wasmBindings.default === 'function') {
        // Call the init function - it will automatically fetch the WASM file
        // using import.meta.url to resolve the path correctly
        await wasmBindings.default();
      } else {
        throw new Error('WASM module does not have a default initialization function');
      }

      // Validate that required functions exist on the imported module
      const requiredFunctions = [
        'convert_duc_to_pdf_rs',
        'convert_duc_to_pdf_crop_wasm',
        'convert_duc_to_pdf_crop_with_dimensions_wasm'
      ];

      for (const fnName of requiredFunctions) {
        if (typeof wasmBindings[fnName] !== 'function') {
          throw new Error(`Required WASM function '${fnName}' not found`);
        }
      }

      wasmModule = wasmBindings;
      return wasmModule;
    } catch (error) {
      console.error('Failed to initialize WASM module:', error);
      wasmInitPromise = null; // Reset promise on failure

      if (error instanceof Error) {
        throw new Error(`WASM module initialization failed: ${error.message}`);
      }
      throw new Error('WASM module initialization failed: Unknown error');
    }
  })();

  return wasmInitPromise;
}

export interface ConversionOptions {
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
  scale?: number;
  zoom?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

function validateInput(ducData: Uint8Array, options?: ConversionOptions): void {
  // Validate input data
  if (!ducData || ducData.length === 0) {
    throw new Error('DUC data is required and cannot be empty');
  }

  // Validate options
  if (options) {
    if (options.offsetX !== undefined && typeof options.offsetX !== 'number') {
      throw new Error('offsetX must be a number');
    }
    if (options.offsetY !== undefined && typeof options.offsetY !== 'number') {
      throw new Error('offsetY must be a number');
    }
    if (options.width !== undefined && (typeof options.width !== 'number' || options.width <= 0)) {
      throw new Error('width must be a positive number');
    }
    if (options.height !== undefined && (typeof options.height !== 'number' || options.height <= 0)) {
      throw new Error('height must be a positive number');
    }
    if (options.scale !== undefined && (typeof options.scale !== 'number' || options.scale <= 0)) {
      throw new Error('scale must be a positive number');
    }
    if (options.zoom !== undefined && (typeof options.zoom !== 'number' || options.zoom <= 0)) {
      throw new Error('zoom must be a positive number');
    }
  }
}

export async function convertDucToPdf(
  ducData: Uint8Array,
  options?: ConversionOptions
): Promise<Uint8Array> {
  try {
    // Validate inputs
    validateInput(ducData, options);

    // Initialize WASM module
    const wasm = await initWasm();

    let ducBytes = new Uint8Array(ducData);
    try {
      const latestBlob = new Blob([ducBytes]);
      const parsed = await parseDuc(latestBlob);
      if (parsed) {
        // Extract scope from parsed data - use localState.scope first, fallback to globalState.mainScope
        const scope = parsed?.localState?.scope || parsed?.globalState?.mainScope || 'mm';

        // ensure that we are only working with mm on the pdf conversion logic
        const normalized: ExportedDataState = traverseAndUpdatePrecisionValues(parsed, 'mm', scope);
        normalized.localState.scope = 'mm';
        normalized.globalState.mainScope = 'mm';

        // Apply zoom preference if provided
        const rawZoom = options?.zoom;

        const localState = normalized.localState;
        if (rawZoom !== undefined) {
          const normalizedZoomValue = getNormalizedZoom(rawZoom);
          const exportZoom = normalizedZoomValue;
          localState.zoom = {
            value: exportZoom,
            scoped: exportZoom as any,
            scaled: exportZoom as any,
          };
        } else if (!normalized.localState?.zoom) {
          const normalizedZoomValue = getNormalizedZoom(1);
          localState.zoom = {
            value: normalizedZoomValue,
            scoped: normalizedZoomValue as any,
            scaled: normalizedZoomValue as any,
          };
        }

        // Process elements before serialization
        let normalizedElements = normalized.elements || [];
        normalizedElements = normalizedElements.map(element => {
          if (element && isFreeDrawElement(element)) {
            const svgPath = getFreeDrawSvgPath(element);
            if (svgPath) {
              return Object.assign({}, element, { svgPath });
            }
          }
          return element;
        });

        normalized.elements = normalizedElements;

        // Re-serialize the DUC with normalized values and scope set to 'mm'
        const serialized = await serializeDuc(
          normalized,
          true, // use scoped values
          undefined,
          {
            forceScope: 'mm'
          }
        );
        if (serialized && serialized.length > 0) {
          ducBytes = new Uint8Array(serialized);
        } else {
          console.warn('serializeDuc returned empty; falling back to original DUC bytes');
        }
      } else {
        console.warn('parseDuc returned null/undefined; falling back to original DUC bytes');
      }
    } catch (e) {
      console.warn('DUC parse/serialize normalization failed; using original bytes. Reason:', e);
    }

    // Call the appropriate WASM function based on options
    let result: Uint8Array;

    if (options && (options.offsetX !== undefined || options.offsetY !== undefined)) {
      // Use crop mode with offset
      const offsetX = options.offsetX || 0;
      const offsetY = options.offsetY || 0;

      if (options.width !== undefined && options.height !== undefined) {
        // Crop with specific dimensions
        result = wasm.convert_duc_to_pdf_crop_with_dimensions_wasm(
          ducBytes,
          offsetX,
          offsetY,
          options.width,
          options.height
        );
      } else {
        // Crop with offset only
        result = wasm.convert_duc_to_pdf_crop_wasm(ducBytes, offsetX, offsetY);
      }
    } else {
      // Standard conversion
      result = wasm.convert_duc_to_pdf_rs(ducBytes);
    }

    // Check if conversion was successful
    if (!result || result.length === 0) {
      throw new Error('PDF conversion failed - empty result');
    }

    return result;
  } catch (error) {
    console.error('DUC to PDF conversion error:', error);

    if (error instanceof Error) {
      // Re-throw validation errors as-is
      if (error.message.includes('required') || error.message.includes('must be')) {
        throw error;
      }
      throw new Error(`Failed to convert DUC to PDF: ${error.message}`);
    }
    throw new Error('Failed to convert DUC to PDF: Unknown error');
  }
}

export async function convertDucToPdfCrop(
  ducData: Uint8Array,
  offsetX: number,
  offsetY: number,
  width?: number,
  height?: number
): Promise<Uint8Array> {
  return convertDucToPdf(ducData, { offsetX, offsetY, width, height });
}

// Utility functions
export function isWasmInitialized(): boolean {
  return wasmModule !== null;
}

export async function getWasmStatus(): Promise<{
  initialized: boolean;
  moduleAvailable: boolean;
  functions: string[];
}> {
  try {
    const wasm = await initWasm();
    return {
      initialized: true,
      moduleAvailable: true,
      functions: Object.keys(wasm).filter(key => typeof wasm[key] === 'function')
    };
  } catch (error) {
    return {
      initialized: false,
      moduleAvailable: false,
      functions: []
    };
  }
}

// Reset WASM module (useful for testing or error recovery)
export function resetWasmModule(): void {
  wasmModule = null;
  wasmInitPromise = null;
} 