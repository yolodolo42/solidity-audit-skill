# Solidity Security Audit Checklist

This checklist provides systematic coverage of common smart contract vulnerabilities. For each category, actively search for issues and document findings.

---

## 1. Access Control

### Authentication & Authorization
- [ ] All external/public functions have appropriate access modifiers
- [ ] `onlyOwner`, `onlyAdmin`, or role-based modifiers are correctly applied
- [ ] No functions missing access control that should have it
- [ ] `tx.origin` is never used for authentication (SWC-115)
- [ ] Multi-sig requirements where appropriate for critical operations

### Role Management
- [ ] Role assignment/revocation is properly protected
- [ ] Cannot accidentally renounce critical roles leaving contract unusable
- [ ] Two-step ownership transfer pattern for critical roles
- [ ] Timelocks on sensitive admin operations where appropriate

### Function Visibility
- [ ] No unintentionally public/external functions (SWC-100)
- [ ] Internal functions not callable through delegatecall chains
- [ ] Constructor visibility handled correctly (Solidity <0.7.0)

---

## 2. External Calls & Reentrancy

### Reentrancy Patterns
- [ ] Checks-Effects-Interactions (CEI) pattern followed
- [ ] ReentrancyGuard used on state-changing external calls
- [ ] Cross-function reentrancy considered (multiple functions share state)
- [ ] Cross-contract reentrancy considered (callbacks to other contracts)
- [ ] Read-only reentrancy considered (view functions during callback)
- [ ] ERC-777 token callbacks handled safely
- [ ] ERC-721/1155 `onReceived` callbacks handled safely

### External Call Safety
- [ ] Return values of external calls checked (SWC-104)
- [ ] Low-level calls (`.call`, `.delegatecall`) have return value checks
- [ ] Gas limits on external calls where appropriate (SWC-134)
- [ ] Delegatecall targets are trusted/immutable (SWC-112)

### Token Interactions
- [ ] Safe ERC-20 patterns (SafeERC20 or explicit checks)
- [ ] Fee-on-transfer tokens handled correctly
- [ ] Rebasing tokens handled correctly
- [ ] Tokens with multiple entry points considered
- [ ] Token decimals handled correctly (not assumed to be 18)

---

## 3. Upgradeability

### Proxy Patterns
- [ ] Implementation contract cannot be initialized directly
- [ ] Initializer functions have `initializer` modifier
- [ ] No constructor logic in implementation (use initializer)
- [ ] Storage layout consistent across upgrades (no collisions)
- [ ] No `selfdestruct` or `delegatecall` to untrusted targets

### Storage Safety
- [ ] Storage gaps in base contracts for future variables
- [ ] No storage variable reordering between versions
- [ ] Inherited contract order preserved
- [ ] No immutable variables that break upgrade compatibility

### UUPS Specific
- [ ] `_authorizeUpgrade` properly protected
- [ ] Cannot upgrade to malicious implementation
- [ ] Upgrade functionality cannot be permanently bricked

### Transparent Proxy Specific
- [ ] Admin functions properly segregated
- [ ] No selector clashes between admin and implementation

---

## 4. Accounting & Math

### Integer Safety
- [ ] No overflow/underflow in unchecked blocks (SWC-101)
- [ ] Safe casting between integer types
- [ ] No precision loss in calculations
- [ ] Correct order of operations (multiply before divide)
- [ ] Rounding direction benefits protocol (round down for withdrawals, up for deposits)

### Balance Tracking
- [ ] Internal balances match actual token balances
- [ ] Share/asset conversions handle edge cases (zero shares, first depositor)
- [ ] No inflation attacks possible on vault-style contracts
- [ ] Donation attacks considered

### Financial Logic
- [ ] Interest calculations handle edge cases
- [ ] Fee calculations cannot be gamed
- [ ] Liquidation math is correct and cannot be manipulated
- [ ] Slippage protection implemented correctly
- [ ] Deadline parameters enforced

---

## 5. Oracle Dependence

### Price Feed Safety
- [ ] Stale price checks implemented (timestamp/round checks)
- [ ] Price bounds/sanity checks in place
- [ ] Decimals handled correctly (not hardcoded)
- [ ] Fallback oracle or circuit breaker for oracle failure
- [ ] TWAP vs spot price considerations

### Manipulation Resistance
- [ ] Flash loan price manipulation not possible
- [ ] Multi-block manipulation considered
- [ ] Cross-protocol price dependencies reviewed
- [ ] Sequencer uptime checks for L2 (Chainlink)

### Oracle Integration
- [ ] Correct oracle interface used
- [ ] Oracle address is immutable or properly governed
- [ ] Multiple oracle sources where appropriate

---

## 6. Denial of Service

### Gas Limits
- [ ] No unbounded loops over user-controlled data (SWC-128)
- [ ] Array lengths bounded
- [ ] Mapping iterations avoided or bounded
- [ ] Gas-heavy operations can be batched

### Griefing Vectors
- [ ] Cannot block other users' operations
- [ ] Withdrawal patterns don't allow blocking (pull vs push)
- [ ] Auctions/queues cannot be griefed
- [ ] No DOS through failed external calls (SWC-113)

### State Bloat
- [ ] No user-controlled state that grows indefinitely
- [ ] Cleanup mechanisms for temporary state
- [ ] Storage slot reuse where appropriate

---

## 7. MEV & Order Dependence

### Frontrunning
- [ ] Commit-reveal for sensitive operations
- [ ] Slippage protection on swaps
- [ ] Deadline parameters on time-sensitive operations
- [ ] Private mempools/flashbots considered where needed

### Sandwich Attacks
- [ ] Price impact checks on large trades
- [ ] TWAP vs spot price for valuations
- [ ] Anti-sandwich mechanisms where appropriate

### Transaction Ordering
- [ ] Race conditions between users considered (SWC-114)
- [ ] Block timestamp manipulation resistance (SWC-116)
- [ ] Block number manipulation resistance
- [ ] Randomness not derived from block data (SWC-120)

---

## 8. Signatures & Replay Protection

### EIP-712 Compliance
- [ ] Proper domain separator with chain ID
- [ ] Correct type hashes
- [ ] Version in domain separator if upgradeable

### Replay Protection
- [ ] Nonces increment correctly
- [ ] Cross-chain replay prevented (chain ID in signature)
- [ ] Contract address in signature to prevent cross-contract replay
- [ ] Deadline/expiry on permits

### Signature Validation
- [ ] `ecrecover` result checked for zero address
- [ ] Signature malleability handled (use OpenZeppelin ECDSA)
- [ ] EIP-1271 for contract signatures where needed
- [ ] `s` value in lower half of curve (malleability)

---

## 9. Additional Checks

### Contract Interactions
- [ ] `address(0)` checks on critical addresses
- [ ] Contract vs EOA checks where needed (`extcodesize` limitations known)
- [ ] Create2 address prediction implications considered

### Events & Logging
- [ ] Events emitted for all state changes
- [ ] Indexed parameters for filtering
- [ ] No sensitive data in events

### Error Handling
- [ ] Custom errors used (gas efficiency)
- [ ] Error messages are informative
- [ ] Assert only for invariants (SWC-110)
- [ ] Require for input validation

### Code Quality
- [ ] No unused variables (SWC-131)
- [ ] No dead code (SWC-135)
- [ ] No deprecated functions (SWC-111)
- [ ] Compiler version locked (not floating)
- [ ] Latest stable Solidity version considered

---

## Cross-Cutting Concerns

### Composability
- [ ] Flash loan safety (no assumptions about atomicity)
- [ ] Callback safety (hook execution)
- [ ] Protocol integration assumptions documented

### Centralization Risks
- [ ] Admin key compromise impact assessed
- [ ] Governance attack vectors considered
- [ ] Emergency shutdown mechanisms reviewed

### Economic Attacks
- [ ] Token economics cannot be gamed
- [ ] Incentive alignment verified
- [ ] Game theory considerations documented
