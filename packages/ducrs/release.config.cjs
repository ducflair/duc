//  Follow up on this https://github.com/rust-lang/cargo/issues/9398

module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        path: "packages/ducrs",
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
  tagFormat: "ducrs@${version}",
};
