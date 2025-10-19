import type {
  DocumentInitParameters,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy
} from 'pdfjs-dist/types/src/display/api';
import type { PageViewport } from 'pdfjs-dist/types/src/display/display_utils';

const workerSrc = new URL('../vendor/pdfjs-dist/pdf.worker.min.js', import.meta.url).toString();

let pdfjsLibCache: typeof import('pdfjs-dist/legacy/build/pdf.js') | null = null;

const getPdfJsLib = async () => {
  if (!pdfjsLibCache) {
    pdfjsLibCache = await import(
      /* @vite-ignore */ new URL('../vendor/pdfjs-dist/pdf.js', import.meta.url).toString()
    ) as typeof import('pdfjs-dist/legacy/build/pdf.js');
  }
  return pdfjsLibCache;
};
import {
  type PdfSource,
  type PdfSvgDocument,
  type PdfSvgPage,
  type PdfToSvgOptions
} from './types';

const XMLNS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

let workerConfigured = false;

type PdfPageWithInternals = PDFPageProxy & {
  commonObjs: unknown;
  objs: unknown;
};

type PdfDocumentWithFingerprint = {
  fingerprint?: unknown;
};

function ensureWorkerConfigured(pdfjsLib: typeof import('pdfjs-dist/legacy/build/pdf.js')) {
  if (!workerConfigured && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }
  workerConfigured = true;
}

function isDocumentInitParameters(value: unknown): value is DocumentInitParameters {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<DocumentInitParameters>;
  return (
    'url' in candidate ||
    'data' in candidate ||
    'range' in candidate ||
    'docBaseUrl' in candidate
  );
}

function toUint8Array(view: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (view instanceof ArrayBuffer) {
    return new Uint8Array(view);
  }

  const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
  return new Uint8Array(buffer);
}

export async function normalizePdfSource(
  source: PdfSource,
  overrides: Partial<DocumentInitParameters> = {}
): Promise<DocumentInitParameters> {
  if (isDocumentInitParameters(source)) {
    return { ...source, ...overrides };
  }

  const init: DocumentInitParameters = { ...overrides };

  if (typeof source === 'string' || source instanceof URL) {
    init.url = source.toString();
    return init;
  }

  if (source instanceof Blob) {
    init.data = toUint8Array(await source.arrayBuffer());
    return init;
  }

  if (ArrayBuffer.isView(source) || source instanceof ArrayBuffer) {
    init.data = toUint8Array(source);
    return init;
  }

  throw new TypeError('Unsupported PDF source type.');
}

function assertDomEnvironment(): void {
  if (typeof XMLSerializer === 'undefined') {
    throw new Error('convertPdfToSvg requires a DOM environment with XMLSerializer support.');
  }
}

function createAbortError(): Error {
  try {
    return new DOMException('Rendering aborted', 'AbortError');
  } catch {
    const error = new Error('Rendering aborted');
    error.name = 'AbortError';
    return error;
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function linkAbortSignal(task: PDFDocumentLoadingTask, signal?: AbortSignal): () => void {
  if (!signal) {
    return () => undefined;
  }

  if (signal.aborted) {
    task.destroy();
    throw createAbortError();
  }

  const abort = () => {
    task.destroy();
  };

  signal.addEventListener('abort', abort, { once: true });
  return () => signal.removeEventListener('abort', abort);
}

async function renderPageToSvg(
  pdfjsLib: typeof import('pdfjs-dist/legacy/build/pdf.js'),
  page: PDFPageProxy,
  viewport: PageViewport,
  embedFonts: boolean
): Promise<string> {
  const { SVGGraphics } = pdfjsLib;
  const operatorList = await page.getOperatorList();
  const internalPage = page as PdfPageWithInternals;
  const svgGraphics = new SVGGraphics(internalPage.commonObjs, internalPage.objs, true);
  svgGraphics.embedFonts = embedFonts;

  const svg = await svgGraphics.getSVG(operatorList, viewport);
  svg.setAttribute('xmlns', XMLNS);
  if (!svg.hasAttribute('xmlns:xlink')) {
    svg.setAttribute('xmlns:xlink', XLINK_NS);
  }
  svg.setAttribute('width', viewport.width.toString());
  svg.setAttribute('height', viewport.height.toString());

  let serialized = new XMLSerializer().serializeToString(svg);
  
  // Fix namespace prefixes (svg: -> no prefix for SVG elements)
  serialized = serialized.replace(/<svg:/g, '<').replace(/<\/svg:/g, '</');
  
  return serialized;
}

export async function convertPdfToSvg(
  source: PdfSource,
  options: PdfToSvgOptions = {}
): Promise<PdfSvgDocument> {
  const {
    scale = 1,
    disableWorker,
    embedFonts = true,
    onProgress,
    signal,
    pdf: pdfOverrides
  } = options;

  assertDomEnvironment();
  const pdfjsLib = await getPdfJsLib();
  if (!disableWorker) {
    ensureWorkerConfigured(pdfjsLib);
  }

  const pdfInitOverrides: Partial<DocumentInitParameters> = {
    ...(pdfOverrides ?? {})
  };

  if (embedFonts && pdfInitOverrides.fontExtraProperties === undefined) {
    pdfInitOverrides.fontExtraProperties = true;
  }

  const init = await normalizePdfSource(source, pdfInitOverrides);

  if (disableWorker) {
    (init as DocumentInitParameters & { disableWorker?: boolean }).disableWorker = true;
  }

  const loadingTask = pdfjsLib.getDocument(init);
  const abortUnsubscribe = linkAbortSignal(loadingTask, signal);

  try {
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: PdfSvgPage[] = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      throwIfAborted(signal);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const svg = await renderPageToSvg(pdfjsLib, page, viewport, embedFonts);

      pages.push({
        index: pageNumber - 1,
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation,
        svg
      });

      onProgress?.({
        page: pageNumber,
        total: totalPages,
        width: viewport.width,
        height: viewport.height
      });

      page.cleanup();
    }

    return {
      pageCount: totalPages,
      fingerprint: extractFingerprint(pdf),
      pages
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }
    throw error;
  } finally {
    abortUnsubscribe();
    await loadingTask.destroy();
  }
}

function extractFingerprint(pdf: PDFDocumentProxy): string | undefined {
  const candidate = pdf as PDFDocumentProxy & PdfDocumentWithFingerprint;
  const fingerprint = candidate.fingerprint;
  return typeof fingerprint === 'string' ? fingerprint : undefined;
}
