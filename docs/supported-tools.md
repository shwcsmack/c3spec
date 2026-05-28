# Supported Runtime

c3spec is **pi-only**.

## Runtime contract

- Supported runtime: **pi**
- Canonical skills live under `.agents/skills/`
- c3spec package lifecycle is managed by pi:
  - install: `pi install ...`
  - update: `pi update ...`
  - remove: `pi remove ...`

## Package setup

Install globally:

```bash
pi install npm:@shwcsmack/c3spec
```

Install project-local:

```bash
pi install -l npm:@shwcsmack/c3spec
```

## Notes

- `c3spec init` and `c3spec update` are removed in pi-only mode.
- If project scaffolding is missing (`c3spec/changes`, `c3spec/specs`, `c3spec/memory`), create it via normal c3spec workflow commands and committed project structure.

## Related

- [CLI Reference](cli.md)
- [Getting Started](getting-started.md)
