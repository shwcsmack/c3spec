# Plan: Workflow Routing Spec

## Stage 1 - Sequential

### Task 1.1: Draft workflow-routing delta spec
Create `c3spec/changes/tier2-workflow-routing-spec/specs/workflow-routing/spec.md` with a behavior-first `workflow-routing` capability. Cover the existing contract only: `c3spec-start` as the single front door, three tier outcomes, classifier signals and confirmation gate, canonical skill and review-agent surfaces, tier workflow shape, generated host instruction alignment, existing enforcement boundaries, and explicit non-goals. Verification approach: parse against the existing spec format and compare against current `.agents/skills/*`, `src/core/host-generation/types.ts`, and `src/core/host-generation/renderers/instructions.ts`.

## Stage 2 - Sequential

### Task 2.1: Validate spec structure
Run the focused source-spec normalization test where applicable. Because the new file is a delta spec under `c3spec/changes/`, also inspect it manually for the required delta header style (`## ADDED Requirements`) and behavior-first requirement/scenario format.

### Task 2.2: Mark implementation tasks complete
After implementation and reviews pass, update `c3spec/changes/tier2-workflow-routing-spec/tasks.md` checkboxes for Tasks 1-3 only. Leave verification, retrospective, and archive tasks for the controller steps that follow.
