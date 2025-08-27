#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
const packageJson = JSON.parse(packageJsonContent);

// Make a backup of the original package.json
fs.writeFileSync(packageJsonPath + '.backup', packageJsonContent);

// Replace workspace:^ with the latest published version of ducjs
if (packageJson.dependencies && packageJson.dependencies.ducjs === 'workspace:^') {
  try {
    // Try to get the latest published version from npm
    const latestVersion = execSync('npm view ducjs version', { encoding: 'utf-8' }).trim();
    packageJson.dependencies.ducjs = `^${latestVersion}`;
    console.log(`Replaced workspace:^ with ^${latestVersion} for ducjs`);
  } catch (error) {
    // If ducjs is not published yet, use a placeholder version or file reference
    console.log('ducjs not found on npm, using file reference to built package');
    // Point to the built ducjs package
    packageJson.dependencies.ducjs = 'file:../ducjs';
  }
}

// Write the modified package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('Updated package.json for publishing');