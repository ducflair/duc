module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        // Build with bun and uv, version from semantic-release
        prepareCmd:
          'cd ../.. && bun duc-py:build ${nextRelease.version}',
        publishCmd:
          "uv publish --token ${process.env.PYPI_TOKEN}"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "@ducflair/duc-py@${version}"
};
