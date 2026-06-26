---
name: write-guide
description: |
  Generates technical guides that teach real-world use cases through progressive examples.

  **Auto-activation:** User asks to write, create, or draft a guide or tutorial. Also use when converting feature documentation, API references, or skill knowledge into step-by-step learning content.

  **Input sources:** API documentation, existing code examples, or user-provided specifications.
---

# Writing Guides

## Goal

Produce a technical guide that teaches a real-world use case through progressive examples. Concepts are introduced only when the reader needs them.

Each guide solves **one specific problem**. Not a category of problems. If the outline has 5+ steps or covers multiple approaches, split it.

### Workflow

1. **Research**: Read existing docs for context and linking opportunities.
2. **Plan**: Outline sections. Verify scope. Each step needs a friction point and resolution.
3. **Write**: Follow the template above. Apply the rules below.
4. **Review**: Re-read the rules, verify, then present.

## Rules

1. **Progressive disclosure.** Start with the smallest working example. Introduce complexity only when the example breaks. Name concepts at the moment of resolution, after the reader has felt the problem. Full loop: working → new requirement → something breaks → explain why → name the fix → apply → verify with proof → move on.
2. **One friction point per step.** If a step has multiple friction points, split it.
3. **No em dashes.** Use periods, commas, or parentheses instead.
4. **Mechanical, observable language.** Describe what happens, not how it feels.
5. **No selling, justifying, or comparing.** No "the best way," no historical context, no framework comparisons.

| Don't                                                | Do                                                       |
| ---------------------------------------------------- | -------------------------------------------------------- |
| "creates friction in the pipeline"                   | "blocks the response"                                    |
| "needs dynamic information"                          | "depends on request-time data"                           |
| "requires dynamic processing"                        | "output can't be known ahead of time"                    |
| "The component blocks the response — causing delays" | "The component blocks the response. This causes delays." |


## References

We write docs on `apps/web/content/docs/**/*`, any reference point or example can be found there. Any new docs should also be added there.
