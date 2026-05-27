import { defineConfig } from 'vitest/config';
import os from 'node:os';

function resolveMaxWorkers(): number | undefined {
  // Allow callers (CI/agents) to override without editing config.
  const raw = process.env.VITEST_MAX_WORKERS;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Vitest v3 defaults to `pool: "forks"` and scales worker processes with CPU.
  // This repo's tests can spawn many Node processes (CLI invocations, temp FS),
  // so cap parallelism to avoid runaway CPU/memory usage in automation.
  const cpuCount = typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
  return Math.min(4, Math.max(1, cpuCount));
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './vitest.setup.ts',
    // Tests rely on per-file process isolation (e.g., `process.cwd()` assumptions).
    pool: 'forks',
    maxWorkers: resolveMaxWorkers(),
    include: ['test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'bin/',
        '*.config.ts',
        'build.js',
        'test/**'
      ]
    },
    // Some tests (workspace, validate, artifact-workflow, cli-e2e) drive the
    // CLI by spawning `dist/cli/index.js` as a subprocess via the runCLI
    // helper. Cold-start of a Node subprocess plus the project's import graph
    // costs ~0.5-1.5s per invocation; tests with 5-10 runCLI calls reliably
    // bust a 10s timeout when CPU is contested by parallel workers. Keep
    // headroom at 30s here; see IDEAS.md #15 for the deeper in-process
    // refactor that would let us drop this back to the vitest default.
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 3000
  }
});
