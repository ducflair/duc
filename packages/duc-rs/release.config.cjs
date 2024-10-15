//  Follow up on this https://github.com/rust-lang/cargo/issues/9398

module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        // Prepare step: Set the version, replace the local dependency path, and build the project
        prepareCmd:
          "cargo install cargo-edit && cargo set-version ${nextRelease.version} && sed -i 's|path = \"../core/canvas/duc/duc-rs\"|version = \"0.1.0\"|' Cargo.toml && cargo build --release",
        
        // Publish step: Publish the crate to crates.io
        publishCmd:
          "cargo publish --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}",
        
        // Success step: After publishing, reset the version and restore the local dependency path
        successCmd:
          "cargo set-version 0.0.0-development && sed -i 's|version = \"0.1.0\"|path = \"../core/canvas/duc/duc-rs\"|' Cargo.toml"
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
