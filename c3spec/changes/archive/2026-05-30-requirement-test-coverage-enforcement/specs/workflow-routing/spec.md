## MODIFIED Requirements
### Requirement: [WORKFLOW-ROUTING-012] Enforcement boundaries for the routing contract
Coverage enforcement SHALL be implemented project-wide via requirement IDs and strict coverage audit.

#### Scenario: Requirement-to-test enforcement active
- **WHEN** strict coverage runs
- **THEN** uncovered, unknown, or duplicate requirement references fail validation.
