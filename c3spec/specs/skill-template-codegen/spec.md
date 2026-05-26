# Skill Template Codegen Specification

## Purpose

Keep raw skill markdown files as the editable source of truth while generating TypeScript template functions used by the bundled CLI fallback.

## Requirements

### Requirement: Raw skill markdown files are the single source of truth

The repository SHALL maintain a `skills/` directory at the project root containing one subdirectory per workflow, each with a `SKILL.md` file. These files SHALL be the authoritative source for skill content. The TypeScript template functions in `src/core/templates/workflows/` SHALL be generated artifacts derived from these files and SHALL NOT be edited directly.

#### Scenario: Skill directory structure

- **WHEN** a developer inspects the repository
- **THEN** each workflow's skill content SHALL exist as `skills/<workflow-dir>/SKILL.md`
- **AND** the `generatedBy` frontmatter field in these files SHALL be the placeholder value `"source"`

#### Scenario: TypeScript templates are not hand-edited

- **WHEN** a developer wants to change skill content
- **THEN** they SHALL edit `skills/<workflow-dir>/SKILL.md`
- **AND** run `node build.js` to regenerate the TypeScript template functions
- **AND** the TypeScript files SHALL reflect the updated content after the build

### Requirement: Build pipeline regenerates TypeScript templates from markdown source

Running `node build.js` SHALL execute the codegen step before TypeScript compilation. The codegen step SHALL read each `skills/<workflow-dir>/SKILL.md` file, parse its frontmatter and body, and write the corresponding TypeScript template function in `src/core/templates/workflows/`.

#### Scenario: Build runs codegen before tsc

- **WHEN** a developer runs `node build.js`
- **THEN** the codegen script SHALL execute first
- **AND** TypeScript compilation SHALL run after codegen completes
- **AND** the compiled output SHALL reflect the current state of the `skills/` directory

#### Scenario: Codegen overwrites generated TypeScript

- **WHEN** the codegen step runs
- **THEN** each `src/core/templates/workflows/<workflow>.ts` file SHALL be overwritten with content derived from its corresponding `skills/<workflow-dir>/SKILL.md`
- **AND** any manual edits to those TypeScript files SHALL be lost

### Requirement: CI enforces no drift between source and generated files

The CI pipeline SHALL include a step that runs the codegen script and asserts that no tracked files were modified. If the committed TypeScript templates do not match what codegen would produce from the current `skills/` files, the CI check SHALL fail.

#### Scenario: CI detects uncommitted drift

- **WHEN** a pull request modifies a `skills/<workflow-dir>/SKILL.md` without regenerating the TypeScript
- **THEN** the CI drift check SHALL fail
- **AND** the failure message SHALL indicate which generated files are out of sync

#### Scenario: CI passes when source and generated files are in sync

- **WHEN** the committed TypeScript templates match what codegen produces from the `skills/` directory
- **THEN** the CI drift check SHALL pass
