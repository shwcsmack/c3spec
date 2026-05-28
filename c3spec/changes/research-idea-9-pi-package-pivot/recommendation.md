# Recommendation

## Preferred direction

Adopt a **pi-only strategic pivot**.

Convert c3spec into a first-class pi package and treat pi agent as the sole supported runtime/host model.

## Why

- Maximizes pi-native UX by designing directly for pi runtime primitives
- Minimizes maintenance by removing host-generation parity burden
- Unlocks full pi-agent capabilities (extensions, events, custom tools/UI, SDK/runtime APIs) without cross-host abstraction constraints

## Success criteria

1. c3spec install/use path works end-to-end as a pi package in project and global scopes.
2. Core tier workflows (start/research/T1/T2/T3/apply/verify/archive) run in pi without host-specific branching.
3. Contributor docs center pi as the only runtime path and stay executable.
4. Measured reduction in host-generation-specific code and support burden.
5. Legacy host-generation surfaces are removed (or frozen outside core) so maintenance cost drops measurably.

## Blockers / unknowns

- Migration sequencing: how aggressively to remove existing host-generation code and generated artifacts while preserving release safety.
- Packaging boundaries: what stays in core CLI vs what moves into pi package resources.
- Communication strategy for users currently depending on non-pi hosts.
