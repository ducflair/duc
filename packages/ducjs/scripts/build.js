#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const REQUIRED_WASM_PACK_MAJOR = 0;
const REQUIRED_WASM_PACK_MINOR = 14;
const WASM_PACK_EXECUTABLE = isWindows ? 'wasm-pack.exe' : 'wasm-pack';

function getWasmPackCandidates() {
  const candidates = [];
  if (process.env.WASM_PACK_BIN) {
    candidates.push(process.env.WASM_PACK_BIN);
  }
  candidates.push(path.join(os.homedir(), '.cargo', 'bin', WASM_PACK_EXECUTABLE));
  candidates.push('wasm-pack');
  return candidates;
}

function parseWasmPackVersion(output) {
  const match = output.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Failed to parse wasm-pack version from: "${output}"`);
  }

  return {
    raw: output,
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

function resolveWasmPack() {
  const errors = [];
  for (const bin of getWasmPackCandidates()) {
    const probe = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (probe.status !== 0) {
      const err = (probe.stderr || probe.stdout || '').trim();
      errors.push(`${bin}: ${err || `exit ${probe.status}`}`);
      continue;
    }

    try {
      const output = (probe.stdout || '').trim();
      const version = parseWasmPackVersion(output);
      return { bin, version };
    } catch (error) {
      errors.push(`${bin}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `wasm-pack is required but could not be resolved. Tried: ${errors.join(' | ')}`,
  );
}

function ensurePinnedWasmPackVersion() {
  const resolved = resolveWasmPack();
  const { bin, version } = resolved;
  const pinned =
    version.major === REQUIRED_WASM_PACK_MAJOR &&
    version.minor === REQUIRED_WASM_PACK_MINOR;

  if (!pinned) {
    throw new Error(
      `ducjs requires wasm-pack ${REQUIRED_WASM_PACK_MAJOR}.${REQUIRED_WASM_PACK_MINOR}.x, ` +
      `but found ${version.raw} at ${bin}. Please install wasm-pack 0.14.x.`,
    );
  }

  console.log(`Using pinned wasm-pack version: ${version.raw} (${bin})`);
  return bin;
}

function decodeUserVersionToSemver(userVersion) {
  if (!Number.isInteger(userVersion) || userVersion < 0) {
    return '0.0.0';
  }

  const major = Math.floor(userVersion / 1_000_000);
  const minor = Math.floor((userVersion % 1_000_000) / 1_000);
  const patch = userVersion % 1_000;

  return `${major}.${minor}.${patch}`;
}

function getSchemaVersionInfoFromSql(sqlFilePath) {
  try {
    const content = fs.readFileSync(sqlFilePath, 'utf8');
    const match = content.match(/PRAGMA\s+user_version\s*=\s*(\d+)\s*;/i);

    if (match) {
      const userVersion = Number.parseInt(match[1], 10);
      return {
        userVersion,
        semver: decodeUserVersionToSemver(userVersion),
      };
    }
  } catch (error) {
    console.warn(`Warning: Could not parse schema version from ${sqlFilePath}: ${error.message}. Defaulting to 0.0.0.`);
  }
  return {
    userVersion: 0,
    semver: '0.0.0',
  };
}

function ensurePkgSchemaVersionShim(pkgJsPath, pkgDtsPath, userVersion) {
  const jsExport = `\n/** Auto-generated fallback when wasm glue is stale. */\nexport function getCurrentSchemaVersion() {\n    return ${userVersion};\n}\n`;
  const dtsExport = 'export function getCurrentSchemaVersion(): number;';

  if (fs.existsSync(pkgJsPath)) {
    let js = fs.readFileSync(pkgJsPath, 'utf8');
    const hasExport = /export\s+function\s+getCurrentSchemaVersion\s*\(\s*\)\s*\{/.test(js);

    if (hasExport) {
      js = js.replace(
        /export\s+function\s+getCurrentSchemaVersion\s*\(\s*\)\s*\{[\s\S]*?\n\}/,
        `export function getCurrentSchemaVersion() {\n    return ${userVersion};\n}`,
      );
    } else {
      js += jsExport;
    }

    fs.writeFileSync(pkgJsPath, js);
  }

  if (fs.existsSync(pkgDtsPath)) {
    let dts = fs.readFileSync(pkgDtsPath, 'utf8');
    if (!dts.includes(dtsExport)) {
      if (dts.includes('export type InitInput')) {
        dts = dts.replace('export type InitInput', `${dtsExport}\n\nexport type InitInput`);
      } else {
        dts += `\n${dtsExport}\n`;
      }
    }
    fs.writeFileSync(pkgDtsPath, dts);
  }
}

// ── WASM build helpers (clang resolution matching ducpdf) ──────────────────

function tryResolveCompiler(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.includes('/') || candidate.includes('\\')) {
      if (!fs.existsSync(candidate)) continue;
      const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
      if (probe.status === 0) return candidate;
      continue;
    }
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (probe.status === 0) return candidate;
  }
  return null;
}

function buildWasm(cratePath, outDir, wasmPackBin) {
  return new Promise((resolve, reject) => {
    const hasCompilerOverride =
      Boolean(process.env.CC_wasm32_unknown_unknown) ||
      Boolean(process.env['CC_wasm32-unknown-unknown']);

    const compilerCandidates = isWindows
      ? ['clang-cl', 'clang']
      : [
          '/opt/homebrew/opt/llvm/bin/clang',
          '/usr/local/opt/llvm/bin/clang',
          '/usr/bin/clang',
          'clang',
        ];

    const resolvedCompiler = hasCompilerOverride
      ? null
      : tryResolveCompiler(compilerCandidates);

    const env = { ...process.env };
    if (!hasCompilerOverride && resolvedCompiler) {
      env.CC_wasm32_unknown_unknown = resolvedCompiler;
      env['CC_wasm32-unknown-unknown'] = resolvedCompiler;
    }

    console.log('Building WASM...');
    const child = spawn(
      wasmPackBin,
      ['build', '--target', 'web', '--out-dir', outDir, '--release'],
      { cwd: cratePath, env, stdio: 'inherit' },
    );

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wasm-pack exited with code ${code}`));
    });
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const manifestDir = __dirname;
  const packageRoot = path.join(manifestDir, '..');
  const schemaSqlPath = path.join(packageRoot, '..', '..', 'schema', 'duc.sql');
  const pkgDir = path.join(packageRoot, 'pkg');
  const pkgJsPath = path.join(pkgDir, 'ducjs_wasm.js');
  const pkgDtsPath = path.join(pkgDir, 'ducjs_wasm.d.ts');
  const cratePath = path.join(packageRoot, 'crate');

  const { userVersion, semver } = getSchemaVersionInfoFromSql(schemaSqlPath);
  console.log(`Building with DUC_SCHEMA_VERSION: ${semver} (${userVersion})`);

  const wasmPackBin = ensurePinnedWasmPackVersion();

  // 1. Rebuild WASM from Rust crate (regenerates pkg/)
  await buildWasm(cratePath, pkgDir, wasmPackBin);

  // 2. Patch pkg JS/DTS with schema version shim (idempotent)
  ensurePkgSchemaVersionShim(pkgJsPath, pkgDtsPath, userVersion);

  // 3. Clean previous TS build artifacts
  const distDir = path.join(packageRoot, 'dist');
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
  } catch (error) {
    console.log('No dist directory to clean or error:', error.message);
  }

  // 4. Run TypeScript compiler
  const env = {
    ...process.env,
    DUC_SCHEMA_VERSION: semver,
    DUC_SCHEMA_USER_VERSION: String(userVersion),
  };

  const tsc = spawn('npx', ['tsc'], { env, stdio: 'inherit' });

  tsc.on('close', (code) => process.exit(code));
  tsc.on('error', (error) => {
    console.error('Error running TypeScript compiler:', error);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
