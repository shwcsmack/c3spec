## MODIFIED Requirements

### Requirement: Update Behavior

When a user runs `c3spec update`, the command SHALL refresh bundled canonical `.agents/` artifacts and regenerate selected or configured host artifacts from the canonical source of truth. Remote skill fetch behavior SHALL apply to canonical skills rather than to per-tool skill directories.

#### Scenario: Running update with configured hosts

- **WHEN** a user runs `c3spec update` in an initialized project with configured hosts
- **THEN** c3spec SHALL refresh canonical `.agents/` artifacts according to the update policy
- **AND** regenerate derived host artifacts for configured Cursor, Claude Code, and Codex hosts
- **AND** SHALL NOT generate slash-command files

#### Scenario: Running update with network available

- **WHEN** remote canonical skill fetch succeeds
- **THEN** canonical `.agents/skills/` SHALL be refreshed from the fetched content
- **AND** derived host artifacts SHALL be regenerated from those canonical skills

#### Scenario: Running update without network

- **WHEN** remote canonical skill fetch is unavailable
- **THEN** update SHALL fall back to bundled canonical skill content
- **AND** derived host artifacts SHALL be regenerated from the bundled canonical content
- **AND** update SHALL exit successfully with a dim warning

### Requirement: Tool-Agnostic Updates

The update command SHALL use the shared host generation pipeline and SHALL protect user-authored edits.

#### Scenario: Updating generated host artifacts

- **WHEN** a generated host artifact matches its last generated sentinel hash
- **THEN** update SHALL overwrite it with newly generated content

#### Scenario: Hand-edited generated artifact

- **WHEN** a generated host artifact does not match its last generated sentinel hash
- **THEN** update SHALL warn that the file appears hand-edited
- **AND** SHALL not overwrite it unless forced or confirmed

#### Scenario: Canonical artifact has local edits

- **WHEN** a canonical `.agents/` artifact differs from the bundled or fetched version
- **THEN** update SHALL treat the canonical artifact as user-authored source
- **AND** SHALL require explicit confirmation or force before replacing it

## REMOVED Requirements

### Requirement: Slash Command Updates

The update command SHALL NOT refresh slash-command files for first-class hosts.

#### Scenario: Legacy slash command file exists

- **WHEN** update finds an existing legacy c3spec slash-command file
- **THEN** update SHALL either leave it untouched or route it through legacy cleanup
- **AND** SHALL NOT treat it as an active first-class host artifact
