/**
 * audit_detect tool implementation.
 *
 * Purpose: Detect project type (Foundry/Hardhat) and available build/test commands.
 * This tool should be called first when auditing a new project to understand its structure.
 *
 * When to use:
 * - At the start of an audit to detect the project type
 * - When you need to know what build/test commands are available
 * - To gather Solidity version information from the project
 *
 * When NOT to use:
 * - If you already know the project type and commands
 * - For running builds or tests (use audit_build/audit_test instead)
 */

import { join } from "path";
import type { DetectInput, DetectOutput, CommandSpec } from "../schemas.js";
import {
  validateProjectPath,
  isFoundryProject,
  isHardhatProject,
  readFileIfExists,
  findSolidityFiles,
  extractSolidityVersions,
} from "./utils.js";

/**
 * Detects the project type and available commands.
 */
export async function detectProject(input: DetectInput): Promise<DetectOutput> {
  const projectPath = await validateProjectPath(input.projectPath);
  const notes: string[] = [];
  const solidityVersionHints: string[] = [];

  // Detect project type
  const isFoundry = await isFoundryProject(projectPath);
  const isHardhat = await isHardhatProject(projectPath);

  let projectType: "foundry" | "hardhat" | "unknown";
  let buildCommand: CommandSpec | null = null;
  let testCommand: CommandSpec | null = null;
  let invariantCommand: CommandSpec | null = null;

  if (isFoundry && isHardhat) {
    // Hybrid project - prefer Foundry for testing
    projectType = "foundry";
    notes.push("Hybrid project detected (both Foundry and Hardhat). Using Foundry for build/test.");
  } else if (isFoundry) {
    projectType = "foundry";
  } else if (isHardhat) {
    projectType = "hardhat";
  } else {
    projectType = "unknown";
    notes.push("Could not detect project type. No foundry.toml or hardhat.config found.");
  }

  // Configure commands based on project type
  if (projectType === "foundry") {
    buildCommand = { cmd: "forge", args: ["build"] };
    testCommand = { cmd: "forge", args: ["test", "-vvv"] };
    invariantCommand = { cmd: "forge", args: ["test", "--match-test", "invariant", "-vvv"] };

    // Read foundry.toml for version hints
    const foundryToml = await readFileIfExists(join(projectPath, "foundry.toml"));
    if (foundryToml) {
      const versions = extractSolidityVersions(foundryToml);
      solidityVersionHints.push(...versions);

      // Check for common configurations
      if (foundryToml.includes("fuzz")) {
        notes.push("Fuzz testing configuration detected in foundry.toml.");
      }
      if (foundryToml.includes("invariant")) {
        notes.push("Invariant testing configuration detected in foundry.toml.");
      }
      if (foundryToml.includes("optimizer")) {
        notes.push("Optimizer settings detected in foundry.toml.");
      }
    }
  } else if (projectType === "hardhat") {
    buildCommand = { cmd: "npx", args: ["hardhat", "compile"] };
    testCommand = { cmd: "npx", args: ["hardhat", "test"] };
    invariantCommand = null; // Hardhat doesn't have built-in invariant testing

    // Read hardhat config for version hints
    const hardhatConfig = await readFileIfExists(join(projectPath, "hardhat.config.ts"))
      ?? await readFileIfExists(join(projectPath, "hardhat.config.js"));
    if (hardhatConfig) {
      const versions = extractSolidityVersions(hardhatConfig);
      solidityVersionHints.push(...versions);

      // Check for plugins
      if (hardhatConfig.includes("hardhat-gas-reporter")) {
        notes.push("Gas reporter plugin detected.");
      }
      if (hardhatConfig.includes("solidity-coverage")) {
        notes.push("Coverage plugin detected.");
      }
    }

    notes.push("Hardhat project detected. Consider using Foundry for fuzz/invariant testing.");
  }

  // Scan Solidity files for version pragmas
  const solidityFiles = await findSolidityFiles(projectPath, 50);
  for (const file of solidityFiles) {
    const content = await readFileIfExists(file);
    if (content) {
      const versions = extractSolidityVersions(content);
      for (const v of versions) {
        if (!solidityVersionHints.includes(v)) {
          solidityVersionHints.push(v);
        }
      }
    }
  }

  // Check for common project structure
  if (await readFileIfExists(join(projectPath, "contracts"))) {
    notes.push("'contracts/' directory found (common Hardhat layout).");
  }
  if (await readFileIfExists(join(projectPath, "src"))) {
    notes.push("'src/' directory found (common Foundry layout).");
  }
  if (await readFileIfExists(join(projectPath, "test"))) {
    notes.push("'test/' directory found.");
  }
  if (await readFileIfExists(join(projectPath, "script"))) {
    notes.push("'script/' directory found (Foundry scripts).");
  }

  // Check for remappings
  if (await readFileIfExists(join(projectPath, "remappings.txt"))) {
    notes.push("remappings.txt found.");
  }

  return {
    projectType,
    solidityVersionHints,
    buildCommand,
    testCommand,
    invariantCommand,
    notes,
  };
}
