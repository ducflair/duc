module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          'uv sync && bun run build ${nextRelease.version}',
        publishCmd:
          "uv publish --token ${process.env.PYPI_TOKEN}"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "@ducflair/duc-py@${version}"
};
