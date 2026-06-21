---
phase: 1
title: "Security Analysis"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Security Analysis

## Overview

Comprehensive security audit of current authorization implementation. Identify all vulnerable locations, document attack vectors, and verify fix scope. This phase produces audit reports and vulnerability maps used in later phases.

**Goal:** Create complete inventory of authorization vulnerabilities with proof-of-concept exploits.

## Requirements

**Functional:**
- Document all 50+ scattered role checks across codebase
- Identify all 6+ hardcoded email authorization locations
- Map localStorage usage for auth data
- Analyze Firestore security rules for vulnerabilities
- Create proof-of-concept exploits for each critical issue

**Non-functional:**
- Audit must be reproducible (automated scripts where possible)
- All findings must include file:line references
- Attack vectors must be demonstrable (not theoretical)

## Architecture

**Audit Methodology:**
1. **Static Analysis** - grep/find for authorization patterns
2. **Manual Code Review** - read AuthContext, ProtectedRoute, security rules
3. **Attack Simulation** - test exploits in browser DevTools
4. **Rules Testing** - Firebase emulator rules validation
5. **Documentation** - structured vulnerability reports

**Output Artifacts:**
- `SECURITY_AUDIT.md` - Comprehensive vulnerability report
- `ATTACK_VECTORS.md` - Proof-of-concept exploits
- `AUTH_INVENTORY.md` - Complete list of authorization checks
- `firestore.rules.audit` - Annotated security rules with vulnerabilities

## Related Code Files

**Analyze:**
- `src/context/AuthContext.jsx` - Auth state management, hardcoded checks
- `src/App.jsx` - Route protection, unprotected SuperAdmin route
- `src/components/Sidebar.jsx` - Navigation role checks
- `src/components/BottomTabBar.jsx` - Mobile nav role checks
- `src/pages/Settings.jsx` - Destructive operations without role checks
- `src/pages/SuperAdmin.jsx` - Hardcoded email checks
- `src/pages/Users.jsx` - Admin-only page
- `src/pages/Home.jsx` - Building-level authorization
- `src/components/RoomDetailDrawer.jsx` - Feature-level role checks
- `src/components/InvoiceReceiptModal.jsx` - Payment role checks
- `src/components/DevBackdoor.jsx` - Development backdoor exposure
- `firestore.rules` - Security rules vulnerabilities
- `src/firebase.js` - Firebase config

## Implementation Steps

### Step 1: Static Analysis (1h)

Search for all authorization patterns:

```bash
# Find all role checks
grep -rn "user?.role" src/ > auth-checks.txt
grep -rn "allowedRoles" src/ >> auth-checks.txt

# Find hardcoded email checks
grep -rn "nguyentienducbmt123@gmail.com" src/ firestore.rules > hardcoded-email.txt

# Find localStorage usage
grep -rn "localStorage" src/ > localstorage-usage.txt

# Count occurrences
echo "Role checks found: $(wc -l < auth-checks.txt)"
echo "Hardcoded email: $(wc -l < hardcoded-email.txt)"
echo "localStorage: $(wc -l < localstorage-usage.txt)"
```

**Expected Output:**
- 50+ role check locations in `auth-checks.txt`
- 6+ hardcoded email locations in `hardcoded-email.txt`
- 10+ localStorage usages in `localstorage-usage.txt`

### Step 2: Manual Code Review (1.5h)

Read and annotate critical files:

**AuthContext.jsx:**
- Line 9-12: localStorage initialization (CRITICAL)
- Line 149-153: Hardcoded super admin email
- Line 116-146: Race condition in auto-heal logic
- Line 174-183: Login stores user in localStorage without validation

**App.jsx:**
- Line 108-113: Route protection with allowedRoles
- Line 115: SuperAdmin route MISSING ProtectedRoute wrapper (CRITICAL)

**Settings.jsx:**
- Line 380-401: Destructive operations (clearAllData, loadMockData) have NO role checks (CRITICAL)

**firestore.rules:**
- Line 6-8: getUserData() uses email instead of UID (VULNERABLE)
- Line 12: isSuperAdmin() checks hardcoded email
- Line 40-42: No ownerId validation on create

### Step 3: Attack Vector Testing (1h)

Test each vulnerability with proof-of-concept:

**Attack 1: localStorage Role Injection**
```javascript
// Open browser console
const adminUser = {
  name: "Attacker",
  email: "attacker@test.com",
  role: "admin",
  plan: "pro",
  ownerId: "attacker-uid"
};
localStorage.setItem('chdv_user', JSON.stringify(adminUser));
location.reload(); // Now admin
```
**Result:** ✅ Exploitable - Full admin access gained

**Attack 2: Firestore Email Tampering**
```javascript
// Change email in Firestore
await updateDoc(doc(db, 'users', currentUserId), {
  email: 'nguyentienducbmt123@gmail.com'
});
location.reload();
```
**Result:** ✅ Exploitable - Super admin access gained

**Attack 3: SuperAdmin Route Direct Access**
```
1. Navigate to http://localhost:5173/super-admin
2. Only component-level check (can be bypassed with localStorage)
```
**Result:** ✅ Exploitable - No route guard

**Attack 4: Settings Destructive Operations**
```javascript
// Any user with route access (now includes manager) can:
clearAllData(); // Wipes entire database
```
**Result:** ✅ Exploitable - No role check

### Step 4: Firestore Rules Testing (0.5h)

Test security rules with Firebase emulator:

```bash
# Start emulator
firebase emulators:start --only firestore

# Run rules test suite
npm run test:rules
```

**Test Cases:**
```javascript
// Test 1: User can modify their own role
const attackerDb = testEnv.authenticatedContext('attacker');
await assertFails(
  attackerDb.collection('users').doc('attacker').update({ role: 'admin' })
);
// EXPECTED: Fail
// ACTUAL: Succeeds (VULNERABILITY)

// Test 2: User can create document with arbitrary ownerId
const attackerDb = testEnv.authenticatedContext('attacker');
await assertFails(
  attackerDb.collection('rooms').add({ ownerId: 'victim-uid' })
);
// EXPECTED: Fail
// ACTUAL: Succeeds (VULNERABILITY)
```

### Step 5: Document Findings (0.5h)

Create structured vulnerability reports:

**SECURITY_AUDIT.md Format:**
```markdown
# Security Audit Report

## Executive Summary
- Total vulnerabilities: 9
- Critical: 3
- Important: 6
- Exploitable: 100%

## Critical Vulnerabilities

### VULN-001: localStorage Role Injection
- Severity: 10/10
- Location: src/context/AuthContext.jsx:9-12
- Attack: [proof-of-concept code]
- Impact: Complete system compromise
- Fix: Implement Custom Claims, remove localStorage auth

[... repeat for all vulnerabilities ...]
```

**AUTH_INVENTORY.md Format:**
```markdown
# Authorization Check Inventory

## Route-Level Checks (App.jsx)
- Line 108: /finance - allowedRoles={['admin', 'manager', 'staff']}
- Line 109: /tenants - allowedRoles={['admin', 'manager', 'staff']}
- Line 115: /super-admin - NO PROTECTION (CRITICAL)

## Component-Level Checks
### Sidebar.jsx
- Line 22: Settings link - user?.role === 'admin' || user?.role === 'manager'

[... complete inventory ...]
```

## Success Criteria

- [ ] All 50+ role check locations documented in `AUTH_INVENTORY.md`
- [ ] All 6+ hardcoded email locations identified with file:line references
- [ ] All 9 vulnerabilities tested with working proof-of-concept exploits
- [ ] `SECURITY_AUDIT.md` report completed with severity ratings
- [ ] `ATTACK_VECTORS.md` contains reproducible exploit code
- [ ] Firestore rules vulnerabilities documented in `firestore.rules.audit`
- [ ] Static analysis scripts saved for future audits
- [ ] Findings reviewed and validated by security-conscious developer

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False negatives (missed vulnerabilities) | High | Manual review + automated search; peer review |
| False positives (non-issues flagged) | Low | Manual verification of each finding |
| Exploits leaked during testing | Medium | Test on local dev environment only; no production testing |

## Verification

Run verification script to confirm audit completeness:

```bash
# Verify all files analyzed
required_files=(
  "src/context/AuthContext.jsx"
  "src/App.jsx"
  "src/pages/Settings.jsx"
  "firestore.rules"
)

for file in "${required_files[@]}"; do
  if ! grep -q "$file" SECURITY_AUDIT.md; then
    echo "❌ Missing analysis for $file"
    exit 1
  fi
done

echo "✅ Audit complete"
```

## Notes

- All exploits tested on local development environment only
- Never test attacks on production systems
- Document all findings even if "low severity" - context matters
- Keep audit reports confidential until vulnerabilities fixed
