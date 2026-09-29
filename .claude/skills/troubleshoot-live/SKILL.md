---
name: troubleshoot-live
description: Diagnosing the live environment when the app is down, a deploy is red, or a delivery stalls. Triggers include "troubleshoot", "why is the live site broken" and "the deploy isn't working".
---

# troubleshoot-live

A symptom-driven playbook for the live environment. Diagnose read-only first,
then act, and never call something fixed without an HTTP code that shows it.

## What the environment is

Two probes tell you whether the host is healthy: the app's health endpoint
and its front page. Quote the code each one answered rather than summarising
the two together.

## What a delivery consists of

One pipeline run on `main` carries the whole delivery.

A red check means a red run, and a red run means no deploy. Read that run
before you reach for anything else. To redeploy the current `main`, re-run its
pipeline run rather than dispatching a deploy of your own.

## Symptom: the tip of main is green and never delivered

Compare the newest release or deployment marker against the tip of `main`. A
marker that trails the tip is a stalled delivery.
