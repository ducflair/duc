module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../../../scripts/semrel-path-filter.cjs"),
      {
        paths: [
          "packages/ducpdf/src/duc2pdf",
          // "packages/ducrs",
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
        // Prepare step: 
        // 1. Update duc dependency to use crates.io version (not development)
        // 2. Set the crate version 
        // 3. Build the project
        prepareCmd:
          "node ../../../../scripts/cargo-set-duc-dep-version.js . 2 && cargo set-version ${nextRelease.version} && cargo build --release",

        // Publish step: Publish the crate to crates.io
        publishCmd:
          "cargo publish --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}",
      },
    ],
  ],
  tagFormat: "duc2pdf@${version}",
};