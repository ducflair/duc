module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/github",
      {
        assets: [
          { path: "dist/**/*", label: "Distribution files" },
        ]
      }
    ],
    [
      "@semantic-release/exec",
      {
        // Prepare step: Set the crate version and build the project
        prepareCmd: "cargo set-version -p duc2pdf ${nextRelease.version} && cargo build -p duc2pdf --release",
        // Publish step: Publish the crate to crates.io
        publishCmd: "cargo publish -p duc2pdf --allow-dirty --token ${process.env.CARGO_REGISTRY_TOKEN}",
      }
    ],
  ],
};