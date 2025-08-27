module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node scripts/semrel-set-version.js packages/ducsvg ${nextRelease.version}",
        publishCmd: "cd packages/ducsvg && bun publish"
      }
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node scripts/semrel-set-version.js packages/ducjs ${nextRelease.version}",
        publishCmd: "cd packages/ducjs && bun publish"
      }
    ],
    "@semantic-release/github"
  ],
  tagFormat: "duc@${version}"
};
