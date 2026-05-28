# Design: Research workflow routing

## Decisions

### 1) Introduce research as a first-class routing outcome in `c3spec-start`
- Chosen: Add a distinct research routing classification alongside existing implementation tiers.
- Reason: Research intent is semantically different from implementation intent; forcing tier mapping creates noise and drift.
- Alternatives considered:
  - Keep 3-tier model and route research into Tier 1 investigation mode (rejected: conflates goals and artifacts).
  - Handle research ad hoc via `c3spec-explore` without routing semantics (rejected: inconsistent and untestable).

### 2) Add a dedicated research workflow skill
- Chosen: Create a new canonical skill (e.g., `c3spec-research`) that runs a lightweight artifact-driven flow.
- Reason: Makes behavior explicit, reusable, and host-agnostic; avoids overloading explore mode with lifecycle rules.
- Alternatives considered:
  - Extend `c3spec-explore` only (rejected: explore is intentionally free-form/non-implementation, lacks durable artifact contract).

### 3) Define lightweight research artifact contract
- Chosen: Require a compact set: `question.md`, `scope.md`, `findings.md`, `recommendation.md`, and `handoff.md` in a research change folder.
- Reason: Creates durable output and clear decision boundary without Tier 2/3 ceremony overhead.
- Alternatives considered:
  - Single combined document (rejected: weaker pause points and reviewability).

### 4) Define handoff contract back to T1/T2/T3
- Chosen: `handoff.md` captures selected direction, scope, risks, and suggested tier; user confirms before entering `c3spec-start` for implementation.
- Reason: Keeps single front door while preserving research outcomes.
- Alternatives considered:
  - Auto-enter implementation tier directly from research (rejected: bypasses front-door interview safeguards).

## Risks and mitigations

- Risk: Spec/model drift between 3-tier lifecycle and new research lane.
  - Mitigation: Keep research lane outside tier-lifecycle ownership, but define explicit boundary and references.
- Risk: Interview duplication with `c3spec-start`.
  - Mitigation: Keep `c3spec-start` interview for routing intent; research skill interview focuses on research question/scope quality.
- Risk: Misclassification of exploratory feature requests.
  - Mitigation: Add explicit routing signals/examples and ambiguous-case behavior.

## Open questions

- Whether research artifacts should live under `c3spec/changes/research-<slug>/` or a dedicated `c3spec/research/` root.
- Whether `c3spec ideas triage` follow-ups should auto-suggest research routing when scope is unclear.
