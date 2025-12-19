import { convertDucToPdf, type ConversionOptions } from "ducpdf";
import { convertPdfToSvg, type SvgDocument } from "./pdf2svg";

export type { SvgDocument };

/**
 * Convert DUC data to SVG pages.
 * Uses ducpdf to convert DUC to PDF, then pdf2svg to convert PDF to SVG.
 */
export const ducToSvg = async (
  ducData: Uint8Array,
  options?: ConversionOptions,
): Promise<SvgDocument> => {
  // Step 1: Convert DUC to PDF using the robust ducpdf converter
  const pdfBytes = await convertDucToPdf(ducData, options);

  // Step 2: Convert PDF to SVG pages using hayro-svg
  const svgDocument = await convertPdfToSvg(pdfBytes);

  return svgDocument;
};