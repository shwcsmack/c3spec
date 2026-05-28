# Design: vendor-superpowers-tooling

## Decisions
1. Vendor critical-path superpowers dependencies first.
2. Introduce local canonical skills:
   - `c3spec-using-git-worktrees`
   - `c3spec-finishing-development-branch`
3. Repoint c3spec tier/archive skills to local skill names.
4. Produce explicit dependency mapping for direct + nested skill references and rank non-critical adoption candidates.

## Architecture
Tier and archive workflow skills call local c3spec skills instead of external `superpowers:*` names.

## Contracts
- Worktree-setup and branch-finishing behavior remains available without external plugin dependency.
- Canonical skill generation and tests remain green.

## Risks
- Reference drift in skill docs/instructions.
- Behavior mismatch with prior superpowers flows.

## Mitigations
- Update all canonical references atomically.
- Validate with full test suite.
