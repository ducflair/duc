declare module '../vendor/pdfjs-dist/pdf.js' {
  const pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.js');
  export = pdfjs;
}
