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

// Also update any workspace dependent crates that specify a version requirement for 'duc' (e.g. duc2pdf, ducdxf)
const pkgNameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
const pkgName = pkgNameMatch ? pkgNameMatch[1] : "duc";

function findWorkspaceCargoTomls(root) {
  const tomls = new Set();
  const rootCargoToml = path.join(root, "Cargo.toml");
  if (fs.existsSync(rootCargoToml)) {
    const rootContent = fs.readFileSync(rootCargoToml, "utf8");
    const membersMatch = rootContent.match(/members\s*=\s*\[([\s\S]*?)\]/);
    if (membersMatch) {
      const memberPaths = [...membersMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
      for (const m of memberPaths) {
        const p = path.join(root, m, "Cargo.toml");
        if (fs.existsSync(p)) tomls.add(path.resolve(p));
      }
    }
  }
  const knownCrates = [
    "packages/ducpdf/src/duc2pdf/Cargo.toml",
    "packages/ducdxf/Cargo.toml",
  ];
  for (const rel of knownCrates) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) tomls.add(path.resolve(p));
  }
  return Array.from(tomls);
}

const workspaceTomls = findWorkspaceCargoTomls(repoRoot);
for (const tomlPath of workspaceTomls) {
  if (path.resolve(tomlPath) === fullPath) continue;

  let tomlContent = fs.readFileSync(tomlPath, "utf8");
  let modified = false;

  const depInlineRegex = new RegExp(`(${pkgName}\\s*=\\s*\\{[^}]*?\\bversion\\s*=\\s*")[^"]+(")`, "g");
  if (depInlineRegex.test(tomlContent)) {
    tomlContent = tomlContent.replace(depInlineRegex, `$1${version}$2`);
    modified = true;
  }

  const depSectionRegex = new RegExp(`(\\[(?:dependencies|dev-dependencies|build-dependencies)(?:\\.[^\\]]+)?\\.${pkgName}\\][\\s\\S]*?\\bversion\\s*=\\s*")[^"]+(")`, "g");
  if (depSectionRegex.test(tomlContent)) {
    tomlContent = tomlContent.replace(depSectionRegex, `$1${version}$2`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(tomlPath, tomlContent);
    console.log(`Updated dependent ${pkgName} version to "${version}" in ${tomlPath}`);
  }
}
