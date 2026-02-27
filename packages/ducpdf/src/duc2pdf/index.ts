import { ExportedDataState, getFreeDrawSvgPath, getNormalizedZoom, isFreeDrawElement, normalizeForSerializationScope, parseDuc, serializeDuc } from 'ducjs';
import { fetchFontsForDuc } from './fonts';

export interface PdfConversionResult {
  data: Uint8Array;
  warnings: string[];
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
        'convert_duc_to_pdf_rs',
        'convert_duc_to_pdf_crop_wasm',
        'convert_duc_to_pdf_with_fonts_rs',
        'convert_duc_to_pdf_crop_with_fonts_wasm'
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

function validateInput(ducData: Uint8Array, options?: ConversionOptions): void {
  // Validate input data
  if (!ducData || ducData.length === 0) {
    throw new Error('DUC data is required and cannot be empty');
  }

  // Validate options - focus on basic validation only since the scaling system handles large values
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

export async function convertDucToPdf(
  ducData: Uint8Array,
  options?: ConversionOptions,
  debugMode: boolean = false
): Promise<PdfConversionResult> {
  const fontWarnings: string[] = [];
  try {
    // Validate inputs
    validateInput(ducData, options);

    // Debug logging if enabled
    if (debugMode) {
      debugConversionState(ducData, options);
    }

    // Initialize WASM module
    const wasm = await initWasm();

    let ducBytes = new Uint8Array(ducData);
    let viewBackgroundColor;
    let normalizedData: ExportedDataState | null = null;

    try {
      const latestBlob = new Blob([ducBytes]);
      const parsed = await parseDuc(latestBlob);
      if (parsed) {
        // Extract scope from parsed data - use localState.scope first, fallback to globalState.mainScope
        const scope = parsed?.localState?.scope || parsed?.globalState?.mainScope || 'mm';

        // ensure that we are only working with mm on the pdf conversion logic
        const normalized: ExportedDataState = normalizeForSerializationScope(parsed as unknown as ExportedDataState, 'mm', scope);
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
        normalizedElements = normalizedElements.map((element: any) => {
          let normalizedElement = element;
          if (element && isFreeDrawElement(element)) {
            const svgPath = getFreeDrawSvgPath(element);
            if (svgPath) {
              normalizedElement = Object.assign({}, element, { svgPath });
            }
          }
          return normalizedElement;
        });

        normalized.elements = normalizedElements;
        viewBackgroundColor = normalized.globalState.viewBackgroundColor;
        normalizedData = normalized;

        // Re-serialize the DUC with normalized values and scope set to 'mm'
        const serialized = await serializeDuc(
          normalized,
          { syncInvalidIndices: (elements: readonly any[]) => elements as any },
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

    // Fetch font data for all detected families (falls back gracefully if offline)
    let fontMap = new Map<string, Uint8Array>();
    if (normalizedData) {
      try {
        const result = await fetchFontsForDuc(normalizedData);
        fontMap = result.fontMap;
        fontWarnings.push(...result.warnings);
      } catch (e) {
        fontWarnings.push('Font fetching failed. Text will use the default font.');
      }
    }

    // Call the appropriate WASM function based on options
    let result: Uint8Array;
    const hasFonts = fontMap.size > 0;

    if (options && (options.offsetX !== undefined || options.offsetY !== undefined)) {
      // Use crop mode with offset
      const offsetX = options.offsetX || 0;
      const offsetY = options.offsetY || 0;
      const backgroundColor = options.backgroundColor ? options.backgroundColor.trim() : viewBackgroundColor;
      const widthOption = typeof options.width === 'number' ? options.width : undefined;
      const heightOption = typeof options.height === 'number' ? options.height : undefined;
      const backgroundOption = backgroundColor === undefined ? undefined : backgroundColor;

      if (hasFonts) {
        result = wasm.convert_duc_to_pdf_crop_with_fonts_wasm(
          ducBytes,
          offsetX,
          offsetY,
          widthOption,
          heightOption,
          backgroundOption,
          fontMap
        );
      } else {
        result = wasm.convert_duc_to_pdf_crop_wasm(
          ducBytes,
          offsetX,
          offsetY,
          widthOption,
          heightOption,
          backgroundOption
        );
      }
    } else {
      // Standard conversion
      if (hasFonts) {
        result = wasm.convert_duc_to_pdf_with_fonts_rs(ducBytes, fontMap);
      } else {
        result = wasm.convert_duc_to_pdf_rs(ducBytes);
      }
    }

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
        console.error('DUC Data Length:', `${errorJson.duc_data_length} bytes`);

        // Log conversion context if available
        if (errorJson.conversion_context) {
          console.error('Conversion Context:', errorJson.conversion_context);
        }

        // Log conversion options for debugging
        console.error('Conversion Options:', JSON.stringify(options, null, 2));

        // Special handling for scaling-related errors
        if (errorJson.details.includes('automatic scaling') || errorJson.details.includes('scaling logic')) {
          console.error('⚠️  Scaling System Alert: This error indicates the automatic scaling system failed.');
          console.error('   Please investigate the scaling logic in the Rust code:');
          console.error('   - calculate_required_scale() function');
          console.error('   - validate_all_coordinates_with_scale() function');
          console.error('   - DucDataScaler scaling application');
        }

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
  ducData: Uint8Array,
  offsetX: number,
  offsetY: number,
  width?: number,
  height?: number
): Promise<PdfConversionResult> {
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

// Debug function to analyze DUC data before conversion
export function analyzeDucData(ducData: Uint8Array): {
  size: number;
  headerInfo: string;
  estimatedElements: number;
  potentialIssues: string[];
} {
  const issues: string[] = [];
  let headerInfo = 'Unknown';

  try {
    // Basic size check
    if (ducData.length === 0) {
      issues.push('DUC data is empty');
      return {
        size: 0,
        headerInfo: 'Empty',
        estimatedElements: 0,
        potentialIssues: issues
      };
    }

    if (ducData.length < 100) {
      issues.push(`DUC data is very small (${ducData.length} bytes), may be truncated`);
    }

    if (ducData.length > 50 * 1024 * 1024) { // 50MB
      issues.push(`DUC data is very large (${(ducData.length / 1024 / 1024).toFixed(2)}MB), may cause memory issues`);
    }

    // Try to extract basic info from the binary data
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const preview = textDecoder.decode(ducData.slice(0, Math.min(200, ducData.length)));

    // Look for common DUC patterns
    if (preview.includes('duc')) {
      headerInfo = 'DUC format detected';
    } else if (preview.includes('{') || preview.includes('[')) {
      headerInfo = 'JSON-like structure detected';
    } else {
      headerInfo = 'Binary format';
    }

    // Estimate number of elements (rough heuristic)
    let elementCount = 0;
    const elementMatches = preview.match(/element/gi);
    if (elementMatches) {
      elementCount = elementMatches.length;
    }

    return {
      size: ducData.length,
      headerInfo,
      estimatedElements: elementCount,
      potentialIssues: issues
    };
  } catch (error) {
    issues.push(`Error analyzing DUC data: ${error}`);
    return {
      size: ducData.length,
      headerInfo: 'Error analyzing',
      estimatedElements: 0,
      potentialIssues: issues
    };
  }
}

// Debug function to log conversion state
export function debugConversionState(
  ducData: Uint8Array,
  options?: ConversionOptions
): void {
  console.group('🔍 DUC to PDF Conversion Debug Info');

  const analysis = analyzeDucData(ducData);
  console.log('📄 DUC Data Analysis:', analysis);

  if (options) {
    console.log('⚙️ Conversion Options:', {
      offsetX: options.offsetX,
      offsetY: options.offsetY,
      width: options.width,
      height: options.height,
      scale: options.scale,
      zoom: options.zoom,
      hasMetadata: !!(options.metadata?.title || options.metadata?.author || options.metadata?.subject)
    });
  } else {
    console.log('⚙️ Conversion Options: (default/none)');
  }

  console.log('🌐 WASM Status:', {
    initialized: isWasmInitialized(),
    // Note: We can't easily check the detailed status without async
  });

  console.groupEnd();
} 