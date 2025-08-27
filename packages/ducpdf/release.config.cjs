module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        // relative to repo root
        path: "packages/ducpdf",
        // pass through any analyzer/notes options you like
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/npm",
      {
        pkgRoot: ".",
        tarballDir: "dist",
      },
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducpdf@${version}",
};
