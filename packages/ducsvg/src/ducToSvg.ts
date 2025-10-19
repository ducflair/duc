import { convertDucToPdf, type ConversionOptions } from "ducpdf";
import { convertPdfToSvg } from "./pdf2svg/src/pdf-to-svg";
import type { PdfSvgDocument, PdfToSvgOptions } from "./pdf2svg/src/types";

export interface DucToSvgOptions extends ConversionOptions {
  /** SVG conversion options */
  svg?: PdfToSvgOptions;
}

export const ducToSvg = async (
  ducData: Uint8Array,
  options?: DucToSvgOptions,
): Promise<PdfSvgDocument> => {
  // Convert DUC to PDF first
  const pdfData = await convertDucToPdf(ducData, options);

  // Then convert PDF to SVG
  const svgOptions = options?.svg || {
    disableWorker: true,
    pdf: { fontExtraProperties: true }
  };

  const svgDocument = await convertPdfToSvg(pdfData, svgOptions);

  return svgDocument;
};