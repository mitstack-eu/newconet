#!/usr/bin/env python3
"""destructive-guard-hook.py -- refuse the handful of Bash shapes that
destroy work outside the caller's own reach, before they run.

Usage:
    python3 .claude/hooks/destructive-guard-hook.py   # reads a PreToolUse payload on stdin

It is wired to the Bash matcher in .claude/settings.json. The payload is the
standard PreToolUse JSON: {"tool_name": ..., "tool_input": {"command": ...},
"cwd": ...}. Exit 0 allows the call, exit 2 refuses it with the reason on
stderr. Stdout is always empty. Four shapes are judged, and everything else
passes through:

  - a recursive `rm` whose target resolves outside every allowed root: the
    outermost repository around the call's directory, `/tmp`, `$TMPDIR`
    and `$CLAUDE_JOB_DIR`. A target that is a root itself, or that is or
    sits inside a `.git` directory, is refused even under a root. A target
    carrying a variable this process cannot expand is refused, since a
    path that cannot be read cannot be vouched for.
  - `git push` with `--force` or `-f` and no lease. `--force-with-lease`
    and `--force-if-includes` pass, because they refuse to overwrite what
    the caller has not seen.
  - a deletion of `main`: `git push <remote> --delete main`, the `:main`
    refspec, and `git branch -d` or `-D main`.
  - `git reset --hard`, `git clean` with `-f`, and `git checkout -- .` in
    the shared checkout, the main worktree every session starts from.
    The same commands in a linked worktree pass, since that tree belongs
    to one session.

The effective directory follows a leading `cd <path>` and a `git -C <path>`,
tracked segment by segment across the whole command.

Why this exists

`rm -rf` sat on the permission ask list, so every scratch cleanup prompted,
and a prompt that fires for routine work trains its user to approve without
reading. A prompt is the wrong tool for a shape that has a right answer:
inside the repository or a scratch directory, a recursive delete is the
caller's own business, and outside them it is never wanted from a session.
The git shapes are the ones that destroy another session's work or the
shared history, and none of them has a legitimate use from an agent.

Why a refusal rather than an ask

Each shape here is one the owner never wants approved from a session. An
ask would put the decision back on the owner for a case that has no yes
answer, and the refusal says why in one paragraph.

What stays out of scope

A command reached through `sh -c`, `eval`, `xargs`, `find -delete` or a
script is not read. A glob is judged by its literal prefix, so `rm -rf
./build/*` is judged as `./build`. A `git` verb other than the four above
is not judged here.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hooklib  # noqa: E402

GIT_GLOBAL_VALUE_OPTS = {"-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"}
PROTECTED_BRANCHES = {"main", "master"}


def allowed_roots(effective_dir: str) -> list[str]:
    roots: list[str] = []
    top = hooklib.outermost_toplevel(effective_dir)
    if top:
        roots.append(os.path.realpath(top))
    for env_name in ("TMPDIR", "CLAUDE_JOB_DIR", "CLAUDE_SCRATCHPAD_DIR"):
        value = os.environ.get(env_name)
        if value:
            roots.append(os.path.realpath(value))
    roots.append(os.path.realpath("/tmp"))
    return roots


def rm_is_recursive(args: list[str]) -> bool:
    for a in args:
        if a == "--recursive":
            return True
        if a.startswith("-") and not a.startswith("--") and ("r" in a[1:] or "R" in a[1:]):
            return True
    return False


def expand_target(target: str) -> str | None:
    """The target with `~` and any environment variable expanded, or None
    when a variable is left that this process cannot expand."""
    expanded = os.path.expanduser(os.path.expandvars(target))
    if "$" in expanded:
        return None
    return expanded


def judge_rm(args: list[str], effective_dir: str) -> str | None:
    """A reason to refuse this `rm`, or None."""
    if not rm_is_recursive(args):
        return None
    targets = [a for a in args if not a.startswith("-") or a == "-"]
    if not targets:
        return None
    roots = allowed_roots(effective_dir)
    for raw in targets:
        expanded = expand_target(raw)
        if expanded is None:
            return f"the target `{raw}` carries a variable this hook cannot expand, so it cannot be vouched for"
        literal = re.split(r"[*?\[]", expanded, maxsplit=1)[0]
        path = hooklib.resolve_relative(effective_dir, literal) if literal else effective_dir
        real = os.path.realpath(path)
        if real == "/" or real == os.path.realpath(os.path.expanduser("~")):
            return f"the target `{raw}` is `{real}`"
        parts = real.split(os.sep)
        if ".git" in parts:
            return f"the target `{raw}` is or sits inside a `.git` directory"
        under = None
        for root in roots:
            if real == root:
                return f"the target `{raw}` is the allowed root `{root}` itself"
            if real.startswith(root + os.sep):
                under = root
                break
        if under is None:
            return f"the target `{raw}` resolves to `{real}`, outside the repository and the scratch directories"
    return None


def git_subcommand(tokens: list[str]) -> tuple[str | None, list[str], str | None]:
    """(subcommand, args, -C directory) for a git invocation."""
    i = 1
    n = len(tokens)
    c_dir = None
    while i < n:
        tok = tokens[i]
        if tok == "-C" and i + 1 < n:
            c_dir = tokens[i + 1]
            i += 2
            continue
        if tok in GIT_GLOBAL_VALUE_OPTS:
            i += 2
            continue
        if tok.startswith("-"):
            i += 1
            continue
        return tok, tokens[i + 1:], c_dir
    return None, [], c_dir


def judge_git(tokens: list[str], effective_dir: str) -> str | None:
    sub, args, c_dir = git_subcommand(tokens)
    if sub is None:
        return None
    invocation_dir = hooklib.resolve_relative(effective_dir, c_dir) if c_dir else effective_dir

    if sub == "push":
        for a in args:
            if a in ("--force", "-f") or (a.startswith("-") and not a.startswith("--") and "f" in a[1:]):
                return "`git push --force` overwrites history another session may hold; use `--force-with-lease`"
        positional = [a for a in args if not a.startswith("-")]
        if "--delete" in args or "-d" in args:
            for a in positional[1:]:
                if a in PROTECTED_BRANCHES:
                    return f"`git push --delete {a}` removes the default branch"
        for a in positional:
            if a.startswith(":") and a[1:] in PROTECTED_BRANCHES:
                return f"the refspec `{a}` deletes the default branch"
        return None

    if sub == "branch":
        if any(a in ("-d", "-D", "--delete") or (a.startswith("-") and not a.startswith("--") and ("d" in a[1:] or "D" in a[1:])) for a in args):
            for a in args:
                if a in PROTECTED_BRANCHES:
                    return f"`git branch -D {a}` removes the default branch locally"
        return None

    shared_verb = None
    if sub == "reset" and "--hard" in args:
        shared_verb = "git reset --hard"
    elif sub == "clean" and any(a.startswith("-") and not a.startswith("--") and "f" in a[1:] or a == "--force" for a in args):
        shared_verb = "git clean -f"
    elif sub == "checkout" and args[:2] == ["--", "."]:
        shared_verb = "git checkout -- ."
    if shared_verb is None:
        return None
    shared = hooklib.classify_shared(invocation_dir)
    if shared is True:
        return (
            f"`{shared_verb}` in the shared checkout discards what other sessions "
            "left there; enter your own worktree first (the EnterWorktree tool)"
        )
    return None


def main() -> int:
    payload = hooklib.read_payload()
    if payload is None:
        return 0
    command = hooklib.bash_command(payload)
    if command is None:
        return 0
    segments = hooklib.command_segments(command)
    if segments is None:
        return 0

    effective_dir = hooklib.payload_cwd(payload)
    for tokens in segments:
        if not tokens:
            continue
        head = tokens[0]
        if head == "cd":
            if len(tokens) == 1:
                effective_dir = os.path.expanduser("~")
            elif tokens[1] == "-":
                break
            else:
                effective_dir = hooklib.resolve_relative(effective_dir, tokens[1])
            continue
        reason = None
        if head == "rm":
            reason = judge_rm(tokens[1:], effective_dir)
        elif head == "git":
            reason = judge_git(tokens, effective_dir)
        if reason:
            sys.stderr.write(
                "destructive-guard hook: refused.\n\n"
                f"`{' '.join(tokens[:4])}`: {reason}.\n"
            )
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
