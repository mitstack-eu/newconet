# Where a file belongs

The placement standard for every file written in this repository. It is
always loaded, because it governs every write.

## What a root may hold

Every repository root holds three documents: `README.md`, `CLAUDE.md` for the
agent instructions, and `CONTEXT.md` for resumable session state.

Configuration belongs at a root only when its tool demands it: a `Makefile`, a
compose file, a `Dockerfile`, a linter config, and the dot files git and the
editor read.

## Where everything else goes

| Kind of file | Destination |
|---|---|
| Guides, runbooks, ADRs, design specs | `docs/`, in the repository it describes |
| Scripts | `scripts/`, in the repository whose work they do |
| Screenshots, browser dumps, scratch captures | `.local-screenshots/`, which git ignores |

Tool output is not a document: act on it and let it go.

## What never belongs anywhere

A second copy of an instruction file never belongs; a tool wanting another
filename gets a pointer to the original. Nor does a dated handover note,
since git records what is in flight. Nor does a file named only for a date or
a ticket id: a name has to say what the file is.

## How this is enforced

`.claude/hooks/repo-structure-hook.sh` runs on the Write and Edit tools and
reports a misplaced file back to whoever wrote it, judged against the root it
lands in.
