---
name: solidity-audit
description: |
  Comprehensive security audit and review for Solidity smart contracts. Triggers on requests to:
  audit contracts, security review, vulnerability assessment, reentrancy analysis, access control
  review, upgradeability check, smart contract security, exploit risk assessment, overflow/underflow
  check, privilege escalation review, oracle manipulation analysis, MEV vulnerability scan.
context: fork
---

# Solidity Security Audit Assistant

You are conducting a professional smart contract security audit. Follow this structured methodology to ensure comprehensive coverage and produce actionable findings.

## Phase 1: Scope & Context (Fast)

Before running any tools, gather essential context:

1. **Project Detection**: Use `audit_detect` to identify:
   - Build system (Foundry/Hardhat)
   - Solidity version(s)
   - Available commands

2. **Manual Context Gathering**:
   - Target chain (mainnet, L2, testnet)
   - Upgradeability pattern (transparent proxy, UUPS, diamond, none)
   - Privileged roles and their capabilities
   - External dependencies (oracles, bridges, other protocols)
   - Assets at risk (TVL estimate, token types)
   - Known assumptions from documentation or comments

## Phase 2: Automated Analysis

Execute the MCP toolbelt in order:

### 2.1 Build Verification
```
audit_build({ projectPath: ".", mode: "auto" })
```
- Ensure clean compilation
- Note any compiler warnings (these often indicate issues)

### 2.2 Test Suite Execution
```
audit_test({ projectPath: "." })
```
- Verify existing tests pass
- Note test coverage gaps
- Identify what behaviors ARE tested vs NOT tested

### 2.3 Invariant Testing (if available)
```
audit_invariants({ projectPath: "." })
```
- Run invariant/fuzz tests
- Document any violations found
- Use reproduction steps for findings

## Phase 3: Manual Review

Conduct systematic manual review using the security checklist. For each category, actively search for vulnerabilities.

**Reference**: [resources/checklist.md](resources/checklist.md)

### Review Categories (in priority order):

1. **Access Control** - Who can call what? Are modifiers correctly applied?
2. **External Calls & Reentrancy** - CEI pattern? Read-only reentrancy? Cross-function reentrancy?
3. **Upgradeability** - Storage collisions? Initialization? Selfdestruct risks?
4. **Accounting & Math** - Rounding? Precision loss? Integer bounds?
5. **Oracle Dependence** - Stale prices? Manipulation? Decimals handling?
6. **Denial of Service** - Unbounded loops? Block gas limits? Griefing?
7. **MEV & Order Dependence** - Frontrunning? Sandwich attacks? Time manipulation?
8. **Signature & Replay** - EIP-712? Nonce handling? Chain ID?

### For Each Potential Finding:

1. Identify the vulnerable code (file + line number)
2. Determine exploitability (can it actually be triggered?)
3. Assess impact (what's the worst case?)
4. Classify using SWC Registry tags where applicable
5. Draft remediation
6. Design a verification test

## Phase 4: Severity Classification

Use the severity rubric to classify findings consistently.

**Reference**: [resources/severity-rubric.md](resources/severity-rubric.md)

| Severity | Impact | Likelihood | Action |
|----------|--------|------------|--------|
| Critical | Catastrophic loss | Likely/Certain | Block deployment |
| High | Significant loss | Possible | Must fix before mainnet |
| Medium | Limited loss | Requires conditions | Should fix |
| Low | Minimal impact | Unlikely | Consider fixing |
| Info | No direct impact | N/A | Best practice |

## Phase 5: Report Generation

Produce the audit report following the standard template.

**Reference**: [resources/report-template.md](resources/report-template.md)

### Required Report Sections:

1. **Executive Summary**
   - Scope (contracts, LOC, commit hash)
   - Findings summary by severity
   - Overall assessment

2. **Assumptions & Trust Model**
   - What the audit assumes is trusted
   - Out-of-scope items
   - Limitations

3. **Findings Summary Table**
   | ID | Title | Severity | Status | SWC |
   |----|-------|----------|--------|-----|

4. **Detailed Findings**
   For each finding:
   - **Title**: Clear, descriptive
   - **Severity**: Critical/High/Medium/Low/Info
   - **SWC Tag**: e.g., SWC-107 (Reentrancy)
   - **Location**: `contracts/Vault.sol:142-156`
   - **Description**: What the issue is
   - **Impact**: What can go wrong
   - **Proof of Concept**: How to exploit (if applicable)
   - **Remediation**: How to fix
   - **Verification Test**: Test code to confirm fix

5. **Verification Plan**
   - Tests to add
   - Invariants to enforce
   - Monitoring recommendations

## SWC Reference Tags

Common SWC classifications to use:
- **SWC-100**: Function Default Visibility
- **SWC-101**: Integer Overflow/Underflow
- **SWC-104**: Unchecked Call Return Value
- **SWC-106**: Unprotected SELFDESTRUCT
- **SWC-107**: Reentrancy
- **SWC-108**: State Variable Default Visibility
- **SWC-110**: Assert Violation
- **SWC-111**: Use of Deprecated Functions
- **SWC-112**: Delegatecall to Untrusted Callee
- **SWC-113**: DoS with Failed Call
- **SWC-114**: Transaction Order Dependence
- **SWC-115**: Authorization through tx.origin
- **SWC-116**: Block Timestamp Dependence
- **SWC-120**: Weak Sources of Randomness
- **SWC-123**: Requirement Violation
- **SWC-124**: Write to Arbitrary Storage
- **SWC-126**: Insufficient Gas Griefing
- **SWC-128**: DoS With Block Gas Limit
- **SWC-131**: Presence of Unused Variables
- **SWC-132**: Unexpected Ether Balance
- **SWC-134**: Message Call with Hardcoded Gas
- **SWC-135**: Code With No Effects
- **SWC-136**: Unencrypted Private Data

Full registry: https://swcregistry.io/

## Important Guidelines

1. **Evidence Required**: Every finding must have specific file:line references
2. **No False Positives**: Only report issues you can demonstrate or strongly justify
3. **Actionable Remediation**: Provide concrete fix suggestions, not vague advice
4. **Verification Tests**: Each finding should include test code to verify the fix
5. **Conservative Severity**: When in doubt, use the lower severity rating

## Output Format

Always produce the final report in Markdown format following [resources/report-template.md](resources/report-template.md). Save the report to `reports/audit-YYYY-MM-DD.md` unless instructed otherwise.
