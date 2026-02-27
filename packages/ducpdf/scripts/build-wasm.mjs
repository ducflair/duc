import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const isWindows = process.platform === "win32";

const hasCompilerOverride =
  Boolean(process.env.CC_wasm32_unknown_unknown) ||
  Boolean(process.env["CC_wasm32-unknown-unknown"]);

const tryResolveCompiler = (candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.includes("/") || candidate.includes("\\")) {
      if (!existsSync(candidate)) continue;
      const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
      if (probe.status === 0) return candidate;
      continue;
    }

    const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (probe.status === 0) return candidate;
  }

  return null;
};

const compilerCandidates = isWindows
  ? ["clang-cl", "clang"]
  : [
      "/opt/homebrew/opt/llvm/bin/clang",
      "/usr/local/opt/llvm/bin/clang",
      "/usr/bin/clang",
      "clang",
    ];

const resolvedCompiler = hasCompilerOverride
  ? null
  : tryResolveCompiler(compilerCandidates);

const env = { ...process.env };
if (!hasCompilerOverride && resolvedCompiler) {
  env.CC_wasm32_unknown_unknown = resolvedCompiler;
  env["CC_wasm32-unknown-unknown"] = resolvedCompiler;
}

const child = spawn(
  "wasm-pack",
  ["build", "--target", "web", "--out-dir", "../../pkg", "--release"],
  {
    cwd: new URL("../src/duc2pdf", import.meta.url),
    env,
    stdio: "inherit",
  },
);

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});
