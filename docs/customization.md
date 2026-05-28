# Customization (pi-only)

c3spec customization is driven by:

- canonical skills under `.agents/skills/`
- project artifacts under `c3spec/`
- pi package lifecycle and pi runtime behavior

## Package lifecycle

```bash
pi install npm:@shwcsmack/c3spec
pi update npm:@shwcsmack/c3spec
```

## Project-level adjustments

- Update workflow guidance in canonical skills
- Update specs in `c3spec/specs/`
- Keep changes in `c3spec/changes/`

Legacy multi-host command-generation customization is not part of pi-only c3spec.
