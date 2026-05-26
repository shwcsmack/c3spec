# Retrospective: github-fetch-skill-templates

> Written: 2026-05-25 (after verify passed with non-blocking warnings)
> Commit range: `05c6e4a^..9d9d9aa`
> Worktree: merged to `main`

---

## 0. Evidence

- **Commit range**: `05c6e4a^..9d9d9aa` (feature commit `9d9d9aa`, merge commit `05c6e4a`)
- **Diff size**: 2,823 insertions / 154 deletions across 37 files in `9d9d9aa`
- **Tasks done**: 26/26
- **Active hours**: not reconstructed from commit history
- **Subagent dispatches**: not reconstructed from commit history
- **New external dependencies**: none
- **Bugs encountered post-merge**: 1 test snapshot mismatch after a later `c3spec-new-change` skill edit; fixed by updating `test/core/templates/skill-templates-parity.test.ts`
- **C3Spec validate state at archive**: target change passes; `validate --all` has 6 unrelated pre-existing active-change failures
- **Test coverage signal**: `pnpm test` passes 1,509 tests across 77 files

Commit chain:

```text
9d9d9aa feat: fetch skill templates from GitHub at runtime with bundled fallback
05c6e4a Merge worktree-github-fetch-skill-templates into main
```

---

## 1. Wins

- The shipped implementation achieved the main product goal: `c3spec update` can fetch current skill markdown from the canonical GitHub repository while preserving bundled fallback behavior (`src/core/shared/remote-skill-fetch.ts`, `src/core/update.ts`).
- The repository now has raw `skills/<workflow>/SKILL.md` files as editable skill sources, backed by codegen and drift checking (`scripts/generate-templates.js`, `pnpm check:codegen`).
- The verification signal is strong after cleanup: build passes, codegen has no drift, focused parity tests pass, and the full Vitest suite passes.

## 2. Misses

- 🟡 The change was merged before its c3spec change directory was archived, leaving planning artifacts untracked and tasks unchecked.
- 🟡 The delta specs were not synced at merge time, so future work could not discover `remote-skill-fetch` and `skill-template-codegen` as main capabilities until this cleanup.
- 📌 The parity hash expectations were not updated after the later `c3spec-new-change` skill content edit, causing the first full test run during archive cleanup to fail.

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| Task 1.1-1.3 | Completed in implementation commit, but task checkboxes stayed unchecked | The code shipped before archive bookkeeping was completed |
| Task 6.3-6.4 | Manual update/network-failure smoke was not rerun during archive cleanup | Automated fetch/update tests and full suite covered the behavior; this cleanup focused on archive readiness |
| Verify/retro artifacts | Written after merge rather than before merge | The change directory remained untracked after the implementation was already merged |

## 4. Skill / workflow compliance

| Skill                                            | Used |
|--------------------------------------------------|------|
| superpowers:brainstorming                        | ✓ |
| superpowers:writing-plans                        | ✓ |
| superpowers:using-git-worktrees                  | ✓ |
| superpowers:subagent-driven-development          | ✓ |
| (transitive) superpowers:test-driven-development | ✓ |
| (transitive) superpowers:requesting-code-review  | ✓ |
| superpowers:finishing-a-development-branch       | ✓ |

### Deliberately Skipped Skills

None identified from the available artifacts and commit history.

## 5. Surprises

- The implementation was already merged, but the change directory was still active and untracked. The archive state was therefore out of sync with the repository state.
- `c3spec validate --all` is not a clean archive gate in this checkout because unrelated active changes without deltas already fail validation.
- The parity hash test made the later skill-content update visible during this archive cleanup, which is useful but easy to miss if the full suite is not run.

## 6. Promote candidates → project memory

- [ ] 🟡 **Archive workflow should run before merging implementation commits** → **Promote to workflow memory**
  > **Why**: This change shipped in `9d9d9aa` but left untracked change artifacts, unchecked tasks, and unsynced specs behind.
  > **How to apply**: Before merging any c3spec change, run status, sync delta specs, write verify/retro, archive, and include those artifacts in the final branch.

- [ ] 📌 **Skill content edits require parity hash updates** → **Promote to workflow memory**
  > **Why**: The `c3spec-new-change` skill update changed generated content hashes and caused `skill-templates-parity.test.ts` to fail until expectations were updated.
  > **How to apply**: Whenever editing `skills/<workflow>/SKILL.md` or generated workflow templates, run the focused parity test and update expected hashes when the content change is intentional.
