---
name: writing-product
description: Drafting or fixing product Markdown: roadmap and knowledge notes, go-to-market material and any value claim a reader acts on.
---

# Writing for product decisions

This covers Markdown written for the product itself: `docs/roadmap/`,
`docs/knowledge/`, the root `README.md`, and the rules and agent definitions
under `.claude/`.

The sentence-level bar is `.claude/rules/writing-style.md`; this skill adds
what is specific to a product document.

## Who reads this, and what they want

The owner, deciding what to build next, and the agents that act on the
decision. Nobody reads these files for pleasure. They read to answer two
questions, in this order: what is this worth, and does the reasoning hold?

Everything below serves those two questions.

## Lead with the value

Say in the first paragraph what changes and for whom. A reader who stops after
that paragraph should still be able to decide.

The first paragraph is not a description of the document. "This note analyses
the onboarding options" tells the reader nothing they could act on.

## Make the value checkable

A value claim needs a number or a named source. "Faster" on its own is a guess
in a good suit.

When you do not have the number, say so. "No measurement yet, so the estimate
comes from the two runs in `docs/knowledge/<note>.md`" is honest and still
usable. A confident sentence with nothing behind it is neither.

## Show the reasoning as a chain

Write the claim, then the evidence, then the conclusion, each in its own
sentence. A reader should be able to disagree with exactly one link and tell
you which.

Never state a conclusion and leave the reasoning implied. A reader cannot check
what they cannot see, so they either take it on trust or skip it. Both are
worse than a chain they can argue with.

## Name the option you rejected

Every recommendation beat something. Name the alternative and give one sentence
on why it lost.

Leave it out and the reader reconstructs your search from scratch, which is
slower for them than writing it was for you.

## Gloss the jargon once

Gloss each term your product coins the first time it appears in a document,
in half a sentence, so a reader outside the product does not have to guess.

## Before and after

| Weaker | Stronger |
|---|---|
| This note analyses the capability onboarding options and makes a recommendation. | Onboarding a capability takes two days today, nearly all of it by hand. Option B below cuts that to under an hour and costs one week of work. |
| Moving to the new runner would give us significant cost savings. | The hosted runner bills 8 minutes per pipeline run at $0.008 a minute. At 40 runs a day that is $77 a month, against $12 for the self-hosted one. |
| The current approach does not scale well. | Each new repository needs six files copied by hand. At sixteen repositories, two have already drifted. |
| We should use option B. | Option B wins because it needs no change to the schema. Option A is faster to build, but it stores state the applier would then have to migrate. |

## Before you finish

Run `.claude/hooks/check-writing-style.sh` on every file you touched.

Then reread your own opening paragraph on its own. If it does not carry the
decision, the document has not started yet.
