---
phase: 4
title: "Testing & Hardening"
status: pending
priority: P1
effort: "8h"
dependencies: ["phase-03-core-implementation"]
---

# Phase 4: Testing & Hardening

## Overview
Establish comprehensive test suite for authorization logic, validate Firestore security rules through penetration testing, conduct manual QA for all user roles, and create security regression tests to verify exploits are permanently fixed.

## Requirements

**Functional:**
- Unit tests for all `useAuthorization` hook methods
- Integration tests for role transitions (user role changes mid-session)
- Firestore rules penetration testing covering all attack vectors
- Manual QA checklist for all 4 roles
- Security regression tests for 9 identified vulnerabilities

**Non-functional:**
- Test execution time less than 3 minutes
- Zero false positives in security alerts
- All penetration tests must fail (rules properly block attacks)

## Architecture

**Test Pyramid:**
```
                    Manual QA (1h)
                   /              \
        Integration Tests (2h)
              /                      \
    Unit Tests (3h)              Firestore Rules Tests (2h)
```

**Security Testing Approach:**
- White-box: Test known vulnerabilities from code review
- Black-box: Attempt privilege escalation with limited knowledge
- Regression: Automated tests preventing re-introduction of fixed issues

## Related Code Files

**Create:**
- `src/hooks/__tests__/useAuthorization.test.js` - Hook unit tests
- `tests/integration/role-transitions.test.js` - Session management tests
- `tests/security/firestore-rules.test.js` - Rules penetration testing
- `tests/security/regression.test.js` - Vulnerability regression suite
- `tests/manual-qa-checklist.md` - QA scenarios for all roles

**Modify:**
- `package.json` - Add test scripts and dependencies

## Implementation Steps

### Step 1: Setup Testing Infrastructure (1h)

Install dependencies and configure test environment.

**Commands:**
```bash
cd /Users/dominhxuan/Desktop/QUAN-LY-CHDV

npm install --save-dev @testing-library/react @testing-library/react-hooks @testing-library/jest-dom vitest @vitest/ui jsdom @firebase/rules-unit-testing
```

**Update package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:security": "vitest run tests/security"
  }
}
```

**Create vitest.config.js:**
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
});
```

**Create tests/setup.js:**
```javascript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));
```

### Step 2: Unit Tests for useAuthorization Hook (3h)

Create comprehensive unit tests for all permission methods.

**File:** `src/hooks/__tests__/useAuthorization.test.js`

Full test suite covering canAccess, canDeleteBuilding, canEditMaintenanceRequest, canAccessSettings, and memoization behavior. Tests verify SuperAdmin has all permissions, Guest has none, Manager and Technician have appropriate intermediate permissions.

**Key test cases:**
- SuperAdmin can access all routes
- Guest blocked from protected routes
- Manager can access management routes but not settings
- Only SuperAdmin can delete buildings
- SuperAdmin, Manager, Technician can edit maintenance
- Only SuperAdmin can access settings
- Hook returns stable references when role unchanged

**Verification:**
```bash
npm run test -- src/hooks/__tests__/useAuthorization.test.js
```

### Step 3: Integration Tests for Role Transitions (2h)

Test real-time permission updates when user roles change.

**File:** `tests/integration/role-transitions.test.js`

Tests AuthProvider integration with role changes mid-session. Verifies permissions update immediately when Custom Claims refresh.

**Key scenarios:**
- Manager upgraded to SuperAdmin gains settings access
- SuperAdmin downgraded to Manager loses delete permissions
- Logout resets to Guest permissions
- Token refresh triggers permission recalculation

**Verification:**
```bash
npm run test -- tests/integration/role-transitions.test.js
```

### Step 4: Firestore Rules Penetration Testing (2h)

Validate server-side security rules block unauthorized operations.

**File:** `tests/security/firestore-rules.test.js`

Uses Firebase Rules Unit Testing to verify all attack vectors blocked.

**Test categories:**

**Users Collection:**
- Unauthenticated reads blocked
- Authenticated users can read all users
- Manager cannot create users
- SuperAdmin can create users
- Users cannot update their own role (privilege escalation blocked)
- Users can update own profile except role field
- Manager cannot delete users

**Buildings Collection:**
- Guest cannot create buildings
- Manager can create buildings
- Manager cannot delete buildings
- SuperAdmin can delete buildings

**Attack Vectors:**
- IDOR attack prevention (cannot modify other users)
- Role escalation via Firestore write blocked

**Verification:**
```bash
npm run test:security
```

### Step 5: Security Regression Tests (1h)

Automated tests preventing re-introduction of fixed vulnerabilities.

**File:** `tests/security/regression.test.js`

Tests all 9 vulnerabilities from code review are permanently fixed.

**CVE checks:**
- CVE-002: No hardcoded admin emails in Settings.jsx
- CVE-003: localStorage not used for authorization in AuthContext
- CVE-001: Settings route protected with role guard in App.jsx
- All components use centralized useAuthorization hook (no inline checks)

**Verification:**
```bash
npm run test:security
```

### Step 6: Manual QA Checklist (1h)

Human verification of all security controls.

**File:** `tests/manual-qa-checklist.md`

Comprehensive checklist covering:

**Role Testing:**
- SuperAdmin: Full access including user deletion, role changes, building deletion
- Manager: Can manage resources but not delete or access settings
- Technician: Can update maintenance, read-only for buildings
- Guest: Minimal access, all protected routes redirect

**Attack Scenarios:**
- Privilege escalation via localStorage manipulation (should fail)
- IDOR attack on user data (should fail)
- Firestore rules bypass attempts (should fail)
- Session hijacking with role downgrade (should immediately revoke permissions)

**Regression Tests:**
- Settings route blocks non-SuperAdmin
- Hardcoded emails removed
- localStorage poisoning ineffective

**Performance:**
- Authorization checks complete under 5ms
- No excessive re-renders

**Sign-off required from tester with date and build number.**

## Success Criteria

- [ ] All unit tests pass (15+ tests)
- [ ] All integration tests pass (3+ scenarios)
- [ ] All Firestore rules penetration tests FAIL (rules properly block attacks)
- [ ] All security regression tests pass (9 vulnerabilities confirmed fixed)
- [ ] Manual QA checklist 100% complete with sign-off
- [ ] Zero false positives in security monitoring
- [ ] Documentation updated with testing procedures

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False sense of security from passing tests | HIGH | Include attack scenarios from external security research, not just known issues |
| Firestore rules test setup complexity | MEDIUM | Use Firebase emulator with clear documentation |
| Manual QA incomplete | MEDIUM | Require sign-off from 2+ testers with different roles |
| Performance regression | LOW | Include performance benchmarks in CI pipeline |
| Test maintenance burden | MEDIUM | Keep tests focused on security contracts, not implementation details |

## Verification

**Run all automated tests:**
```bash
npm run test -- src/hooks/__tests__
npm run test -- tests/integration
npm run test:security
```

**Verify manual QA completed:**
```bash
test -f tests/manual-qa-checklist-completed-$(date +%Y%m%d).md && echo "PASS" || echo "FAIL: Manual QA not complete"
```

## Rollback Instructions

No rollback needed for tests. If tests fail:

1. Do NOT proceed to Phase 5
2. Return to Phase 3 and fix failing implementation
3. Re-run tests until all pass
4. Update test cases if requirements changed

## Notes

- Tests are first-class citizens - do not skip or disable failing tests
- Firestore rules tests require @firebase/rules-unit-testing v2+
- Manual QA must be performed by someone other than implementer
- Security regression tests prevent re-introduction of fixed vulnerabilities
- Keep test data realistic but not production data
- Document any test failures with steps to reproduce
- Phase 5 deployment blocked until all tests pass
- Reference penetration testing report for attack vector analysis
