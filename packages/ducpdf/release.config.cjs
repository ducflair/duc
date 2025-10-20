module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        path: "packages/ducpdf",
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node ../../scripts/semrel-set-version.js packages/ducsvg ${nextRelease.version}",
        publishCmd: "bun publish"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducpdf@${version}",
};
