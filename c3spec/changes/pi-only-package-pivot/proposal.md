# Proposal: pi-only-package-pivot

Date: 2026-05-28

## Why

c3spec currently maintains multi-host runtime/generation paths that increase maintenance and constrain pi-native UX. We will pivot to a pi-only package/runtime with a hard break from non-pi hosts.

## What Changes

| Area | Before | After |
| --- | --- | --- |
| Supported hosts | Cursor, Claude Code, Codex | Pi only |
| Host generation | Host-specific renderers/artifacts | Removed from core |
| Workflow docs | Multi-host routing language | Pi-native-only contract |
| Capability strategy | Host abstraction first | Pi extensions/SDK/runtime primitives first |

## New Capabilities

- Pi-native workflow enhancement points via extensions/events/tools/UI.
- SDK/runtime-backed orchestration improvements scoped in this initiative.

## Impact

- **Specs:** workflow-routing, command-generation, ai-tool-paths, canonical-skills
- **Skills:** routing and host-adapter content realigned to pi-only
- **CLI/Core:** host-generation and host-specific pathways removed or isolated outside core
- **Docs:** default docs remove non-pi host support references
- **Tests:** host-matrix tests removed/replaced with pi-only contract tests

## Success Metric

Eliminate 100% of non-pi host-generation/runtime support from core and remove all non-pi references from default docs.
