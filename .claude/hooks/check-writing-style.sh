#!/usr/bin/env bash
# check-writing-style.sh — enforce the parts of the writing standard a machine
# can be right about.
#
# Explained in .claude/rules/writing-style.md.
#
# WHY THIS EXISTS
#
# The standard binds every agent and every doc, and prose that has to be
# interpreted leaves compliance depending on whoever is writing remembering
# it — and a long session is exactly where that fails. A session can hold the
# guide the whole time and still drift: mid-sentence emphasis as a tic, an
# arrow chain, the same observation restated message after message.
#
# WHAT IT DOES NOT DO
#
# It does not judge whether prose is good. Readability, ordering, whether the
# why precedes the how — none of that is decidable here, and a gate that
# guessed at it would be argued with and then disabled. It catches the specific
# CONSTRUCTS the standard names, which is the part a machine can be right
# about. Taste stays with the reviewer.
#
# SCOPE IS PER-CHANGE, AND THAT IS NOT A WAIVER
#
# A repository can carry existing violations. Scanning everything on every
# change would fail every delivery over prose nobody touched, which is how a
# gate gets switched off. So the default judges what a change INTRODUCES, and
# --all surfaces the whole backlog for anyone deliberately working through it.
# Nothing is allowlisted, and every violation in changed text still fails.
#
# Usage:
#   .claude/hooks/check-writing-style.sh                # files changed vs main
#   .claude/hooks/check-writing-style.sh --all          # docs/ + *.md, whole tree
#   .claude/hooks/check-writing-style.sh [path ...]     # named files
#   .claude/hooks/check-writing-style.sh --text FILE    # a commit message or PR body
#   .claude/hooks/check-writing-style.sh --change       # this PR's title, body and commits
set -euo pipefail

# The repository this package is vendored into: the git toplevel above
# .claude/hooks/, or two directories up when the tree is not a git checkout.
ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fails=0

fail() { printf '%s\n' "FAIL: $*"; fails=$((fails + 1)); }

# --- the rules ---------------------------------------------------------------
#
# Each is a construct the standard names outright, so a violation is a fact
# rather than an opinion.

# An arrow chain replaces a sentence with a diagram and reads as shorthand.
check_arrow_chains() {
  local file="$1"
  # A → between two words. Mermaid blocks legitimately use arrows, so lines
  # inside a fenced block are skipped by the caller.
  #
  # An arrow wholly INSIDE one inline code span is notation, not shorthand for a
  # sentence: `Backlog → Ready → Done` is a state machine and `A → B` in a path
  # is a path. Rewriting those as prose makes them harder to read, which is the
  # opposite of the point — same reasoning the fenced-block skip already
  # applies to mermaid. Code spans are therefore removed before the match.
  #
  # What survives that removal is the construct the standard actually bans: an
  # arrow between things in RUNNING PROSE, including between two code spans, as
  # in "`test-author` (first) → `code-author` (green)". That still fails, and a
  # test pins it, because exempting it would gut the rule.
  sed 's/`[^`]*`//g' "$file" 2>/dev/null \
    | grep -nE '[[:alnum:])"]+ *(→|->) *[[:alnum:]("]+' 2>/dev/null || true
}

# A heading that is a ticket id, or shouts, tells the reader nothing.
check_headings() {
  local file="$1"
  grep -nE '^#{1,6} +(MIT[- ]?[0-9]+|T-[0-9]+|m-[0-9]+)\b' "$file" 2>/dev/null || true
  grep -nE '^#{1,6} +[A-Z][A-Z0-9 ]{6,}$' "$file" 2>/dev/null || true
  grep -niE '^#{1,6} +(overview|details|misc|notes|summary|introduction)[[:space:]]*$' "$file" 2>/dev/null || true
}

# A wall of bold-label bullets is a table pretending to be prose.
check_bold_label_bullets() {
  local file="$1"
  awk '
    /^[[:space:]]*[-*] +\*\*[^*]+\*\*[:—-]/ { run++; if (run >= 4) print NR": "$0; next }
    { run = 0 }
  ' "$file" 2>/dev/null || true
}

# Filler that asserts rather than shows. The second group is the hedging half:
# each of those words tells the reader a thing is evident instead of showing it,
# which is the same failure as "simply". "clearly" is matched only when it is
# not the head of a compound such as "clearly-marked", which is description
# rather than hedging.
check_filler() {
  local file="$1"
  # A word inside a code span is being NAMED, not used — this very gate has to
  # list the words it bans, and a check that fails on its own explanation is one
  # people weaken rather than obey.
  local prose
  prose="$(sed 's/`[^`]*`/@/g' "$file" 2>/dev/null)"
  printf '%s\n' "$prose" | grep -nEi '\b(simply|just [a-z]+ it|powerful|seamless|blazing|effortless)\b' || true
  printf '%s\n' "$prose" | grep -nEi '\b(obviously|of course|needless to say|as you can see|basically|essentially)\b' || true
  printf '%s\n' "$prose" | grep -nEi '\bclearly([^-]|$)' || true
}

# maxSentenceWords is where a sentence has stopped carrying one idea. Sixty is
# not a style preference picked from the air: at the time this rule landed the
# whole tree held a small number of sentences above it, at most a handful in
# any single file, which is a backlog a file can clear when it is next touched.
# A tighter limit measured in the hundreds, and a gate whose backlog cannot be
# cleared is a gate that gets switched off.
maxSentenceWords=60

# A sentence is measured across the WHOLE paragraph, not per line. Counting per
# line would let any sentence pass by being wrapped, so the rule would stop
# measuring anything while still reporting success. Table rows are data and
# headings are titles — neither is a sentence, and flagging them would fire on
# text nobody can shorten. Each bullet is its own unit, since a list item is a
# sentence in its own right.
check_long_sentences() {
  local file="$1"
  # Code spans collapse to one token and a link keeps its text but loses its
  # target: a long URL is one thing to a reader, not twenty words.
  sed -e 's/`[^`]*`/CODE/g' -e 's/\](\([^)]*\))/]/g' "$file" 2>/dev/null \
    | awk -v limit="$maxSentenceWords" '
      function words(s,   n, a) { n = split(s, a, /[ \t]+/); if (a[1] == "") n--; if (n > 0 && a[n] == "") n--; return n }
      function flush(   n, parts, i, w) {
        if (unit == "") return
        gsub(/[][]/, "", unit)
        n = split(unit, parts, /[.!?;:]+[ \t]+/)
        for (i = 1; i <= n; i++) {
          w = words(parts[i])
          if (w > limit) printf "%d: %d-word sentence — split it: %.60s...\n", start, w, parts[i]
        }
        unit = ""
      }
      /^[[:space:]]*$/            { flush(); next }
      /^[[:space:]]*[#|>]/        { flush(); next }
      /^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]/ {
        flush()
        line = $0
        sub(/^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]+/, "", line)
        unit = line; start = NR; next
      }
      { if (unit == "") start = NR; unit = unit " " $0 }
      END { flush() }
    ' 2>/dev/null || true
}

# An outline that skips a level stops describing the document, and a heading
# with nothing under it promises a section that is not there.
check_heading_structure() {
  local file="$1"
  awk '
    function level(s,   h) { match(s, /^#+/); return RLENGTH }
    /^#{1,6} / {
      lvl = level($0)
      if (prev > 0 && lvl > prev + 1) printf "%d: heading jumps from level %d to %d: %s\n", NR, prev, lvl, $0
      if (pending && lvl <= pending) printf "%d: nothing under the heading above it: %s\n", NR, $0
      prev = lvl; pending = lvl; next
    }
    /^[[:space:]]*$/ { next }
    { pending = 0 }
  ' "$file" 2>/dev/null || true
}

# Link text has to say where it goes. "here" reads as nothing on its own, and a
# reader scanning for the destination never finds it.
check_vague_link_text() {
  local file="$1"
  grep -nEi '\[(here|this|this one|link|click here|read more|more)\]\(' "$file" 2>/dev/null || true
}

# A doubled word is always a typo; a repeat across a sentence boundary is not,
# so the pattern requires the two to sit in the same clause.
check_doubled_words() {
  local file="$1"
  # A code span becomes a non-word marker rather than disappearing. Deleting it
  # would push the words on either side together and invent a doubling nobody
  # wrote, and a word-shaped placeholder would double against itself the moment
  # two spans sit side by side, which is ordinary in prose.
  sed 's/`[^`]*`/@/g' "$file" 2>/dev/null | grep -nEi '\b([a-z]+)[[:space:]]+\1\b' || true
}

# maxBulletRun is where a list of terse items stops being scannable and should
# be a table or prose. Only TERSE items count, measured in words: a list whose
# entries each carry a paragraph is a section written as a list, which reads
# fine, while a dozen one-liners in a row is the wall the standard is about.
# Without that distinction the rule fires on every documented inventory and
# gets argued with rather than fixed.
maxBulletRun=12
maxTerseBulletWords=25

check_bullet_runs() {
  local file="$1"
  awk -v limit="$maxBulletRun" -v terse="$maxTerseBulletWords" '
    function close_item() {
      if (inItem && itemWords > terse) run = 0
      inItem = 0; itemWords = 0
    }
    /^[[:space:]]*([-*]|[0-9]+\.)[[:space:]]/ {
      close_item()
      if (run == 0) start = NR
      run++
      if (run == limit) printf "%d: %d consecutive terse bullets — use a table or prose\n", start, limit
      inItem = 1; itemWords = NF; next
    }
    /^[[:space:]]*$/ { next }
    /^[[:space:]]/   { if (inItem) itemWords += NF; next }
    { close_item(); run = 0 }
  ' "$file" 2>/dev/null || true
}

scan_file() {
  local file="$1" label="${2:-$1}"

  # docs/archive/ is a frozen record of what was decided and why, kept so a
  # later reader can see the reasoning as it stood. Rewriting it to satisfy a
  # prose rule would edit history to look like it was written under a standard
  # that did not exist yet, which costs more than the tidiness is worth. This is
  # an exemption of scope, not a waiver: nothing there is being fixed later, and
  # a live doc moved into the archive stops being judged from that moment on.
  case "$label" in
    docs/archive/*|*/docs/archive/*)
      return 0
      ;;
  esac

  # Strip fenced code blocks: arrows and shouting inside them are code, not prose.
  # The opening fence leaves a one-word placeholder rather than a blank line, so
  # a section whose only content is a code block still reads as HAVING content —
  # blanking the whole fence would make the structure rule report it as an empty
  # section. Line numbers are preserved either way, and the placeholder carries
  # nothing any other rule can match.
  local stripped
  stripped="$(mktemp)"
  awk '
    /^[[:space:]]*```/ {
      if (!infence) { match($0, /^[[:space:]]*/); print substr($0, 1, RLENGTH) "CODEBLOCK" } else print ""
      infence = !infence; next
    }
    { print (infence ? "" : $0) }
  ' "$file" > "$stripped"

  local hits
  hits="$(check_arrow_chains "$stripped")"
  [ -n "$hits" ] && fail "$label: arrow chain — write the sentence instead:"$'\n'"$hits"

  hits="$(check_headings "$stripped")"
  [ -n "$hits" ] && fail "$label: heading is a ticket id, shouting, or generic — say what the section is about:"$'\n'"$hits"

  hits="$(check_bold_label_bullets "$stripped")"
  [ -n "$hits" ] && fail "$label: four or more bold-label bullets in a row — use prose or a real table:"$'\n'"$hits"

  hits="$(check_filler "$stripped")"
  [ -n "$hits" ] && fail "$label: filler word — cut it or show the thing instead:"$'\n'"$hits"

  hits="$(check_long_sentences "$stripped")"
  [ -n "$hits" ] && fail "$label: sentence carries more than one idea — split it:"$'\n'"$hits"

  hits="$(check_heading_structure "$stripped")"
  [ -n "$hits" ] && fail "$label: the outline does not describe the document:"$'\n'"$hits"

  hits="$(check_vague_link_text "$stripped")"
  [ -n "$hits" ] && fail "$label: link text says nothing — name the destination:"$'\n'"$hits"

  hits="$(check_doubled_words "$stripped")"
  [ -n "$hits" ] && fail "$label: doubled word:"$'\n'"$hits"

  hits="$(check_bullet_runs "$stripped")"
  [ -n "$hits" ] && fail "$label: a list this long is a table or prose:"$'\n'"$hits"

  rm -f "$stripped"
}

# The standard binds every text a change carries, not only its documentation.
# A commit message and a PR body are read more often than most docs — by the
# next person bisecting, and by the agent reconstructing why something was
# done.
#
# Env, set by the workflow: PR_TITLE, PR_BODY, PR_ACTOR, BASE_SHA, HEAD_SHA.
scan_change_text() {
  if [ "${GITHUB_EVENT_NAME:-}" != "pull_request" ]; then
    echo "not a pull_request event — no change text to judge"
    return 0
  fi

  # A bot writes none of the text this mode reads. A dependency bot's title,
  # body and commit message are generated, and the body is often a verbatim
  # paste of upstream release notes — so the violations are upstream's, in a
  # repository nobody here can edit, and they come back on every rebase
  # because the body is regenerated. That makes this gate a permanent wall
  # across every dependency update rather than something an author can answer.
  # Exempting the bot is narrower than that, and narrower than a waiver —
  # nothing is allowlisted, and the markdown scan still judges any file a bot
  # changes.
  #
  # PR_ACTOR is a pull-request signal only, and it is read only here, inside
  # the branch that has already established this is a PR. Consulting it in
  # any other mode would let a scan that has no PR inherit an exemption that
  # was never about it.
  case "${PR_ACTOR:-}" in
    *"[bot]"|dependabot*)
      echo "bot PR (${PR_ACTOR}) — its title, body and commits are generated, so"
      echo "there is no authored prose here to hold to the standard"
      return 0
      ;;
  esac

  local scratch
  scratch="$(mktemp -d)"

  printf '%s\n\n%s\n' "${PR_TITLE:-}" "${PR_BODY:-}" > "$scratch/pr.txt"
  scan_file "$scratch/pr.txt" "the PR title and body"

  local base="${BASE_SHA:-}" head="${HEAD_SHA:-HEAD}"
  if [ -n "$base" ]; then
    local shas
    shas="$(git log --format='%H' "$base..$head" 2>/dev/null || true)"
    local sha
    for sha in $shas; do
      git log -1 --format='%s%n%n%b' "$sha" > "$scratch/commit.txt" 2>/dev/null || continue
      scan_file "$scratch/commit.txt" "commit ${sha:0:8}"
    done
  fi

  rm -rf "$scratch"
}

main() {
  if [ "${1:-}" = "--change" ]; then
    scan_change_text
  elif [ "${1:-}" = "--text" ]; then
    scan_file "$2" "${3:-$2}"
  elif [ "${1:-}" = "--all" ]; then
    while IFS= read -r f; do scan_file "$f"; done < <(
      find "$ROOT/docs" -name '*.md' -type f 2>/dev/null
      find "$ROOT" -maxdepth 1 -name '*.md' -type f 2>/dev/null
    )
  elif [ "$#" -gt 0 ]; then
    for f in "$@"; do scan_file "$f"; done
  else
    # Changed markdown only. Fail SAFE to nothing rather than to everything: a
    # missing merge-base must not turn this into the whole-tree scan the scope
    # rule exists to avoid.
    local base
    base="$(git -C "$ROOT" merge-base HEAD origin/main 2>/dev/null || true)"
    if [ -z "$base" ]; then
      # Refuse rather than pass. Returning success here is indistinguishable
      # from having checked and found nothing, which is worse than no gate at
      # all, because it also stops anyone looking.
      echo "writing style: cannot derive a merge-base with origin/main, so there is" >&2
      echo "no way to tell what this change introduced. Refusing to report success." >&2
      echo "In CI this means the checkout is shallow — give the job fetch-depth: 0." >&2
      echo "Locally, fetch origin/main first, or name the files to check explicitly." >&2
      return 1
    fi
    while IFS= read -r f; do
      [ -f "$ROOT/$f" ] && scan_file "$ROOT/$f" "$f"
    done < <(git -C "$ROOT" diff --name-only --diff-filter=ACM "$base"...HEAD -- '*.md' 2>/dev/null || true)
  fi

  if [ "$fails" -gt 0 ]; then
    echo
    echo "$fails writing-standard violation(s)."
    echo "These are the constructs the standard names outright; the gate does not"
    echo "judge whether the prose is good, only that it avoids them."
    exit 1
  fi
  echo "writing style OK — no banned constructs found."
}

main "$@"
