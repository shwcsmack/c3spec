#!/usr/bin/env node
/**
 * Ensures every required canonical skill exists under .agents/skills/.
 */

import fs from 'fs';
import path from 'path';

const REQUIRED = [
  'c3spec-start',
  'c3spec-tier1-fix',
  'c3spec-tier2-feature',
  'c3spec-tier3-full',
  'c3spec-subagent-dev',
  'c3spec-host-adapter',
  'c3spec-continue-change',
  'c3spec-apply-change',
  'c3spec-explore',
  'c3spec-sync-specs',
  'c3spec-archive-change',
  'c3spec-bulk-archive-change',
  'c3spec-verify-change',
  'c3spec-onboard',
];

const missing = [];
for (const name of REQUIRED) {
  const skillPath = path.join('.agents', 'skills', name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    missing.push(skillPath);
  }
}

if (missing.length > 0) {
  console.error('Missing canonical skills:');
  for (const entry of missing) {
    console.error(`  ${entry}`);
  }
  process.exit(1);
}

console.log(`All ${REQUIRED.length} canonical skills present under .agents/skills/`);
