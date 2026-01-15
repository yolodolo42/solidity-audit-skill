# Smart Contract Security Audit Report

**Project**: [Project Name]
**Repository**: [Git URL]
**Commit**: [Commit Hash]
**Auditor**: Claude (AI-Assisted Audit)
**Date**: [YYYY-MM-DD]

---

## Executive Summary

### Scope

| Item | Details |
|------|---------|
| Contracts | [List of contracts audited] |
| Lines of Code | [Approximate LOC] |
| Solidity Version | [Version(s)] |
| Framework | [Foundry/Hardhat] |
| Chain Target | [Mainnet/L2/etc.] |

### Findings Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Informational | 0 |
| **Total** | **0** |

### Overall Assessment

[1-2 paragraphs summarizing the overall security posture of the codebase, key observations, and recommendations.]

---

## Scope & Methodology

### In-Scope Contracts

| File | LOC | Description |
|------|-----|-------------|
| `contracts/Example.sol` | 150 | Main contract functionality |

### Out of Scope

- [Items explicitly excluded from the audit]
- [External dependencies assumed secure]
- [Test files, scripts, documentation]

### Methodology

1. **Automated Analysis**: Build verification, test execution, invariant testing
2. **Static Analysis**: [Tools used, if any]
3. **Manual Review**: Line-by-line code review following security checklist
4. **Threat Modeling**: Identification of attack vectors and trust assumptions

---

## Assumptions & Trust Model

### Trusted Entities

| Entity | Trust Level | Capabilities |
|--------|-------------|--------------|
| Owner/Admin | Trusted | [What they can do] |
| Oracle | Semi-trusted | [Price feed, assume correct within bounds] |

### Key Assumptions

1. [Assumption about external dependencies]
2. [Assumption about user behavior]
3. [Assumption about chain/environment]

### Limitations

- This audit does not guarantee the absence of vulnerabilities
- AI-assisted analysis may miss subtle or novel attack vectors
- Economic/game-theoretic attacks may require specialized analysis

---

## Findings Summary

| ID | Title | Severity | Status | SWC |
|----|-------|----------|--------|-----|
| [H-01] | [Finding Title] | High | Open | SWC-107 |
| [M-01] | [Finding Title] | Medium | Open | SWC-114 |

---

## Detailed Findings

### [C-01] [Critical Finding Title]

**Severity**: Critical

**SWC**: [SWC-XXX if applicable]

**Location**: `contracts/File.sol:XX-YY`

#### Description

[Clear explanation of the vulnerability. What is the issue? Why is it a problem?]

#### Impact

[What can happen if this is exploited? Quantify if possible: funds at risk, affected users, etc.]

#### Proof of Concept

```solidity
// Exploit code or step-by-step attack description
function testExploit() public {
    // 1. Attacker does X
    // 2. This causes Y
    // 3. Result: Z
}
```

#### Recommendation

[Specific, actionable fix. Include code if helpful.]

```solidity
// Suggested fix
function vulnerable() external nonReentrant {
    // Apply CEI pattern
}
```

#### Verification Test

```solidity
// Test to verify the fix works
function test_FixedVulnerability() public {
    // Setup
    // Action that previously exploited the bug
    // Assert that exploit no longer works
}
```

---

### [H-01] [High Finding Title]

**Severity**: High

**SWC**: [SWC-XXX if applicable]

**Location**: `contracts/File.sol:XX-YY`

#### Description

[Description]

#### Impact

[Impact]

#### Proof of Concept

```solidity
// PoC
```

#### Recommendation

[Recommendation]

#### Verification Test

```solidity
// Test
```

---

### [M-01] [Medium Finding Title]

**Severity**: Medium

**SWC**: [SWC-XXX if applicable]

**Location**: `contracts/File.sol:XX-YY`

#### Description

[Description]

#### Impact

[Impact]

#### Recommendation

[Recommendation]

#### Verification Test

```solidity
// Test
```

---

### [L-01] [Low Finding Title]

**Severity**: Low

**Location**: `contracts/File.sol:XX`

#### Description

[Description]

#### Recommendation

[Recommendation]

---

### [I-01] [Informational Finding Title]

**Severity**: Informational

**Location**: `contracts/File.sol:XX`

#### Description

[Description]

#### Recommendation

[Recommendation]

---

## Verification Plan

### Tests to Add

| Finding | Test Description | Priority |
|---------|-----------------|----------|
| [H-01] | Test that X cannot happen | High |
| [M-01] | Verify Y is enforced | Medium |

### Invariants to Enforce

```solidity
// Suggested invariant tests
function invariant_TotalSupplyMatchesBalances() public {
    // Total supply should always equal sum of balances
}

function invariant_NoUnauthorizedMinting() public {
    // Only authorized minters can increase supply
}
```

### Monitoring Recommendations

| Metric | Alert Threshold | Rationale |
|--------|----------------|-----------|
| [Metric] | [Threshold] | [Why monitor this] |

---

## Appendix

### A. Tools Used

- Foundry/Hardhat (build & test)
- [Other tools]

### B. SWC References

| SWC | Title | Findings |
|-----|-------|----------|
| SWC-107 | Reentrancy | [C-01] |

### C. Disclosure

This audit was performed by Claude, an AI assistant. While comprehensive automated and manual analysis was performed, AI-assisted audits should be supplemented with human expert review for critical deployments.

---

*Generated by Solidity Audit Assistant*
