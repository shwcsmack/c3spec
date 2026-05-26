## ADDED Requirements

### Requirement: Fetch skill content from GitHub on update

When a user runs `c3spec update`, the command SHALL attempt to fetch the latest skill content for each workflow from the c3spec GitHub repository before writing skill files to the user's project.

#### Scenario: Successful fetch writes remote content

- **WHEN** `c3spec update` runs and all skill fetches return HTTP 200
- **THEN** skill files written to the user's project SHALL contain the content fetched from GitHub
- **AND** the `generatedBy` frontmatter field SHALL reflect the user's locally installed CLI version

#### Scenario: Network failure falls back to bundled content

- **WHEN** `c3spec update` runs and a network error prevents fetching one or more skills
- **THEN** the update SHALL complete successfully using bundled template content for any failed skill
- **AND** a dim warning SHALL be displayed indicating that remote fetch failed and bundled content was used
- **AND** no error exit code SHALL be emitted

#### Scenario: HTTP error response falls back to bundled content

- **WHEN** `c3spec update` runs and the GitHub server returns a non-2xx response for a skill
- **THEN** the update SHALL complete successfully using bundled template content for that skill
- **AND** a dim warning SHALL be displayed

#### Scenario: Fetch timeout falls back to bundled content

- **WHEN** a skill fetch does not complete within 5 seconds
- **THEN** the update SHALL abort that fetch and use bundled template content for the timed-out skill
- **AND** a dim warning SHALL be displayed

#### Scenario: All fetches in parallel

- **WHEN** `c3spec update` fetches skill content for multiple workflows
- **THEN** all fetches SHALL be issued concurrently, not sequentially
- **AND** the total fetch time SHALL be bounded by the slowest individual fetch, not their sum

### Requirement: Fetch source is the main branch of the canonical repository

The skill fetch URL SHALL target the `main` branch of `github.com/shwcsmack/c3spec`, using the raw content delivery URL for each workflow's `SKILL.md` file.

#### Scenario: Fetch URL construction

- **WHEN** fetching the skill for workflow directory `c3spec-explore`
- **THEN** the URL used SHALL be `https://raw.githubusercontent.com/shwcsmack/c3spec/main/skills/c3spec-explore/SKILL.md`
