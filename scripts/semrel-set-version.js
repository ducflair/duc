#!/usr/bin/env node
// usage: node scripts/semrel-set-version.js packages/ducjs 1.2.3
const fs = require("fs");
const path = require("path");

const pkgDir = process.argv[2];
const version = process.argv[3];

if (!pkgDir || !version) {
  console.error("Usage: node scripts/semrel-set-version.js <packageDir> <version>");
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");
const pkgPath = path.isAbsolute(pkgDir) ? path.join(pkgDir, "package.json") : path.join(repoRoot, pkgDir, "package.json");

if (!fs.existsSync(pkgPath)) {
  // Fallback relative to process.cwd()
  const altPath = path.join(process.cwd(), "..", "..", pkgDir, "package.json");
  if (fs.existsSync(altPath)) {
    const pkg = JSON.parse(fs.readFileSync(altPath, "utf8"));
    pkg.version = version;
    fs.writeFileSync(altPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Wrote version ${version} to ${altPath}`);
    process.exit(0);
  }
  console.error(`Error: package.json not found at ${pkgPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Wrote version ${version} to ${pkgPath}`);