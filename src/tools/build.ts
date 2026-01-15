/**
 * audit_build tool implementation.
 *
 * Purpose: Compile the Solidity project and return structured error/warning information.
 * This tool runs the appropriate build command and parses the output for actionable errors.
 *
 * When to use:
 * - After detecting the project type with audit_detect
 * - To verify the project compiles before running tests
 * - To check for compiler warnings that may indicate issues
 *
 * When NOT to use:
 * - Before running audit_detect (you need to know the project type first)
 * - If you just want to run tests (use audit_test instead)
 *
 * Parameters:
 * - projectPath: Path to the project root directory
 * - mode: "auto" (detect), "foundry", or "hardhat"
 * - extraArgs: Additional arguments to pass to the build command
 */

import type { BuildInput, BuildOutput } from "../schemas.js";
import {
  validateProjectPath,
  isFoundryProject,
  isHardhatProject,
  execCommand,
  parseFoundryBuildOutput,
} from "./utils.js";

/**
 * Builds the Solidity project and returns structured results.
 */
export async function buildProject(input: BuildInput): Promise<BuildOutput> {
  const projectPath = await validateProjectPath(input.projectPath);
  const mode = input.mode ?? "auto";
  const extraArgs = input.extraArgs ?? [];

  // Determine project type
  let buildCmd: string;
  let buildArgs: string[];

  if (mode === "foundry" || (mode === "auto" && await isFoundryProject(projectPath))) {
    buildCmd = "forge";
    buildArgs = ["build", "--force", ...extraArgs];
  } else if (mode === "hardhat" || (mode === "auto" && await isHardhatProject(projectPath))) {
    buildCmd = "npx";
    buildArgs = ["hardhat", "compile", "--force", ...extraArgs];
  } else {
    return {
      ok: false,
      compilerErrors: [{
        file: "",
        line: 0,
        message: "Could not detect project type. Specify mode='foundry' or mode='hardhat'.",
        severity: "error",
      }],
      warnings: [],
      summary: "Build failed: Unknown project type",
    };
  }

  // Execute build command
  const result = await execCommand(buildCmd, buildArgs, projectPath);
  const output = result.stdout + "\n" + result.stderr;

  // Parse output based on build system
  if (buildCmd === "forge") {
    const parsed = parseFoundryBuildOutput(output);

    const ok = result.exitCode === 0 && parsed.errors.length === 0;
    const summary = ok
      ? `Build successful${parsed.warnings.length > 0 ? ` with ${parsed.warnings.length} warning(s)` : ""}`
      : `Build failed with ${parsed.errors.length} error(s)`;

    return {
      ok,
      compilerErrors: parsed.errors,
      warnings: parsed.warnings,
      summary,
    };
  } else {
    // Hardhat output parsing
    const errors: BuildOutput["compilerErrors"] = [];
    const warnings: BuildOutput["warnings"] = [];

    // Parse Hardhat error format: Error HH...
    const errorMatches = output.matchAll(/Error[:\s]+([^\n]+)/g);
    for (const match of errorMatches) {
      errors.push({
        file: "",
        line: 0,
        message: match[1].trim(),
        severity: "error",
      });
    }

    // Parse Solidity errors: ParserError: ... --> file:line:col
    const solcErrorMatches = output.matchAll(/(ParserError|TypeError|DeclarationError)[:\s]+([^\n]+)\n\s*-->\s*([^:]+):(\d+):\d+/g);
    for (const match of solcErrorMatches) {
      errors.push({
        file: match[3],
        line: parseInt(match[4], 10),
        message: `${match[1]}: ${match[2].trim()}`,
        severity: "error",
      });
    }

    // Parse warnings
    const warningMatches = output.matchAll(/Warning[:\s]+([^\n]+)\n\s*-->\s*([^:]+):(\d+):\d+/g);
    for (const match of warningMatches) {
      warnings.push({
        file: match[2],
        line: parseInt(match[3], 10),
        message: match[1].trim(),
      });
    }

    const ok = result.exitCode === 0 && errors.length === 0;
    const summary = ok
      ? `Build successful${warnings.length > 0 ? ` with ${warnings.length} warning(s)` : ""}`
      : `Build failed with ${errors.length} error(s)`;

    return {
      ok,
      compilerErrors: errors,
      warnings,
      summary,
    };
  }
}
