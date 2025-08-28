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
