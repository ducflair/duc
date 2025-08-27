module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node ../../scripts/semrel-set-version.js packages/ducjs ${nextRelease.version}",
        publishCmd: "bun publish"
      }
    ],
    "@semantic-release/github"
  ],
  tagFormat: "ducjs@${version}"
};