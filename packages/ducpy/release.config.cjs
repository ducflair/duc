module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        // relative to repo root
        path: "packages/ducpy",
        // pass through any analyzer/notes options you like
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "bun prerelease && bun run build ${nextRelease.version}",
        publishCmd: "uv publish --token ${process.env.PYPI_TOKEN}",
      },
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducpy@${version}",
};
