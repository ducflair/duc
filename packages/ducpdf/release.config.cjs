module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        paths: [
          "packages/ducpdf",
          "packages/ducjs",
          "packages/ducrs"
        ],
        // This is the one that controls the version bump (major/minor/patch)
        analyzer: {
          preset: "conventionalcommits",
          parserOpts: {
            // Temporarily set to a keyword nobody will use
            noteKeywords: ["SKIP_BREAKING_DETECTION"],
          },
        },

        // This controls release notes generation (so "Breaking Changes" sections, etc.)
        // If you only change `analyzer`, you might still see BREAKING CHANGE notes in output notes.
        notes: {
          preset: "conventionalcommits",
          parserOpts: {
            noteKeywords: ["SKIP_BREAKING_DETECTION"],
          },
        },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node ../../scripts/semrel-set-version.js packages/ducpdf ${nextRelease.version}",
        publishCmd: "npm publish",
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducpdf@${version}",
};