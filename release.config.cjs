module.exports = {
  branches: [
    "main",
    {
      name: "next",
      prerelease: true,
    },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",       // Analyzes commit messages to determine the next version
    "@semantic-release/release-notes-generator", // Generates release notes based on commit messages
    "@semantic-release/changelog",             // Updates the changelog file
    "@semantic-release/github",                // Creates GitHub releases
    "@semantic-release/npm",                   // Publishes the package to npm
  ],
};
