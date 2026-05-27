# Verification: Tier Workflow Resumability

## Summary

Verification passed for the tier workflow resumability change. The canonical skill set validates with the new `c3spec-tier-lifecycle` skill, host artifacts were regenerated from `.agents/` and proved stable on repeat sync, source specs validate after sync, the project builds, and the full test suite passes.

## Commands

- `pnpm check:canonical-skills` — passed. Reported all 15 canonical skills present under `.agents/skills/`.
- `pnpm run build` — passed. TypeScript compiled and `dist/` was rebuilt successfully.
- `pnpm test` — passed. 79 test files passed, 1415 tests passed.
- `node bin/c3spec.js validate tier-workflow-resumability` — passed. The active change is valid.
- `node bin/c3spec.js validate --specs` — passed. 42 specs passed, 0 failed.
- `node bin/c3spec.js sync --force .` — passed. Regenerated configured host artifacts for Claude, Codex, and Cursor from `.agents/`.
- Repeat `node bin/c3spec.js sync --force .` with `git diff --name-only` comparison — passed. The generated artifact file set was stable on repeat sync.

## Tests Added or Updated

- Added `test/specs/tier-lifecycle-skill-contract.test.ts`.
- Updated `test/core/host-generation/canonical.test.ts`.

The focused tests cover:

- `c3spec-tier-lifecycle` canonical registration and script-level enforcement.
- Lifecycle skill frontmatter and required T1/T2/T3 artifact names.
- Tier workflow skills referencing `c3spec-tier-lifecycle`.
- Continue/apply/archive helpers referencing `c3spec-tier-lifecycle` and `tier.md`.
- `c3spec-apply-change` handing implementation to `c3spec-subagent-dev` without direct checkbox mutation.
- Cursor host-adapter guidance avoiding any requirement for `.cursor/agents/<name>.md`.

## Spec Sync Status

Approved delta specs were synced into:

- `c3spec/specs/workflow-routing/spec.md`
- `c3spec/specs/canonical-skills/spec.md`
- `c3spec/specs/cli-artifact-workflow/spec.md`
- `c3spec/specs/cli-archive/spec.md`

Validation confirmed source specs remain normalized with `## Purpose`, `## Requirements`, and parseable `### Requirement:` headers.

## Generated Artifact Drift

Ran `node bin/c3spec.js sync --force .` and re-ran it after inspecting generated diffs. The repeat sync was stable, and reviewers confirmed generated sentinels/hashes match the canonical `.agents/` sources after expected renderer normalization.

Tracked generated host artifacts were updated and committed for:

- Claude agents, selected Claude skills, and settings sidecar.
- Cursor agents and hooks sidecar.
- Codex agents and hooks sidecar.

## Cross-Platform Notes

New tests construct filesystem paths with Node path helpers (`path.join`, `path.resolve`, `path.dirname`, `fileURLToPath`) instead of hardcoded separators. No platform-specific path assumptions were introduced in test code.

## Residual Risks

- `cli-artifact-workflow` still contains some pre-existing `openspec` terminology in scenarios that were outside the approved delta scope. The synced sections use `c3spec`, but a broader terminology cleanup remains a possible follow-up.
- Tier lifecycle enforcement is skill-level guidance in this change. The CLI archive command remains backwards compatible and does not hard-require `tier.md` for legacy/pre-fork changes.
- Non-tracked generated Claude skill mirrors are written by `c3spec sync` but remain ignored by the repository convention. Tracked generated artifacts were regenerated and committed.
