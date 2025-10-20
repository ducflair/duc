import { convertDucToPdf, type ConversionOptions } from "ducpdf";
import { convertPdfToSvg } from "pdf-into-svg";

export const ducToSvg = async (
  ducData: Uint8Array,
  options?: ConversionOptions,
) => {
  // Convert DUC to PDF first
  const pdfData = await convertDucToPdf(ducData, options);

  // const svgDocument = await convertPdfToSvg(pdfData, svgOptions);
  const result = await convertPdfToSvg(pdfData);
  return result;
};