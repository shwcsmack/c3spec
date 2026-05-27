## Why

c3spec workflows can currently start while the source checkout has tracked, uncommitted changes. That makes worktree setup and later cleanup noisy: the user discovers too late that unrelated edits need to be stashed, committed, or disentangled. The workflow should stop before any tier routing or worktree setup and ask the user how to handle the dirty source tree.

## What Changes

**Workflow entry**
- From: The agent can route into a tier and create a worktree while tracked changes are present.
- To: The agent checks `git status --porcelain --untracked-files=no` before tier work begins.
- Reason: Prevent unrelated tracked edits from leaking into workflow setup.
- Impact: Non-breaking workflow guardrail.

**Dirty tree policy**
- From: No consistent policy; cleanup happens ad hoc.
- To: Soft-block with three choices: stash and continue, commit first, or abort.
- Reason: Keep the user in control while making the unsafe path explicit.
- Impact: Interactive workflow behavior changes only when tracked changes are present.

**Direct tier entry**
- From: Tier skills rely on worktree setup and do not guard the source repo.
- To: Each tier skill mirrors the same clean-tree pre-flight gate.
- Reason: Protect direct/resume paths, not only `c3spec-start`.
- Impact: Tier skill instructions become more explicit.

**Untracked files**
- From: Unspecified.
- To: Untracked files are ignored by the gate.
- Reason: Scratch files and local notes should not block normal work.
- Impact: The check focuses on tracked uncommitted changes only.

## Capabilities

### New Capabilities

- `workflow-clean-tree-gate`: Defines the workflow requirement that c3spec checks for tracked uncommitted changes before starting routed tier work.

### Modified Capabilities

- `workflow-routing`: The tier entry contract now includes a source-repo clean-tree pre-flight gate.

## Impact

- `.agents/skills/c3spec-start/SKILL.md`: Add a pre-flight clean-tree gate before interview routing proceeds.
- `.agents/skills/c3spec-tier1-fix/SKILL.md`: Mirror the clean-tree gate before commit approval and worktree setup.
- `.agents/skills/c3spec-tier2-feature/SKILL.md`: Mirror the clean-tree gate before commit approval and worktree setup.
- `.agents/skills/c3spec-tier3-full/SKILL.md`: Mirror the clean-tree gate before commit approval and worktree setup.
- Generated host artifacts: Regenerate host-specific skill copies if the project requires checked-in generated artifacts.
