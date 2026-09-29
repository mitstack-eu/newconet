#!/usr/bin/env python3
"""rtk-proxy-hook.py -- ask the permission question again about a command
carried inside `rtk proxy`, before that command runs.

Usage:
    python3 .claude/hooks/rtk-proxy-hook.py   # reads a PreToolUse payload on stdin

It is wired to the Bash matcher in .claude/settings.json. The payload is the
standard PreToolUse JSON:
{"tool_name": ..., "tool_input": {"command": ...}}. Only a line that carries
an `rtk proxy` or `rtk run` payload is judged; every other command, and every
line whose shape cannot be read, is passed through untouched.

A carried command matching a `Bash(...)` entry of permissions.deny exits 2,
which refuses the call. One matching permissions.ask prints a PreToolUse ask
decision on stdout and exits 0. Everything else exits 0 in silence.

Env:
    RTK_PROXY_HOOK_SETTINGS -- a colon-separated list of settings files read
        INSTEAD of the defaults. This is the test seam, judging fixture rules
        rather than whatever the machine's own settings happen to hold. Unset,
        the defaults are .claude/settings.json and .claude/settings.local.json
        resolved next to this file, then ~/.claude/settings.json.

Why this exists

.claude/settings.local.json allows `Bash(rtk proxy *)`, and `rtk proxy` runs
a raw command with no filtering, which is what the subcommand documents
itself as doing. A permission rule matches a prefix, so `rtk proxy` followed
by anything matches that allow entry, and a command handed over as a single
quoted argument is never inspected by the permission layer at all. That makes
`rtk proxy sudo rm -rf /` allowed while `Bash(sudo*)` sits on the deny list,
and it re-opens every narrowing the deny and ask lists made. The allow entry
cannot be removed: it has over nine thousand recorded invocations, and a
permission set that prompts constantly trains its user to approve without
reading. So the check is wrapped around the tool instead.

Why the check is not configured in rtk itself

rtk 0.42.3 has no allow list, no deny list and no policy mode. The only
configuration it carries that touches commands is `[hooks] exclude_commands`
and `transparent_prefixes`, which decide which commands its rewrite hook
rewrites rather than whether a proxied command may run. `rtk proxy --help`
describes the subcommand as executing a command without filtering, and
`rtk run --help` as executing one via `sh -c` with no filtering or tracking.
There is nothing in the tool to configure, which is why this lives outside it.

Why a deny is an exit code and an ask is JSON

Exit 2 is the guaranteed block, so a refusal can never degrade into an allow
through a harness that does not read this hook's stdout. An ask has the
opposite failure shape: expressed as a JSON decision, a harness that ignores
it degrades to today's behaviour, where the call was allowed outright. Each
verdict is carried by the channel whose failure mode is the safe one.

Why it only escalates, and never grants

Only permissions.deny and permissions.ask are read. This hook can turn a
proxy-allowed invocation into a prompt or a refusal; it never consults the
allow list and never approves anything, so it cannot widen what is permitted.

Why an unreadable shape is passed through

A line this hook cannot tokenise, a settings file it cannot parse, a settings
path that does not exist and a line past the length cap all end in exit 0.
A hook that blocks legitimate work gets switched off, and then it protects
nothing, so degrading is the rule throughout this file. The case that
matters most is `rtk proxy grep -iE "operator init|ssh|console"`, whose pipe
and whose `ssh` are inside a quoted argument. Text is therefore never split on
`|`, `&&` or `;` -- the scanner below tracks quote state and segments at the
token level, because splitting the raw string is exactly what refuses that
line.

Why the spelling of a line may not change the verdict

Five pieces of shell syntax are removed or resolved by the shell before the
command it carries ever runs, so none of them may decide whether that command
is judged. A payload written as one quoted token is a command string, and
`rtk proxy 'sudo id'` really does run sudo; the `$'...'` spelling is the same
single token with its escapes interpreted, so it is decoded rather than read
literally. A grouping token and a reserved word both leave the next word in
command position, so `then rtk proxy ...` carries a payload. A redirection
written before the command never reaches rtk's argv, and that includes `&>`
and `&>>`, each of which is one operator rather than an `&` followed by a `>`.
A trailing comment is not part of the command, and an apostrophe in one used
to make the whole line untokenisable, which is a one-character bypass. A
wrapper named below hands its trailing words on as a command, so a payload's
first word is not always the command that runs.

Each of these is read here the way the shell reads it, and the reserved-word
rule holds only where a command may begin: in an argument list `then` is an
ordinary word, so `echo then rtk proxy sudo id` runs nothing but echo. The
same position rule governs the wrappers, so `rtk proxy grep -n env file`
carries no env.

What this hook does not read

Six shapes can carry a command past this hook. Each is a boundary decided
on rather than a gap nobody noticed, and each is stated here so the next
reader judges it again on purpose.

A heredoc is read as though it were ordinary shell, because the tokeniser has
no heredoc rule at all, and that cuts both ways. A body that leaves a quote
unbalanced makes the whole line unreadable, so it yields no payload and is
passed through. A body that tokenises cleanly has its own lines judged as
commands, so a heredoc that quotes a proxied command is refused even though the
shell never runs that text as a command. The second direction is a false
positive, and it is recorded here as known rather than unnoticed: a control
that reports the half of its own misbehaviour that fails safe and stays silent
about the other half is the shape this section exists to prevent.

A spelling that splits a command name is read as written. `rtk proxy s""udo
id` really does run sudo, and nothing here sees it -- but `Bash(sudo*)` in the
permission layer does not see `s""udo id` either, with no rtk anywhere in the
line. Reading it here would not make the control stronger than the layer that
owns the question; it would only make this hook the single place the shape is
judged, which is the wrong place for it to live.

A wrapper the named set does not hold still hides its argument. The set is
`env`, `command`, `nohup`, `nice`, `timeout` and `xargs`, chosen because those
are the ones reached for by hand, and it is deliberately small and named
rather than guessed at, because a list that tries to cover every runner is a
list nobody can keep true. `setsid`, `stdbuf` and every other program that
takes a trailing command are not read at all.

Inside that set, the options are read and two option value shapes are not. The
scan walks past options, past `--`, and past a value carrying no lower-case
letter, so `env -u FOO sudo id` and `timeout -s KILL 5 sudo id` are both read
down to the sudo they run. A value spelled the way an executable is spelled
cannot be told from the command by shape, so `xargs -a list.txt sudo id` stops
the scan at the file operand and hands `list.txt` on as the command it runs,
and the sudo behind it is never read.

The second shape is that same value written as one word with its flag, and it
is the more dangerous of the two. An option-shaped token is walked past whole,
so nothing inside it is read at all. GNU `env -S` splits its argument and runs
the result, which makes the text inside the flag a command line rather than a
value that merely resembles one, and the attached spelling is the ordinary way
that flag is written. So `env -S'sudo id'`, `env -Ssudo id` and
`env --split-string='sudo id'` each run sudo and each pass through in silence.
Reading either shape needs per-option knowledge of which flags take a value,
and that enumeration is what the shape rule above was chosen over, because a
table naming every option of every wrapper goes stale the first time one of
those programs grows a flag. A follow-up ticket carries both.

A backslash-escaped quote inside an ANSI-C body leaves the whole line
unreadable. bash reads `$'a\\'b'` as the single token `a'b`, while the tokeniser
here reads a single-quoted run the way an ordinary one behaves, where a
backslash is not an escape. The run ends at that quote, the trailing one is
unbalanced, and the line yields no payload. Teaching the single-quote scan a
backslash rule that every other line must not have would change how this hook
reads far more than it would close.

`\\UHHHHHHHH` is not decoded. `\\xHH`, `\\uHHHH` and both octal spellings are,
since they all name a character by its code and a decoder that claims one of
them and not its neighbours reaches different verdicts for the same character.
The eight-digit form is left because it was not confirmed against a real shell,
and this file only reads a spelling somebody has watched run.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import sys

# rtk's own options, which sit between the subcommand and the command it
# carries. Taken from `rtk proxy --help` / `rtk run --help` on 0.42.3.
EXECUTOR_OPTIONS = {"-v", "-vv", "-vvv", "--ultra-compact", "--skip-env"}
RUN_COMMAND_FLAGS = {"-c", "--command"}
RUN_COMMAND_PREFIX = "--command="

EXECUTOR_SUBCOMMANDS = {"proxy", "run"}
INTERPRETERS = {"bash", "sh", "zsh", "dash"}

# A program whose trailing words are themselves a command. `rtk proxy env sudo
# id` runs sudo, so a payload's first word is not always the command that runs.
# This is the same handing-on an interpreter's `-c` already gets read for, with
# less syntax around it. The set is small and named on purpose: see "What this
# hook does not read" above for why it is not a guess at every runner.
COMMAND_WRAPPERS = {"env", "command", "nohup", "nice", "timeout", "xargs"}

# The two options that make `command` describe a name instead of running it:
# `-v` prints where the name would be found and `-V` says the same in words.
# A payload carrying either runs nothing, so there is no command under it to
# hand on. `command -p` is absent because it selects a default PATH and then
# still executes the argument after it.
COMMAND_LOOKUP_FLAGS = {"-v", "-V"}

# Every wrapper in the set takes options of its own, and an option may sit
# between the wrapper and the command it hands on. The scan below is a rule
# about the SHAPE of a word rather than a list of the options each wrapper
# accepts, because a list covers only the spellings somebody thought of.
END_OF_OPTIONS = "--"

# A word that cannot be the command, because it carries no lower-case letter:
# `KILL`, `FOO`, `10`, `{}`. This is what tells an option's value from the
# command that follows it, an ambiguity no general rule can settle from syntax
# alone -- `-i grep` passes a command through while `-s KILL` passes a value.
# Executables are named in lower case in practice, so reading an upper-case or
# digit-only word as a value is right on the lines people actually write, and
# wrong in the direction this hook fails in everywhere else: it reads no
# command rather than the wrong one.
OPTION_VALUE_RE = re.compile(r"^[^a-z]+$")

# `timeout` takes a duration before the command it runs, and `env` takes any
# number of NAME=value assignments. These are facts about those two programs
# rather than option spellings, so they sit alongside the shape rule above.
DURATION_RE = re.compile(r"^\d+(?:\.\d+)?[smhd]?$")

# Longest first, so `&&` is never read as two `&` and `||` never as two `|`.
# The parentheses are here rather than among the words below because a
# subshell both opens a command position and closes the one before it, which
# is what keeps the `)` of `( rtk proxy sudo id )` out of the payload.
OPERATOR_STRINGS = ("&&", "||", ";;", ";", "|", "&", "(", ")", "\n")

# A word that leaves the NEXT word in command position, but only where a
# command may itself begin. Read unconditionally these would refuse `echo then
# rtk proxy sudo id`, a line the shell never executes a proxy on. `for` and
# `in` are absent because the word after each of them is a variable name or a
# list item rather than a command.
COMMAND_POSITION_WORDS = {
    "if", "then", "elif", "else", "while", "until", "do", "!", "time", "{",
}

ASSIGNMENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
DASH_C_RE = re.compile(r"^-[A-Za-z]*c$")
BASH_RULE_RE = re.compile(r"^Bash\((?P<pattern>.*)\)$", re.DOTALL)

# A redirection operator. The file-descriptor prefix is accepted only where a
# word begins, so the `2` of `2>&1` is read as a descriptor while the `2` of
# `abc2>x` stays part of the word the shell would run. Matching `>&`, `&>>` and
# `&>` whole is what keeps their `&` out of the operator table's hands, where it
# would end the payload halfway through the redirection and leave the command
# after it unjudged. The two ampersand-first forms lead the alternation, longer
# first, and neither can claim the `&` of `2>&1` or `>&2`, whose `&` never sits
# where a word begins.
REDIRECT_AT_WORD_START_RE = re.compile(r"&>>|&>|\d*(?:>>|>&|>\||<&|<>|[<>])")
REDIRECT_MID_WORD_RE = re.compile(r">>|>&|>\||<&|<>|[<>]")

# ANSI-C quoting. `$'sudo id'` is one argv element exactly as `'sudo id'` is,
# with backslash escapes interpreted, so the body is decoded before it is read
# as a command. The body may hold no bare `'`, which is what the tokeniser's
# own reading of a single-quoted run already assumes.
ANSI_C_QUOTED_RE = re.compile(r"^\$'([^']*)'$", re.DOTALL)

# What the decoder claims. An escape outside this set, and outside the numeric
# forms below, keeps its backslash, which is what bash does with it -- so
# `$'grep \q x'` carries a literal `\q`.
ANSI_C_ESCAPES = {
    "a": "\a", "b": "\b", "e": "\x1b", "E": "\x1b", "f": "\f", "n": "\n",
    "r": "\r", "t": "\t", "v": "\v", "\\": "\\", "'": "'", '"': '"', "?": "?",
}

# The numeric escapes, all three of which name a character by its code. `\xHH`
# is the newest of them and octal is the oldest, and a decoder that claims one
# and not the others reaches a different verdict for the same character
# depending on how it was written. `\0nnn` leads the octal alternation so its
# leading zero is consumed as part of the number rather than as a number of its
# own, which is what makes `\163` and `\0163` decode alike.
ANSI_C_HEX_RE = re.compile(r"[0-9A-Fa-f]{1,2}")
ANSI_C_UNICODE_RE = re.compile(r"[0-9A-Fa-f]{1,4}")
ANSI_C_OCTAL_RE = re.compile(r"0[0-7]{0,3}|[0-7]{1,3}")

# The characters whose presence in a word makes its quoting worth resolving.
QUOTING_CHARS = frozenset("'\"\\")

# An unwrapped command can carry another wrapper. The cap bounds a payload
# that nests into itself; it is not a limit anyone should reach in practice.
# It bounds how DEEP the expansion goes and nothing else -- how many times the
# same text is re-expanded is bounded separately, by the `seen` ledger that
# candidate_commands threads through the whole recursion.
MAX_UNWRAP_DEPTH = 8

# `"$("` nesting is read by two functions that call each other, so a line deep
# enough in it would exhaust the interpreter's stack and end this hook in a
# traceback rather than a verdict. Past this depth the line is reported as
# unreadable, which the callers already pass through.
MAX_SUBSTITUTION_NESTING = 64

# This hook runs before EVERY Bash call in the workspace, and the tokeniser
# runs before any early exit, so a line pays for its own scan whether or not it
# carries a proxy. The cap is 16 KiB because a hand-written command, heredoc
# script included, sits far below it, while a machine-generated line of nested
# quoting long enough to take longer than the call it guards sits far above.
# Past the cap the line is passed through, in line with every other shape this
# hook cannot read.
#
# The cap bounds how much text is read ONCE. It does not bound how many TIMES
# the same text is read, and those are two different quantities: a payload that
# nests into itself is reachable down many paths through the unwrap, and
# re-scanning each path is where the cost that was measured actually sat --
# 29.6 seconds on a 15112-character line eight levels deep, comfortably under
# this cap. The second quantity is bounded by the `seen` ledger and by
# MAX_UNWRAP_DEPTH, not here.
#
# There is deliberately no cheap `"rtk" in command` pre-check in front of the
# tokeniser: `"r"tk proxy sudo id` carries a proxy that the substring test
# cannot see, and the scan it would skip costs orders of magnitude less than
# starting the interpreter that runs it.
MAX_COMMAND_LENGTH = 16384


class Token:
    """One shell token, with the span it occupies in the line it came from.

    The span is what lets a payload be handed on as the author wrote it,
    quoting intact, rather than as a re-joined list of words.
    """

    __slots__ = ("text", "start", "end", "is_operator", "is_redirect")

    def __init__(self, text: str, start: int, end: int, is_operator: bool,
                 is_redirect: bool = False):
        self.text = text
        self.start = start
        self.end = end
        self.is_operator = is_operator
        self.is_redirect = is_redirect


def _operator_at(line: str, i: int) -> str | None:
    for op in OPERATOR_STRINGS:
        if line.startswith(op, i):
            return op
    return None


def _redirect_at(line: str, i: int, at_word_start: bool) -> str | None:
    pattern = REDIRECT_AT_WORD_START_RE if at_word_start else REDIRECT_MID_WORD_RE
    match = pattern.match(line, i)
    return match.group(0) if match else None


def _end_of_double_quote(line: str, start: int, depth: int = 0) -> int:
    """Index of the `"` closing the one opened at `start`, or -1."""
    if depth > MAX_SUBSTITUTION_NESTING:
        return -1
    i = start + 1
    n = len(line)
    while i < n:
        c = line[i]
        if c == "\\":
            i += 2
            continue
        if c == '"':
            return i
        if c == "$" and i + 1 < n and line[i + 1] == "(":
            j = _end_of_paren(line, i + 1, depth + 1)
            if j == -1:
                return -1
            i = j + 1
            continue
        if c == "`":
            j = line.find("`", i + 1)
            if j == -1:
                return -1
            i = j + 1
            continue
        i += 1
    return -1


def _end_of_paren(line: str, start: int, depth: int = 0) -> int:
    """Index of the `)` matching the `(` at `start`, or -1."""
    if depth > MAX_SUBSTITUTION_NESTING:
        return -1
    nesting = 0
    i = start
    n = len(line)
    while i < n:
        c = line[i]
        if c == "\\":
            i += 2
            continue
        if c == "'":
            j = line.find("'", i + 1)
            if j == -1:
                return -1
            i = j + 1
            continue
        if c == '"':
            j = _end_of_double_quote(line, i, depth + 1)
            if j == -1:
                return -1
            i = j + 1
            continue
        if c == "(":
            nesting += 1
        elif c == ")":
            nesting -= 1
            if nesting == 0:
                return i
        i += 1
    return -1


def tokenise(line: str) -> list[Token]:
    """Split a command line into words, operators and redirections, tracking
    quote state.

    Raises ValueError on unbalanced quoting or an unterminated substitution.
    A quoted run, a `$( )` and a backtick pair are each consumed whole before
    any operator is looked for, which is why an operator character inside an
    argument stays part of that argument. An unquoted `#` beginning a word
    ends the line, exactly as the shell ends it.
    """
    tokens: list[Token] = []
    i = 0
    n = len(line)
    word_start: int | None = None

    def close_word(end: int) -> None:
        nonlocal word_start
        if word_start is not None:
            tokens.append(Token(line[word_start:end], word_start, end, False))
            word_start = None

    while i < n:
        c = line[i]

        if c == "#" and word_start is None:
            break

        redirect = _redirect_at(line, i, word_start is None)
        if redirect is not None:
            close_word(i)
            tokens.append(Token(redirect, i, i + len(redirect), False, True))
            i += len(redirect)
            continue

        op = _operator_at(line, i)
        if op is not None:
            close_word(i)
            tokens.append(Token(op, i, i + len(op), True))
            i += len(op)
            continue

        if c in " \t\r":
            close_word(i)
            i += 1
            continue

        if word_start is None:
            word_start = i

        if c == "\\":
            if i + 1 >= n:
                raise ValueError("line ends in a backslash")
            i += 2
            continue
        if c == "'":
            j = line.find("'", i + 1)
            if j == -1:
                raise ValueError("unbalanced single quote")
            i = j + 1
            continue
        if c == '"':
            j = _end_of_double_quote(line, i)
            if j == -1:
                raise ValueError("unbalanced double quote")
            i = j + 1
            continue
        if c == "`":
            j = line.find("`", i + 1)
            if j == -1:
                raise ValueError("unbalanced backtick")
            i = j + 1
            continue
        if c == "$" and i + 1 < n and line[i + 1] == "(":
            j = _end_of_paren(line, i + 1)
            if j == -1:
                raise ValueError("unterminated command substitution")
            i = j + 1
            continue

        i += 1

    close_word(n)
    return tokens


def substitutions(line: str) -> list[str]:
    """The text inside every `$( )` and every backtick pair on the line.

    A substitution is a command position of its own, so a payload can hide in
    one. Single quotes suppress substitution and are skipped whole; double
    quotes do not, so scanning continues inside them.
    """
    found: list[str] = []
    i = 0
    n = len(line)
    in_double = False
    while i < n:
        c = line[i]
        if c == "\\":
            i += 2
            continue
        if c == "'" and not in_double:
            j = line.find("'", i + 1)
            if j == -1:
                break
            i = j + 1
            continue
        if c == '"':
            in_double = not in_double
            i += 1
            continue
        if c == "$" and i + 1 < n and line[i + 1] == "(":
            j = _end_of_paren(line, i + 1)
            if j == -1:
                break
            found.append(line[i + 2:j])
            i = j + 1
            continue
        if c == "`":
            j = line.find("`", i + 1)
            if j == -1:
                break
            found.append(line[i + 1:j])
            i = j + 1
            continue
        i += 1
    return found


def dequote(text: str) -> str:
    """The value a single token carries, with its quoting removed."""
    # shlex walks the string a character at a time in Python, and this is
    # called once per token, so a word carrying no quoting at all takes the
    # short way out. The two paths agree by construction: with no quote and no
    # backslash in the text, shlex either splits it into exactly itself or into
    # several parts, and both readings return the text unchanged.
    if not QUOTING_CHARS.intersection(text):
        return text
    try:
        parts = shlex.split(text)
    except ValueError:
        return text
    return parts[0] if len(parts) == 1 else text


def ansi_c_string(text: str) -> str | None:
    """The command an ANSI-C quoted token carries, decoded, or None.

    `$'sudo\\x20id'` is one argv element holding `sudo id`, so the escapes are
    interpreted rather than read literally -- interpreting them is the whole
    point of the spelling, and a literal reading judges a different string from
    the one that runs.
    """
    match = ANSI_C_QUOTED_RE.match(text)
    if match is None:
        return None
    body = match.group(1)
    out: list[str] = []
    i = 0
    n = len(body)
    while i < n:
        c = body[i]
        if c != "\\" or i + 1 >= n:
            out.append(c)
            i += 1
            continue
        nxt = body[i + 1]
        if nxt in ANSI_C_ESCAPES:
            out.append(ANSI_C_ESCAPES[nxt])
            i += 2
            continue
        if nxt == "x":
            hexits = ANSI_C_HEX_RE.match(body, i + 2)
            if hexits is not None:
                out.append(chr(int(hexits.group(0), 16)))
                i = hexits.end()
                continue
        if nxt == "u":
            hexits = ANSI_C_UNICODE_RE.match(body, i + 2)
            if hexits is not None:
                out.append(chr(int(hexits.group(0), 16)))
                i = hexits.end()
                continue
        octal = ANSI_C_OCTAL_RE.match(body, i + 1)
        if octal is not None:
            # Bash wraps a value past a byte, so `\400` is one character rather
            # than a code point out of range.
            out.append(chr(int(octal.group(0), 8) & 0xFF))
            i = octal.end()
            continue
        # An escape the decoder does not claim keeps its backslash, which is
        # what bash leaves behind for one it does not recognise.
        out.append(c)
        i += 1
    return "".join(out)


def _head(text: str) -> str:
    return os.path.basename(dequote(text))


def _command_words(tokens: list[Token]) -> list[Token]:
    """The words of a command with its redirections removed, the way the shell
    removes them before deciding what to run."""
    words: list[Token] = []
    drop_target = False
    for tok in tokens:
        if tok.is_operator:
            continue
        if tok.is_redirect:
            drop_target = True
            continue
        if drop_target:
            drop_target = False
            continue
        words.append(tok)
    return words


def _quoted_command_string(text: str, tokens: list[Token]) -> str | None:
    """The command a payload written as one quoted token carries, or None.

    `rtk proxy 'sudo id'` hands the shell a single argument, which the shell
    then reads as a command line, so the quoting is syntax rather than an
    argument boundary. The `$'...'` spelling is the same single argument with
    its escapes interpreted, and it is unwrapped here for the same reason.

    The whole payload must be that one token. A quoted word sitting in an
    argument list is an argument, so `rtk proxy grep -rn $'sudo' scripts/`
    carries no sudo.
    """
    if len(tokens) != 1:
        return None
    token = tokens[0]
    if token.is_operator or token.is_redirect or token.text != text:
        return None
    decoded = ansi_c_string(token.text)
    unwrapped = (decoded if decoded is not None else dequote(token.text)).strip()
    if not unwrapped or unwrapped == token.text:
        return None
    return unwrapped


def _segment_bounds(tokens: list[Token]) -> list[tuple[int, int]]:
    """Token index ranges between operators, as [start, end) pairs."""
    bounds: list[tuple[int, int]] = []
    start: int | None = None
    for idx, tok in enumerate(tokens):
        if tok.is_operator:
            if start is not None:
                bounds.append((start, idx))
                start = None
        elif start is None:
            start = idx
    if start is not None:
        bounds.append((start, len(tokens)))
    return bounds


def _read_payload(line: str, tokens: list[Token], first: int, subcommand: str) -> tuple[str | None, int]:
    """Return (payload, index after the segment) for an executor invocation.

    `first` is the token index just past `rtk proxy` / `rtk run`. The payload
    runs to the end of the segment, which is where the first unquoted
    operator sits. A redirection before the command is skipped with its
    target, because the shell removes both before rtk sees its argv.
    """
    n = len(tokens)
    seg_end = first
    while seg_end < n and not tokens[seg_end].is_operator:
        seg_end += 1

    k = first
    while k < seg_end:
        if tokens[k].is_redirect:
            k += 1
            if k < seg_end and not tokens[k].is_redirect:
                k += 1
            continue
        word = dequote(tokens[k].text)
        if word in EXECUTOR_OPTIONS:
            k += 1
            continue
        if subcommand == "run":
            if word in RUN_COMMAND_FLAGS:
                value = dequote(tokens[k + 1].text) if k + 1 < seg_end else None
                return value, seg_end
            if word.startswith(RUN_COMMAND_PREFIX):
                return word[len(RUN_COMMAND_PREFIX):], seg_end
        break

    if k >= seg_end:
        return None, seg_end
    return line[tokens[k].start:tokens[seg_end - 1].end], seg_end


def proxied_payloads(command: str, depth: int = 0) -> list[str]:
    """Every command string carried by an `rtk proxy` or `rtk run` on the line.

    The text is returned as written, so quoting survives for the caller to
    take apart. A line that cannot be tokenised yields nothing at all, which
    the caller reads as "no judgement to make" rather than as "allowed".
    """
    if not isinstance(command, str) or not command.strip():
        return []
    if len(command) > MAX_COMMAND_LENGTH:
        return []
    try:
        tokens = tokenise(command)
    except ValueError:
        return []

    payloads: list[str] = []
    i = 0
    n = len(tokens)
    at_command = True
    while i < n:
        tok = tokens[i]
        if tok.is_operator:
            at_command = True
            i += 1
            continue
        if tok.is_redirect:
            # A redirection and its target stand outside the command, so
            # neither ends a command position nor begins one.
            i += 1
            if i < n and not tokens[i].is_operator and not tokens[i].is_redirect:
                i += 1
            continue
        if not at_command:
            i += 1
            continue
        if ASSIGNMENT_RE.match(tok.text):
            # A leading assignment keeps the next word in command position.
            i += 1
            continue

        following = tokens[i + 1] if i + 1 < n else None
        if (
            _head(tok.text) == "rtk"
            and following is not None
            and not following.is_operator
            and dequote(following.text) in EXECUTOR_SUBCOMMANDS
        ):
            payload, i = _read_payload(command, tokens, i + 2, dequote(following.text))
            if payload and payload.strip():
                payloads.append(payload)
            at_command = False
            continue

        if tok.text in COMMAND_POSITION_WORDS:
            i += 1
            continue

        at_command = False
        i += 1

    if depth < MAX_UNWRAP_DEPTH:
        for inner in substitutions(command):
            payloads.extend(proxied_payloads(inner, depth + 1))
    return payloads


def _wrapper_command_index(head: str, words: list[Token]) -> int | None:
    """Index of the word a wrapper hands the command on at, or None when it
    has no trailing command and so runs nothing of its own.

    The scan walks forward over everything that cannot be the command -- an
    option, an option's value, and the operands `env` and `timeout` take -- and
    stops at the first word that can be. `--` ends the scan outright: whatever
    follows it is the command however it is spelled, and nothing following it
    means the wrapper runs no command at all.

    One flag ends the scan with no index at all. A `command` lookup flag makes
    the wrapper describe the name after it rather than run it, so the words
    behind that flag are an operand and never a command.
    """
    idx = 1
    n = len(words)
    while idx < n:
        word = dequote(words[idx].text)
        if word == END_OF_OPTIONS:
            idx += 1
            break
        if head == "command" and word in COMMAND_LOOKUP_FLAGS:
            return None
        if word.startswith("-") or OPTION_VALUE_RE.match(word):
            idx += 1
            continue
        if head == "env" and ASSIGNMENT_RE.match(word):
            idx += 1
            continue
        if head == "timeout" and DURATION_RE.match(word):
            idx += 1
            continue
        break
    return idx if idx < n else None


def _unwrap_segment(segment: str, depth: int, seen: dict[str, int]) -> list[str]:
    """Commands a segment hands to something else: an interpreter's `-c`
    argument, the trailing words a wrapper runs, or a further executor
    invocation nested inside it.

    `depth` is the caller's own unwrap depth and is threaded onward rather
    than restarted, so a payload nested into itself is bounded by one budget
    across the whole expansion instead of one per nesting level.
    """
    try:
        tokens = tokenise(segment)
    except ValueError:
        return []
    words = _command_words(tokens)
    if not words:
        return []

    head = _head(words[0].text)
    if head in INTERPRETERS:
        for idx in range(1, len(words)):
            if DASH_C_RE.match(dequote(words[idx].text)) and idx + 1 < len(words):
                return candidate_commands(dequote(words[idx + 1].text), depth + 1, seen)
        return []
    if head in COMMAND_WRAPPERS:
        idx = _wrapper_command_index(head, words)
        if idx is None:
            return []
        carried = segment[words[idx].start:words[-1].end]
        return candidate_commands(carried, depth + 1, seen)
    if head == "rtk":
        found: list[str] = []
        for inner in proxied_payloads(segment, depth):
            found.extend(candidate_commands(inner, depth + 1, seen))
        return found
    return []


def candidate_commands(payload: str, depth: int = 0,
                       seen: dict[str, int] | None = None) -> list[str]:
    """Every command a payload would actually run, ordered outermost first.

    That is the payload itself, the command it carries when it is written as
    one quoted token, each of its top-level segments, and whatever an
    interpreter, a wrapper or a nested executor inside it would go on to run.
    A shape that cannot be read contributes what was read so far rather than
    raising.

    `seen` maps a text to the shallowest depth it has already been expanded
    at, and is threaded through the whole recursion so the same text is not
    re-expanded down every path that reaches it. Every result funnels back
    into one accumulator, so nothing is lost by expanding a text once; a text
    reached again at a SHALLOWER depth is expanded again, because the depth
    cap would otherwise have cut its first expansion short.
    """
    if not isinstance(payload, str):
        return []
    text = payload.strip()
    if not text or len(text) > MAX_COMMAND_LENGTH:
        return []
    if seen is None:
        seen = {}
    already = seen.get(text)
    if already is not None and already <= depth:
        return [text]
    seen[text] = depth

    found = [text]
    if depth >= MAX_UNWRAP_DEPTH:
        return found

    try:
        tokens = tokenise(text)
    except ValueError:
        return found

    unwrapped = _quoted_command_string(text, tokens)
    if unwrapped is not None:
        found.extend(candidate_commands(unwrapped, depth + 1, seen))

    for start, end in _segment_bounds(tokens):
        segment = text[tokens[start].start:tokens[end - 1].end]
        found.append(segment)
        found.extend(_unwrap_segment(segment, depth, seen))

    for inner in substitutions(text):
        found.extend(candidate_commands(inner, depth + 1, seen))

    ordered: list[str] = []
    for item in found:
        cleaned = item.strip()
        if cleaned and cleaned not in ordered:
            ordered.append(cleaned)
    return ordered


def _read_settings(path: str) -> dict | None:
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def load_rules(paths: list[str]) -> tuple[list[str], list[str]]:
    """The Bash patterns of permissions.deny and permissions.ask, merged
    across `paths` in order, de-duplicated, first occurrence winning.

    A missing or unparseable file contributes nothing. An entry for another
    tool, such as `Read(./.env)`, is not a command pattern and is dropped.
    """
    deny: list[str] = []
    ask: list[str] = []
    for path in paths:
        data = _read_settings(path)
        if data is None:
            continue
        permissions = data.get("permissions")
        if not isinstance(permissions, dict):
            continue
        for field, target in (("deny", deny), ("ask", ask)):
            entries = permissions.get(field)
            if not isinstance(entries, list):
                continue
            for entry in entries:
                if not isinstance(entry, str):
                    continue
                match = BASH_RULE_RE.match(entry.strip())
                if not match:
                    continue
                pattern = match.group("pattern")
                if pattern and pattern not in target:
                    target.append(pattern)
    return deny, ask


def matches(pattern: str, command: str) -> bool:
    """Whether a permission pattern covers a command. `*` stands for any run
    of characters and every other character is literal, anchored both ends --
    the same shape the permission layer itself applies."""
    if not isinstance(pattern, str) or not isinstance(command, str):
        return False
    regex = "".join(".*" if ch == "*" else re.escape(ch) for ch in pattern)
    return re.fullmatch(regex, command.strip(), re.DOTALL) is not None


def judge(command: str, deny: list[str], ask: list[str]) -> tuple[str | None, str | None, str | None]:
    """Return (decision, rule, matched command) for a whole Bash line.

    Deny is evaluated across every candidate on the line before ask is
    considered at all, so a line carrying both is refused rather than
    prompted for.

    The `seen` ledger is shared across every payload on the line, not made
    afresh per payload: two payloads that expand into the same text expand it
    once between them, and the candidate list they build is the same either
    way because it is de-duplicated here regardless.
    """
    candidates: list[str] = []
    seen: dict[str, int] = {}
    for payload in proxied_payloads(command):
        for candidate in candidate_commands(payload, 0, seen):
            if candidate not in candidates:
                candidates.append(candidate)

    for patterns, decision in ((deny, "deny"), (ask, "ask")):
        for candidate in candidates:
            for pattern in patterns:
                if matches(pattern, candidate):
                    return decision, pattern, candidate
    return None, None, None


def settings_paths() -> list[str]:
    override = os.environ.get("RTK_PROXY_HOOK_SETTINGS")
    if override:
        return [p for p in override.split(":") if p]
    here = os.path.dirname(os.path.abspath(__file__))
    repo = os.path.dirname(os.path.dirname(here))
    return [
        os.path.join(repo, ".claude", "settings.json"),
        os.path.join(repo, ".claude", "settings.local.json"),
        os.path.expanduser("~/.claude/settings.json"),
    ]


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return 0

    if not isinstance(payload, dict) or payload.get("tool_name") != "Bash":
        return 0

    tool_input = payload.get("tool_input") or {}
    command = tool_input.get("command") if isinstance(tool_input, dict) else None
    if not isinstance(command, str) or not command.strip():
        return 0

    if len(command) > MAX_COMMAND_LENGTH:
        sys.stderr.write(
            "rtk-proxy hook: the command is longer than "
            f"{MAX_COMMAND_LENGTH} characters, so it was not read for a "
            "proxied command.\n"
        )
        return 0

    if not proxied_payloads(command):
        return 0

    paths = settings_paths()
    if not any(_read_settings(path) is not None for path in paths):
        sys.stderr.write(
            "rtk-proxy hook: no readable permission settings at "
            f"{', '.join(paths)}, so the proxied command was not checked.\n"
        )
        return 0

    deny, ask = load_rules(paths)
    decision, rule, matched = judge(command, deny, ask)

    if decision == "deny":
        # The message names what was refused and why, and stops there. It is
        # read by an agent optimising for task completion, so any route it
        # names is a next action that moves the denied command closer to
        # running -- and the route through the settings is the worst of them,
        # because it defeats the control for every call that follows rather
        # than for this one.
        sys.stderr.write(
            "This call reaches a denied command through rtk, which runs it "
            "unfiltered.\n\n"
            f"  command: {matched}\n"
            f"  rule:    Bash({rule})\n\n"
            "The permission settings refuse this command however it is "
            "reached, and what they say is the owner's decision rather than "
            "this session's. Re-issuing it through another wrapper is the "
            "same denied call.\n"
        )
        return 2

    if decision == "ask":
        reason = (
            f"rtk would run `{matched}` unfiltered, which the permission "
            f"settings mark as ask under Bash({rule})."
        )
        sys.stdout.write(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": reason,
            }
        }) + "\n")
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
