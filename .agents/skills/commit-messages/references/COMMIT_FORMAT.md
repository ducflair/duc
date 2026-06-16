# Commit Format Reference

Complete guide to commit message formatting, line wrapping, and conventions.

## Contents
- Subject line rules
- Body format and wrapping
- Long URLs
- Issue references
- Conventional Commits compatibility

## Subject Line Rules

| Rule | Example | Violation | Why |
|------|---------|-----------|-----|
| Capitalize first word | `feat: Add CPU arch filter` | `feat: add CPU arch filter` | Sentence case always |
| Imperative mood | `fix: Fix null pointer` | `fix: Fixed null pointer` | Command form: Add/Fix/Remove |
| 72 char max | `feat: Add CPU arch filter support` | `feat: Add CPU architecture filter to scheduler...` | Hard limit |
| No trailing period | `feat: Add user auth` | `feat: Add user auth.` | Subject is title, not sentence |
| Scope prefix allowed | `fix(auth): Fix null pointer` | — | Use Conventional Commits scopes |
| Meaningful standalone | `feat: Add CPU arch filter support` | `Fix #847` | Readable outside platform |

```bash
# ✅ Correct
Add CPU arch filter scheduler support

# ❌ Wrong
added cpu arch filter scheduler support    # lowercase, past tense
```

### Body Format and Wrapping
Body entries use `type:` prefix colons (no bullet points). Order by
importance: `fix:` first, then `feat:`, then `refactor:`, then `style:`.

### Blank line after subject (critical)

```bash
# ✅ Correct
fix: resolve panel layout reactivity

fix: Replace useTransform with direct motion value subscriptions
feat: Add self-contained get_drawing_versions tool with pagination

# ❌ Wrong (no blank line after subject)
fix: resolve panel layout reactivity
fix: Replace useTransform with direct motion value subscriptions
feat: Add self-contained get_drawing_versions tool with pagination
```

### Wrap at 72 characters

Exception: URLs and code that can't be split.

### Explain WHAT in the body with type prefixes

The diff shows what changed at the code level; the body summarizes the
subjects in a compact type-prefixed list:

```bash
# ✅ Correct
fix: resolve panel layout reactivity

fix: Replace useTransform with direct motion value subscriptions
refactor: Simplify panel dimension state management

# ❌ Wrong (no type prefixes, explains implementation detail)
fix: resolve panel layout reactivity

Changed the usePanelDimensions hook to use proper motion values
instead of useTransform because of stale closure issues.
```

### Group changes by type, ordered by importance

In the body, list each distinct change with its type prefix. Order
by priority: `fix:` entries first, then `feat:`, then `refactor:`,
then `style:`.

```bash
fix: resolve panel layout reactivity

fix: Replace useTransform with direct motion value subscriptions
feat: Add self-contained get_drawing_versions tool with pagination
refactor: Split checkpoint/delta queries into reusable functions
style: Rename "Clipping" to "Section Views" in 3D properties
```

## Long URLs

Put URLs on their own line or use reference-style:

```bash
# Option 1: URL on own line
Implement the technique described at:

https://example.com/very/long/url/exceeds/72/chars

# Option 2: Reference-style
Implement the technique at [1] to prevent exhaustion.

[1] https://example.com/very/long/url/exceeds/72/chars
```

## Issue References

**Only add if project uses them** (check `git log --oneline -20`).

Put in **body** on **own line** at end:

```bash
# ✅ Correct
Add CPU arch filter support

[explanation]

Fixes #847

# ❌ Wrong (in subject)
Fix #847: Add CPU arch filter
```

**Keywords:** `Fixes #N`, `Closes #N`, `Resolves #N` (GitHub/GitLab), `PROJ-123` (Jira)

## Full Example

```
Add CPU arch filter scheduler support

In a mixed environment of x86 and ARM nodes, the scheduler
previously could not distinguish between architectures,
leading to binary incompatibility crashes.

Add an arch label to each node and a corresponding filter
in the scheduling algorithm. This enables workloads to be
scheduled only on compatible architectures.

Current limitation: only x86 and ARM are supported. Adding
new architectures requires updating the label enum.

Fixes #847
```

## Conventional Commits


### Available types:
<br>
`feat`: New Features <br>
`fix`: Bug Fixes <br>
`docs`: Documentation only changes <br>
`style`: Changes that do not affect the meaning of the code (white-space, formatting, etc) <br>
`refactor`: A code change that neither fixes a bug nor adds a feature <br>
`perf`: A code change that improves performance <br>
`test`: Adding missing tests or correcting existing tests <br>
`build`: Changes that affect the build system or external dependencies <br>
`ci`: Changes to our CI configuration files and scripts <br>
`chore`: Other changes that don't modify src or test files <br>
`revert`: Reverts a previous commit <br>
`deps`: Changes that update the dependencies <br>
`improvement`: A code change that improves the code without fixing a bug or adding a feature <br>
`security`: Changes to security <br>
</details>

#### Multi-change commit footer subheading for major changes<br>
Use type prefix colons for body entries (no bullet points):

```
fix: resolve panel layout reactivity and add get_drawing_versions tool

fix: Replace useTransform with direct motion value subscriptions
feat: Add self-contained get_drawing_versions tool with pagination
refactor: Split checkpoint/delta queries into reusable functions
```

The type-prefixed lines in the body are ordered by importance (fixes
first, then features, then refactors, then style).

#### Major Releases that break the last version
```
feat(ducpy): bump ducpy to 2.0

BREAKING CHANGE: Updated ducpy to version 2.0 which introduces breaking changes
```
The breaking change part is the most important, needs to be bellow the first line of the commit message
    
> All other rules still apply (imperative, 72-char limit includes prefix, body explains WHY).

## Gotchas

- **72-char limit includes type prefix** — `feat(scheduler): ` counts toward 72
- **Blank line is critical** — many tools parse on this boundary
- **Issue refs in body, not subject** — keeps subject meaningful
- **URLs break wrapping rule** — put on own line
- **Capitalize after colon** — `feat: Add auth` not `feat: add auth` (unless project uses lowercase)
