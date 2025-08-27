//  Follow up on this https://github.com/rust-lang/cargo/issues/9398

module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        // relative to repo root
        path: "packages/ducrs",
        // pass through any analyzer/notes options you like
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [{ path: "target/release/**/*", label: "Distribution files" }],
      },
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
