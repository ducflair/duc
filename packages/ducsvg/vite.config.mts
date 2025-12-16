import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
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
        'ducpdf',        // Uses Rust WASM - let consuming app handle
        'ducjs',         // Workspace dependency
      ],
      output: {
        globals: {
          'ducpdf': 'DucPdf',
          'ducjs': 'DucJs',
        },
      },
    },
  },
});