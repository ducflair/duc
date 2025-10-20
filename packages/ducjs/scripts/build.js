#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSchemaVersionFromFbs(fbsFilePath) {
  try {
    const content = fs.readFileSync(fbsFilePath, 'utf8');
    const firstLine = content.split('\n')[0];
    const match = firstLine.match(/\/\/\s*SCHEMA_VERSION\s*=\s*([0-9.]+)/);
    
    if (match) {
      return match[1];
    }
  } catch (error) {
    console.warn(`Warning: Could not parse schema version from ${fbsFilePath}: ${error.message}. Defaulting to 0.0.0.`);
  }
  return '0.0.0';
}

function main() {
  const manifestDir = __dirname;
  const fbsPath = path.join(manifestDir, '..', '..', '..', 'schema', 'duc.fbs');
  
  const version = getSchemaVersionFromFbs(fbsPath);
  
  console.log(`Building with DUC_SCHEMA_VERSION: ${version}`);
  
  // Clean previous build artifacts
  const distDir = path.join(manifestDir, '..', 'dist');
  const tsbuildinfo = path.join(manifestDir, '..', 'tsconfig.tsbuildinfo');
  
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
  } catch (error) {
    console.log('No dist directory to clean or error:', error.message);
  }
  
  try {
    fs.unlinkSync(tsbuildinfo);
  } catch (error) {
    console.log('No tsconfig.tsbuildinfo to remove or error:', error.message);
  }
  
  // Set environment variable and run TypeScript compiler
  const env = { ...process.env, DUC_SCHEMA_VERSION: version };
  
  const tsc = spawn('npx', ['tsc'], {
    env,
    stdio: 'inherit'
  });
  
  tsc.on('close', (code) => {
    process.exit(code);
  });
  
  tsc.on('error', (error) => {
    console.error('Error running TypeScript compiler:', error);
    process.exit(1);
  });
}

main();
