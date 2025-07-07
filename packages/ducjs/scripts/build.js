#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
  
  // Set environment variable and run TypeScript compiler
  const env = { ...process.env, DUC_SCHEMA_VERSION: version };
  
  const tsc = spawn('npx', ['tsc'], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  tsc.on('close', (code) => {
    process.exit(code);
  });
  
  tsc.on('error', (error) => {
    console.error('Error running TypeScript compiler:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
} 