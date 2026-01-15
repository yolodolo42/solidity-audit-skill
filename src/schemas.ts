/**
 * JSON Schema definitions and TypeScript types for the Solidity Audit MCP tools.
 * These schemas define the input/output contracts for each tool.
 */

// ============================================================================
// Tool Input Schemas (JSON Schema format for MCP)
// ============================================================================

export const detectInputSchema = {
  type: "object",
  properties: {
    projectPath: {
      type: "string",
      description: "Path to the Solidity project root directory. Use '.' for current directory."
    }
  },
  required: ["projectPath"],
  additionalProperties: false
} as const;

export const buildInputSchema = {
  type: "object",
  properties: {
    projectPath: {
      type: "string",
      description: "Path to the Solidity project root directory."
    },
    mode: {
      type: "string",
      enum: ["auto", "foundry", "hardhat"],
      description: "Build mode: 'auto' detects the project type, or explicitly specify 'foundry' or 'hardhat'.",
      default: "auto"
    },
    extraArgs: {
      type: "array",
      items: { type: "string" },
      description: "Additional arguments to pass to the build command.",
      default: []
    }
  },
  required: ["projectPath"],
  additionalProperties: false
} as const;

export const testInputSchema = {
  type: "object",
  properties: {
    projectPath: {
      type: "string",
      description: "Path to the Solidity project root directory."
    },
    match: {
      type: "string",
      description: "Optional pattern to match specific test names (e.g., 'testTransfer' or 'Vault').",
      default: null
    },
    extraArgs: {
      type: "array",
      items: { type: "string" },
      description: "Additional arguments to pass to the test command.",
      default: []
    }
  },
  required: ["projectPath"],
  additionalProperties: false
} as const;

export const invariantsInputSchema = {
  type: "object",
  properties: {
    projectPath: {
      type: "string",
      description: "Path to the Solidity project root directory."
    },
    extraArgs: {
      type: "array",
      items: { type: "string" },
      description: "Additional arguments to pass to the invariant test command.",
      default: []
    }
  },
  required: ["projectPath"],
  additionalProperties: false
} as const;

// ============================================================================
// Tool Output Schemas (JSON Schema format for structured output)
// ============================================================================

export const detectOutputSchema = {
  type: "object",
  properties: {
    projectType: {
      type: "string",
      enum: ["foundry", "hardhat", "unknown"],
      description: "Detected project type based on configuration files."
    },
    solidityVersionHints: {
      type: "array",
      items: { type: "string" },
      description: "Solidity version hints found in configuration or contracts."
    },
    buildCommand: {
      type: ["object", "null"],
      properties: {
        cmd: { type: "string" },
        args: { type: "array", items: { type: "string" } }
      },
      description: "Recommended build command, or null if not detected."
    },
    testCommand: {
      type: ["object", "null"],
      properties: {
        cmd: { type: "string" },
        args: { type: "array", items: { type: "string" } }
      },
      description: "Recommended test command, or null if not detected."
    },
    invariantCommand: {
      type: ["object", "null"],
      properties: {
        cmd: { type: "string" },
        args: { type: "array", items: { type: "string" } }
      },
      description: "Recommended invariant test command, or null if not applicable."
    },
    notes: {
      type: "array",
      items: { type: "string" },
      description: "Additional notes about the project setup."
    }
  },
  required: ["projectType", "solidityVersionHints", "buildCommand", "testCommand", "invariantCommand", "notes"],
  additionalProperties: false
} as const;

export const buildOutputSchema = {
  type: "object",
  properties: {
    ok: {
      type: "boolean",
      description: "Whether the build completed successfully."
    },
    compilerErrors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "number" },
          message: { type: "string" },
          severity: { type: "string", enum: ["error", "warning"] }
        }
      },
      description: "List of compiler errors encountered."
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "number" },
          message: { type: "string" }
        }
      },
      description: "List of compiler warnings."
    },
    summary: {
      type: "string",
      description: "Human-readable summary of the build result."
    }
  },
  required: ["ok", "compilerErrors", "warnings", "summary"],
  additionalProperties: false
} as const;

export const testOutputSchema = {
  type: "object",
  properties: {
    ok: {
      type: "boolean",
      description: "Whether all tests passed."
    },
    totalTests: {
      type: "number",
      description: "Total number of tests run."
    },
    passedTests: {
      type: "number",
      description: "Number of tests that passed."
    },
    failingTests: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          file: { type: "string" },
          reason: { type: "string" }
        }
      },
      description: "List of failing tests with details."
    },
    failingTraces: {
      type: "array",
      items: { type: "string" },
      description: "Stack traces or execution traces for failing tests (truncated if too long)."
    },
    summary: {
      type: "string",
      description: "Human-readable summary of test results."
    }
  },
  required: ["ok", "totalTests", "passedTests", "failingTests", "failingTraces", "summary"],
  additionalProperties: false
} as const;

export const invariantsOutputSchema = {
  type: "object",
  properties: {
    ok: {
      type: "boolean",
      description: "Whether all invariants held."
    },
    violations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          invariant: { type: "string" },
          file: { type: "string" },
          details: { type: "string" }
        }
      },
      description: "List of invariant violations found."
    },
    seedHints: {
      type: "array",
      items: { type: "string" },
      description: "Seeds or inputs that triggered violations, for reproduction."
    },
    reproductionSteps: {
      type: "array",
      items: { type: "string" },
      description: "Steps to reproduce the violation."
    },
    summary: {
      type: "string",
      description: "Human-readable summary of invariant test results."
    }
  },
  required: ["ok", "violations", "seedHints", "reproductionSteps", "summary"],
  additionalProperties: false
} as const;

// ============================================================================
// TypeScript Types (derived from schemas)
// ============================================================================

export interface DetectInput {
  projectPath: string;
}

export interface BuildInput {
  projectPath: string;
  mode?: "auto" | "foundry" | "hardhat";
  extraArgs?: string[];
}

export interface TestInput {
  projectPath: string;
  match?: string | null;
  extraArgs?: string[];
}

export interface InvariantsInput {
  projectPath: string;
  extraArgs?: string[];
}

export interface CommandSpec {
  cmd: string;
  args: string[];
}

export interface DetectOutput {
  projectType: "foundry" | "hardhat" | "unknown";
  solidityVersionHints: string[];
  buildCommand: CommandSpec | null;
  testCommand: CommandSpec | null;
  invariantCommand: CommandSpec | null;
  notes: string[];
}

export interface CompilerError {
  file: string;
  line: number;
  message: string;
  severity: "error" | "warning";
}

export interface CompilerWarning {
  file: string;
  line: number;
  message: string;
}

export interface BuildOutput {
  ok: boolean;
  compilerErrors: CompilerError[];
  warnings: CompilerWarning[];
  summary: string;
}

export interface FailingTest {
  name: string;
  file: string;
  reason: string;
}

export interface TestOutput {
  ok: boolean;
  totalTests: number;
  passedTests: number;
  failingTests: FailingTest[];
  failingTraces: string[];
  summary: string;
}

export interface InvariantViolation {
  invariant: string;
  file: string;
  details: string;
}

export interface InvariantsOutput {
  ok: boolean;
  violations: InvariantViolation[];
  seedHints: string[];
  reproductionSteps: string[];
  summary: string;
}
