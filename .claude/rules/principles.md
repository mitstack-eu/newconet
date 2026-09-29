---
paths:
  - "**/*.go"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.py"
---

# Engineering invariants

These bind any change to the service code, and each has the build-time check
behind it named in the right column.

## What the code must always do

| Invariant | Enforced by |
|---|---|
| Every read filters by tenant; every write checks membership and role | Review, handler tests |
| Additive API changes only | `api-contract-reviewer` agent |
| A service never returns or logs a secret it received | Review, a leak test per secret-carrying handler |
| Request-derived values are stripped of carriage returns and newlines before logging | Review |

## Waivers are closed

The deviation mechanism is frozen. A blocking finding has exactly one
resolution, which is fixing the code until the check passes. Adding, renewing
or broadening a waiver is not available: no `gitleaks:allow`, no
`eslint-disable`, no `nolint`, no `nosemgrep`, and no `IgnoredVulns`. For a
framework false positive, restructure the code until the analyzer is
satisfied.
