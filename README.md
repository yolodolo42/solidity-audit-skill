# Solidity Audit Skill for Claude Code

[![CI](https://github.com/yolodolo42/solidity-audit-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/yolodolo42/solidity-audit-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

A Claude Code skill that turns Claude into a smart contract security auditor. Automatically triggers when you ask to audit, review, or assess Solidity contracts.

## What It Does

Ask Claude to "audit my contracts" and it will:

1. **Detect your project** - Foundry or Hardhat, Solidity versions
2. **Build & test** - Compile, run tests, check invariants
3. **Manual review** - Systematic checklist covering reentrancy, access control, MEV, oracles, etc.
4. **Generate report** - Findings with severity, SWC tags, file:line references, and verification tests

## Install

```bash
git clone https://github.com/yolodolo42/solidity-audit-mcp.git
cd solidity-audit-mcp
./install.sh
```

That's it. The script:
- Builds the MCP server
- Links skill files to `~/.claude/skills/solidity-audit/`
- Adds the `/audit` command
- Configures the MCP server in `~/.claude/mcp.json`

To uninstall: `./uninstall.sh`

## Usage

Just ask Claude:

```
"Audit my smart contracts"
"Review this contract for security issues"
"Check for reentrancy vulnerabilities"
"Run a security assessment"
```

Or use the slash command:
```
/audit
/audit Focus on access control
```

## What's Included

### Skill (`skill/`)
- **SKILL.md** - Main skill with 5-phase audit methodology
- **resources/checklist.md** - 100+ item security checklist (SWC-aligned)
- **resources/severity-rubric.md** - Impact/likelihood severity matrix
- **resources/report-template.md** - Professional audit report format
- **commands/audit.md** - `/audit` slash command

### MCP Server (`src/`)
Structured tools that return parsed, actionable output:

| Tool | Purpose |
|------|---------|
| `audit_detect` | Detect project type, Solidity versions, available commands |
| `audit_build` | Compile with structured errors/warnings + file locations |
| `audit_test` | Run tests with failure details and traces |
| `audit_invariants` | Run fuzz tests with reproduction steps |

## Security Checklist Coverage

- Access Control & Authorization
- Reentrancy (CEI, cross-function, read-only)
- Upgradeability (proxy patterns, storage collisions)
- Math & Accounting (precision, rounding, overflow)
- Oracle Manipulation
- DoS Vectors
- MEV & Frontrunning
- Signature Replay

## Example Output

```markdown
## Findings Summary

| ID | Title | Severity | SWC |
|----|-------|----------|-----|
| H-01 | Reentrancy in withdraw() | High | SWC-107 |
| M-01 | Missing slippage protection | Medium | SWC-114 |

### [H-01] Reentrancy in withdraw()

**Location**: `src/Vault.sol:142-156`

**Description**: The withdraw function sends ETH before updating state...

**Remediation**: Apply CEI pattern or use ReentrancyGuard

**Verification Test**:
function test_ReentrancyFixed() public {
    // Test that reentrancy is no longer possible
}
```

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode
npm run lint     # ESLint
npm test         # Run tests
```

## Related

- [Slither-MCP](https://github.com/trailofbits/slither-mcp) - Static analysis MCP server
- [SWC Registry](https://swcregistry.io/) - Smart Contract Weakness Classification
- [Claude Code Skills](https://docs.anthropic.com/claude-code/skills) - Skill documentation

## License

[MIT](LICENSE)
