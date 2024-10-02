module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: "pip install setuptools && sed -i 's/version=.*,/version=\"${nextRelease.version}\",/' setup.py && python3 setup.py sdist bdist_wheel",
        publishCmd: "python3 -m twine upload dist/* -u __token__ -p ${process.env.PYPI_TOKEN}"
      }
    ],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["setup.py"],
        message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"
      }
    ]
  ],
  tagFormat: "@ducflair/duc-py@${version}"
};
