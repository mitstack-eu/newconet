# CLAUDE.md — the Claude Code standard

This file and the tree beside it are the seeded standard, listed by the
package manifest the seeding block carries. Everything outside `.claude/` is
the user's own.

## Delivery routes through skills and agents unasked

Any executable path, a mixed diff or an unrecognised path runs the full
split: `test-author` writes failing tests, `code-author` makes them pass,
`code-validator` gates the diff.

A prose-only diff runs one author agent, who turns the covering guard red
before green; an author who finds it must touch an executable file stops and
re-routes to full. `code-validator` gates both flows. Any prose goes through
the `writing-style` skill.

A rule or agent definition is policy mechanical checkers judge, so it clears
in one pass. A design note or decision record carries reasoning no checker
reads, so expect several review rounds.

## Never assert what you have not proven

This binds every message, ticket, commit, comment and document, so no file
scopes it.

State a cause only when you have evidence that rules out the alternatives. Until
then, say what you observed, say what you have not established, and say what
would settle it. A symptom is not a cause, a plausible mechanism is not the
mechanism, and code that could produce the behaviour is not proof that it did.

Separate the two plainly. "The head sha carried zero check runs" is an
observation and needs its source. "Nothing resends the webhook" is a claim and
needs a check. Give an observation its source, and give a claim the file, line,
run or command that settles it.

An assertion that turns out wrong is worse than an open question, because the
next reader stops looking. A ticket naming the wrong mechanism sends someone to
fix code that was never broken, and they land a change that reads as delivered
and moves nothing.

When you cannot prove it, the answer is to build the thing that would: a test
that reproduces the state, a probe against the live system, a run whose output
you can read. Say "unproven" and name the next step rather than picking the
likeliest story.

Distrust a bare verdict, including your own. A subagent reporting green is not
green until you have read the output; a gate reporting pass is not a pass until
you know what it checked. Ask for evidence rather than a conclusion.

Correct yourself the moment the evidence lands, and say which claim was wrong.

## Terminal replies

This standard applies to every message, so no file scopes it. Lead with the
outcome in a complete sentence before any detail, then write full sentences in
short paragraphs, with no fragments or arrow chains. Drop what does not change
the reader's next action.

## Text inside code

A comment says what the code does or its constraint: no ticket id, no
history. A script header says what it does, its `Usage:`, and why it exists.
