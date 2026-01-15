# Severity Classification Rubric

This rubric provides consistent criteria for classifying audit findings. Severity is determined by the combination of **Impact** and **Likelihood**.

---

## Severity Matrix

|                    | **Certain/Likely** | **Possible** | **Unlikely** |
|--------------------|-------------------|--------------|--------------|
| **Critical Impact** | Critical          | High         | Medium       |
| **High Impact**     | High              | Medium       | Low          |
| **Medium Impact**   | Medium            | Low          | Low          |
| **Low Impact**      | Low               | Info         | Info         |

---

## Severity Definitions

### Critical

**Definition**: Issues that will likely result in catastrophic loss of funds or complete protocol failure with high probability.

**Criteria** (any of):
- Direct theft of user funds possible
- Permanent freezing of funds
- Protocol insolvency
- Unrestricted minting/burning of value
- Governance takeover
- Complete access control bypass

**Examples**:
- Reentrancy allowing complete vault drain
- Missing access control on mint function
- Proxy upgrade by unauthorized party
- Oracle manipulation causing instant liquidation of all positions

**Action Required**: Block deployment. Must be fixed before any mainnet deployment.

---

### High

**Definition**: Issues that can result in significant loss of funds or major protocol dysfunction under realistic conditions.

**Criteria** (any of):
- Theft of significant funds (but not total)
- Temporary freezing of funds requiring manual intervention
- Major economic damage to protocol or users
- Bypass of important security controls
- Significant griefing with material impact

**Examples**:
- First depositor inflation attack on vault
- Liquidation threshold manipulation
- DOS of critical protocol function
- Flash loan attack extracting significant value
- Missing slippage protection on swaps

**Action Required**: Must fix before mainnet. Consider pausing affected functionality.

---

### Medium

**Definition**: Issues that can result in limited loss of funds or protocol dysfunction under specific conditions.

**Criteria** (any of):
- Limited theft of funds (edge cases, small amounts)
- Temporary DOS of non-critical functions
- Manipulation requiring significant capital or unlikely conditions
- Privilege escalation with limited impact
- Economic inefficiencies benefiting attackers

**Examples**:
- Rounding errors exploitable for small profit
- Missing deadline parameter on time-sensitive operation
- Fee manipulation in edge cases
- Griefing with recoverable impact
- Missing zero-address checks

**Action Required**: Should fix before mainnet. May defer if risk is acceptable.

---

### Low

**Definition**: Issues with minimal impact or very low likelihood of exploitation.

**Criteria** (any of):
- Theoretical vulnerabilities requiring unrealistic conditions
- Minor economic impact (dust amounts)
- Issues with trivial workarounds
- Non-critical functionality affected
- Requires admin compromise (single point acknowledged)

**Examples**:
- Missing event emission
- Gas inefficiency with no security impact
- Compiler warning with no exploit path
- Theoretical MEV extraction requiring perfect conditions
- Minor precision loss in non-critical calculation

**Action Required**: Consider fixing. May accept with documentation.

---

### Informational

**Definition**: Best practice recommendations, code quality issues, or observations with no direct security impact.

**Criteria** (any of):
- Code style/quality suggestions
- Documentation improvements
- Gas optimizations (non-DOS related)
- Test coverage gaps
- Centralization observations (documented, accepted)
- Future-proofing recommendations

**Examples**:
- Unused variables
- Missing NatSpec documentation
- Suboptimal data structures
- Hardcoded values that could be constants
- Floating pragma

**Action Required**: Optional. Consider for code quality.

---

## Impact Assessment Guide

### Critical Impact
- **Funds**: Total loss of protocol funds or all user funds
- **Protocol**: Complete protocol failure, irreversible damage
- **Users**: All users affected, no recovery possible

### High Impact
- **Funds**: Significant portion of funds at risk (>10% of TVL)
- **Protocol**: Major functionality broken, requires emergency response
- **Users**: Many users affected, recovery may be partial

### Medium Impact
- **Funds**: Limited funds at risk (<10% of TVL, or specific edge cases)
- **Protocol**: Non-critical functionality affected, workarounds exist
- **Users**: Some users affected, recovery generally possible

### Low Impact
- **Funds**: Minimal/dust amounts, theoretical scenarios
- **Protocol**: Minor inconvenience, no material effect
- **Users**: Few users affected, trivial impact

---

## Likelihood Assessment Guide

### Certain/Likely
- No special conditions required
- Can be triggered by any user
- Economic incentive exists
- Has happened before in similar protocols
- Simple attack path

### Possible
- Requires specific conditions but they're realistic
- Requires moderate capital or coordination
- Race conditions that could realistically occur
- Depends on external factors that could align

### Unlikely
- Requires very specific/rare conditions
- Requires unrealistic capital or coordination
- Only exploitable by privileged actors with assumed trust
- Theoretical with no practical attack path
- Mitigated by external factors (MEV protection, etc.)

---

## Special Cases

### Centralization Risks
Classify based on the impact IF the trusted party acts maliciously:
- Document as the severity level of worst-case scenario
- Note that it requires trusted party compromise
- Recommend mitigations (timelocks, multisig, etc.)

### External Dependencies
For issues depending on external protocol behavior:
- Consider likelihood of external failure
- Assess what protections exist (circuit breakers, etc.)
- Document assumptions clearly

### Gas Griefing
- If it blocks critical functionality: Medium or High
- If it only affects attacker or single tx: Low or Info
- Consider economic viability of attack
