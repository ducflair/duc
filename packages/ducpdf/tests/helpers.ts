import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export function getAssetsDir(): string {
  const env = process.env.DUC_ASSETS_DIR;
  if (env && env.length > 0) return env;
  // tests run from package root; assets live at ../../../assets/testing/duc-files
  return join(__dirname, '../../../assets/testing/duc-files');
}

export function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function loadDucFile(filename: string): Uint8Array {
  const p = join(getAssetsDir(), filename);
  const buf = readFileSync(p);
  return new Uint8Array(buf);
}

export function savePdfOutput(relPath: string, data: Uint8Array) {
  const outPath = join(__dirname, relPath);
  ensureDir(dirname(outPath));
  writeFileSync(outPath, data);
}

export function validatePdf(data: Uint8Array) {
  if (data.length < 5) throw new Error('PDF too small');
  const head = new TextDecoder().decode(data.slice(0, 5));
  if (!head.startsWith('%PDF-')) throw new Error('Invalid PDF header');
  const tail = new TextDecoder().decode(data.slice(-10));
  if (!/%%EOF\s*$/.test(tail)) throw new Error('Invalid PDF trailer');
}