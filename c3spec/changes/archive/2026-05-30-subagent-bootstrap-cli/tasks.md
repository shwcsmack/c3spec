# Tasks: subagent-bootstrap-cli

## 1. Add bootstrap command surface
- [x] 1.1 Register `subagent bootstrap` command in CLI command tree.
- [x] 1.2 Require `--change <id>` and return usage failure class on omission.
- [x] 1.3 Wire `--json` flag handling and output mode selection.

## 2. Implement bootstrap validation engine
- [x] 2.1 Implement change resolution + tier derivation from on-disk metadata.
- [x] 2.2 Add required `runtime` check with deterministic failure reporting.
- [x] 2.3 Add required `artifacts` check aligned with tier apply-readiness requirements.
- [x] 2.4 Add required `roles` check aligned with host-adapter named-role contract.
- [x] 2.5 Add informational `memory` check (warn/pass, non-blocking).
- [x] 2.6 Implement stable check IDs, categories, and remediation payloads.

## 3. Exit-code and output contracts
- [x] 3.1 Define and centralize distinct exit-code constants by failure class.
- [x] 3.2 Implement human-readable report output with grouped check results.
- [x] 3.3 Implement stable JSON output contract (`ok`, `checks`, `failures`, `nextSteps`, context).
- [x] 3.4 Ensure required failures produce strict non-zero exit; informational-only warnings still exit 0.

## 4. Integrate bootstrap gate into dispatch paths
- [x] 4.1 Update subagent dispatch flow to run bootstrap before any implementer/reviewer dispatch.
- [x] 4.2 Ensure apply/tier handoff paths do not bypass bootstrap gate.
- [x] 4.3 Surface bootstrap failure remediation in workflow output and stop dispatch.

## 5. Update skills/docs/spec-aligned workflow text
- [x] 5.1 Update canonical skill guidance where subagent dispatch prerequisites are described.
- [x] 5.2 Align host-adapter/subagent skill wording with bootstrap command as pre-dispatch gate.
- [x] 5.3 Ensure routing/workflow docs avoid contradictory "continue anyway" behavior for bootstrap failures.

## 6. Tests
- [x] 6.1 Add command tests for required args, success path, and each failure class exit code.
- [x] 6.2 Add JSON contract tests for stable fields/check IDs/categories.
- [x] 6.3 Add integration tests proving dispatch paths halt on bootstrap failure and continue on success.
- [x] 6.4 Add tests verifying memory warnings are non-blocking.

## 7. Verification and lifecycle completion
- [x] 7.1 Run targeted tests for new command and dispatch integrations.
- [x] 7.2 Run full project test suite.
- [x] 7.3 Write `verify.md` with commands/results and residual risks.
- [x] 7.4 Produce retrospective and capture any generalizable memory.
- [ ] 7.5 Complete archive readiness checks and archive/finish branch.
