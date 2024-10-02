module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "cargo set-version ${nextRelease.version} && cargo build --release",
        publishCmd: "cargo publish --token ${process.env.CARGO_REGISTRY_TOKEN}"
      }
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["Cargo.toml"],
        message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"
      }
    ]
  ],
  tagFormat: "@ducflair/duc-rs@${version}"
};
