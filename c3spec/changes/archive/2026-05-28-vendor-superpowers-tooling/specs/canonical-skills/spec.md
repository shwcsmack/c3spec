## MODIFIED Requirements

### Requirement: Required canonical skills are enforced

Host generation and validation SHALL require the tier routing skills, tier lifecycle contract, resumption helpers, utility skills, and local replacements for critical superpowers dependencies: `c3spec-using-git-worktrees` and `c3spec-finishing-development-branch`.

#### Scenario: Validation fails when vendored critical skill is missing

- **WHEN** `discoverCanonicalArtifacts` runs and `c3spec-using-git-worktrees` or `c3spec-finishing-development-branch` is absent
- **THEN** validation SHALL report a missing required canonical skill error
- **AND** host artifacts SHALL NOT be generated as fully valid
