## MODIFIED Requirements

### Requirement: Generated host instruction alignment

Generated host instructions SHALL describe c3spec as an opinionated workflow contract without schema customization entry points.

#### Scenario: No schema customization front door in generated instructions

- **WHEN** generated host instructions describe workflow entry
- **THEN** they SHALL direct users to canonical c3spec skills and tiers
- **AND** they SHALL NOT require schema selection or schema-specific workflow switching for normal development flow
