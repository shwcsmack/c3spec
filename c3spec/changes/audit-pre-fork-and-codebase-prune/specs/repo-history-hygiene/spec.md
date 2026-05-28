## ADDED Requirements

### Requirement: Pre-Fork Archive Pruning
The repository SHALL support pruning inherited pre-fork archive entries while preserving c3spec-era archive history.

#### Scenario: Remove pre-fork archive entries by approved retention policy
- **GIVEN** archive entries classified as pre-fork by approved policy
- **WHEN** cleanup is executed
- **THEN** pre-fork archive entries are removed from `c3spec/changes/archive/`
- **AND** c3spec-era archive entries remain

### Requirement: Active Change Preservation
The repository SHALL preserve active c3spec change folders during history pruning.

#### Scenario: Active root-level change folders are retained
- **GIVEN** active folders under `c3spec/changes/` excluding `archive/`
- **WHEN** pre-fork archive pruning runs
- **THEN** active root-level folders are not deleted by the archive prune procedure
