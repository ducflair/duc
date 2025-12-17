import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      filter: /\.(wasm|js)$/i,
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false, // Keep original files for compatibility
    }),
  ],
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
        'ducpdf',
        'ducjs',
        '/pdf2svg/pkg/',
        /pdf2svg-wasm(\.js)?$/,
        /\.wasm$/,
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