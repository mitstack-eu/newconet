---
paths:
  - ".github/**"
  - "deploy/**"
  - "scripts/**"
---

# Delivery, branching and the pipeline

This binds any change to a workflow, a deploy script or a `check-*.sh` gate.

## How a change reaches production

`main` is the only long-lived branch and production the only environment.
Every change lands through a short-lived pull request, and that run's `deploy`
job delivers the merge once every required check is green.

Protection on `main` requires an up-to-date branch, linear history and every
required check green. Force-push and direct push are disabled.

Fix a red check on your own pull request the moment it appears, by reading the
failing job's log; re-run only once the cause is understood.

## A pull request with no checks at all

A `pull_request` run is triggered on a merge commit GitHub cannot build while
the branch conflicts, so a conflicted pull request reports nothing. Read
`mergeStateStatus` first, and rebase on `main` when it says `DIRTY`.

```sh
gh pr view <number> --repo <owner/name> --json mergeStateStatus -q .mergeStateStatus
```

## Resolving the conflict

The session that opened the pull request resolves the conflict the moment it
appears. Rebase on `main`, never merge `main` in, because linear history is
required.

```sh
git fetch origin main && git rebase origin/main
```

Resolving a hunk means deciding which side is still true, so check whether what
you were changing still exists. Rerun the checks covering what the conflict
touched, since a rebase replays your commits onto untested code, then push with
`--force-with-lease`.

Read `mergeStateStatus` again afterwards: `BLOCKED` means the conflict is gone
and checks are running.

## What a remote is allowed to carry

A remote carries `main` and the head branch of an open pull request, and
nothing else in this repository.

## Infrastructure applies

`tofu apply` never runs locally, and `.claude/hooks/aws-guard-hook.py` refuses
it. The same hook asks before a mutating `aws` call, the one action needing the
owner, and allows every read.
