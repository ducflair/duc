#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const pkgPath = process.argv[2];
if (!pkgPath) {
  console.error("Usage: node fix-workspace-deps.mjs <path-to-package.json>");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const deps = pkg.dependencies || {};
for (const [name, range] of Object.entries(deps)) {
  if (typeof range === "string" && (range.startsWith("workspace:") || range.startsWith("link:"))) {
    const latest = execFileSync("npm", ["view", name, "version"], { encoding: "utf8" })
      .trim();
    // Use caret to track future minor/patch
    deps[name] = `^${latest}`;
    console.log(`Rewrote ${name}: ${range} -> ^${latest}`);
  }
}
pkg.dependencies = deps;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");