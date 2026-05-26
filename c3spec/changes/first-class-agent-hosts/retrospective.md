# Retrospective

## What Changed

c3spec now treats Cursor, Claude Code, and Codex as the only first-class hosts. Canonical workflow assets live under `.agents/`, and host-native files are generated from that source.

The old broad adapter surface was removed. Slash command generation is no longer the primary workflow surface; native skills, agents, and hooks are generated instead.

## Decisions That Mattered

- Use `.agents/` as the canonical source, then render host-native artifacts instead of maintaining parallel hand-written copies.
- Do not mirror Cursor skills. Cursor receives native agents/hooks, while skills remain canonical in `.agents/`.
- Keep host JSON config schema-clean. Generated JSON files use sidecar `.c3spec.json` metadata instead of inline `_c3spec` fields.
- Detect configured hosts from host-native generated markers, not from canonical `.agents/` alone. This prevents a Claude-only project from receiving unsolicited Cursor/Codex files.
- Preserve safe drift behavior by skipping hand-edited generated files unless `--force` is supplied.

## Implementation Deviations

- `c3spec sync` was added as a top-level command for host regeneration. It reads local `.agents/` and does not refresh bundled canonical content.
- The first implementation of host detection treated `.agents/` as Cursor/Codex configuration. Review caught this and it was replaced with explicit host-native markers.
- The first JSON sentinel approach used inline `_c3spec` fields. Review caught the host-schema risk, and JSON metadata moved to sidecar files.

## Follow-Ups

- Add interactive confirmation for drifted generated/canonical files if the warning plus `--force` flow proves too blunt.
- Consider extracting shared host detection marker paths so `AI_TOOLS` and host generation cannot drift.
- If Cursor ever needs a skill mirror, add it as an explicit renderer option rather than reintroducing `.cursor/skills/` by default.
- Revisit workspace-local skill generation if workspace mode should eventually render full host-native agents/hooks too.
