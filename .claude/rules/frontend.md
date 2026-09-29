---
paths:
  - "**/*.tsx"
  - "**/*.css"
---

# The bar for user-visible work

Passing tests is not the bar: a page has to look like it belongs beside the
repository's most polished page.

`frontend-stylist` does the design pass once the tests are green, on anything
user-visible. A larger feature gets a `ux-designer` spec in `docs/design/specs/`
first, since that agent owns design direction.

## What the styling pass must satisfy

`docs/design-system.md` is the contract. Every `className` resolves to real
CSS, and a class that resolves to no CSS is a finding. Never ship a bare
element with browser defaults, and never hard-code a colour or size a token
covers. A new token or class is documented there in the same change.

## Tests a user-visible change carries

An interaction test in `*.test.tsx` is the minimum, and a user-visible flow
change also updates the Playwright specs. Verify with a screenshot against a
sibling page rather than the diff.
