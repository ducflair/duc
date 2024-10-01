module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        pkgRoot: ".",
        tarballDir: "dist"
      }
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md"], // Exclude package.json
        message: "chore(release): ${nextRelease.version} \n\n${nextRelease.notes}"
      }
    ]
  ],
  tagFormat: "@ducflair/duc@${version}"
};
