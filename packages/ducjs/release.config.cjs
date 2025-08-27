module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        // relative to repo root
        path: "packages/ducjs",
        // pass through any analyzer/notes options you like
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "node ../../scripts/semrel-set-version.js packages/ducjs ${nextRelease.version}",
        publishCmd: "bun publish",
      },
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducjs@${version}",
};
