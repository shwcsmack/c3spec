---
name: c3spec-research
description: Execute a lightweight research workflow for idea-driven and explicit research requests. Produces durable research artifacts and a handoff back to c3spec-start for implementation tier routing.
---

# C3Spec Research Workflow

Use this workflow when the user asks to research, investigate, compare, evaluate, or survey options before implementation.

## Guardrails

- Research mode is analysis-only: do not implement product/code changes in this flow.
- Keep one-question interview pacing for clarifications.
- Keep artifacts lightweight and decision-oriented.

## Step 1 — Create research folder

Create:

`c3spec/changes/research-<slug>/`

## Step 2 — Capture artifacts

Write these files:

- `question.md` — exact research question and decision to inform
- `scope.md` — in-scope/out-of-scope, constraints, evidence sources
- `findings.md` — options considered, evidence, tradeoffs
- `recommendation.md` — preferred direction and why
- `handoff.md` — next-step implementation candidates, suggested tier, open risks

## Step 3 — Pause for approval

Present recommendation + handoff summary and wait for explicit user approval.

## Step 4 — Return to implementation front door

If user wants implementation, route back through `c3spec-start` for final tier classification using research outputs as context.

## What NOT to do

- Do not skip durable artifacts.
- Do not bypass `c3spec-start` for implementation handoff.
- Do not run T1/T2/T3 implementation steps directly from this workflow.
