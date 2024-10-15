//  Follow up on this https://github.com/rust-lang/cargo/issues/9398

module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "cargo install cargo-edit && cargo set-version ${nextRelease.version} && cargo build --release",
        publishCmd:
          "cargo publish --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}",
        // After publishing, reset Cargo.toml to the development version without committing
        successCmd:
          "cargo set-version 0.0.0-development"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "@ducflair/duc-rs@${version}"
};

// module.exports = {
//   branches: ["main", { name: "next", prerelease: true }],
//   plugins: [
//     "@semantic-release/commit-analyzer",
//     "@semantic-release/release-notes-generator",
//     [
//       "@semantic-release/exec",
//       {
//         // Set the version, but do not commit it
//         prepareCmd:
//           "cargo install cargo-edit && cargo set-version ${nextRelease.version} && cargo build --release",
//         // Use the --allow-dirty flag to avoid errors with uncommitted changes
//         publishCmd:
//           "cargo publish --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}"
//       }
//     ],
//     "@semantic-release/github",
//   ],
//   tagFormat: "@ducflair/duc-rs@${version}"
// };
