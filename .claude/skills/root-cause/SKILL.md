---
name: root-cause
description: Explaining a defect at its root and offering three costed ways out. Triggers include "why did this happen", "root cause", "what are our options", "how do we fix this properly", or reporting any non-trivial bug.
---

# root-cause

A defect report is worth reading when it separates three things a reader
usually gets mixed together: what broke, why it broke, and what to do about it.
This skill is the shape for that, and the rule that a fix is never offered
without its cost.

## Reproduce before you explain

An explanation that has never been run is a guess wearing a lab coat, and a
guess costs more than it saves: it sends the next person to the wrong file.

Get the defect to happen in front of you first. Run the failing test, load the
page, call the endpoint. If reproducing needs an environment you do not have,
say that in the report rather than reasoning around the gap — "I could not
reproduce this locally because the API image was stale" is a finding, and a
useful one.

Watch for the probe that changes the answer. A local run against a stale build,
a test whose own fixture contains the string being matched, a shared database
carrying another test's rows: each produces a confident result about a
different question than the one asked.

## Say what broke, in one sentence with real values

Name the input and the output, not the feeling. "The destination line reads
`github.com/acme/a repo named from the block id` when the org is connected and
the name is still empty" tells a reader where to look. "The destination line is
wrong" does not.

Quote the actual string, the actual status code, the actual query. A report
that paraphrases what the system said is a report someone has to redo.

## Separate the cause from the trigger

The trigger is what made it visible today. The cause is the thing that was
already untrue.

These are almost never the same, and conflating them produces fixes that
suppress the symptom. A selector that matched three elements was ambiguous from
the day it was written; the change that added a fourth element is the trigger.
Fixing the change would leave the ambiguity in place.

Write both, in that order, and be explicit about which one the fix addresses.

## Offer three ways out, each with what it costs

Every option gets an honest cost. An option with no drawback listed has not
been thought about.

**The quick one.** What stops the bleeding today, with the smallest diff and
the least risk. State plainly what it leaves unfixed, because that is the
reason it is not the only option offered.

**The sustainable one.** What makes this class of defect hard to reintroduce,
usually by removing the shape that allowed it rather than the instance. It
costs more now and is normally the recommendation. Say what it touches and
roughly what it takes.

**The alternative, when one is recommendable.** A genuinely different approach
worth considering, such as deleting the feature, changing the contract, or
accepting the behaviour and documenting it. Offer it only when it is a real
candidate. Three options where the third is filler is worse than two, because
it teaches the reader to skim.

End with a recommendation and one sentence of why. A menu without a
recommendation pushes the decision back to the person who asked for help.

## Prove the fix on the failure

Change the thing, then watch the original reproduction go from failing to
passing. A fix verified only by the suite passing is a fix verified against
everything except the bug.

Where the defect was a wrong value rather than a crash, cover every combination
of the inputs that produced it. A single case passing is how the second half of
a two-by-two stays broken.

## What the report looks like

Six short parts, in this order: what broke with real values, how it was
reproduced, the cause, the trigger, the three options with costs, and the
recommendation. Prose over bullets wherever a sentence carries the reasoning.

Keep it short enough to read in a minute. A root cause that takes a page has
usually not been found yet.
