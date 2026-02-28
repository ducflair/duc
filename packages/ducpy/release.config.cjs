module.exports = {
  branches: ["main", { name: "next", prerelease: true }, { name: "dev", prerelease: true }],
  plugins: [
    [
      require.resolve("../../scripts/semrel-path-filter.cjs"),
      {
        paths: [
          "packages/ducpy",
          "packages/ducrs",
        ],
        analyzer: { preset: "conventionalcommits" },
        notes: { preset: "conventionalcommits" },
      },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "bun prerelease && sed -i 's/^version = \".*\"$/version = \"${nextRelease.version}\"/' crate/Cargo.toml && SETUPTOOLS_SCM_PRETEND_VERSION=${nextRelease.version} uv build --sdist",
        publishCmd: "uv publish --token ${process.env.PYPI_TOKEN} dist/*.tar.gz",
      },
    ],
    "@semantic-release/github",
  ],
  tagFormat: "ducpy@${version}",
};
