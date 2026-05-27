#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const workflowsDir = path.join('src/core/templates/workflows');
const commandsDir = path.join('src/core/templates/commands');

fs.mkdirSync(commandsDir, { recursive: true });

for (const file of fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.ts'))) {
  const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
  const match = content.match(/export function getOpsx[\s\S]*$/);
  if (!match) {
    console.log(`skip ${file} (no command template)`);
    continue;
  }

  const out = `/**
 * Slash-command template for ${file.replace('.ts', '')}.
 */

import type { CommandTemplate } from '../types.js';

${match[0]}
`;
  fs.writeFileSync(path.join(commandsDir, file), out);
  console.log(`wrote commands/${file}`);
}
