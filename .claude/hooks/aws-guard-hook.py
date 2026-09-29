#!/usr/bin/env python3
"""aws-guard-hook.py -- decide, before it runs, whether a Bash call reads
AWS, changes AWS infrastructure, or applies infrastructure locally.

Usage:
    python3 .claude/hooks/aws-guard-hook.py   # reads a PreToolUse payload on stdin

It is wired to the Bash matcher in .claude/settings.json. The payload is the
standard PreToolUse JSON: {"tool_name": ..., "tool_input": {"command": ...}}.
Every simple command in the call is judged, whether it stands alone or sits
behind `rtk`, `env`, `timeout` or a `NAME=value` assignment.

The verdicts, strongest first:

  refuse  exit 2, reason on stderr. A local `tofu` or `terraform` apply,
          destroy, import, taint or state rewrite. The branching rule says an
          apply never runs locally, so this is a refusal rather than a prompt.
  ask     exit 0, an "ask" decision on stdout naming the change. Any `aws`
          verb that is not read-only, `aws ssm send-command`, a dispatch of
          a workflow that changes infrastructure, and `aws-power.yml` with
          power set to off.
  allow   exit 0, an "allow" decision on stdout. Every segment is a
          read-only `aws` verb, a read-only `tofu` verb, a pure text filter,
          or shell glue, and at least one is an AWS read. The permission
          prompt is skipped outright.
  silent  exit 0, nothing on stdout. No segment names AWS, or an AWS read
          shares the call with a command this hook does not know, which the
          ordinary permission rules then judge.

Env:
    AWS_GUARD_HOOK_INFRA_WORKFLOWS -- a space-separated list of workflow file
        names whose dispatch asks, replacing the built-in list. A test seam.

Why this exists

The owner approves exactly one kind of action, a change to AWS
infrastructure, and never a read. A permission rule matches a prefix, so it
cannot say "every aws verb except the reads", and an ask rule beats an allow
rule, so the two lists cannot express the split either. The auto-mode
classifier can, but by judgement rather than by rule, and it prompted for
`aws iam get-role`. This hook makes the split a table, so the same command
gets the same answer every time.

Why an allow needs every segment to be known

An "allow" decision skips the permission layer for the whole tool call, not
for one segment of it. `aws sts get-caller-identity && rm -rf ~` would ride
through on the read. So the allow is emitted only when every segment is one
this hook can vouch for; anything else leaves the decision to the ordinary
rules, which still see the whole command.

Why a read of a secret is a read

`aws ssm get-parameter --with-decryption` and `aws secretsmanager
get-secret-value` return a value and change nothing, so they allow. The
owner's rule is that reads never prompt, and the deny list on `.env` files
already draws the line at what the model may read from disk.

Why an ask is JSON and a refusal is an exit code

Exit 2 is the guaranteed block, so a refusal can never degrade into an allow
through a harness that does not read stdout. An ask expressed as JSON
degrades, in a harness that ignores it, to the ordinary permission rules,
which is the safe direction. Each verdict rides the channel whose failure
mode is the harmless one.

What stays out of scope

A command reached through `sh -c`, `eval`, `xargs` or a script is not read.
An unexpanded variable in the service or verb position, as in `aws $svc
describe-x`, cannot be classified and leaves the call to the ordinary rules.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hooklib  # noqa: E402

READ_VERB_PREFIXES = (
    "describe-", "list-", "get-", "head-", "search-", "lookup-", "batch-get-",
    "select-", "check-", "estimate-", "validate-", "simulate-", "preview-",
    "query", "scan", "wait", "generate-presigned-url", "filter-log-events",
    "tail", "help", "start-query", "start-live-tail", "stop-query", "get",
    "test-invoke-", "ls", "presign", "export-credentials",
)

# `aws <service> <verb>` pairs that are reads or local-only configuration and
# whose verb is not caught by a prefix above.
READ_PAIRS = {
    ("sts", "assume-role"),
    ("sts", "assume-role-with-web-identity"),
    ("sts", "decode-authorization-message"),
    ("configure", "list"),
    ("configure", "get"),
    ("configure", "list-profiles"),
    ("configure", "set"),
    ("configure", "import"),
    ("sso", "login"),
    ("sso", "logout"),
    ("ecr", "get-login-password"),
    ("ecr-public", "get-login-password"),
    ("eks", "update-kubeconfig"),
    ("cloudformation", "validate-template"),
    ("ce", "get-cost-and-usage"),
}

# Verbs that a read prefix would match but that change something.
NOT_READ = {
    ("s3", "mb"), ("s3", "rb"), ("s3", "rm"),
}

# `s3` high-level verbs whose direction decides: a copy to a bucket writes,
# a copy from a bucket reads.
S3_TRANSFER_VERBS = {"cp", "sync", "mv"}

# Commands that only transform text on their way through a pipe. `tee`,
# `xargs`, `python3` and `eval` are absent on purpose: each can run or write
# something of its own, so a call carrying one is left to the ordinary rules.
PURE_FILTERS = {
    "jq", "yq", "grep", "egrep", "fgrep", "rg", "head", "tail", "sort", "uniq",
    "wc", "cut", "tr", "awk", "sed", "column", "cat", "echo", "printf", "date",
    "true", "false", "test", "[", "base64", "read", "sleep", "export", "set",
    "unset", "cd", "pushd", "popd", "local", "declare",
}

# Redirection targets that write nowhere. Any other target is a file write
# riding on the command, which an allow must not vouch for.
HARMLESS_REDIRECT_TARGETS = {"/dev/null", "&1", "&2", "/dev/stderr", "/dev/stdout"}

APPLY_VERBS = {"apply", "destroy", "import", "taint", "untaint", "force-unlock"}
STATE_REWRITE_VERBS = {"rm", "mv", "push", "replace-provider"}
TOFU_READ_VERBS = {
    "plan", "init", "validate", "fmt", "show", "output", "providers", "version",
    "graph", "console", "get", "refresh", "test", "login", "logout", "metadata",
    "workspace",
}

DEFAULT_INFRA_WORKFLOWS = (
    "infra.yml", "_infra-apply.yml", "ops-box.yml", "restore-db.yml",
    "seed-secrets.yml", "snapshot-data-volume.yml", "backup-prune.yml",
)


def infra_workflows() -> tuple[str, ...]:
    raw = os.environ.get("AWS_GUARD_HOOK_INFRA_WORKFLOWS")
    if raw is None:
        return DEFAULT_INFRA_WORKFLOWS
    return tuple(raw.split())


def aws_service_and_verb(tokens: list[str]) -> tuple[str | None, str | None, list[str]]:
    """The service, verb and remaining arguments of an `aws` invocation,
    skipping the CLI's own global options. Either may be None when absent."""
    i = 1
    positional: list[str] = []
    rest: list[str] = []
    n = len(tokens)
    while i < n:
        tok = tokens[i]
        if len(positional) >= 2:
            rest.append(tok)
            i += 1
            continue
        if tok.startswith("--"):
            # The CLI's own boolean flags take no value: every `--no-*`
            # switch, `--debug`, `--version` and the prompt toggle. Every
            # other global option (`--profile`, `--region`, `--output`,
            # `--query`) consumes the token after it.
            if "=" in tok or tok.startswith("--no-") or tok in ("--debug", "--version", "--cli-auto-prompt"):
                if tok == "--version":
                    positional.append("--version")
                i += 1
            else:
                i += 2
            continue
        if tok.startswith("-") and len(tok) > 1:
            i += 1
            continue
        positional.append(tok)
        i += 1
    service = positional[0] if positional else None
    verb = positional[1] if len(positional) > 1 else None
    return service, verb, rest


def classify_aws(tokens: list[str]) -> str:
    """'read', 'change' or 'unknown' for one `aws` invocation."""
    service, verb, rest = aws_service_and_verb(tokens)
    if service is None or service in ("--version", "help"):
        return "read"
    if service.startswith("$") or (verb is not None and verb.startswith("$")):
        return "unknown"
    if (service, verb) in READ_PAIRS or (service, None) in READ_PAIRS:
        return "read"
    if verb is None:
        return "read" if service in ("help",) else "unknown"
    if (service, verb) in NOT_READ:
        return "change"
    if service == "s3" and verb in S3_TRANSFER_VERBS:
        targets = [t for t in rest if t == "-" or not t.startswith("-")]
        if verb == "mv":
            return "change"
        if targets and targets[-1].startswith("s3://"):
            return "change"
        return "read"
    if verb == "help":
        return "read"
    if any(verb == p or verb.startswith(p) for p in READ_VERB_PREFIXES):
        return "read"
    return "change"


def classify_tofu(tokens: list[str]) -> str:
    """'read', 'apply' or 'unknown' for a `tofu`/`terraform` invocation."""
    args = [t for t in tokens[1:] if not t.startswith("-")]
    if not args:
        return "read"
    verb = args[0]
    if verb in APPLY_VERBS:
        return "apply"
    if verb == "state":
        sub = args[1] if len(args) > 1 else ""
        return "apply" if sub in STATE_REWRITE_VERBS else "read"
    if verb == "workspace":
        sub = args[1] if len(args) > 1 else ""
        return "apply" if sub in ("delete",) else "read"
    if verb in TOFU_READ_VERBS:
        return "read"
    return "unknown"


def classify_gh_workflow_run(tokens: list[str]) -> str:
    """'change', 'read' or 'unknown' for `gh workflow run ...`."""
    if len(tokens) < 3 or tokens[1] != "workflow" or tokens[2] != "run":
        return "unknown"
    args = tokens[3:]
    workflow = None
    fields: list[str] = []
    i = 0
    while i < len(args):
        tok = args[i]
        if tok in ("-f", "--raw-field", "-F", "--field") and i + 1 < len(args):
            fields.append(args[i + 1])
            i += 2
            continue
        if tok.startswith(("-f=", "--raw-field=", "-F=", "--field=")):
            fields.append(tok.split("=", 1)[1])
            i += 1
            continue
        if tok in ("-R", "--repo", "-r", "--ref") and i + 1 < len(args):
            i += 2
            continue
        if tok.startswith("-"):
            i += 1
            continue
        if workflow is None:
            workflow = tok
        i += 1
    if workflow is None:
        return "unknown"
    name = os.path.basename(workflow)
    if name == "aws-power.yml":
        for f in fields:
            k, _, v = f.partition("=")
            if k == "power" and v.strip().lower() == "off":
                return "change"
        return "read"
    if name in infra_workflows():
        return "change"
    return "unknown"


def writes_a_file(command: str) -> bool:
    """True when any segment redirects output to a file, or runs `sed -i`
    or `sort -o`, so an allow decision cannot vouch for the whole call."""
    segments = hooklib.split_segments(command) or []
    for text, _terminator in segments:
        try:
            tokens = __import__("shlex").split(text)
        except ValueError:
            return True
        for i, tok in enumerate(tokens):
            if hooklib.REDIRECT_BARE_RE.fullmatch(tok):
                if tok.startswith("<") or tok.lstrip("0123456789").startswith("<"):
                    continue
                target = tokens[i + 1] if i + 1 < len(tokens) else ""
                if target not in HARMLESS_REDIRECT_TARGETS:
                    return True
                continue
            m = hooklib.REDIRECT_PREFIX_RE.match(tok)
            if m and m.end() < len(tok):
                op = m.group(1)
                if op.startswith("<"):
                    continue
                if tok[m.end():] not in HARMLESS_REDIRECT_TARGETS:
                    return True
        cleaned = hooklib.strip_prefix(hooklib.strip_shell_noise(tokens))
        if cleaned and cleaned[0] == "sed" and any(t.startswith("-i") or t == "--in-place" for t in cleaned[1:]):
            return True
        if cleaned and cleaned[0] == "sort" and any(t == "-o" or t.startswith("--output") for t in cleaned[1:]):
            return True
    return False


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

    refusals: list[str] = []
    asks: list[str] = []
    aws_reads = 0
    all_known = True

    for tokens in segments:
        if not tokens:
            continue
        head = tokens[0]
        if head in hooklib.SHELL_KEYWORDS or head in PURE_FILTERS:
            continue
        if head == "aws":
            verdict = classify_aws(tokens)
            if verdict == "read":
                aws_reads += 1
            elif verdict == "change":
                asks.append(" ".join(tokens[:3]))
            else:
                all_known = False
            continue
        if head in ("tofu", "terraform"):
            verdict = classify_tofu(tokens)
            if verdict == "apply":
                refusals.append(" ".join(tokens[:3]))
            elif verdict == "read":
                aws_reads += 1
            else:
                all_known = False
            continue
        if head == "gh":
            verdict = classify_gh_workflow_run(tokens)
            if verdict == "change":
                asks.append(" ".join(tokens[:4]))
            elif verdict == "read":
                aws_reads += 1
            else:
                all_known = False
            continue
        all_known = False

    if refusals:
        sys.stderr.write(
            "aws-guard hook: refused.\n\n"
            f"`{refusals[0]}` would apply infrastructure from this machine. An apply "
            "never runs locally: it belongs in the pipeline's apply job, where the "
            "pull-request review is the approval and the run records the audit "
            "trail. Open a pull request with the change instead.\n"
        )
        return 2

    if asks:
        hooklib.emit_decision(
            "PreToolUse", "ask",
            f"aws-guard hook: `{asks[0]}` changes AWS infrastructure. This is the one "
            "action that needs the owner's approval; approve only if the change is intended.",
        )
        return 0

    if aws_reads and all_known and not writes_a_file(command):
        hooklib.emit_decision(
            "PreToolUse", "allow",
            "aws-guard hook: every AWS call in this command is read-only.",
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
