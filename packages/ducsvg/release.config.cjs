module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    [
      require.resolve('../../scripts/semrel-path-filter.cjs'),
      {
        // relative to repo root
        path: 'packages/ducsvg',
        // pass through any analyzer/notes options you like
        analyzer: { preset: 'conventionalcommits' },
        notes: { preset: 'conventionalcommits' },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node ../../scripts/semrel-set-version.js packages/ducsvg ${nextRelease.version}",
        publishCmd: "bun publish"
      }
    ],
    "@semantic-release/github"
  ],
  tagFormat: "ducsvg@${version}"
};