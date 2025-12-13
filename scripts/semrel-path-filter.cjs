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

/**
 * Normalize paths config to an array of prefixes
 * Supports both `path` (string) and `paths` (array) options
 */
function normalizePaths(pluginConfig) {
  const { path, paths } = pluginConfig;

  // Combine both options - paths array takes precedence but path is also included
  const allPaths = [];

  if (path) {
    allPaths.push(path);
  }

  if (Array.isArray(paths)) {
    allPaths.push(...paths);
  }

  // Remove duplicates and normalize
  return [...new Set(allPaths)].map(normalizePrefix);
}

async function filterCommitsByPaths(commits, prefixes) {
  if (!prefixes || prefixes.length === 0) return commits;
  const filtered = [];

  for (const c of commits) {
    const files = gitChangedFiles(c.hash);
    // Check if any file matches any of the prefixes
    if (files.some(f => {
      const normalizedFile = f.replace(/\\/g, '/');
      return prefixes.some(prefix => normalizedFile.startsWith(prefix));
    })) {
      filtered.push(c);
    }
  }
  return filtered;
}

module.exports = {
  analyzeCommits: async (pluginConfig = {}, context) => {
    const { analyzer = {} } = pluginConfig;
    const prefixes = normalizePaths(pluginConfig);
    const filtered = await filterCommitsByPaths(context.commits, prefixes);

    const pathsDisplay = prefixes.map(p => p.slice(0, -1)).join(', ');
    context.logger.log(`[path-filter] ${filtered.length}/${context.commits.length} commits affect "${pathsDisplay}"`);
    if (filtered.length === 0) return null;

    const { analyzeCommits: analyze } = await import('@semantic-release/commit-analyzer');
    return analyze(analyzer, { ...context, commits: filtered });
  },

  generateNotes: async (pluginConfig = {}, context) => {
    const { notes = {} } = pluginConfig;
    const prefixes = normalizePaths(pluginConfig);
    const filtered = await filterCommitsByPaths(context.commits, prefixes);

    const { generateNotes: genNotes } = await import('@semantic-release/release-notes-generator');
    return genNotes(notes, { ...context, commits: filtered });
  },
};
