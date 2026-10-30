import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function buildLocator(wasmPack, destination) {
  const output = path.join(root, 'pkg/locator');
  await new Promise((resolve, reject) => {
    const child = spawn(wasmPack, ['build', '--target', 'web', '--out-dir', output, '--out-name', 'duc_locator_wasm', '--release', '--', '--no-default-features', '--features', 'locator-only'], {
      cwd: path.join(root, 'crate'), env: process.env, stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Locator WASM build exited with ${code}`)));
  });
  fs.mkdirSync(destination, { recursive: true });
  for (const file of ['duc_locator_wasm.js', 'duc_locator_wasm.d.ts', 'duc_locator_wasm_bg.wasm', 'duc_locator_wasm_bg.wasm.d.ts']) {
    fs.copyFileSync(path.join(output, file), path.join(destination, file));
  }
  const bytes = fs.readFileSync(path.join(output, 'duc_locator_wasm_bg.wasm')).toString('base64');
  // Keep synchronous public helpers usable before the async document WASM loads,
  // including in Blob workers and hosts without fetch or a native filesystem.
  fs.writeFileSync(path.join(destination, 'locator-runtime.js'), `import {initSync, normalizeHostPath as host, normalizePathSegments as segments, getOwningDucDirectory as directory, resolveLocatorPath as resolve} from './duc_locator_wasm.js';
let ready = false;
function load() { if (!ready) { initSync({module: Uint8Array.from(atob('${bytes}'), char => char.charCodeAt(0))}); ready = true; } }
export function normalizeHostPath(path) { load(); return host(path); }
export function normalizePathSegments(path) { load(); return segments(path); }
export function getOwningDucDirectory(path) { load(); return directory(path); }
export function resolveLocatorPath(kind, path, owner) { load(); return resolve(kind, path, owner); }
`);
  fs.writeFileSync(path.join(destination, 'locator-runtime.d.ts'), `export function normalizeHostPath(path: string): string;
export function normalizePathSegments(path: string): string;
export function getOwningDucDirectory(path: string): string;
export function resolveLocatorPath(kind: string, path: string, owner?: string): string;
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildLocator(process.env.WASM_PACK_BIN || path.join(process.env.HOME, '.cargo/bin/wasm-pack'), path.join(root, 'dist'));
}
