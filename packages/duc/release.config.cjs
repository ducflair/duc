module.exports = {
  branches: ["main", { name: "next", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        pkgRoot: ".",
        tarballDir: "dist"
      }
    ],
    "@semantic-release/github",
    "@semantic-release/git"
  ],
  tagFormat: "@ducflair/duc@${version}",
  // Add this to ensure semantic-release uses the correct base version
  verifyConditions: [
    () => {
      const npmVersion = require('child_process')
        .execSync('npm view @ducflair/duc version')
        .toString()
        .trim();
      process.env.PREVIOUS_VERSION = npmVersion;
    },
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
  analyzeCommits: {
    preset: 'angular',
    releaseRules: [
      {type: 'feat', release: 'minor'},
      {type: 'fix', release: 'patch'},
      {type: 'docs', release: 'patch'},
      {type: 'style', release: 'patch'},
      {type: 'refactor', release: 'patch'},
      {type: 'perf', release: 'patch'},
      {type: 'test', release: 'patch'},
      {type: 'chore', release: 'patch'},
    ],
  },
};