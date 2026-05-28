---
name: c3spec-host-adapter
description: Map c3spec named agent roles to the current host's native subagent mechanism. Use whenever dispatching implementer, spec-reviewer, or quality-reviewer agents.
---

# C3Spec Host Adapter

c3spec is pi-only. Other c3spec skills refer to named agents (`implementer`, `spec-reviewer`, `quality-reviewer`) and to structured questions. This skill defines how to map those references to pi-native mechanisms.

Canonical agent definitions live under `.agents/agents/*.yaml`.

## Pi

**Named-agent dispatch.** Dispatch named roles using pi’s native subagent/agent workflow mechanisms available in the current runtime. When a skill says "dispatch the spec-reviewer agent," invoke the pi-native agent flow for role `spec-reviewer`.

**Structured questions.** When a skill says "use a structured question," use pi-native structured UI/input primitives when available; otherwise fall back to a plain numbered prompt.

## Unsupported runtime

If the active runtime is not pi:

1. Stop before dispatching subagents.
2. Report that c3spec is pi-only.
3. Ask the user to continue in pi.

Do not guess fallback dispatch behavior for other hosts.
