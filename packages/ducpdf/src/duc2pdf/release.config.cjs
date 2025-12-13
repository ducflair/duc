module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../../../scripts/semrel-path-filter.cjs"),
      {
        paths: [
          "packages/ducpdf/src/duc2pdf",
          "packages/ducrs",
        ],
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/github",
    ],
    [
      "@semantic-release/exec",
      {
        // Prepare step: Set the crate version and build the project
        prepareCmd:
          "cargo set-version ${nextRelease.version} && cargo build --release",

        // Publish step: Publish the crate to crates.io
        publishCmd:
          "cargo publish --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}",
      },
    ],
  ],
  tagFormat: "duc2pdf@${version}",
};