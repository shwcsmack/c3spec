# Design

## Contracts
- Spec header format: `### Requirement: [PREFIX-NNN] ...`
- Test link format: `requirement: PREFIX-NNN`
- Strict mode fails on: missing IDs, uncovered IDs, unknown refs, duplicate IDs.

## Rollout
1. Introduce coverage command + baseline.
2. Migrate IDs into all specs.
3. Annotate tests and ratchet baseline by family.
4. Clear baseline exemptions and enforce strict unknown refs.
