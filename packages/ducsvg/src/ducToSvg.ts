import { convertDucToPdf, type ConversionOptions } from "ducpdf";
import type { ExportedDataState } from "ducjs";
import { convertPdfToSvg, type SvgDocument } from "./pdf2svg";

export type { SvgDocument };

export interface DucDocumentSource {
  readDocumentState(): ExportedDataState | Promise<ExportedDataState>;
}

export type DucSvgSource = ExportedDataState | DucDocumentSource;

/**
 * Convert a DUC document state/source to SVG pages.
 * Uses ducpdf to convert DUC to PDF, then pdf2svg to convert PDF to SVG.
 */
export const ducToSvg = async (
  source: DucSvgSource,
  options?: ConversionOptions,
): Promise<SvgDocument> => {
  const { data: pdfBytes } = await convertDucToPdf(source as never, options);

  const svgDocument = await convertPdfToSvg(pdfBytes);

  return svgDocument;
};
