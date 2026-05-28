# c3spec CLI (pi-only)

c3spec runs as a pi package. Package lifecycle is managed by pi.

## Package lifecycle

```bash
pi install npm:@shwcsmack/c3spec
pi update npm:@shwcsmack/c3spec
pi remove npm:@shwcsmack/c3spec
```

## Core c3spec commands

```bash
c3spec list
c3spec show
c3spec validate
c3spec status --change <name>
c3spec instructions --change <name>
c3spec new change <name>
c3spec archive <name>
c3spec sync
```

## Notes

- `c3spec init` and `c3spec update` are removed in pi-only mode.
- Use `/c3spec:start` in pi for workflow routing.
