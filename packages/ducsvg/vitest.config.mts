import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      // Ensure proper resolution of workspace packages
      'ducjs': resolve(__dirname, '../ducjs/src'),
      'ducpdf': resolve(__dirname, '../ducpdf/src'),
    }
  }
});
