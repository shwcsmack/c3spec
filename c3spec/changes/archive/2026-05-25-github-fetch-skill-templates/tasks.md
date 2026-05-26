## 1. Create skills/ source-of-truth directory

- [x] 1.1 Create `skills/` at the repo root with one subdirectory per workflow: `c3spec-explore`, `c3spec-new-change`, `c3spec-continue-change`, `c3spec-apply-change`, `c3spec-ff-change`, `c3spec-sync-specs`, `c3spec-archive-change`, `c3spec-bulk-archive-change`, `c3spec-verify-change`, `c3spec-onboard`, `c3spec-propose`
- [x] 1.2 For each workflow, create `skills/<dir>/SKILL.md` using full frontmatter + body extracted from the corresponding TypeScript template function — set `generatedBy: "source"` as the placeholder value
- [x] 1.3 Manually audit each `SKILL.md` against the TypeScript template it was extracted from and fix any content that is out of sync (suspected existing drift)

## 2. Write codegen script

- [x] 2.1 Create `scripts/generate-templates.ts` that reads each `skills/<dir>/SKILL.md`, parses the YAML frontmatter (name, description, license, compatibility, metadata) and markdown body, and generates the corresponding TypeScript template function
- [x] 2.2 Codegen script writes output to `src/core/templates/workflows/<workflow>.ts` — overwriting the existing file — using the same exported function signature as the current hand-written templates
- [x] 2.3 Add a header comment to each generated file (`// GENERATED — edit skills/<dir>/SKILL.md instead`) so editors know not to modify them directly
- [x] 2.4 Run codegen and verify its output is identical to the current TypeScript templates (if there is drift, the `skills/` files from task 1.3 take precedence)

## 3. Integrate codegen into build pipeline

- [x] 3.1 Update `build.js` to run `scripts/generate-templates.ts` (via `npx tsx` or compiled script) before invoking `tsc`
- [x] 3.2 Add a `check:codegen` npm script in `package.json` that runs codegen then asserts `git diff --exit-code src/core/templates/workflows/`
- [x] 3.3 Add the codegen drift check step to the CI workflow (run `pnpm check:codegen` and fail if any generated file is modified)

## 4. Implement remote skill fetch

- [x] 4.1 Create `src/core/shared/remote-skill-fetch.ts` that exports a function accepting a list of `{ workflowId, dirName }` entries and returning a `Map<workflowId, string>` of fetched SKILL.md content — fetches all in parallel with a 5-second `AbortSignal` timeout per request
- [x] 4.2 Define the fetch base URL as a constant: `https://raw.githubusercontent.com/shwcsmack/c3spec/main/skills`
- [x] 4.3 On any fetch failure (network error, timeout, non-2xx), resolve that workflow's entry to `null` (caller falls back to bundled); do not throw
- [x] 4.4 In `UpdateCommand.execute()`, call the remote fetch before the skill generation loop — build a `Map<workflowId, string>` of remote content
- [x] 4.5 In the skill generation loop, if remote content is available for a workflow use it directly as the `instructions` field; otherwise use the bundled template's instructions
- [x] 4.6 When falling back to bundled for any workflow, emit a single consolidated dim warning after the update summary (not per-skill) listing the workflows that used bundled content
- [x] 4.7 Replace `generatedBy: "source"` in fetched SKILL.md frontmatter with the local `C3SPEC_VERSION` before writing to disk — or parse the frontmatter and pass instructions body + metadata through the existing `generateSkillContent()` path

## 5. Tests

- [x] 5.1 Write unit tests for `remote-skill-fetch.ts`: successful fetch returns content, HTTP 4xx returns null, timeout (mock slow response > 5s) returns null, network error returns null
- [x] 5.2 Test that the fetch fallback path in `UpdateCommand` writes the correct bundled content when all fetches return null
- [x] 5.3 Test that the dim fallback warning is displayed when any skill uses bundled content and suppressed when all fetches succeed
- [x] 5.4 Update any existing update command tests that assert specific skill file content if the fetch integration changes their behavior

## 6. Verify end-to-end

- [x] 6.1 Run `node build.js` and confirm codegen + tsc complete without errors
- [x] 6.2 Run `pnpm check:codegen` and confirm it passes (no drift)
- [x] 6.3 Run `c3spec update` in a test project and verify the written SKILL.md files contain the remotely fetched content with the local CLI version in `generatedBy`
- [x] 6.4 Simulate network failure (e.g., invalid host override) and verify the update completes with bundled content and shows the fallback warning
- [x] 6.5 Run the full test suite (`pnpm test`) and confirm no regressions
