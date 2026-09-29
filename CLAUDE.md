# CLAUDE.md — Managed by mitstack dev-stack-claude-code

This repository is an app on the Mitstack platform. Infrastructure was
provisioned deterministically by the app's stack subscription before any
agent ran. Do not create, modify, or destroy infrastructure resources.

The app is app_newconet_2f3e14ab, repository is mitstack-eu/newconet.

## Project context

The Mitstack platform provides the infrastructure, CI/CD pipeline, and
deployment target for this app. The agent writes business-logic code inside
a repo that already builds and deploys.

## Constraints

- Never call cloud APIs to create, update, or delete infrastructure. The
  app's stack already provisioned everything.
- Never read or write secrets directly. Secrets are in mitstack's encrypted
  store and injected into CI as masked environment variables.
- The GitHub token is scoped to this repository only.
