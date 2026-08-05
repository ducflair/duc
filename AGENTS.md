# AGENTS.md

# Core
- When linting/compiling `python`: ALWAYS use `uv` and `uvx`, never create venv or use `python` commands
- When linting/compiling `rust`: use `cargo check` or `cargo build` to check the areas worked on
- When linting/compiling `typescript`: use commands from the root, look into `turbo.json` tree or `package.json` to check the areas worked on
- Never write comments that would be about your experience on fixing the problem only, add valuable comments to the project - Never write useless comments
- Never run `sst` commands
- Never do `git` destructive actions unless told explicitly to do so. These actions include messing with other branches, changing staged or unstaged changes via git commands, and so on...

---

# Guidelines


## Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.


## Modularization Awareness

When writing code into a file, always examine the file's name or some of the existing contents before proceeding.

If the code you're about to add is:
- Substantial in size, or
- Highly specialized for a specific concern

...then **do not write it directly into the current file**. Instead, create a dedicated module for that logic and import/reference it from the original file.

**Example:** If you're adding PDF rendering logic inside a general `renderer` file, don't inline it there. Create a `pdf-renderer` module, implement the logic there, and then leverage it inside the main renderer.

The rule of thumb: a file that *uses* logic should not also *own* the full implementation of a complex, self-contained concern.