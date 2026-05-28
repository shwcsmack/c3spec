# Getting Started (pi-only)

c3spec runs in pi as a package.

## 1) Install

```bash
pi install npm:@shwcsmack/c3spec
```

## 2) Start workflow

In pi:

```text
/c3spec:start
```

## 3) Follow tier routing

c3spec routes to Research / T1 / T2 / T3 and drives artifact creation in `c3spec/changes/`.

## 4) Use CLI helpers

```bash
c3spec list
c3spec status --change <name>
c3spec validate
c3spec archive <name>
```
