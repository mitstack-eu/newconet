---
name: writing-style
description: The procedure for checking prose against the house standard, and the door to the two writing skills beside it. Triggers include "write the docs", "update the README", "fix the writing style", "check this prose" and "the style check failed".
---

# writing-style

Everything written here is written for a human developer, in the style a good
colleague would use. This skill carries the procedure for checking prose before
you ship it, and points you at the right guidance for the doc you are writing.

The standard itself is written once, in `.claude/rules/writing-style.md`, which
loads on its own whenever a Markdown file is in play. This skill does not
restate it.

## Pick the skill for the doc you are writing

The sentence-level bar is shared. What changes between the two skills beside
this one is the reader and what they need from the page.

| Writing | Read | The reader is |
|---|---|---|
| Technical references, guides, runbooks, decision records | `writing-technical` | Changing or running the system, and needs the guarantee and its failure mode |
| Roadmap and knowledge notes, value claims a reader acts on | `writing-product` | Deciding what to build, and needs the value and the reasoning |

A file outside both, such as a commit message or a pull-request body, is
covered by the rule file alone.

## Where enforcement happens

`.claude/hooks/writing-style-hook.sh` runs `.claude/hooks/check-writing-style.sh`
against any Markdown file the moment you write it, and hands the findings back
to whoever wrote it.

Treat the hook's refusal as a decision rather than advice. Nothing is
allowlisted and no finding can be waived.

## Check a file before you edit it

Findings already sitting in a file become yours the moment you edit it, which
`.claude/rules/writing-style.md` explains. Ask what an unfamiliar file costs
before you touch it:

```bash
.claude/hooks/check-writing-style.sh docs/technical/operators.md
```

A clean file answers `writing style OK`. A file with findings names each one
and the line it sits on. The constructs it decides are listed once, in
`.claude/rules/writing-style.md`, so look there rather than here.

The other invocations, in the order you are likely to need them:

```bash
.claude/hooks/check-writing-style.sh              # every file changed against main
.claude/hooks/check-writing-style.sh --all        # the whole backlog across the tree
.claude/hooks/check-writing-style.sh --text FILE  # a commit message or a PR body
.claude/hooks/check-writing-style.sh --change     # this change's own title, body and commits
```

`--change` reads the change's own title, body and commit messages by the same
rules, and you run it on your own work when the body is substantial.

## When the hook stops you

Fix the finding rather than working around the hook.

## Prose that is not in a Markdown file

Two surfaces sit outside the rule file, because a session editing them never
loads it. The root `CLAUDE.md` covers both: script headers and comments under
"Text inside code", and terminal replies under "Terminal replies".
