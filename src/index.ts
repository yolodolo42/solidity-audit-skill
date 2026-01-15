#!/usr/bin/env node
/**
 * Solidity Audit MCP Server
 *
 * An MCP (Model Context Protocol) server that provides tools for auditing
 * Solidity smart contracts. This server exposes tools for:
 *
 * - audit_detect: Detect project type and available commands
 * - audit_build: Compile the project and return structured errors
 * - audit_test: Run unit tests and return failing test details
 * - audit_invariants: Run invariant tests and return violation details
 *
 * The server uses stdio transport for communication with Claude Code.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  detectInputSchema,
  detectOutputSchema,
  buildInputSchema,
  buildOutputSchema,
  testInputSchema,
  testOutputSchema,
  invariantsInputSchema,
  invariantsOutputSchema,
  type DetectInput,
  type BuildInput,
  type TestInput,
  type InvariantsInput,
} from "./schemas.js";

import { detectProject } from "./tools/detect.js";
import { buildProject } from "./tools/build.js";
import { runTests } from "./tools/test.js";
import { runInvariants } from "./tools/invariants.js";

// ============================================================================
// Tool Definitions
// ============================================================================

const TOOLS = [
  {
    name: "audit_detect",
    description: `Detect the type of Solidity project and available build/test commands.

This tool should be called FIRST when starting an audit to understand the project structure.
It identifies whether the project uses Foundry or Hardhat, extracts Solidity version hints,
and determines the appropriate commands for building and testing.

Use this tool when:
- Starting a new audit to understand the project setup
- You need to know what build/test commands are available
- You want to gather Solidity version information

Do NOT use this tool when:
- You already know the project type and commands
- You just want to run builds or tests (use audit_build/audit_test instead)

Returns:
- projectType: "foundry", "hardhat", or "unknown"
- solidityVersionHints: Array of version strings found in configs/contracts
- buildCommand: Command spec for building (or null)
- testCommand: Command spec for testing (or null)
- invariantCommand: Command spec for invariant tests (or null)
- notes: Observations about the project structure`,
    inputSchema: detectInputSchema,
    outputSchema: detectOutputSchema,
  },
  {
    name: "audit_build",
    description: `Compile the Solidity project and return structured error/warning information.

This tool runs the appropriate build command based on the detected project type
and parses the output into actionable error and warning lists with file locations.

Use this tool when:
- You need to verify the project compiles successfully
- You want to check for compiler warnings that may indicate issues
- After making changes to ensure they compile

Do NOT use this tool when:
- You haven't run audit_detect yet (you need to know the project type)
- You just want to run tests (use audit_test instead)

Parameters:
- projectPath: Path to the project root directory
- mode: "auto" (detects type), "foundry", or "hardhat"
- extraArgs: Additional arguments for the build command

Returns:
- ok: Whether build succeeded
- compilerErrors: Array of {file, line, message, severity}
- warnings: Array of {file, line, message}
- summary: Human-readable result summary`,
    inputSchema: buildInputSchema,
    outputSchema: buildOutputSchema,
  },
  {
    name: "audit_test",
    description: `Run unit tests and return structured results with failing test details.

This tool executes the project's test suite and parses the output to provide
actionable information about which tests failed and why.

Use this tool when:
- After a successful build to verify test coverage
- To identify failing tests and their reasons
- To understand what behaviors are already tested

Do NOT use this tool when:
- The project hasn't been built yet (run audit_build first)
- You specifically want invariant/fuzz tests (use audit_invariants)

Parameters:
- projectPath: Path to the project root directory
- match: Optional pattern to filter tests (e.g., "testTransfer", "Vault")
- extraArgs: Additional arguments for the test command

Returns:
- ok: Whether all tests passed
- totalTests: Number of tests run
- passedTests: Number of passing tests
- failingTests: Array of {name, file, reason}
- failingTraces: Stack traces for failures
- summary: Human-readable result summary`,
    inputSchema: testInputSchema,
    outputSchema: testOutputSchema,
  },
  {
    name: "audit_invariants",
    description: `Run invariant/fuzz tests and return structured results with reproduction guidance.

This tool specifically targets invariant tests, which verify properties that should
always hold regardless of the sequence of operations. These tests are powerful for
finding edge cases that unit tests might miss.

Use this tool when:
- After running regular unit tests to check for deeper issues
- Auditing contracts with complex state transitions
- You want to find edge cases through fuzzing

Do NOT use this tool when:
- For regular unit tests (use audit_test instead)
- On pure Hardhat projects (Hardhat lacks built-in invariant testing)
- The project hasn't been built yet

Parameters:
- projectPath: Path to the project root directory
- extraArgs: Additional arguments for the invariant test command

Returns:
- ok: Whether all invariants held
- violations: Array of {invariant, file, details}
- seedHints: Fuzz seeds that triggered violations
- reproductionSteps: Steps to reproduce violations
- summary: Human-readable result summary

Note: This tool is primarily for Foundry projects. For Hardhat, consider Echidna.`,
    inputSchema: invariantsInputSchema,
    outputSchema: invariantsOutputSchema,
  },
];

// ============================================================================
// Server Setup
// ============================================================================

const server = new Server(
  {
    name: "solidity-audit-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * Handle list_tools request - returns available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

/**
 * Handle call_tool request - executes the requested tool.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;
    let textSummary: string;

    switch (name) {
      case "audit_detect": {
        const input = args as unknown as DetectInput;
        result = await detectProject(input);
        const detectResult = result as Awaited<ReturnType<typeof detectProject>>;
        textSummary = `Project Type: ${detectResult.projectType}\n` +
          `Solidity Versions: ${detectResult.solidityVersionHints.join(", ") || "none detected"}\n` +
          `Build Command: ${detectResult.buildCommand ? `${detectResult.buildCommand.cmd} ${detectResult.buildCommand.args.join(" ")}` : "N/A"}\n` +
          `Test Command: ${detectResult.testCommand ? `${detectResult.testCommand.cmd} ${detectResult.testCommand.args.join(" ")}` : "N/A"}\n` +
          `Notes:\n${detectResult.notes.map(n => `  - ${n}`).join("\n")}`;
        break;
      }

      case "audit_build": {
        const input = args as unknown as BuildInput;
        result = await buildProject(input);
        const buildResult = result as Awaited<ReturnType<typeof buildProject>>;
        textSummary = `${buildResult.summary}\n`;
        if (buildResult.compilerErrors.length > 0) {
          textSummary += `\nErrors:\n${buildResult.compilerErrors.map(e =>
            `  ${e.file}:${e.line} - ${e.message}`
          ).join("\n")}`;
        }
        if (buildResult.warnings.length > 0) {
          textSummary += `\nWarnings:\n${buildResult.warnings.map(w =>
            `  ${w.file}:${w.line} - ${w.message}`
          ).join("\n")}`;
        }
        break;
      }

      case "audit_test": {
        const input = args as unknown as TestInput;
        result = await runTests(input);
        const testResult = result as Awaited<ReturnType<typeof runTests>>;
        textSummary = `${testResult.summary}\n` +
          `Passed: ${testResult.passedTests}/${testResult.totalTests}`;
        if (testResult.failingTests.length > 0) {
          textSummary += `\n\nFailing Tests:\n${testResult.failingTests.map(t =>
            `  - ${t.name}: ${t.reason}`
          ).join("\n")}`;
        }
        if (testResult.failingTraces.length > 0) {
          textSummary += `\n\nTraces:\n${testResult.failingTraces.slice(0, 3).join("\n---\n")}`;
        }
        break;
      }

      case "audit_invariants": {
        const input = args as unknown as InvariantsInput;
        result = await runInvariants(input);
        const invResult = result as Awaited<ReturnType<typeof runInvariants>>;
        textSummary = `${invResult.summary}\n`;
        if (invResult.violations.length > 0) {
          textSummary += `\nViolations:\n${invResult.violations.map(v =>
            `  - ${v.invariant}: ${v.details}`
          ).join("\n")}`;
        }
        if (invResult.reproductionSteps.length > 0) {
          textSummary += `\n\nReproduction:\n${invResult.reproductionSteps.join("\n")}`;
        }
        break;
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }

    // Return both structured content and text fallback
    return {
      content: [
        {
          type: "text",
          text: textSummary,
        },
      ],
      structuredContent: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP communication)
  console.error("Solidity Audit MCP Server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
