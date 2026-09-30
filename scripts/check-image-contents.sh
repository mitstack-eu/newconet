#!/usr/bin/env bash
# Fails when the built image serves test source under /usr/share/nginx/html.
#
# Usage: scripts/check-image-contents.sh
#
# Why it exists: CI builds the image from `git archive ... | docker build -`,
# a mode in which .dockerignore is not honoured, so a `COPY site/` ships every
# *.test.js and *.spec.js file. This script builds the image the same way, from
# the working tree staged into a throwaway index, and checks the result. It
# never commits and it removes the temp index and the image on exit.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

tmp_index="$(mktemp -u "${TMPDIR:-/tmp}/image-check-index.XXXXXX")"
image="newconet-image-check:$$"

cleanup() {
  rm -f "$tmp_index"
  docker rmi -f "$image" >/dev/null 2>&1 || true
}
trap cleanup EXIT

export GIT_INDEX_FILE="$tmp_index"
git read-tree HEAD
git add -A -- . ':!CLAUDE.md'
tree="$(git write-tree)"
unset GIT_INDEX_FILE

git archive --format=tar "$tree" | docker build -q -t "$image" - >/dev/null

leaked="$(docker run --rm --entrypoint find "$image" /usr/share/nginx/html \
  \( -name '*.test.js' -o -name '*.spec.js' \) -type f)"

if [ -n "$leaked" ]; then
  echo "FAIL: test source is inside the image:" >&2
  echo "$leaked" >&2
  exit 1
fi
echo "OK: no test source under /usr/share/nginx/html"
