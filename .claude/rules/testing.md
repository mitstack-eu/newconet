---
paths:
  - "**/*_test.go"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# How this project tests

Flow selection, which changes run the agent split at all, is decided in the
root `CLAUDE.md`. What follows is how a change that does run the split gets
its tests written: `test-author` writes the failing tests, `code-author` makes
them pass without editing any of them, and `code-validator` gates the result.

## The four layers a test plan names

Every risk-based test plan points at one of these layers rather than
inventing a kind of test.

| Layer | What it covers | Where it lives |
|---|---|---|
| Unit | Every behaviour change | `*_test.go` beside the source, `*.test.tsx` beside the component, a Playwright spec for a user-visible flow |
| Contract | Any wire shape two parties depend on | A contract test beside the client and one beside the server, sharing a golden fixture |
| Regression | Every rule an incident produced | A row in a decision table, a structural seam test, or a scratch-break proof |
| Scanners | Always on, never chosen per change | The pipeline's scanners and its `check-*.sh` gates |

## Practices that are not negotiable

Use a real database through the repository's test-database helper and the
real router, never mocks.

Keep MSW at `onUnhandledRequest: 'error'` so an unmocked fetch fails loudly.
Name tests behaviourally, as in `TestAdoptStack_409IfAlreadyAdopted`, and
co-locate them with no `tests/` directory. Assert one concept per test, and
avoid `data-testid` unless role and text fail.

## Coverage floors, which only ever rise

The floor is the number a human last locked in, in the repository's coverage
config, and it only ever rises. Cover any uncovered line you touch, in the
same change.

## Done means live

For a user-facing, infrastructure or deploy change, done means proven working
end to end on the live environment, not merely merged with green checks.

A gate nobody has watched fail is not a gate: prove a new guard by breaking what
it guards, watching it fail, and restoring it.
