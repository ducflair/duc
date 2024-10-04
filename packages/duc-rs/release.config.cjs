module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        // Install cargo-edit and then set the version
        prepareCmd:
          "cargo install cargo-edit && cargo set-version ${nextRelease.version} && cargo build --release",
        publishCmd:
          "cargo publish --token ${process.env.CARGO_REGISTRY_TOKEN}"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "@ducflair/duc-rs@${version}"
};
