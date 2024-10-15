//  Follow up on this https://github.com/rust-lang/cargo/issues/9398
module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        // Prepare step: set the new version and build the package
        prepareCmd:
          "cargo install cargo-edit && cargo set-version ${nextRelease.version} && cargo build --release",
        
        // Publish step: update the `Cargo.toml` to use version dependency and publish
        publishCmd:
          'sed -i "s/path = \\"..\\/core\\/canvas\\/duc\\/duc-rs\\"/version = \\"${nextRelease.version}\\"/" Cargo.toml && cargo publish --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}',

        // After publishing, reset `Cargo.toml` to the development version with path dependency
        successCmd:
          'cargo set-version 0.0.0-development && sed -i "s/version = \\"${nextRelease.version}\\"/path = \\"..\\/core\\/canvas\\/duc\\/duc-rs\\"/" Cargo.toml'
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
