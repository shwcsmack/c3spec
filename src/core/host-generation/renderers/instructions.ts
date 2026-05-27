import { C3SPEC_MARKERS } from '../../config.js';

const ROUTING_BODY = `# C3Spec Workflow Routing

This project uses c3spec for spec-driven development across Cursor, Claude Code, and Codex.

## Step 0 — Memory scan

On every session start, load the project memory index:

\`\`\`bash
cat c3spec/memory/MEMORY.md
\`\`\`

Scan the index for entries relevant to the current work and load relevant memory files before planning or implementing.

## Single front door

All development work enters through the \`c3spec-start\` skill. Do not pick a tier yourself — interview the user and route to the correct workflow.

| Tier | When | Entry |
| --- | --- | --- |
| T1 Spec-Aware Fix | Bug fix, investigation, config tweak | Inline fix workflow |
| T2 Lightweight Feature | New capability, clear scope | \`c3spec-tier2-feature\` |
| T3 Full Workflow | Design uncertainty, architecture, breaking change | \`c3spec-tier3-full\` |

## Subagent roles

Dispatch named agents for implementation and review:

- \`implementer\` — one bounded task at a time
- \`spec-reviewer\` — verify against proposal, design, specs, and tasks
- \`quality-reviewer\` — review correctness, tests, maintainability, and generated artifact drift

Consult \`c3spec-host-adapter\` for host-specific invocation details.

## Canonical source

Skills and hook sources live under \`.agents/\`. Generated host artifacts are derived and protected by c3spec sentinels — edit canonical files instead of generated copies.`;

export function buildManagedInstructionBlock(): string {
  return `${C3SPEC_MARKERS.start}
${ROUTING_BODY}
${C3SPEC_MARKERS.end}`;
}

export function buildInstructionDocument(): string {
  return `${buildManagedInstructionBlock()}\n`;
}
