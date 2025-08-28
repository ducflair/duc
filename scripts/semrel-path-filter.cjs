// scripts/semrel-path-filter.cjs
'use strict';

const { execSync } = require('node:child_process');

function gitChangedFiles(hash) {
  // Combined diff of the commit, robust for merges
  const out = execSync(`git show --name-only --pretty="" ${hash}`, { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function normalizePrefix(p) {
  return p.replace(/\\/g, '/').replace(/\/+$/, '') + '/';
}

async function filterCommitsByPath(commits, pkgPath) {
  if (!pkgPath) return commits;
  const prefix = normalizePrefix(pkgPath);
  const filtered = [];

  for (const c of commits) {
    const files = gitChangedFiles(c.hash);
    if (files.some(f => f.replace(/\\/g, '/').startsWith(prefix))) {
      filtered.push(c);
    }
  }
  return filtered;
}

module.exports = {
  analyzeCommits: async (pluginConfig = {}, context) => {
    const { path: pkgPath, analyzer = {} } = pluginConfig;
    const filtered = await filterCommitsByPath(context.commits, pkgPath);

    context.logger.log(`[path-filter] ${filtered.length}/${context.commits.length} commits affect "${pkgPath}"`);
    if (filtered.length === 0) return null;

    const analyze = require('@semantic-release/commit-analyzer');
    return analyze(analyzer, { ...context, commits: filtered });
  },

  generateNotes: async (pluginConfig = {}, context) => {
    const { path: pkgPath, notes = {} } = pluginConfig;
    const filtered = await filterCommitsByPath(context.commits, pkgPath);

    const genNotes = require('@semantic-release/release-notes-generator');
    return genNotes(notes, { ...context, commits: filtered });
  },
};
