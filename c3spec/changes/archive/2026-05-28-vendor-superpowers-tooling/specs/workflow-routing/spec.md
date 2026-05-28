## MODIFIED Requirements

### Requirement: Canonical skill and review-agent surfaces

The workflow-routing contract SHALL include local c3spec-owned replacements for critical external superpowers dependencies used by tier/archive workflows.

#### Scenario: Tier workflows invoke local vendored workspace skill

- **WHEN** a tier workflow performs worktree setup
- **THEN** it SHALL invoke `c3spec-using-git-worktrees`
- **AND** it SHALL NOT require external `superpowers:using-git-worktrees` availability for critical-path execution

#### Scenario: Archive and tier endgame invoke local vendored finish skill

- **WHEN** tier or archive flow performs branch finalization
- **THEN** it SHALL invoke `c3spec-finishing-development-branch`
- **AND** it SHALL NOT require external `superpowers:finishing-a-development-branch` availability for critical-path execution
