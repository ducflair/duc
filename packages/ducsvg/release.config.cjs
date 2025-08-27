module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node ./scripts/prepare-ducsvg-publish.js"
      }
    ],
    [
      "@semantic-release/npm",
      {
        pkgRoot: ".",
        tarballDir: "dist"
      }
    ],
    [
      "@semantic-release/exec",
      {
        successCmd: "git checkout -- package.json"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducsvg@${version}"
};