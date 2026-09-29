"""hooklib.py -- the pieces every PreToolUse and PostToolUse hook in this
directory needs to read a Bash command the way the shell will run it.

Usage:
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import hooklib

    payload = hooklib.read_payload()             # dict, or None when unreadable
    for tokens in hooklib.command_segments(cmd): # one token list per simple command
        ...

A hook judges the command text the harness hands it, so every hook faces the
same three problems: the text is several commands joined by `&&`, `|`, `;`
or a newline; each of those carries redirections and comments that are not
arguments; and the real command may sit behind a `NAME=value` assignment or a
wrapper such as `rtk`, `env` or `timeout`. This module answers those three
once, so a hook holds only its own judgement.

Why this is a module rather than a copy in each hook

`destructive-guard-hook.py` and `aws-guard-hook.py` both need the same
segment splitter and noise stripper, and a splitter that exists in two files
drifts in two directions: a quoting case fixed in one stays open in the
other. This module is that splitter, shared.

Why the splitter is hand-rolled

shlex treats a newline as whitespace, and a newline is a command boundary.
Tracking a `cd` across boundaries, or judging one `aws` call among several,
needs the boundary kept. The scan below keeps quote state so a `|` inside a
quoted argument is text rather than a pipe, and returns None when a quote
never closes, which is the one shape no hook can read confidently.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys

# A leading `NAME=value` assignment on a segment, which sits before any
# wrapper or the command itself.
ASSIGNMENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")

# Wrappers a command may sit behind. Each takes its own `-`-prefixed options
# before the real command; `timeout` and `nice` also take one value token.
SHELL_WRAPPERS = {"rtk", "command", "exec", "env", "time", "nice", "nohup", "builtin", "timeout", "stdbuf"}
WRAPPER_VALUE_FIRST = {"timeout"}  # `timeout 30 aws ...`: the duration is a value

# Shell keywords that open or close a compound command. A segment starting
# with one of these carries no command of its own to judge.
SHELL_KEYWORDS = {
    "if", "then", "elif", "else", "fi", "for", "while", "until", "do", "done",
    "case", "esac", "in", "select", "function", "{", "}", "!", "[[", "]]",
}

REDIRECT_BARE_RE = re.compile(r"^\d*(>>|<<<|<<|<|>|&>|>&)$")
REDIRECT_PREFIX_RE = re.compile(r"^\d*(>>|<<<|<<|<|>|&>|>&)")


def read_payload() -> dict | None:
    """The hook payload on stdin as a dict, or None when it is not JSON or
    not an object. A hook that cannot read its payload has nothing to judge
    and lets the call stand."""
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, TypeError, ValueError):
        return None
    return payload if isinstance(payload, dict) else None


def bash_command(payload: dict) -> str | None:
    """The Bash command text in a PreToolUse or PostToolUse payload, or None
    when the tool is not Bash or the command is absent or empty."""
    if payload.get("tool_name") != "Bash":
        return None
    tool_input = payload.get("tool_input")
    command = tool_input.get("command") if isinstance(tool_input, dict) else None
    if not isinstance(command, str) or not command.strip():
        return None
    return command


def payload_cwd(payload: dict) -> str:
    cwd = payload.get("cwd")
    if isinstance(cwd, str) and cwd:
        return cwd
    return os.getcwd()


def split_segments(command: str) -> list[tuple[str, str | None]] | None:
    """Split `command` into its simple-command pieces at every unquoted
    `&&`, `||`, `;`, `|`, newline, single `&`, `(` and `)`. Returns a list of
    (text, terminator) pairs, or None when a quote never closes."""
    segments: list[tuple[str, str | None]] = []
    buf: list[str] = []
    in_single = False
    in_double = False
    i, n = 0, len(command)
    while i < n:
        c = command[i]
        if in_single:
            buf.append(c)
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            buf.append(c)
            if c == "\\" and i + 1 < n:
                buf.append(command[i + 1])
                i += 2
                continue
            if c == '"':
                in_double = False
            i += 1
            continue
        if c == "'":
            in_single = True
            buf.append(c)
            i += 1
            continue
        if c == '"':
            in_double = True
            buf.append(c)
            i += 1
            continue
        if c == "\\" and i + 1 < n:
            buf.append(c)
            buf.append(command[i + 1])
            i += 2
            continue
        if c == "\n":
            segments.append(("".join(buf), "\n"))
            buf = []
            i += 1
            continue
        if command[i:i + 2] in ("&&", "||"):
            segments.append(("".join(buf), command[i:i + 2]))
            buf = []
            i += 2
            continue
        if c == "&" and (
            (buf and buf[-1] in "<>") or command[i + 1:i + 2] == ">"
        ):
            # `2>&1`, `>&2` and `&>file` are redirections, not a background
            # marker, so they stay inside their segment.
            buf.append(c)
            i += 1
            continue
        if c in (";", "|", "&", "(", ")"):
            segments.append(("".join(buf), c))
            buf = []
            i += 1
            continue
        buf.append(c)
        i += 1
    if in_single or in_double:
        return None
    segments.append(("".join(buf), None))
    return segments


def strip_shell_noise(tokens: list[str]) -> list[str]:
    """Drop redirections and a trailing comment from a segment's shlex-split
    tokens. A bare operator is dropped with the token after it; one carrying
    its target attached (`2>&1`, `>/dev/null`) is dropped alone."""
    cleaned: list[str] = []
    i, n = 0, len(tokens)
    while i < n:
        tok = tokens[i]
        if tok == "#" or tok.startswith("#"):
            break
        if REDIRECT_BARE_RE.fullmatch(tok):
            i += 2
            continue
        m = REDIRECT_PREFIX_RE.match(tok)
        if m and m.end() < len(tok):
            i += 1
            continue
        cleaned.append(tok)
        i += 1
    return cleaned


# Keywords that precede a command on the same line, as in `do aws ...` or
# `if test -f x`. They are dropped so the command behind them is judged.
LEADING_KEYWORDS = {"if", "elif", "while", "until", "then", "else", "do", "{", "!"}


def strip_prefix(tokens: list[str]) -> list[str]:
    """Drop leading shell keywords, `NAME=value` assignments and known
    wrappers, so the first token left is the command the shell will run.
    `env -u X` and `env NAME=value` forms are consumed with `env`;
    `timeout 30` consumes its duration. A segment that is only assignments
    or keywords comes back empty."""
    i, n = 0, len(tokens)
    while i < n:
        tok = tokens[i]
        if tok in LEADING_KEYWORDS or ASSIGNMENT_RE.match(tok):
            i += 1
            continue
        if tok in SHELL_WRAPPERS:
            i += 1
            if tok in WRAPPER_VALUE_FIRST and i < n and not tokens[i].startswith("-"):
                i += 1
            while i < n and tokens[i].startswith("-"):
                if tok == "env" and tokens[i] in ("-u", "--unset") and i + 1 < n:
                    i += 2
                    continue
                if tok == "timeout" and tokens[i] in ("-s", "--signal", "-k", "--kill-after") and i + 1 < n:
                    i += 2
                    continue
                i += 1
            if tok == "timeout" and i < n and re.fullmatch(r"\d+(\.\d+)?[smhd]?", tokens[i]):
                i += 1
            continue
        break
    return tokens[i:]


def command_segments(command: str) -> list[list[str]] | None:
    """Every simple command in `command` as a cleaned token list with its
    assignments and wrappers stripped, in order. Empty segments are kept as
    empty lists so a caller can still count positions. None when the text
    cannot be split or tokenised."""
    segments = split_segments(command)
    if segments is None:
        return None
    out: list[list[str]] = []
    for text, _terminator in segments:
        try:
            tokens = shlex.split(text)
        except ValueError:
            return None
        out.append(strip_prefix(strip_shell_noise(tokens)))
    return out


def resolve_relative(base: str, path: str) -> str:
    """Resolve `path` against `base` the way a shell `cd` would: unchanged
    when already absolute, joined and normalised otherwise."""
    if os.path.isabs(path):
        return path
    return os.path.normpath(os.path.join(base, path))


def scripts_dir() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def repo_root() -> str:
    """The repository root: the parent of the `.claude/` directory this
    module's own hooks/ lives under."""
    return os.path.dirname(os.path.dirname(scripts_dir()))


def git(args: list[str], cwd: str) -> subprocess.CompletedProcess | None:
    try:
        return subprocess.run(["git", "-C", cwd] + args, capture_output=True, text=True)
    except OSError:
        return None


def outermost_toplevel(dir_path: str) -> str | None:
    """The top-level directory of the outermost repository containing
    `dir_path`, climbing out of any submodule, or None when it is not inside
    a repository."""
    if not os.path.isdir(dir_path):
        return None
    d = dir_path
    while True:
        r = git(["rev-parse", "--show-superproject-working-tree"], d)
        if r is None or r.returncode != 0:
            break
        out = r.stdout.strip()
        if not out:
            break
        d = out
    top = git(["rev-parse", "--show-toplevel"], d)
    if top is None or top.returncode != 0:
        return None
    return top.stdout.strip()


def classify_shared(dir_path: str) -> bool | None:
    """True when `dir_path` sits in the shared checkout (the main worktree
    of its outermost repository), False in a linked worktree, None when this
    cannot be told."""
    toplevel = outermost_toplevel(dir_path)
    if toplevel is None:
        return None
    gd = git(["rev-parse", "--git-dir"], toplevel)
    gcd = git(["rev-parse", "--git-common-dir"], toplevel)
    if gd is None or gd.returncode != 0 or gcd is None or gcd.returncode != 0:
        return None
    git_dir_abs = os.path.realpath(os.path.join(toplevel, gd.stdout.strip()))
    git_common_dir_abs = os.path.realpath(os.path.join(toplevel, gcd.stdout.strip()))
    return git_dir_abs == git_common_dir_abs


def emit_decision(event: str, decision: str | None, reason: str | None = None,
                  additional_context: str | None = None) -> None:
    """Print the JSON the harness reads for a hook decision. `decision` is
    "allow", "ask" or None; `additional_context` rides along either way."""
    specific: dict[str, str] = {"hookEventName": event}
    if decision:
        specific["permissionDecision"] = decision
        if reason:
            specific["permissionDecisionReason"] = reason
    if additional_context:
        specific["additionalContext"] = additional_context
    sys.stdout.write(json.dumps({"hookSpecificOutput": specific}))
    sys.stdout.write("\n")
