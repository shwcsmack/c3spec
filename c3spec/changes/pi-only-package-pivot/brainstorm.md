# Brainstorm: pi-only-package-pivot

## Problem framing

c3spec currently carries first-class multi-host generation/runtime assumptions (Cursor, Claude Code, Codex). This creates maintenance overhead, host-specific drift risk, and constrains use of pi-native capabilities.

## Why now

Priority is explicit: maximize pi-native UX, minimize maintenance, and use full pi-agent power. A hard break is approved.

## Scope

- Convert c3spec support model to pi-only
- Remove non-pi host-generation/runtime support from core
- Remove default docs/instructions references to non-pi hosts
- Add pi-native workflow upgrades (extensions/SDK-runtime leverage) in the same initiative

## Non-goals

- Temporary compatibility bridges for non-pi hosts
- Preserving generated host artifacts for Cursor/Claude/Codex in core workflow

## Options considered

1. Staged pi-first with compatibility window
2. pi-only hard break

## Chosen direction

Option 2 (pi-only hard break), because it best aligns with declared priorities and eliminates dual-path maintenance.

## Key risks

- Breaking existing non-pi user workflows immediately
- Larger one-shot migration surface
- Spec/docs/runtime drift during broad removal

## Mitigations

- Tight Tier 3 artifacts and staged implementation plan
- Contract-first spec updates before major code removal
- Strong verification and generated-artifact drift checks

## Success metric

Primary: eliminate 100% of non-pi host-generation/runtime support from core and remove all non-pi references from default docs.
