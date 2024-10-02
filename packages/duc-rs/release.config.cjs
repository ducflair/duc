module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "cargo build --release",
        publishCmd: "cargo publish"
      }
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["Cargo.toml", "Cargo.lock"],
        message: "chore(release): ${nextRelease.version} \n\n${nextRelease.notes}"
      }
    ]
  ],
  tagFormat: "@ducflair/duc-rs@${version}"
};