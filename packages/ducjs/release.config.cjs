module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        paths: [
          "packages/ducjs",
          "packages/ducrs"
        ],
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node ../../scripts/semrel-set-version.js packages/ducjs ${nextRelease.version}",
        publishCmd: "npm publish",
      },
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducjs@${version}",
};