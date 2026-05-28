# Superpowers dependency audit

## Direct critical-path dependencies (before this change)
- `superpowers:using-git-worktrees`
- `superpowers:finishing-a-development-branch`

## Direct references still present for context/docs (non-critical)
- `superpowers:brainstorming`
- `superpowers:writing-plans`
- `superpowers:subagent-driven-development`

## Nested/transitive dependencies called out in docs/schema
- `superpowers:test-driven-development` (via subagent-driven-development)
- `superpowers:requesting-code-review` (via subagent-driven-development)

## Evaluation: future adoption candidates
1. `superpowers:brainstorming` — high fit; could standardize discovery facilitation.
2. `superpowers:writing-plans` — medium fit; current c3spec already has strong plan generation.
3. `superpowers:test-driven-development` — high rigor value, but requires deeper integration policy.
4. `superpowers:requesting-code-review` — medium-high value; overlaps with c3spec reviewer roles.
5. `superpowers:subagent-driven-development` — low immediate need because `c3spec-subagent-dev` already replaces it.

## Vendoring-now decision
Vendor only critical-path dependencies now (`using-git-worktrees`, `finishing-a-development-branch`), defer broader adoption to prioritized follow-up work.