---
name: commit-messages
description: Use when creating git commits, writing commit messages, or when about to run git commit -- enforces structured commit message format with imperative mood, capitalized subjects, 72-char wrapping
license: MIT
---

# Writing Commit Messages

## Overview

Every commit message follows a consistent format. The subject line completes the sentence: **"If applied, this commit will _\<your subject line\>_"**. When present, the body explains **why**, not what.

The project uses **Conventional Commits** with type-prefixed body lines. Type and scope are lowercase; the description after the colon is capitalized and imperative.

## Detect Project Convention First

Follow existing instructions for commits if present in the repository. Check `git log --oneline -20` to see recent patterns and match the existing style.

**Project convention always wins.** The rules below are the default when no convention is detected.

## How to Write

### Subject line (first line)
- Use a **Conventional Commits type** (`fix:`, `feat:`, `refactor:`, `style:`, `perf:`, `docs:`, `chore:`).
  - Only use `feat:` if the commit introduces a new feature or functionality.
- Pick the **most important type** as the prefix. If the commit contains multiple types of changes, chain them after a comma: `fix: resolve layout reactivity and extract version history tool`.
- Imperative mood, capitalized after colon, no trailing period, max 72 chars.
- If there is a clear scope (e.g. a specific package), use `feat(canvas):` or `fix(backend):`.

### Body (optional, but recommended for multi-change commits)
- Separate from subject by one blank line.
- Each line starts with a **type prefix and colon**: `fix:`, `feat:`, `refactor:`, `style:`, etc.
- Describe **what** changed briefly, focusing on user-facing or structural impact.
- Keep each line under 72 chars.
- Order lines by importance (fixes first, then features, then refactors, then style).
- No bullet points — type colons replace them.
- Don't write trivial changes as new lines so that we don't bloat the commit message, only use what is essential to the commit changes made.

## References

Consider the following references when creating new commit messages:
- **Subject line rules, body format, URLs, issue references**: [references/COMMIT_FORMAT.md](references/COMMIT_FORMAT.md)