## ADDED Requirements

### Requirement: Canonical subagent bootstrap command contract

c3spec canonical workflow surfaces SHALL depend on a stable bootstrap command contract for pre-dispatch validation.

#### Scenario: Bootstrap command contract is stable
- **WHEN** canonical workflow skills rely on subagent dispatch prerequisites
- **THEN** they SHALL invoke `c3spec subagent bootstrap --change <id>` as the pre-dispatch validation surface
- **AND** they SHALL treat the command's machine-readable output contract as stable for automation (`--json`)

#### Scenario: Distinct failure classes are available for automation
- **WHEN** bootstrap fails
- **THEN** it SHALL return distinct non-zero exit codes by failure class rather than a single generic code
- **AND** canonical skills/tests SHALL be able to branch on failure class without parsing free-form text
