## MODIFIED Requirements

### Requirement: Update Behavior

When a user runs `c3spec update`, the command SHALL attempt to fetch the latest skill content from the c3spec GitHub repository. If all fetches succeed, the fetched content SHALL be used to write skill files. If any fetch fails, the command SHALL fall back to bundled template content for that skill and complete successfully.

#### Scenario: Running update command with network available

- **WHEN** a user runs `c3spec update` and the network is reachable
- **THEN** skill files in the user's project SHALL be written with content fetched from the canonical GitHub repository
- **AND** the `generatedBy` frontmatter field SHALL reflect the locally installed CLI version
- **AND** a success message SHALL be displayed

#### Scenario: Running update command without network

- **WHEN** a user runs `c3spec update` and the network is unavailable
- **THEN** skill files SHALL be written using bundled template content
- **AND** a dim warning SHALL be displayed indicating that remote fetch was unavailable
- **AND** the command SHALL exit successfully
