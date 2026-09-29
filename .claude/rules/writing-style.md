---
paths:
  - "**/*.md"
---

# Writing docs for a human developer

The prose standard for every Markdown file in this repository, including
READMEs, runbooks, ADRs, roadmap notes, design specs and the CLAUDE.md files.
It binds every agent that writes one.

Two parts sit elsewhere, in the root `CLAUDE.md`: terminal replies, which apply
to every message, and prose inside code, which a session editing a shell script
needs without loading this rule.

## Write sentences a reader gets on the first pass

A reader should never have to go back to the start of a sentence to work out
what it says.

Aim for fifteen to twenty words and split anything past twenty-five. The count
is a signal rather than a target: what you want is one idea per sentence.

Put the subject and its verb near the front, since a long opening setup clause
makes the reader hold it all in mind first.

Give every sentence a subject you can point at: the script, the job, the file
or the person. A sentence about "what happens" or "the thing that" has hidden
its actor.

Use one plain verb where you were about to use a noun built from a verb: the
gate decides, rather than makes a decision.

Hold yourself to one subordinate clause. Two "which" or "because" clauses in a
single sentence are two sentences that have not been separated yet.

Prefer the everyday word unless the technical term is the exact one. Write
"use" rather than "utilise", and write "idempotent" when that is what you mean.

## What a good doc does

Open with one short paragraph saying what the doc covers and who it is for, so
a reader knows within five seconds whether to keep reading. That paragraph is
the last thing to cut when a doc gets long.

Explain the reasoning before the steps. A reader who knows why a step exists
can tell when it stops applying, and a bare list of steps cannot.

Give one idea per paragraph. If a paragraph needs "and also", split it.

Write in the active voice and the present tense, and address the reader as
"you". Keep code samples short and runnable. Reference code as `file.ts:42`
rather than pasting a block, and quote only what the reader needs.

Use numbered steps for a real procedure, one action per step. Use a table when
the content has columns, and prose when it does not.

Headings name what the section is about, as in "How the deploy verifies
itself". A heading is never a ticket id and never a milestone id.

## A doc describes the present, and nothing else

Write how the thing works now, not what changed or which ticket changed it. A
reader wants the current behaviour and stops at a post-mortem.

This holds everywhere except `docs/adr/`, since a decision record is history by
definition.

| Never write | Write |
|---|---|
| A ticket or milestone id, anywhere | The behaviour itself |
| `This used to be a CI check, but` | The rule as it stands |
| An incident narrative motivating a rule | The rule, and one sentence of why |
| `Renamed from`, `supersedes`, `no longer` | Nothing. The old name is gone |

When a rule genuinely needs its reasoning, give it one sentence in the present
tense. If it needs a paragraph, that paragraph belongs in a decision record the
doc links to.

## What the checker rejects

Most of the standard above is taste, which stays with the reviewer. The
constructs below are decided by `.claude/hooks/check-writing-style.sh`, which
the hook runs the moment you write a Markdown file.

| Construct | Write this instead |
|---|---|
| An arrow between two words, in either the unicode or ASCII form | The sentence: "a push to main runs the deploy job, which builds the images" |
| A heading that is a ticket id, is all-caps, or is one of `Overview`, `Details`, `Misc`, `Notes`, `Summary`, `Introduction` | A heading that says what the section is about |
| Four or more consecutive bullets opening with a bolded label | A real table, or paragraphs |
| `simply`, `powerful`, `seamless`, `blazing`, `effortless`, `obviously`, `of course`, `needless to say`, `as you can see`, `basically`, `essentially`, and `clearly` when it hedges | Nothing, or the thing the word was standing in for |
| A sentence over sixty words, measured across the whole paragraph | Two sentences |
| Twelve or more bullets in a row of twenty-five words or fewer | A table, or prose |

The sixty-word limit is the machine's floor, not the target. The bar you are
writing to is twenty-five words, and no checker enforces it.

A word inside a code span is named rather than used, so it passes, which is why
the table above can exist. Headings and table rows are exempt from the
sentence-length rule, and a fenced block is skipped whole.

The gate also rejects a few structural faults: a skipped heading level, a
heading with nothing under it, link text that names no destination, and a
doubled word.

## The scope that surprises people

The default run judges the Markdown a change touches, and it judges each file
whole. Every violation in a file you edit becomes yours to fix, so check before
you start:

```bash
.claude/hooks/check-writing-style.sh path/to/doc.md
```

`--all` lists the backlog across the tree. Nothing is allowlisted and there is
no waiver path, so a real finding is fixed in the change that surfaced it.

## Where each rule is enforced

This file informs, and so do the two writing skills beside it, which carry the
procedure. Neither of them enforces anything.

Enforcement is one hook. `.claude/hooks/writing-style-hook.sh` runs the checker
against any Markdown file just written and returns the findings to whoever
wrote it. That is the only path that reaches an agent with no Skill tool.
