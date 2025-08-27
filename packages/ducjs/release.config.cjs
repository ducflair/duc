module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "rm -f package-lock.json bun.lockb"
      }
    ],
    [
      "@semantic-release/npm",
      {
        pkgRoot: ".",
        tarballDir: "dist"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducjs@${version}"
};