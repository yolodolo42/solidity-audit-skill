/**
 * audit_invariants tool implementation.
 *
 * Purpose: Run invariant/fuzz tests and return structured results with reproduction guidance.
 * This tool specifically targets invariant tests which verify properties that should always hold.
 *
 * When to use:
 * - After running regular unit tests to check for deeper issues
 * - To find edge cases that unit tests might miss
 * - When auditing contracts with complex state transitions
 *
 * When NOT to use:
 * - For regular unit tests (use audit_test instead)
 * - On Hardhat projects (Hardhat doesn't have built-in invariant testing)
 * - Before building the project
 *
 * Parameters:
 * - projectPath: Path to the project root directory
 * - extraArgs: Additional arguments to pass to the invariant test command
 *
 * Note: This tool is primarily designed for Foundry projects. For Hardhat projects,
 * consider using external fuzzing tools like Echidna or Foundry for fuzz testing.
 */

import type { InvariantsInput, InvariantsOutput } from "../schemas.js";
import {
  validateProjectPath,
  isFoundryProject,
  isHardhatProject,
  execCommand,
  parseFoundryInvariantOutput,
  truncate,
} from "./utils.js";

/**
 * Runs invariant tests and returns structured results.
 */
export async function runInvariants(input: InvariantsInput): Promise<InvariantsOutput> {
  const projectPath = await validateProjectPath(input.projectPath);
  const extraArgs = input.extraArgs ?? [];

  // Check project type
  if (await isHardhatProject(projectPath) && !(await isFoundryProject(projectPath))) {
    return {
      ok: true,
      violations: [],
      seedHints: [],
      reproductionSteps: [
        "Hardhat does not have built-in invariant testing.",
        "Consider using Foundry for invariant testing, or external tools like Echidna.",
        "To use Foundry alongside Hardhat, run: forge init --force",
      ],
      summary: "Invariant testing not available for pure Hardhat projects",
    };
  }

  if (!(await isFoundryProject(projectPath))) {
    return {
      ok: false,
      violations: [{
        invariant: "N/A",
        file: "",
        details: "Could not detect Foundry project. Invariant testing requires Foundry.",
      }],
      seedHints: [],
      reproductionSteps: [],
      summary: "Invariant testing requires a Foundry project",
    };
  }

  // Build the invariant test command
  const testCmd = "forge";
  const testArgs = [
    "test",
    "--match-test",
    "invariant",
    "-vvv",
    ...extraArgs,
  ];

  // Execute with extended timeout (10 minutes for invariant tests)
  const result = await execCommand(testCmd, testArgs, projectPath, 600_000);
  const output = result.stdout + "\n" + result.stderr;

  if (result.timedOut) {
    return {
      ok: false,
      violations: [{
        invariant: "TIMEOUT",
        file: "",
        details: "Invariant test execution timed out after 10 minutes",
      }],
      seedHints: [],
      reproductionSteps: [
        "The invariant tests took too long to complete.",
        "Consider reducing the number of runs or depth in foundry.toml:",
        "[invariant]",
        "runs = 256",
        "depth = 15",
      ],
      summary: "Invariant tests timed out",
    };
  }

  // Check if no invariant tests were found
  if (output.includes("No tests match") || output.includes("No tests to run")) {
    return {
      ok: true,
      violations: [],
      seedHints: [],
      reproductionSteps: [
        "No invariant tests found in the project.",
        "Invariant tests should be named with 'invariant' prefix (e.g., 'invariant_totalSupply').",
        "Consider adding invariant tests to verify critical protocol properties.",
      ],
      summary: "No invariant tests found",
    };
  }

  // Parse the output
  const parsed = parseFoundryInvariantOutput(output);

  // Build reproduction steps from parsed data
  const reproductionSteps: string[] = [];

  if (parsed.violations.length > 0) {
    reproductionSteps.push("To reproduce the violation:");

    if (parsed.seeds.length > 0) {
      reproductionSteps.push(`1. Set the fuzz seed: FOUNDRY_FUZZ_SEED=${parsed.seeds[0]}`);
      reproductionSteps.push("2. Run: forge test --match-test <invariant_name> -vvvv");
    }

    if (parsed.steps.length > 0) {
      reproductionSteps.push("");
      reproductionSteps.push("Counterexample sequence:");
      reproductionSteps.push(...parsed.steps);
    }
  }

  // Enhance violation details with output context
  const violations = parsed.violations.map(v => {
    // Try to find more context for this invariant in the output
    const contextMatch = output.match(
      new RegExp(`${v.invariant}[^\\n]*\\n([\\s\\S]{0,500})`, "i")
    );

    return {
      ...v,
      details: contextMatch
        ? truncate(contextMatch[1].trim(), 500)
        : v.details,
    };
  });

  const summary = parsed.ok
    ? "All invariants held"
    : `${violations.length} invariant violation(s) found`;

  return {
    ok: parsed.ok,
    violations,
    seedHints: parsed.seeds,
    reproductionSteps,
    summary,
  };
}
