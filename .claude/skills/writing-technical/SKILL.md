---
name: writing-technical
description: Drafting or fixing technical Markdown: references, guides, runbooks, decision records and script headers, and any runbook needing steps an operator can verify.
---

# Writing technical documentation

This covers Markdown written in this repository: technical references,
guides, runbooks, decision records, journeys, design notes and the headers on
`scripts/*.sh`.

The sentence-level bar is `.claude/rules/writing-style.md`; this skill adds
what is specific to technical documentation.

## Who reads this, and what they want

A developer changing the system, and an operator running it under time
pressure. They know the stack. Assume it.

What they need from you is the guarantee this component makes, and what happens
when it does not hold.

## State the invariant, then the mechanism

A service is a set of promises: a signature verifies, a pin resolves to one
image, a plan never destroys a module wholesale. Lead with the promise, in
one sentence. Then say what enforces it.

A reader who has the invariant can judge whether your mechanism is enough. A
reader who has only the mechanism has to reverse-engineer the promise and will
sometimes get it wrong.

## Say what happens when it fails

A doc that describes the happy path is half a doc. For every guarantee, say
what a breach looks like from the outside and which signal carries it.

The important case is a failure that looks like success. Name those outright,
because they are the ones no reader will infer.

## A runbook step ends in a check

Every step in a runbook has an action and a way to know it worked. A step
without a check is a step an operator cannot report on.

Write the command, then the output that means it succeeded. Where a step is
slow, say roughly how long before the operator starts wondering.

## Name the real thing

Point at the route, the job, the module or the file. `POST /v1/subscriptions`,
the `deploy` job, `deploy/tofu/cicd`, `config/service-pins.yaml`. Never "the
deploy layer" or "the signing code".

## History belongs in a decision record and nowhere else

Everywhere under `docs/`, write only the present behaviour. The one
exception is `docs/adr/`, which exists to hold history.

An ADR says what was decided, when, what it replaced, and what it costs. The
cost line is the one most often skipped and the one a later reader most needs.

## Before and after

| Weaker | Stronger |
|---|---|
| Webhook calls are securely signed. | Every lifecycle call carries an Ed25519 signature from the platform key. The receiver verifies it against the global JWKS. There is no shared secret to leak or rotate. |
| The apply job handles destructive plans. | A plan whose only real actions are deletes is refused, never applied. The job fails and names the module before touching the state. |
| Restart the service and check it comes up. | Run `docker compose up -d api`. Then `curl -fsS localhost:8000/healthz`, which returns `ok` within about 20 seconds. A timeout here means a required key is missing from the environment. |
| A stale backup will be detected by monitoring. | A backup that stopped running looks identical to one that never ran. Nothing in the restore test tells them apart, so age is checked on its own. |

## Before you finish

Run `.claude/hooks/check-writing-style.sh` on every file you touched.

Then read your own doc as the operator at 2am. Every step should tell them what
to type and how to know it worked.
