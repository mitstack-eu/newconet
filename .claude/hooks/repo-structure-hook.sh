#!/usr/bin/env bash
# repo-structure-hook.sh — judge WHERE a file was just written, and hand any
# finding back to whoever wrote it.
#
# Usage:
#   .claude/hooks/repo-structure-hook.sh          # reads a PostToolUse payload on stdin
#   .claude/hooks/repo-structure-hook.sh <path>   # judge one path directly (for tests)
#
# It is wired to the Write and Edit tools in .claude/settings.json. A file in an
# allowed location produces nothing at all. A misplaced one exits 2, which
# returns the finding to the agent that wrote it.
#
# WHY THIS EXISTS
#
# A repository root is the path of least resistance: a screenshot or a scratch
# note written without a destination lands beside CLAUDE.md, where it looks
# load-bearing and is not. The rule in .claude/rules/repo-structure.md is
# context and informs; this is the half that enforces, and it is the only one
# that reaches an agent with no Skill tool.
#
# WHY THERE IS NO CI CHECK BESIDE IT
#
# Root debris is gitignored, so it never reaches a pull request. A pipeline
# gate would spend a job on every run judging files it cannot see. Placement
# is cheapest to fix at the moment of writing, which is here.
#
# WHY IT DEGRADES INSTEAD OF FAILING
#
# A missing jq, or a payload it cannot parse, lets the write stand. Blocking
# every edit over an absent dependency turns a gate into a wall.

set -uo pipefail

# Roots may hold these three documents plus a standing waiver file. Everything
# else at a root is either tool-mandated config (matched by pattern below) or
# a placement mistake.
ALLOWED_ROOT_DOCS="README.md CLAUDE.md CONTEXT.md DEVIATIONS.md AGENTS.md"

judge() { # $1 path, absolute or relative -> prints a finding and returns 1, or returns 0
  local path="$1" repo rel base dir
  # Resolve to an absolute path FIRST. The repo root comes back absolute, so a
  # relative argument made the prefix strip below a no-op: the result still held
  # a slash, hit the directory case, and every stray file at a submodule root
  # was waved through.
  dir="$(cd "$(dirname "$path")" 2>/dev/null && pwd)" || return 0
  path="$dir/$(basename "$path")"
  repo="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || return 0
  [ -n "$repo" ] || return 0
  rel="${path#"$repo"/}"
  base="$(basename "$rel")"

  # Only root-level files are judged. A path with a slash is inside a directory
  # that already expresses an intent, and this hook does not second-guess it.
  case "$rel" in */*) return 0 ;; esac

  # Dot files are configuration git, the editor and the toolchain require here.
  case "$base" in .*) return 0 ;; esac

  # Tool-mandated config that must sit at a root to be found at all.
  case "$base" in
    Makefile|Dockerfile|docker-compose*.yml|*.mod|*.sum|*.lock) return 0 ;;
    *.yml|*.yaml|*.toml|*.json|*.ini|*.cfg) return 0 ;;
    LICENSE|LICENCE|NOTICE|entrypoint.sh) return 0 ;;
  esac

  for allowed in $ALLOWED_ROOT_DOCS; do
    [ "$base" = "$allowed" ] && return 0
  done

  # Past here the file is at a root with no reason to be. Name the likely home
  # rather than only the violation, because the fix is a move and the author
  # needs a destination.
  local hint
  case "$base" in
    *.png|*.jpg|*.jpeg|*.gif|*.webp)
      hint="Screenshots and captures go in .local-screenshots/ (gitignored)." ;;
    HANDOVER*|*handover*)
      hint="Session handover belongs in CONTEXT.md, not a dated file." ;;
    *.md)
      hint="Docs go in docs/." ;;
    *.sh|*.py)
      hint="Scripts go in scripts/, in the repo whose work they do." ;;
    *)
      hint="Transient tool output goes in .local-screenshots/, or is read and discarded." ;;
  esac
  printf '%s\n' "$rel|$hint"
  return 1
}

report() { # $1 "rel|hint"
  local rel="${1%%|*}" hint="${1#*|}"
  {
    echo "This file is at a repository root, which is reserved: $rel"
    echo
    echo "  $hint"
    echo
    echo "A root holds README.md, CLAUDE.md and CONTEXT.md, plus config a tool"
    echo "requires there. Everything else has a better home, and a file left at a"
    echo "root looks load-bearing when it is not."
    echo "The placement rules are in .claude/rules/repo-structure.md."
  } >&2
}

# Direct-path mode keeps the decision testable without constructing a payload.
if [ "$#" -gt 0 ]; then
  finding="$(judge "$1")" || { report "$finding"; exit 2; }
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "repo-structure hook: jq not found, skipping the check" >&2
  exit 0
fi

payload="$(cat)"
file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"

# No path, or a path already gone: an Edit can be followed by a delete.
[ -n "$file_path" ] || exit 0
[ -e "$file_path" ] || exit 0

finding="$(judge "$file_path")" || { report "$finding"; exit 2; }
exit 0
