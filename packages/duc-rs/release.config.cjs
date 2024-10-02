module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "cargo set-version ${nextRelease.version} && cargo build --release",
        "publishCmd": "cargo publish"
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["Cargo.toml", "Cargo.lock"],
        "message": "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ],
  tagFormat: "@ducflair/duc-rs@${version}"
};