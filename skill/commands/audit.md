# Solidity Smart Contract Audit

Perform a comprehensive security audit of the Solidity smart contracts in this project.

## Instructions

1. **Detect Project Setup**: Use the `audit_detect` MCP tool to identify the project type (Foundry/Hardhat), Solidity versions, and available commands.

2. **Compile the Project**: Run `audit_build` to verify the project compiles without errors. Note any warnings.

3. **Run Tests**: Execute `audit_test` to verify existing tests pass. Document any failures and coverage gaps.

4. **Run Invariant Tests**: If available, run `audit_invariants` to check for property violations.

5. **Manual Review**: Conduct a thorough manual code review following the security checklist in `.claude/skills/solidity-audit/resources/checklist.md`.

6. **Document Findings**: For each issue found:
   - Determine severity using `.claude/skills/solidity-audit/resources/severity-rubric.md`
   - Identify the exact file and line number
   - Assign an appropriate SWC tag
   - Provide a clear remediation
   - Include a verification test

7. **Generate Report**: Create an audit report following the template in `.claude/skills/solidity-audit/resources/report-template.md`. Save it to `reports/audit-YYYY-MM-DD.md`.

## Focus Areas

If you want to focus on specific areas, you can specify them:
- Access control and authorization
- Reentrancy and external calls
- Upgradeability and proxy patterns
- Mathematical operations and precision
- Oracle dependencies
- Denial of service vectors
- MEV and frontrunning
- Signature handling

## Example Usage

```
/audit
/audit Focus on reentrancy and access control
/audit Review the Vault.sol contract
```
