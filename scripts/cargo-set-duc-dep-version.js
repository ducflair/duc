#!/usr/bin/env node
/**
 * Updates the 'duc' dependency version in a Cargo.toml file.
 * Used during semantic-release to set the duc dependency to a crates.io-compatible version.
 * 
 * Usage: node scripts/cargo-set-duc-dep-version.js <cargoTomlPath> <version>
 * Example: node scripts/cargo-set-duc-dep-version.js packages/ducpdf/src/duc2pdf/Cargo.toml 2
 */
const fs = require("fs");
const path = require("path");

const cargoTomlPath = process.argv[2];
const version = process.argv[3];

if (!cargoTomlPath || !version) {
  console.error("Usage: node scripts/cargo-set-duc-dep-version.js <cargoTomlPath> <version>");
  console.error("Example: node scripts/cargo-set-duc-dep-version.js packages/ducpdf/src/duc2pdf/Cargo.toml 2");
  process.exit(1);
}

let fullPath = path.resolve(process.cwd(), cargoTomlPath);

// If path is a directory, append Cargo.toml
if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
  fullPath = path.join(fullPath, "Cargo.toml");
}

if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`);
  process.exit(1);
}

let content = fs.readFileSync(fullPath, "utf8");

// Match entire duc dependency line and replace with version-only format
// Handles variations like:
//   duc = { version = "0.0.0-development", path = "..." }
//   duc = { path = "...", version = "..." }
// Replaces with: duc = "VERSION"
const ducDepRegex = /^(#[^\n]*\n)*duc\s*=\s*\{[^}]+\}/m;

if (!ducDepRegex.test(content)) {
  console.error("Could not find duc dependency with version/path in Cargo.toml");
  process.exit(1);
}

// Replace the entire duc dependency (including any comment above it) with simple version
content = content.replace(ducDepRegex, `duc = "${version}"`);

fs.writeFileSync(fullPath, content);
console.log(`Updated duc dependency to "${version}" (removed path) in ${fullPath}`);
