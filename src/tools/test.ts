/**
 * audit_test tool implementation.
 *
 * Purpose: Run unit tests and return structured results with failing test details.
 * This tool executes the project's test suite and parses output for actionable information.
 *
 * When to use:
 * - After a successful build to verify test coverage
 * - To identify which tests are failing and why
 * - To understand what behaviors are already tested
 *
 * When NOT to use:
 * - Before building the project (build first to catch compile errors)
 * - For invariant/fuzz tests specifically (use audit_invariants instead)
 *
 * Parameters:
 * - projectPath: Path to the project root directory
 * - match: Optional pattern to filter tests (e.g., "testTransfer", "Vault")
 * - extraArgs: Additional arguments to pass to the test command
 */

import type { TestInput, TestOutput } from "../schemas.js";
import {
  validateProjectPath,
  isFoundryProject,
  isHardhatProject,
  execCommand,
  parseFoundryTestOutput,
  truncate,
} from "./utils.js";

/**
 * Runs unit tests and returns structured results.
 */
export async function runTests(input: TestInput): Promise<TestOutput> {
  const projectPath = await validateProjectPath(input.projectPath);
  const match = input.match ?? null;
  const extraArgs = input.extraArgs ?? [];

  // Determine project type and build command
  let testCmd: string;
  let testArgs: string[];

  if (await isFoundryProject(projectPath)) {
    testCmd = "forge";
    testArgs = ["test", "-vvv"];

    if (match) {
      testArgs.push("--match-test", match);
    }

    // Add extra args
    testArgs.push(...extraArgs);
  } else if (await isHardhatProject(projectPath)) {
    testCmd = "npx";
    testArgs = ["hardhat", "test"];

    if (match) {
      testArgs.push("--grep", match);
    }

    testArgs.push(...extraArgs);
  } else {
    return {
      ok: false,
      totalTests: 0,
      passedTests: 0,
      failingTests: [{
        name: "N/A",
        file: "",
        reason: "Could not detect project type. No foundry.toml or hardhat.config found.",
      }],
      failingTraces: [],
      summary: "Tests failed: Unknown project type",
    };
  }

  // Execute test command with extended timeout (5 minutes for tests)
  const result = await execCommand(testCmd, testArgs, projectPath, 300_000);
  const output = result.stdout + "\n" + result.stderr;

  if (result.timedOut) {
    return {
      ok: false,
      totalTests: 0,
      passedTests: 0,
      failingTests: [{
        name: "TIMEOUT",
        file: "",
        reason: "Test execution timed out after 5 minutes",
      }],
      failingTraces: [truncate(output, 2000)],
      summary: "Tests timed out",
    };
  }

  // Parse output based on test framework
  if (testCmd === "forge") {
    const parsed = parseFoundryTestOutput(output);

    const failingTests = parsed.tests
      .filter(t => !t.passed)
      .map(t => ({
        name: t.name,
        file: t.file,
        reason: t.reason || "Test failed",
      }));

    return {
      ok: parsed.failed === 0,
      totalTests: parsed.total,
      passedTests: parsed.passed,
      failingTests,
      failingTraces: parsed.traces,
      summary: parsed.failed === 0
        ? `All ${parsed.total} tests passed`
        : `${parsed.failed}/${parsed.total} tests failed`,
    };
  } else {
    // Parse Hardhat/Mocha output
    const failingTests: TestOutput["failingTests"] = [];
    const failingTraces: string[] = [];

    // Match failing tests: X) test description
    const failPattern = /\d+\)\s+([^\n]+)\n\s*([^\n]+)/g;
    for (const match of output.matchAll(failPattern)) {
      failingTests.push({
        name: match[1].trim(),
        file: "",
        reason: match[2].trim(),
      });
    }

    // Parse summary: X passing, Y failing
    const summaryMatch = output.match(/(\d+)\s+passing.*?(\d+)\s+failing/s);
    const passMatch = output.match(/(\d+)\s+passing/);

    let totalTests = 0;
    let passedTests = 0;

    if (summaryMatch) {
      passedTests = parseInt(summaryMatch[1], 10);
      const failed = parseInt(summaryMatch[2], 10);
      totalTests = passedTests + failed;
    } else if (passMatch) {
      passedTests = parseInt(passMatch[1], 10);
      totalTests = passedTests + failingTests.length;
    }

    // Extract error traces
    const tracePattern = /Error:([^\n]+(?:\n\s+at[^\n]+)*)/g;
    for (const match of output.matchAll(tracePattern)) {
      failingTraces.push(truncate(match[0], 1000));
    }

    const ok = failingTests.length === 0 && result.exitCode === 0;

    return {
      ok,
      totalTests,
      passedTests,
      failingTests,
      failingTraces,
      summary: ok
        ? `All ${totalTests} tests passed`
        : `${failingTests.length} test(s) failed`,
    };
  }
}
