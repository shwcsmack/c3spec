# Proposal: Research workflow routing for idea-driven requests

## Why

`c3spec-start` currently forces all development requests into T1/T2/T3 implementation tiers. Requests that are explicitly research-oriented (e.g., investigate options, compare approaches, evaluate tradeoffs, or run idea follow-up research) are awkwardly routed into implementation workflows or handled ad hoc.

This creates routing ambiguity, weakens workflow consistency, and makes research outputs non-standard.

## What changes

1. Extend routing behavior in `c3spec-start` to detect research intent and classify it as a dedicated research path.
2. Add a dedicated skill/flow for research execution with a lightweight artifact set:
   - research question
   - scope
   - findings
   - recommendation
   - next steps / handoff
3. Define handoff rules from research outputs back into implementation workflows (T1/T2/T3) when the user chooses a direction.
4. Update workflow routing specs and tests to enforce the new routing behavior and expectations.

## Scope boundaries

In scope:
- Research intent detection and routing
- New research workflow skill + artifact contract
- Spec + test updates for workflow behavior

Out of scope:
- Implementing any downstream feature discovered by research
- Changing existing T1/T2/T3 artifact requirements beyond necessary handoff integrations

## Impact

- Skills:
  - `.agents/skills/c3spec-start/SKILL.md`
  - new research workflow skill under `.agents/skills/`
  - potentially `c3spec-tier-lifecycle` if lifecycle contract references are needed for handoff semantics
- Specs/tests:
  - `c3spec/specs/workflow-routing/spec.md`
  - associated routing tests

## Success criteria

- Research requests are routed intentionally and consistently.
- The research flow produces durable, lightweight outputs with clear pause/approval points.
- Research outputs can cleanly hand off into T1/T2/T3 when implementation is requested.
