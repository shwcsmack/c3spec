# Retrospective: one-question-interviews

## Evidence

- 4 canonical tier/start skills updated + 4 legacy `skills/` mirrors
- `workflow-routing` spec gained `One-question interview pacing` requirement (6 scenarios)
- New test: `workflow-routing-interview-pacing.test.ts` (5 cases)
- Full suite: 1422 tests passed (1417 baseline + 5 new)

## What worked

- Existing `workflow-routing` spec made the delta small — ADDED only, no classifier churn
- Memory note on two pipelines prevented editing only `.agents/` and missing `skills/` duplicates
- `c3spec update` regenerated Claude/Cursor/Codex host skills in one step

## What didn't

- Initial test assertion was too strict (`numbered question` vs `numbered interview questions` wording)

## Learning

- none that generalizes — workflow copy change with straightforward dual-pipeline mirroring
