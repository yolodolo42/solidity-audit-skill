# Solidity Audit MCP Server

[![CI](https://github.com/yolodolo42/solidity-audit-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/yolodolo42/solidity-audit-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

An MCP (Model Context Protocol) server that provides structured tools for auditing Solidity smart contracts. Designed to work with [Claude Code](https://claude.ai/code) for comprehensive security reviews.

## Features

- **Project Detection**: Automatically identifies Foundry/Hardhat projects and available commands
- **Structured Build Output**: Compiles projects and returns parsed errors/warnings with file locations
- **Test Execution**: Runs unit tests and provides structured failure information with traces
- **Invariant Testing**: Executes invariant/fuzz tests with reproduction guidance
- **Security-First Design**: Allowlisted commands, input validation, secret redaction, timeouts

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yolodolo42/solidity-audit-mcp.git
cd solidity-audit-mcp

# Install dependencies
npm install

# Build
npm run build
```

### Configure Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "solidity_audit": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/solidity-audit-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

Or configure globally in Claude Code settings for use across all projects.

## Available Tools

| Tool | Description |
|------|-------------|
| `audit_detect` | Detect project type (Foundry/Hardhat), Solidity versions, and available commands |
| `audit_build` | Compile project and return structured errors/warnings with locations |
| `audit_test` | Run unit tests and return failing test details with traces |
| `audit_invariants` | Run invariant/fuzz tests and return violations with reproduction steps |

### `audit_detect`

Detects the project type and available build/test commands.

```json
// Input
{ "projectPath": "." }

// Output
{
  "projectType": "foundry",
  "solidityVersionHints": ["^0.8.20"],
  "buildCommand": { "cmd": "forge", "args": ["build"] },
  "testCommand": { "cmd": "forge", "args": ["test", "-vvv"] },
  "invariantCommand": { "cmd": "forge", "args": ["test", "--match-test", "invariant", "-vvv"] },
  "notes": ["Fuzz testing configuration detected in foundry.toml."]
}
```

### `audit_build`

Compiles the project and returns structured error/warning information.

```json
// Input
{ "projectPath": ".", "mode": "auto", "extraArgs": [] }

// Output
{
  "ok": true,
  "compilerErrors": [],
  "warnings": [{ "file": "src/Vault.sol", "line": 42, "message": "Unused local variable" }],
  "summary": "Build successful with 1 warning(s)"
}
```

### `audit_test`

Runs unit tests and returns structured results.

```json
// Input
{ "projectPath": ".", "match": "testTransfer", "extraArgs": [] }

// Output
{
  "ok": false,
  "totalTests": 15,
  "passedTests": 14,
  "failingTests": [{ "name": "testTransferInsufficientBalance", "file": "test/Vault.t.sol", "reason": "Revert: Insufficient balance" }],
  "failingTraces": ["..."],
  "summary": "1/15 tests failed"
}
```

### `audit_invariants`

Runs invariant/fuzz tests and returns violation details with reproduction guidance.

```json
// Input
{ "projectPath": ".", "extraArgs": ["--runs", "1000"] }

// Output
{
  "ok": false,
  "violations": [{ "invariant": "invariant_totalSupplyMatchesBalances", "file": "...", "details": "..." }],
  "seedHints": ["12345"],
  "reproductionSteps": ["1. Set FOUNDRY_FUZZ_SEED=12345", "2. Run: forge test --match-test ..."],
  "summary": "1 invariant violation(s) found"
}
```

## Security

This server is designed with security as a priority:

| Measure | Description |
|---------|-------------|
| **Command Allowlisting** | Only `forge`, `npx`, `npm`, `yarn`, `pnpm` permitted |
| **Argument Validation** | Shell metacharacters and injection attempts blocked |
| **Path Validation** | Prevents path traversal attacks |
| **Secret Redaction** | Private keys and sensitive data automatically redacted |
| **Timeouts** | Enforced timeouts (2-10 minutes depending on operation) |
| **Output Limits** | Large outputs truncated to prevent memory issues |

## Development

```bash
# Build
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Lint
npm run lint

# Test
npm test
```

### Project Structure

```
src/
├── index.ts           # MCP server entry point
├── schemas.ts         # Type definitions and JSON schemas
└── tools/
    ├── utils.ts       # Shared utilities (exec, validation, parsing)
    ├── detect.ts      # Project detection tool
    ├── build.ts       # Build tool
    ├── test.ts        # Test runner tool
    └── invariants.ts  # Invariant test tool
```

## Troubleshooting

### Server not loading

1. Ensure the server is built: `npm run build`
2. Check that `dist/index.js` exists
3. Verify the path in `.mcp.json` is correct
4. Run Claude Code with `--debug` flag

### Command not found errors

Ensure [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`) or Hardhat (`npx hardhat`) are installed and in your PATH.

### Timeout errors

For large projects, increase timeouts by modifying `DEFAULT_TIMEOUT_MS` in `src/tools/utils.ts`.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Related Projects

- [Slither-MCP](https://github.com/trailofbits/slither-mcp) - MCP server for Slither static analysis (AGPL-3.0)
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [Claude Code](https://claude.ai/code) - AI coding assistant

## License

[MIT](LICENSE)
