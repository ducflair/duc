#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Replace workspace:^ with the latest published version of ducjs
if (packageJson.dependencies && packageJson.dependencies.ducjs === 'workspace:^') {
  try {
    // Try to get the latest published version from npm
    const latestVersion = execSync('npm view ducjs version', { encoding: 'utf-8' }).trim();
    packageJson.dependencies.ducjs = `^${latestVersion}`;
    console.log(`Replaced workspace:^ with ^${latestVersion} for ducjs`);
  } catch (error) {
    // If ducjs is not published yet, use a placeholder version
    console.log('ducjs not found on npm, using ^1.0.0');
    packageJson.dependencies.ducjs = '^1.0.0';
  }
}

// Write the modified package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');