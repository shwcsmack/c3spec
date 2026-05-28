# Brainstorm — vendor-superpowers-tooling

## Problem framing
c3spec currently references externally provided `superpowers:*` skills for critical lifecycle steps (worktree setup and branch finishing) and historically relies on transitive quality guarantees from superpowers execution flows. This creates supply and compatibility risk when plugins are unavailable or behavior drifts upstream.

## Why now
Idea #1 is a high-priority backlog item and directly affects c3spec reliability as a standalone workflow system.

## Scope
- Inventory all direct and transitive superpowers skill dependencies currently referenced by c3spec.
- Vendor c3spec-critical dependencies into canonical local skills.
- Repoint routing/instructions to local vendored equivalents.
- Produce an evaluated opportunity list for non-critical superpowers skills.

## Non-goals
- Full one-shot vendoring of every upstream superpowers skill.
- Re-architecting c3spec-subagent-dev internals in this change.

## Dependency findings
Direct references in active c3spec skills:
- `superpowers:using-git-worktrees`
- `superpowers:finishing-a-development-branch`

Contextual/transitive references in schema docs:
- `superpowers:subagent-driven-development`
- `superpowers:test-driven-development`
- `superpowers:requesting-code-review`
- `superpowers:brainstorming`
- `superpowers:writing-plans`

## Options considered
1. Vendor all upstream skills immediately.
   - Pros: full local control.
   - Cons: large migration, high drift and validation burden.
2. Vendor only current hard dependencies + create evaluated adoption map for the rest. ✅
   - Pros: lowers risk, removes immediate dependency, keeps rollout scoped.
   - Cons: still leaves follow-up work.

## Recommended direction
Adopt option 2: vendor critical path skills now, add a codified dependency/opportunity report, and define follow-up adoption candidates ranked by workflow impact.

## Risks and unknowns
- Hidden dependency assumptions in existing skill prose.
- Host artifact generation drift after skill naming updates.
- Need to preserve behavior expectations during name transition.
