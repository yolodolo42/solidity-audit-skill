/**
 * Utility functions for the Solidity Audit MCP tools.
 * Provides path validation, command execution, and output parsing.
 */

import { spawn } from "child_process";
import { access, readFile, readdir } from "fs/promises";
import { join, resolve, isAbsolute } from "path";

// ============================================================================
// Constants
// ============================================================================

/** Allowlisted commands that can be executed */
const ALLOWED_COMMANDS = new Set(["forge", "npx", "npm", "yarn", "pnpm"]);

/** Maximum output size to capture (10KB) */
const MAX_OUTPUT_SIZE = 10 * 1024;

/** Default command timeout (2 minutes) */
const DEFAULT_TIMEOUT_MS = 120_000;

/** Patterns that might indicate secrets in output */
const SECRET_PATTERNS = [
  /0x[a-fA-F0-9]{64}/g,  // Private keys (64 hex chars)
  /(?:api[_-]?key|apikey|secret|password|token)[=:]["']?[\w\-]+["']?/gi,
  /(?:PRIVATE[_-]?KEY|MNEMONIC)[=:]["']?[\w\s]+["']?/gi,
];

// ============================================================================
// Path Validation
// ============================================================================

/**
 * Validates and resolves a project path.
 * Ensures the path exists and is a directory.
 * Prevents path traversal attacks.
 */
export async function validateProjectPath(projectPath: string): Promise<string> {
  // Resolve to absolute path
  const absolutePath = isAbsolute(projectPath)
    ? projectPath
    : resolve(process.cwd(), projectPath);

  // Check for path traversal attempts
  const normalizedPath = resolve(absolutePath);
  if (normalizedPath.includes("..")) {
    throw new Error(`Invalid path: path traversal not allowed`);
  }

  // Verify the path exists and is accessible
  try {
    await access(absolutePath);
  } catch {
    throw new Error(`Path does not exist or is not accessible: ${projectPath}`);
  }

  return absolutePath;
}

/**
 * Checks if a file exists at the given path.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a file and returns its contents, or null if it doesn't exist.
 */
export async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

// ============================================================================
// Command Execution
// ============================================================================

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

/**
 * Validates that a command is in the allowlist.
 * Throws if the command is not allowed.
 */
export function validateCommand(cmd: string): void {
  if (!ALLOWED_COMMANDS.has(cmd)) {
    throw new Error(
      `Command not allowed: ${cmd}. Only ${Array.from(ALLOWED_COMMANDS).join(", ")} are permitted.`
    );
  }
}

/**
 * Validates command arguments for safety.
 * Rejects arguments that could be used for injection.
 */
export function validateArgs(args: string[]): void {
  for (const arg of args) {
    // Reject shell metacharacters and dangerous patterns
    if (/[;&|`$(){}[\]<>\\]/.test(arg)) {
      throw new Error(`Invalid argument: contains shell metacharacters: ${arg}`);
    }
    // Reject arguments that look like they're trying to escape
    if (arg.includes("\0") || arg.includes("\n") || arg.includes("\r")) {
      throw new Error(`Invalid argument: contains null or newline characters`);
    }
  }
}

/**
 * Executes a command with the given arguments.
 * Only allows commands from the ALLOWED_COMMANDS set.
 * Enforces timeouts and output size limits.
 */
export async function execCommand(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ExecResult> {
  // Validate command and arguments
  validateCommand(cmd);
  validateArgs(args);

  return new Promise((resolvePromise) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn(cmd, args, {
      cwd,
      shell: false, // Explicitly disable shell to prevent injection
      env: {
        ...process.env,
        // Ensure consistent output formatting
        FORCE_COLOR: "0",
        NO_COLOR: "1",
      },
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      // Force kill after 5 seconds if still running
      setTimeout(() => proc.kill("SIGKILL"), 5000);
    }, timeoutMs);

    proc.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      if (stdout.length + chunk.length <= MAX_OUTPUT_SIZE) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_SIZE) {
        stdout += chunk.slice(0, MAX_OUTPUT_SIZE - stdout.length);
        stdout += "\n[Output truncated...]";
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const chunk = data.toString();
      if (stderr.length + chunk.length <= MAX_OUTPUT_SIZE) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_SIZE) {
        stderr += chunk.slice(0, MAX_OUTPUT_SIZE - stderr.length);
        stderr += "\n[Output truncated...]";
      }
    });

    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      resolvePromise({
        stdout: redactSecrets(stdout),
        stderr: redactSecrets(stderr),
        exitCode: code ?? (timedOut ? 124 : 1),
        timedOut,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeoutId);
      resolvePromise({
        stdout: "",
        stderr: `Failed to execute command: ${err.message}`,
        exitCode: 1,
        timedOut: false,
      });
    });
  });
}

// ============================================================================
// Output Processing
// ============================================================================

/**
 * Redacts potential secrets from output.
 */
export function redactSecrets(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

/**
 * Truncates a string to the given maximum length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 20) + "\n[Truncated...]";
}

/**
 * Extracts Solidity version hints from content.
 */
export function extractSolidityVersions(content: string): string[] {
  const versions = new Set<string>();

  // Match pragma statements
  const pragmaMatches = content.matchAll(/pragma\s+solidity\s+([^;]+);/g);
  for (const match of pragmaMatches) {
    versions.add(match[1].trim());
  }

  // Match version specifications in config files
  const versionMatches = content.matchAll(/["']?solidity["']?\s*[:=]\s*["']([^"']+)["']/g);
  for (const match of versionMatches) {
    versions.add(match[1].trim());
  }

  return Array.from(versions);
}

// ============================================================================
// Project Detection Helpers
// ============================================================================

/**
 * Checks if the project is a Foundry project.
 */
export async function isFoundryProject(projectPath: string): Promise<boolean> {
  const foundryToml = join(projectPath, "foundry.toml");
  return await fileExists(foundryToml);
}

/**
 * Checks if the project is a Hardhat project.
 */
export async function isHardhatProject(projectPath: string): Promise<boolean> {
  const hardhatConfig = join(projectPath, "hardhat.config.ts");
  const hardhatConfigJs = join(projectPath, "hardhat.config.js");
  return (await fileExists(hardhatConfig)) || (await fileExists(hardhatConfigJs));
}

/**
 * Finds all Solidity files in a directory.
 */
export async function findSolidityFiles(
  projectPath: string,
  maxFiles: number = 100
): Promise<string[]> {
  const files: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    if (files.length >= maxFiles) return;

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= maxFiles) return;

        const fullPath = join(dir, entry.name);

        // Skip node_modules, lib, and hidden directories
        if (entry.isDirectory()) {
          if (!["node_modules", "lib", "cache", "out", "artifacts"].includes(entry.name) &&
              !entry.name.startsWith(".")) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith(".sol")) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  await scanDir(projectPath);
  return files;
}

// ============================================================================
// Output Parsing
// ============================================================================

/**
 * Parses Foundry build output for errors and warnings.
 */
export function parseFoundryBuildOutput(output: string): {
  errors: Array<{ file: string; line: number; message: string; severity: "error" | "warning" }>;
  warnings: Array<{ file: string; line: number; message: string }>;
} {
  const errors: Array<{ file: string; line: number; message: string; severity: "error" | "warning" }> = [];
  const warnings: Array<{ file: string; line: number; message: string }> = [];

  // Match Foundry error pattern: Error: ... --> file:line:col
  const errorPattern = /Error[:\s]+([^\n]+)\n\s*-->\s*([^:]+):(\d+):\d+/g;
  for (const match of output.matchAll(errorPattern)) {
    errors.push({
      file: match[2],
      line: parseInt(match[3], 10),
      message: match[1].trim(),
      severity: "error",
    });
  }

  // Match warning pattern
  const warningPattern = /Warning[:\s]+([^\n]+)\n\s*-->\s*([^:]+):(\d+):\d+/g;
  for (const match of output.matchAll(warningPattern)) {
    warnings.push({
      file: match[2],
      line: parseInt(match[3], 10),
      message: match[1].trim(),
    });
  }

  return { errors, warnings };
}

/**
 * Parses Foundry test output for failing tests.
 */
export function parseFoundryTestOutput(output: string): {
  total: number;
  passed: number;
  failed: number;
  tests: Array<{ name: string; file: string; reason: string; passed: boolean }>;
  traces: string[];
} {
  const tests: Array<{ name: string; file: string; reason: string; passed: boolean }> = [];
  const traces: string[] = [];

  // Match test results: [PASS] testName() or [FAIL. reason] testName()
  const testPattern = /\[(PASS|FAIL[^\]]*)\]\s+(\w+)\s*\(/g;
  for (const match of output.matchAll(testPattern)) {
    const passed = match[1] === "PASS";
    const name = match[2];
    let reason = "";

    if (!passed && match[1].includes(":")) {
      reason = match[1].replace("FAIL.", "").trim();
    }

    tests.push({
      name,
      file: "", // Foundry doesn't always show file in output
      reason,
      passed,
    });
  }

  // Extract traces for failures
  const tracePattern = /Traces:\s*([\s\S]*?)(?=\n\n|\[|$)/g;
  for (const match of output.matchAll(tracePattern)) {
    if (match[1].trim()) {
      traces.push(truncate(match[1].trim(), 2000));
    }
  }

  // Parse summary line: Ran X tests for ... : Y passed; Z failed
  const summaryMatch = output.match(/(\d+)\s+passed[,;]\s*(\d+)\s+failed/);
  const passed = summaryMatch ? parseInt(summaryMatch[1], 10) : tests.filter(t => t.passed).length;
  const failed = summaryMatch ? parseInt(summaryMatch[2], 10) : tests.filter(t => !t.passed).length;

  return {
    total: passed + failed,
    passed,
    failed,
    tests,
    traces,
  };
}

/**
 * Parses Foundry invariant test output for violations.
 */
export function parseFoundryInvariantOutput(output: string): {
  ok: boolean;
  violations: Array<{ invariant: string; file: string; details: string }>;
  seeds: string[];
  steps: string[];
} {
  const violations: Array<{ invariant: string; file: string; details: string }> = [];
  const seeds: string[] = [];
  const steps: string[] = [];

  // Check for invariant failures
  const ok = !output.includes("[FAIL]") && !output.includes("Invariant");

  // Match invariant violations
  const violationPattern = /\[FAIL[^\]]*\]\s+(invariant_?\w*)/g;
  for (const match of output.matchAll(violationPattern)) {
    violations.push({
      invariant: match[1],
      file: "",
      details: "Invariant violation detected",
    });
  }

  // Extract counterexample seeds
  const seedPattern = /Sequence:\s*\n([\s\S]*?)(?=\n\n|$)/g;
  for (const match of output.matchAll(seedPattern)) {
    steps.push(truncate(match[1].trim(), 1000));
  }

  // Extract fuzz seed if present
  const fuzzSeedMatch = output.match(/seed[=:]\s*(\d+)/i);
  if (fuzzSeedMatch) {
    seeds.push(fuzzSeedMatch[1]);
  }

  return { ok, violations, seeds, steps };
}
