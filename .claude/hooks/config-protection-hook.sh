#!/usr/bin/env bash
# config-protection-hook.sh — blocks a Write or Edit from silently rewriting a
# lint or formatter config once that file already exists.
#
# Usage:
#   .claude/hooks/config-protection-hook.sh          # reads a PreToolUse payload on stdin
#   .claude/hooks/config-protection-hook.sh <path>   # judge one path directly (for tests)
#
# It is wired to the Write and Edit tools in .claude/settings.json. Creating
# one of these files for the first time is always allowed; only rewriting one
# that already exists is judged, and a tsconfig*.json is judged by content
# (does the edit touch a lint-related compilerOption) rather than by existence
# alone.
#
# WHY THIS EXISTS
#
# Loosening .golangci*, eslint.config.*, .prettierrc*, or a tsconfig lint
# option is how a check gets satisfied without the code that failed it ever
# changing. That is a closed-waiver an agent grants itself, the shape the
# closed-waiver policy in .claude/rules/principles.md forbids, applied here
# repository-wide rather than only to one directory: fix the code the check is
# pointing at, never weaken the check. Blocking the edit at the tool call is
# the only enforcement point that reaches an agent mid-session, the same
# reasoning .claude/hooks/repo-structure-hook.sh applies to file placement.
#
# A config like this is declarative, so loosening it turns a gate green with
# no change to the code it judged and nothing else in the repository notices.
# That is why the protected set stops here: an imperative script already
# carries a paired test in CI, and weakening it either turns that test red or
# forces a second, conspicuous edit to the test — the defence this hook exists
# to provide, which a declarative config has no other way to get.
#
# WHY IT DEGRADES INSTEAD OF FAILING
#
# A missing jq, or a payload it cannot parse, lets the write stand — a finding
# nobody can act on is a wall, not a gate. An oversized payload is refused
# outright instead, since there is nothing safe to degrade to once the input
# itself cannot be trusted to hold a whole JSON document.

set -uo pipefail

# Pinned so every subprocess's text is locale-stable: stat's ENOENT message
# stays the English string path_state() greps for even when the caller's
# locale is not C, and nothing here needs locale-aware collation or casing.
export LC_ALL=C

CAP=1048576 # stdin payload cap, in bytes

# compilerOptions that change what the TypeScript lint check enforces. A
# tsconfig edit is judged by whether it mentions one of these, not by
# existence alone, since most tsconfig edits are not lint-related.
LINT_KEYS="strict noImplicitAny strictNullChecks strictFunctionTypes strictBindCallApply strictPropertyInitialization noImplicitThis alwaysStrict noUnusedLocals noUnusedParameters noImplicitReturns noFallthroughCasesInSwitch noUncheckedIndexedAccess noImplicitOverride noPropertyAccessFromIndexSignature allowUnusedLabels allowUnreachableCode useUnknownInCatchVariables exactOptionalPropertyTypes skipLibCheck"

lint_key_present() { # $1 content blob -> 0 if it mentions a lint compilerOption
  local blob="$1" key
  for key in $LINT_KEYS; do
    case "$blob" in
      *"$key"*) return 0 ;;
    esac
  done
  return 1
}

path_state() { # $1 path -> prints exists|absent|unknown
  local p="$1" err
  # A dangling symlink still counts as existing: -L catches it without
  # following it, ahead of the -e check that a broken target would fail.
  if [ -L "$p" ] || [ -e "$p" ]; then
    printf 'exists\n'
    return
  fi
  # -e can come back false for a reason other than "not there" — an
  # unreadable parent directory, for one. Ask stat why, and only call the
  # path absent when it says so; anything else fails closed.
  err="$(stat -- "$p" 2>&1 >/dev/null)"
  if grep -qi "no such file or directory" <<<"$err"; then
    printf 'absent\n'
  else
    printf 'unknown\n'
  fi
}

judge() { # $1 file_path, $2 content blob (may be empty) -> "path|reason" and rc 1 to block, else rc 0
  local file_path="$1" content_blob="${2:-}" base kind state reason
  [ -n "$file_path" ] || return 0
  base="$(basename -- "$file_path")"
  kind=""

  # Cheap glob match first: most writes touch nothing protected, and this
  # branch never touches the filesystem.
  case "$base" in
    .golangci*) kind="golangci" ;;
    eslint.config.*) kind="eslint" ;;
    .prettierrc*) kind="prettierrc" ;;
    tsconfig*.json) kind="tsconfig" ;;
  esac
  [ -n "$kind" ] || return 0

  state="$(path_state "$file_path")"
  case "$state" in
    absent) return 0 ;; # first-time creation is always allowed
    unknown)
      printf '%s\n' "$file_path|Its existence could not be determined (stat failed for a reason other than \"not found\"), so the write is refused rather than guessed at."
      return 1
      ;;
  esac

  if [ "$kind" = "tsconfig" ]; then
    if lint_key_present "$content_blob"; then
      printf '%s\n' "$file_path|This edit mentions a lint-related compilerOption; tsconfig*.json is otherwise open."
      return 1
    fi
    return 0
  fi

  case "$kind" in
    golangci) reason="This is the Go lint configuration; it decides what golangci-lint enforces." ;;
    eslint) reason="This is the ESLint configuration; it decides what the TypeScript lint check enforces." ;;
    prettierrc) reason="This is the Prettier configuration; it decides what the formatter enforces." ;;
  esac
  printf '%s\n' "$file_path|$reason"
  return 1
}

report() { # $1 "path|reason"
  local path="${1%%|*}" reason="${1#*|}"
  {
    echo "This write targets a protected lint or formatter config: $path"
    echo
    echo "  $reason"
    echo
    echo "Rewriting a lint or formatter config to make a check pass, instead"
    echo "of fixing the code the check is pointing at, is a closed-waiver an"
    echo "agent would be granting itself — the closed-waiver policy in"
    echo ".claude/rules/principles.md, applied repository-wide by this hook."
    echo
    echo "A deliberate change to this config still has a path: open it as its"
    echo "own pull request, with the reason for the change in the description,"
    echo "and get a human review to approve it. Never a silent edit mid-session."
  } >&2
}

# Direct-path mode: no content to inspect, so a tsconfig lint edit can never
# be judged here — only existence-based protection applies.
if [ "$#" -gt 0 ]; then
  finding="$(judge "$1" "")" || { report "$finding"; exit 2; }
  exit 0
fi

# The cap is enforced on the raw read, before any parsing or pattern logic
# runs, so an oversized payload never reaches jq or the glob matching. The
# byte count comes from wc -c on the read itself, not from ${#payload}: bash
# string length is locale-aware and undercounts multi-byte characters, and a
# command-substitution capture also strips trailing newlines, either of which
# can let an over-cap payload measure as under it.
#
# Staging to a file can itself fail (no writable TMPDIR, disk full): that is
# not "under the cap", it is "unmeasured", and an unmeasured payload is
# refused rather than waved through by an empty $bytes never tripping the
# comparison below. BSD wc pads the count with leading spaces, so the count
# is stripped of whitespace before it is judged.
stage_failed="config-protection hook: cannot stage the payload read, refusing"

raw="$(mktemp 2>/dev/null)" || raw=""
if [ -z "$raw" ] || [ ! -e "$raw" ]; then
  echo "$stage_failed" >&2
  exit 2
fi
trap 'rm -f "$raw"' EXIT

if ! head -c $((CAP + 1)) >"$raw" 2>/dev/null; then
  echo "$stage_failed" >&2
  exit 2
fi

bytes="$(wc -c <"$raw" 2>/dev/null | tr -d "[:space:]")"
case "$bytes" in
  '' | *[!0-9]*)
    echo "$stage_failed" >&2
    exit 2
    ;;
esac

if [ "$bytes" -gt "$CAP" ]; then
  echo "config-protection hook: payload exceeds the ${CAP}-byte cap, refusing (truncated read, nothing parsed)" >&2
  exit 2
fi
payload="$(cat -- "$raw")"
rm -f "$raw"

if ! command -v jq >/dev/null 2>&1; then
  echo "config-protection hook: jq not found, skipping the check" >&2
  exit 0
fi

fields="$(printf '%s' "$payload" | jq -r '
    [(.tool_input.file_path // ""),
     ((.tool_input.content // "") + (.tool_input.old_string // "") + (.tool_input.new_string // ""))]
    | @tsv
  ' 2>/dev/null)" || exit 0

IFS=$'\t' read -r file_path content_blob <<<"$fields"
[ -n "$file_path" ] || exit 0

finding="$(judge "$file_path" "$content_blob")" || { report "$finding"; exit 2; }
exit 0
