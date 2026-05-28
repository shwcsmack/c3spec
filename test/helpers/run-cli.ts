import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CommanderError } from 'commander';
import { createProgram } from '../../src/cli/program.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const cliEntry = path.join(projectRoot, 'dist', 'cli', 'index.js');

let buildPromise: Promise<void> | undefined;

interface RunCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface RunCLIOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  timeoutMs?: number;
  mode?: 'in-process' | 'subprocess';
}

export interface RunCLIResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  command: string;
}

class InterceptedProcessExit extends Error {
  constructor(public readonly exitCode: number | null) {
    super(`Intercepted process.exit(${exitCode ?? 'null'})`);
  }
}

function runCommand(command: string, args: string[], options: RunCommandOptions = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? projectRoot,
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(new Error(`Command failed (${reason}): ${command} ${args.join(' ')}`));
      }
    });
  });
}

export async function ensureCliBuilt() {
  if (existsSync(cliEntry)) {
    return;
  }

  if (!buildPromise) {
    buildPromise = runCommand('pnpm', ['run', 'build']).catch((error) => {
      buildPromise = undefined;
      throw error;
    });
  }

  await buildPromise;

  if (!existsSync(cliEntry)) {
    throw new Error('CLI entry point missing after build. Expected dist/cli/index.js');
  }
}

async function runCLIInProcess(args: string[], options: RunCLIOptions): Promise<RunCLIResult> {
  const finalArgs = Array.isArray(args) ? args : [args];
  const command = `node src/cli/index.ts ${finalArgs.join(' ')}`;

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalExit = process.exit;
  const originalExitCode = process.exitCode;
  const originalCwd = process.cwd();

  let stdout = '';
  let stderr = '';

  const envOverrides: Record<string, string | undefined> = {
    OPEN_SPEC_INTERACTIVE: '0',
    ...options.env,
  };

  const previousEnvValues = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(envOverrides)) {
    previousEnvValues.set(key, process.env[key]);
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  process.stdout.write = ((chunk: any, encoding?: any, cb?: any) => {
    stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString(encoding ?? 'utf-8');
    if (typeof cb === 'function') cb();
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: any, encoding?: any, cb?: any) => {
    stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString(encoding ?? 'utf-8');
    if (typeof cb === 'function') cb();
    return true;
  }) as typeof process.stderr.write;

  console.log = (...parts: unknown[]) => {
    stdout += `${parts.map((part) => String(part)).join(' ')}\n`;
  };
  console.error = (...parts: unknown[]) => {
    stderr += `${parts.map((part) => String(part)).join(' ')}\n`;
  };
  console.warn = (...parts: unknown[]) => {
    stderr += `${parts.map((part) => String(part)).join(' ')}\n`;
  };
  console.info = (...parts: unknown[]) => {
    stdout += `${parts.map((part) => String(part)).join(' ')}\n`;
  };

  process.exit = ((code?: number | null) => {
    throw new InterceptedProcessExit(code ?? process.exitCode ?? 0);
  }) as typeof process.exit;

  if (options.cwd) {
    process.chdir(options.cwd);
  }

  let exitCode: number | null = 0;
  let observedExitCode: number | undefined;
  const start = Date.now();

  try {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(['node', 'c3spec', ...finalArgs]);
  } catch (error) {
    if (error instanceof InterceptedProcessExit) {
      exitCode = error.exitCode;
    } else if (error instanceof CommanderError) {
      exitCode = typeof error.exitCode === 'number' ? error.exitCode : 1;
    } else {
      exitCode = typeof process.exitCode === 'number' ? process.exitCode : 1;
      const message = error instanceof Error ? error.message : String(error);
      stderr += stderr.endsWith('\n') || stderr.length === 0 ? `${message}\n` : `\n${message}\n`;
    }
  } finally {
    observedExitCode = process.exitCode;

    if (options.cwd) {
      process.chdir(originalCwd);
    }

    process.stdout.write = originalStdoutWrite as typeof process.stdout.write;
    process.stderr.write = originalStderrWrite as typeof process.stderr.write;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    process.exit = originalExit;
    process.exitCode = originalExitCode;

    for (const [key, previous] of previousEnvValues.entries()) {
      if (typeof previous === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    }
  }

  if ((exitCode === 0 || exitCode === null) && typeof observedExitCode === 'number' && observedExitCode !== 0) {
    exitCode = observedExitCode;
  }

  const elapsed = Date.now() - start;

  return {
    exitCode,
    signal: null,
    stdout,
    stderr,
    timedOut: typeof options.timeoutMs === 'number' ? elapsed > options.timeoutMs : false,
    command,
  };
}

async function runCLIInSubprocess(args: string[], options: RunCLIOptions): Promise<RunCLIResult> {
  await ensureCliBuilt();

  const finalArgs = Array.isArray(args) ? args : [args];
  const invocation = [cliEntry, ...finalArgs].join(' ');

  return new Promise<RunCLIResult>((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...finalArgs], {
      cwd: options.cwd ?? projectRoot,
      env: {
        ...process.env,
        OPEN_SPEC_INTERACTIVE: '0',
        ...options.env,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    child.unref();

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = options.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, options.timeoutMs)
      : undefined;

    child.stdout?.setEncoding('utf-8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr?.setEncoding('utf-8');
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      child.stdout?.destroy();
      child.stderr?.destroy();
      child.stdin?.destroy();
      reject(error);
    });

    child.on('close', (code, signal) => {
      if (timeout) clearTimeout(timeout);
      child.stdout?.destroy();
      child.stderr?.destroy();
      child.stdin?.destroy();
      resolve({
        exitCode: code,
        signal,
        stdout,
        stderr,
        timedOut,
        command: `node ${invocation}`,
      });
    });

    if (options.input && child.stdin) {
      child.stdin.end(options.input);
    } else if (child.stdin) {
      child.stdin.end();
    }
  });
}

export async function runCLI(args: string[] = [], options: RunCLIOptions = {}): Promise<RunCLIResult> {
  const defaultMode = process.env.C3SPEC_RUNCLI_MODE === 'subprocess' ? 'subprocess' : 'in-process';
  const mode = options.mode ?? defaultMode;

  if (mode === 'subprocess') {
    return runCLIInSubprocess(args, options);
  }

  return runCLIInProcess(args, options);
}

export const cliProjectRoot = projectRoot;
