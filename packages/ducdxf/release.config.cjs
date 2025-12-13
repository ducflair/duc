module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        paths: [
          "packages/ducdxf",
          "packages/ducpy"
        ],
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          'bun prerelease && bun run build ${nextRelease.version}',
        publishCmd:
          "uv publish --token ${process.env.PYPI_TOKEN}"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducdxf@${version}"
};
