#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

function findMemoryIndex(startDir) {
  let dir = resolve(startDir);

  while (true) {
    const memoryPath = join(dir, 'c3spec', 'memory', 'MEMORY.md');
    if (existsSync(memoryPath)) {
      return memoryPath;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

const memoryPath = findMemoryIndex(process.cwd());

if (!memoryPath) {
  console.log('c3spec memory: no project root found (missing c3spec/memory/MEMORY.md)');
  process.exit(0);
}

console.log(`c3spec memory index (${memoryPath}):`);

try {
  const content = readFileSync(memoryPath, 'utf8').trimEnd();
  console.log(content.length > 0 ? content : '(empty index)');
} catch {
  console.log('(unable to read memory index)');
  process.exit(1);
}
