import { DUC_VERSION, ExportedDataState, getFreeDrawSvgPath, getNormalizedZoom, isFreeDrawElement, normalizeForSerializationScope, restore, transformToRust } from 'ducjs';
import { collectFontFamilies, fetchFontsForFamilies } from './fonts';

export interface PdfConversionResult {
  data: Uint8Array;
  warnings: string[];
}

export interface DucDocumentSource {
  readDocumentState(): Partial<ExportedDataState> | Promise<Partial<ExportedDataState>>;
}

const PREPARED_DUC_PDF_SOURCE = 'ducpdf/prepared-v1' as const;

export interface PreparedDucPdfSource {
  kind: typeof PREPARED_DUC_PDF_SOURCE;
  state: unknown;
  fontFamilies: string[];
  backgroundColor?: string;
}

export type DucPdfSource = Partial<ExportedDataState> | DucDocumentSource | PreparedDucPdfSource;

/**
 * Fetch the raw duc2pdf WASM binary as an ArrayBuffer.
 * Must be called from the main thread where `import.meta.url` resolves correctly.
 * Used by ExportService to transfer the binary to a Web Worker.
 */
export async function getDuc2PdfWasmBinary(): Promise<ArrayBuffer> {
  const url = new URL('../../dist/duc2pdf_bg.wasm', import.meta.url);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch duc2pdf WASM: ${resp.status} ${resp.statusText}`);
  return resp.arrayBuffer();
}

/**
 * Initialize the duc2pdf WASM module from a pre-fetched binary (ArrayBuffer).
 * Used inside Web Workers where `import.meta.url` cannot resolve the .wasm file.
 */
export async function initWasmFromBinary(wasmBinary: BufferSource): Promise<void> {
  if (wasmModule) return;
  const wasmBindings: any = await import('../wasm');
  if (typeof wasmBindings.initSync === 'function') {
    wasmBindings.initSync({ module: wasmBinary });
  } else {
    await wasmBindings.default(wasmBinary);
  }

  const requiredFunctions = [
    'convert_exported_data_to_pdf_wasm',
  ];
  for (const fnName of requiredFunctions) {
    if (typeof wasmBindings[fnName] !== 'function') {
      throw new Error(`Required WASM function '${fnName}' not found`);
    }
  }
  wasmModule = wasmBindings;
}

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
      // Standard wasm-pack init pattern
      if (typeof wasmBindings.default === 'function') {
        // Call the init function - it will automatically fetch the WASM file
        // using import.meta.url to resolve the path correctly
        await wasmBindings.default();
      } else {
        throw new Error('WASM module does not have a default initialization function');
      }

      // Validate that required functions exist on the imported module
      const requiredFunctions = [
        'convert_exported_data_to_pdf_wasm',
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
  backgroundColor?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

function validateInput(source: DucPdfSource, options?: ConversionOptions): void {
  if (!source || typeof source !== 'object') {
    throw new Error('DUC document state or document source is required');
  }

  if (options) {
    if (options.offsetX !== undefined) {
      if (typeof options.offsetX !== 'number' || !Number.isFinite(options.offsetX)) {
        throw new Error(`offsetX must be a finite number, got: ${options.offsetX}`);
      }
    }
    if (options.offsetY !== undefined) {
      if (typeof options.offsetY !== 'number' || !Number.isFinite(options.offsetY)) {
        throw new Error(`offsetY must be a finite number, got: ${options.offsetY}`);
      }
    }
    if (options.width !== undefined) {
      if (typeof options.width !== 'number' || !Number.isFinite(options.width) || options.width <= 0) {
        throw new Error(`width must be a positive finite number, got: ${options.width}`);
      }
    }
    if (options.height !== undefined) {
      if (typeof options.height !== 'number' || !Number.isFinite(options.height) || options.height <= 0) {
        throw new Error(`height must be a positive finite number, got: ${options.height}`);
      }
    }
    if (options.scale !== undefined) {
      if (typeof options.scale !== 'number' || !Number.isFinite(options.scale) || options.scale <= 0) {
        throw new Error(`scale must be a positive finite number, got: ${options.scale}`);
      }
    }
    if (options.zoom !== undefined) {
      if (typeof options.zoom !== 'number' || !Number.isFinite(options.zoom) || options.zoom <= 0) {
        throw new Error(`zoom must be a positive finite number, got: ${options.zoom}`);
      }
    }
    if (options.backgroundColor !== undefined) {
      if (typeof options.backgroundColor !== 'string' || options.backgroundColor.trim() === '') {
        throw new Error(`backgroundColor must be a non-empty string, got: ${options.backgroundColor}`);
      }
    }
  }
}

function isPreparedDucPdfSource(source: DucPdfSource): source is PreparedDucPdfSource {
  return (source as PreparedDucPdfSource).kind === PREPARED_DUC_PDF_SOURCE;
}

async function resolveDocumentState(source: DucPdfSource): Promise<Partial<ExportedDataState>> {
  if (typeof (source as DucDocumentSource).readDocumentState === 'function') {
    return await (source as DucDocumentSource).readDocumentState();
  }
  return source as Partial<ExportedDataState>;
}

function prepareDocumentState(
  state: Partial<ExportedDataState>,
): { normalized: ExportedDataState; backgroundColor?: string } {
  const restored = restore(
    state,
    { syncInvalidIndices: (elements) => elements as any },
  );
  const completeState = {
    type: state.type ?? 'duc',
    version: state.version ?? DUC_VERSION,
    source: state.source ?? 'ducpdf',
    ...restored,
  } as ExportedDataState;
  const scope = completeState.localState?.scope || completeState.globalState?.mainScope || 'mm';
  const normalized: ExportedDataState = normalizeForSerializationScope(
    completeState,
    'mm',
    scope,
  );
  (normalized as any).localState.scope = 'mm';
  (normalized as any).globalState.mainScope = 'mm';

  const localState = (normalized as any).localState;
  if (!localState?.zoom) {
    const normalizedZoomValue = getNormalizedZoom(1);
    localState.zoom = {
      value: normalizedZoomValue,
      scoped: normalizedZoomValue as any,
      scaled: normalizedZoomValue as any,
    };
  }

  normalized.elements = (normalized.elements || []).map((element: any) => {
    let normalizedElement = element;
    if (element && isFreeDrawElement(element)) {
      const svgPath = getFreeDrawSvgPath(element);
      if (svgPath) {
        normalizedElement = Object.assign({}, element, { svgPath });
      }
    }
    if (element && element.type === 'model' && element.thumbnail != null) {
      const tn = element.thumbnail;
      if (!(tn instanceof Uint8Array)) {
        try {
          if (ArrayBuffer.isView(tn)) {
            normalizedElement = Object.assign({}, normalizedElement, {
              thumbnail: new Uint8Array((tn as ArrayBufferView).buffer, (tn as ArrayBufferView).byteOffset, (tn as ArrayBufferView).byteLength),
            });
          } else if (Array.isArray(tn)) {
            normalizedElement = Object.assign({}, normalizedElement, { thumbnail: new Uint8Array(tn) });
          } else if (typeof tn === 'object') {
            normalizedElement = Object.assign({}, normalizedElement, {
              thumbnail: new Uint8Array(Object.values(tn) as number[]),
            });
          }
        } catch {
          // Keep the original thumbnail if coercion fails.
        }
      }
    }
    return normalizedElement;
  });

  return {
    normalized,
    backgroundColor: (normalized as any).globalState?.viewBackgroundColor,
  };
}

export async function prepareDucPdfSource(source: DucPdfSource): Promise<PreparedDucPdfSource> {
  validateInput(source);
  if (isPreparedDucPdfSource(source)) {
    return source;
  }

  const state = await resolveDocumentState(source);
  const { normalized, backgroundColor } = prepareDocumentState(state);

  return {
    kind: PREPARED_DUC_PDF_SOURCE,
    state: transformToRust(normalized),
    fontFamilies: collectFontFamilies(normalized),
    backgroundColor,
  };
}

function applyZoomToPreparedState(state: unknown, zoom?: number): unknown {
  if (zoom === undefined || !state || typeof state !== 'object') {
    return state;
  }

  const normalizedZoom = getNormalizedZoom(zoom);
  const rustState = state as Record<string, any>;
  return {
    ...rustState,
    localState: {
      ...(rustState.localState ?? {}),
      zoom: normalizedZoom,
    },
  };
}

export async function convertDucToPdf(
  source: DucPdfSource,
  options?: ConversionOptions,
  debugMode: boolean = false
): Promise<PdfConversionResult> {
  const fontWarnings: string[] = [];
  try {
    validateInput(source, options);

    const prepared = await prepareDucPdfSource(source);
    if (debugMode) {
      debugConversionState(prepared.state as ExportedDataState, options);
    }

    const wasm = await initWasm();

    let fontMap = new Map<string, Uint8Array>();
    try {
      const result = await fetchFontsForFamilies(prepared.fontFamilies);
      fontMap = result.fontMap;
      fontWarnings.push(...result.warnings);
    } catch (e) {
      fontWarnings.push('Font fetching failed. Text will use the default font.');
    }

    const backgroundColor = options?.backgroundColor ? options.backgroundColor.trim() : prepared.backgroundColor;
    const rustState = applyZoomToPreparedState(prepared.state, options?.zoom);
    const result: Uint8Array = wasm.convert_exported_data_to_pdf_wasm(
      rustState,
      options?.offsetX,
      options?.offsetY,
      typeof options?.width === 'number' ? options.width : undefined,
      typeof options?.height === 'number' ? options.height : undefined,
      backgroundColor === undefined ? undefined : backgroundColor,
      typeof options?.scale === 'number' ? options.scale : undefined,
      fontMap,
    );

    // Check if conversion was successful
    if (!result || result.length === 0) {
      throw new Error('PDF conversion failed - empty result');
    }

    // Check if the result contains an error message from WASM
    if (result.length >= 6) {
      const prefixBytes = result.slice(0, 6);
      const prefixStr = String.fromCharCode(...prefixBytes);

      if (prefixStr === 'ERROR:') {
        // Extract and parse the error information
        const errorBytes = result.slice(6);
        let errorJson;
        try {
          errorJson = JSON.parse(new TextDecoder().decode(errorBytes));
        } catch (parseError) {
          // Fallback if JSON parsing fails
          const errorText = new TextDecoder().decode(errorBytes);
          throw new Error(`PDF conversion failed: ${errorText}`);
        }

        // Handle the new structured error format
        if (errorJson.error_type === 'ValidationError') {
          console.error('=== DUC to PDF Validation Error ===');
          console.error('Validation Error:', errorJson.error);
          console.error('Details:', errorJson.details);
          throw new Error(`PDF conversion failed: ${errorJson.details}`);
        }

        // Handle structured conversion errors
        const detailedError = `PDF conversion failed: ${errorJson.details || errorJson.error}`;
        console.error('=== DUC to PDF Conversion Error Details ===');
        console.error('Error Type:', errorJson.error_type);
        console.error('Error Message:', errorJson.error);
        console.error('Details:', errorJson.details);
        if (errorJson.conversion_context) {
          console.error('Conversion Context:', errorJson.conversion_context);
        }

        console.error('Conversion Options:', JSON.stringify(options, null, 2));

        throw new Error(detailedError);
      }
    }

    return { data: result, warnings: fontWarnings };
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
  source: DucPdfSource,
  offsetX: number,
  offsetY: number,
  width?: number,
  height?: number
): Promise<PdfConversionResult> {
  return convertDucToPdf(source, { offsetX, offsetY, width, height });
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

// Debug function to analyze DUC state before conversion
export function analyzeDucData(state: ExportedDataState): {
  source: string;
  elementCount: number;
  externalFileCount: number;
  potentialIssues: string[];
} {
  const issues: string[] = [];

  try {
    if (!state.elements?.length) {
      issues.push('DUC state has no elements');
    }
    const externalFiles = (state as any).files ?? (state as any).externalFiles ?? {};

    return {
      source: state.source,
      elementCount: state.elements?.length ?? 0,
      externalFileCount: Object.keys(externalFiles).length,
      potentialIssues: issues
    };
  } catch (error) {
    issues.push(`Error analyzing DUC state: ${error}`);
    return {
      source: '',
      elementCount: 0,
      externalFileCount: 0,
      potentialIssues: issues
    };
  }
}

// Debug function to log conversion state
export function debugConversionState(
  state: ExportedDataState,
  options?: ConversionOptions
): void {
  console.group('DUC to PDF Conversion Debug Info');

  const analysis = analyzeDucData(state);
  console.log('DUC State Analysis:', analysis);

  if (options) {
    console.log('Conversion Options:', {
      offsetX: options.offsetX,
      offsetY: options.offsetY,
      width: options.width,
      height: options.height,
      scale: options.scale,
      zoom: options.zoom,
      hasMetadata: !!(options.metadata?.title || options.metadata?.author || options.metadata?.subject)
    });
  } else {
    console.log('Conversion Options: (default/none)');
  }

  console.log('WASM Status:', {
    initialized: isWasmInitialized(),
    // Note: We can't easily check the detailed status without async
  });

  console.groupEnd();
}
