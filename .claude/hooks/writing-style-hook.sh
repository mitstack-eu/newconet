#!/usr/bin/env bash
# writing-style-hook.sh — run the writing-style checker against a Markdown file
# the moment an agent writes it, and hand any findings back.
#
# Usage:
#   .claude/hooks/writing-style-hook.sh            # reads a PostToolUse payload on stdin
#
# It is wired to the Write and Edit tools in .claude/settings.json. It reads the
# hook payload, ignores anything that is not an existing Markdown file, and runs
# the checker over the rest. A clean file produces nothing at all. A violating
# file exits 2, which returns the checker's own findings to whoever wrote it.
#
# WHY THIS EXISTS
#
# A prose standard that only informs gets followed while someone is attending
# to it and drifts the moment they are not. This hook is the enforcing half,
# and it is the only one of the writing standard's parts that reaches an agent
# whose tool list has no Skill tool.
#
# WHY IT DEGRADES INSTEAD OF FAILING
#
# A missing checker, or a missing jq, lets the write stand rather than
# blocking every Markdown edit over an absent dependency. A finding nobody can
# fix forward stops being a gate and starts being a wall.
#
# WHAT IT DOES NOT DECIDE
#
# Nothing. Every verdict comes from check-writing-style.sh, vendored beside
# this hook, so there is exactly one implementation of the rules and this file
# never drifts from it.

set -uo pipefail

CHECKER="${WRITING_STYLE_CHECKER:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/check-writing-style.sh}"

payload="$(cat)"

# jq is the standard JSON reader every hook in this directory assumes. If it
# is genuinely absent, say so once and get out of the way.
if ! command -v jq >/dev/null 2>&1; then
  echo "writing-style hook: jq not found, skipping the check" >&2
  exit 0
fi

file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"

# No path, a path that is not Markdown, or a path that is no longer there. An
# Edit can be followed by a delete, and most writes are Go, TypeScript or
# shell, so this is the common case and it must cost nothing.
[ -n "$file_path" ] || exit 0
case "$file_path" in
  *.md) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

if [ ! -x "$CHECKER" ]; then
  echo "writing-style hook: check-writing-style.sh is missing at $CHECKER" >&2
  exit 0
fi

findings="$("$CHECKER" "$file_path" 2>&1)"
checker_rc=$?

[ "$checker_rc" -eq 0 ] && exit 0

# Exit 2 is what turns this from a log line into feedback. The checker's wording
# is forwarded verbatim; the only thing added is where the rules are explained,
# because the finding names the construct and not the reason behind it.
{
  echo "The writing standard rejects something in $file_path. Fix it before moving on."
  echo
  printf '%s\n' "$findings"
  echo
  echo "The finding above is not a preview: this hook is the enforcement. It judges"
  echo "a Markdown file whole, so a pre-existing violation in a file you touched is"
  echo "yours to fix."
  echo "Run it yourself with: .claude/hooks/check-writing-style.sh $file_path"
  echo "The rules are explained in .claude/rules/writing-style.md."
} >&2
exit 2
