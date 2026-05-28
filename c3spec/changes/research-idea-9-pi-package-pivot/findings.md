# Findings

## 1) Current c3spec model is host-generation centric

- c3spec currently hardcodes supported hosts to `cursor`, `claude`, `codex`.
- Core workflow guidance is generated to describe those hosts specifically.
- `c3spec-host-adapter` encodes host-native subagent dispatch semantics per host.

Implication: today’s architecture optimizes for multi-host parity and generated host artifacts, not for a single runtime package model.

## 2) pi package model can carry c3spec skills/extensions directly

From pi docs:
- Packages can ship skills/extensions/prompts/themes via `package.json#pi` or convention folders.
- pi discovers `.agents/skills/` and supports package-scoped resources.
- pi supports local, npm, and git package install sources and project-local install scope.

Implication: c3spec’s canonical `.agents/skills/` structure already maps well to pi package primitives.

## 3) pi can absorb host-adapter complexity via native runtime capabilities

From pi docs:
- Skills are loaded natively and can be invoked automatically or explicitly.
- Extensions can add tools, commands, event hooks, and UI interaction.
- SDK/runtime API supports embedding and custom orchestration.

Implication: several c3spec host-specific branches (especially host dispatch adaptation) could be reduced if pi becomes the primary runtime.

## 4) Biggest migration cost is not packaging; it is workflow contract realignment

Packaging effort is moderate. Hard parts:
- Reframing “supported host” contract from Cursor/Claude/Codex to pi-first
- Preserving contributor UX for non-pi users (if desired)
- Handling existing generated artifacts and sentinel drift rules tied to host generation

## 5) Tradeoff summary

### Benefits of pi-first
- Lower ongoing maintenance on multi-host rendering logic
- Single runtime behavior and fewer host-specific failure modes
- Better leverage of extensions/SDK for future workflow evolution

### Costs/risks
- Compatibility loss for users invested in Cursor/Claude/Codex native flows
- Ecosystem lock-in perception (project identity shift)
- Transitional docs/support burden during migration

## 6) Direction fit against user priorities

Given priorities of pi-native UX, minimal maintenance, and full pi-agent power:
- **Additive or long-tail compatibility paths conflict with goals** because they preserve host-generation complexity.
- **pi-only strategic pivot is the strongest fit** because it removes cross-host parity burden and unlocks direct use of pi extensions/SDK/runtime capabilities as first-class design primitives.
