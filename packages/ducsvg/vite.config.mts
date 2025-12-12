import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DucSvg',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es'],
    },
    target: 'es2019',
    sourcemap: false,
    rollupOptions: {
      // Externalize dependencies that have WASM runtimes or shouldn't be bundled
      external: [
        'pdf-into-svg',  // Uses .NET Blazor WASM - can't be bundled
        'ducpdf',        // Uses Rust WASM - let consuming app handle
        'ducjs',         // Workspace dependency
      ],
      output: {
        globals: {
          'pdf-into-svg': 'PdfIntoSvg',
          'ducpdf': 'DucPdf',
          'ducjs': 'DucJs',
        },
      },
    },
  },
});