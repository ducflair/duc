module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        // Clean the dist directory and update version in pyproject.toml
        prepareCmd:
          'pip install build && rm -rf dist && sed -i "s/version = \\"[^\\"].*\\"/version = \\"${nextRelease.version}\\"/" pyproject.toml && python3 -m build',
        publishCmd:
          "python3 -m twine upload dist/* -u __token__ -p ${process.env.PYPI_TOKEN}"
      }
    ],
    "@semantic-release/github",
  ],
  tagFormat: "@ducflair/duc-py@${version}"
};
