import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(rootDir, 'src/index.ts'),
      name: 'DucSvg',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es']
    },
    sourcemap: false,
    target: 'es2019',
    rollupOptions: {
      output: {
        exports: 'named',
      },
      external: (id) => {
        // Bundle pdfjs-dist with ducsvg, but keep other dependencies as external
        if (id.startsWith('pdfjs-dist')) {
          return false;
        }
        // Mark other dependencies as external
        return !id.startsWith('.') && !id.startsWith('/');
      }
    }
  }
});