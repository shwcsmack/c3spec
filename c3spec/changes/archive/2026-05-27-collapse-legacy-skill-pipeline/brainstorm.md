# Brainstorm: Collapse Legacy Skill Pipeline

## Problem

c3spec maintained two skill sources: root `skills/` with TypeScript codegen, and `.agents/skills/` with host generation. Tier routing skills already lived only in `.agents/`, but legacy workflow skills duplicated effort and confused contributors.

## Decision

Use `.agents/skills/` as the single canonical source. Retire root `skills/`, `scripts/generate-templates.js`, and `src/core/templates/workflows/`.

## Legacy skill classification

| Skill | Action | Rationale |
| --- | --- | --- |
| c3spec-start, tier1/2/3, subagent-dev, host-adapter | Keep (already canonical) | Tier routing surface |
| c3spec-explore | Migrate | Unique explore-mode stance; complements tiers |
| c3spec-sync-specs | Migrate | Spec sync utility still needed |
| c3spec-archive-change | Migrate | Archive helper for agents |
| c3spec-bulk-archive-change | Migrate | Bulk archive utility |
| c3spec-verify-change | Migrate | Verification helper |
| c3spec-onboard | Migrate | Onboarding flow for new projects |
| c3spec-propose, new/continue/apply/ff | Retire | Replaced by c3spec-start + tier workflows |
| Root duplicates of tier skills | Delete | `.agents/` is authoritative |

## Risks

- Workspace profile workflows narrowed to utility set (explore/sync/archive core).
- Legacy installed propose/apply skills remain on disk until users run update/cleanup; migration scans only ALL_WORKFLOWS utilities.
