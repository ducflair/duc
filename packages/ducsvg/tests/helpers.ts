import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export function getAssetsDir(): string {
  const env = process.env.DUC_ASSETS_DIR;
  if (env && env.length > 0) return env;
  // tests run from package root; assets live at ../../../assets/testing/duc-files
  return join(__dirname, '../../../assets/testing/duc-files');
}

export function getPdfAssetsDir(): string {
  return join(__dirname, '../../../assets/testing/pdf-files');
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

export function loadPdfFile(filename: string): Uint8Array {
  const p = join(getPdfAssetsDir(), filename);
  const buf = readFileSync(p);
  return new Uint8Array(buf);
}

export function saveSvgOutput(relPath: string, data: string) {
  const outPath = join(__dirname, relPath);
  ensureDir(dirname(outPath));
  writeFileSync(outPath, data, 'utf-8');
}

export function validateSvg(data: string) {
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('SVG data is empty or not a string');
  }
  if (!data.includes('<svg')) {
    throw new Error('Invalid SVG: missing <svg> tag');
  }
}
