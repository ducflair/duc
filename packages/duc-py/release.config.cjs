module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "python setup.py sdist bdist_wheel",
        publishCmd: "twine upload dist/*"
      }
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["setup.py"],
        message: "chore(release): ${nextRelease.version} \n\n${nextRelease.notes}"
      }
    ]
  ],
  tagFormat: "@ducflair/duc-py@${version}"
};