#!/usr/bin/env node
/**
 * Updates the '[package] version = ...' field in a Cargo.toml file.
 * Used during API doc builds to lock the rust crate doc version to its latest git release tag.
 * 
 * Usage: node scripts/cargo-set-pkg-version.js <cargoTomlPath> <version>
 * Example: node scripts/cargo-set-pkg-version.js packages/ducrs/Cargo.toml 0.4.2
 */
const fs = require("fs");
const path = require("path");

const cargoTomlPath = process.argv[2];
const version = process.argv[3];

if (!cargoTomlPath || !version) {
  console.error("Usage: node scripts/cargo-set-pkg-version.js <cargoTomlPath> <version>");
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");
let fullPath = path.resolve(process.cwd(), cargoTomlPath);
if (!fs.existsSync(fullPath)) {
  const altPath = path.resolve(repoRoot, cargoTomlPath);
  if (fs.existsSync(altPath)) {
    fullPath = altPath;
  } else {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }
}

let content = fs.readFileSync(fullPath, "utf8");

// Replace package version
if (!/^version\s*=\s*"[^"]+"/m.test(content)) {
  console.error(`Could not find [package] version field in ${fullPath}`);
  process.exit(1);
}

content = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
fs.writeFileSync(fullPath, content);
console.log(`Updated [package] version to "${version}" in ${fullPath}`);

// Also update any workspace dependent crates that specify a version requirement for 'duc' (e.g. duc2pdf)
const duc2pdfPath = path.join(repoRoot, "packages/ducpdf/src/duc2pdf/Cargo.toml");
if (fs.existsSync(duc2pdfPath)) {
  let duc2pdfContent = fs.readFileSync(duc2pdfPath, "utf8");
  if (/duc\s*=\s*\{\s*version\s*=\s*"[^"]+"/m.test(duc2pdfContent)) {
    duc2pdfContent = duc2pdfContent.replace(/(duc\s*=\s*\{\s*version\s*=\s*")[^"]+(")/m, `$1${version}$2`);
    fs.writeFileSync(duc2pdfPath, duc2pdfContent);
    console.log(`Updated dependent duc version to "${version}" in ${duc2pdfPath}`);
  }
}
