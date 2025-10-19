import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';

export type BinaryPdfSource = ArrayBuffer | ArrayBufferView | Blob | File;

export type PdfSource = BinaryPdfSource | string | URL | DocumentInitParameters;

export interface PdfSvgPage {
  /** Zero-based page index. */
  index: number;
  /** Width of the rendered SVG in CSS pixels. */
  width: number;
  /** Height of the rendered SVG in CSS pixels. */
  height: number;
  /** Clockwise rotation applied to the page, in degrees. */
  rotation: number;
  /** Serialized SVG markup for the page. */
  svg: string;
}

export interface PdfSvgDocument {
  /** Total number of pages in the original PDF. */
  pageCount: number;
  /** Unique fingerprint reported by pdf.js when available. */
  fingerprint?: string;
  /** Collection of rendered pages. */
  pages: PdfSvgPage[];
}

export interface PdfToSvgProgress {
  /** 1-based page currently processed. */
  page: number;
  /** Total number of pages in the document. */
  total: number;
  /** Width of the current page in CSS pixels. */
  width: number;
  /** Height of the current page in CSS pixels. */
  height: number;
}

export interface PdfToSvgOptions {
  /**
   * Scale factor applied to the page viewport before conversion.
   * Defaults to 1 (100%).
   */
  scale?: number;
  /** Optional AbortSignal to cancel the conversion. */
  signal?: AbortSignal;
  /** Embed fonts referenced by each page into the generated SVG markup. Defaults to true. */
  embedFonts?: boolean;
  /**
   * Disable use of the pdf.js Web Worker. When true the conversion occurs on
   * the main thread.
   */
  disableWorker?: boolean;
  /** Callback invoked after each page is converted. */
  onProgress?: (progress: PdfToSvgProgress) => void;
  /**
   * Additional parameters forwarded to pdf.js when loading the document.
   * Values provided here override the automatically detected source settings.
   */
  pdf?: Partial<DocumentInitParameters>;
}
