---
phase: 0
title: "Critical Fixes - Red Team Blockers"
status: pending
priority: P0
effort: "6h"
dependencies: []
---

# Phase 0: Critical Fixes - Red Team Blockers

## Overview

Fix 10 blocking vulnerabilities identified by red team review BEFORE proceeding with main implementation. These fixes address fundamental architectural flaws that would make the original plan LESS secure than current state.

**CRITICAL:** This phase must complete successfully before any other phase begins.

## Requirements

**Functional:**
- Remove localStorage fallback (no dual authorization)
- Implement server-side token revocation
- Add infrastructure prerequisites audit
- Fix migration race conditions
- Add function-level authorization
- Remove all hardcoded email checks
- Implement minimum SuperAdmin enforcement
- Add TOCTOU protection
- Expand security test coverage to 100+ scenarios
- Implement server-side feature flags

**Non-functional:**
- Zero tolerance for security shortcuts
- All fixes must be backwards-incompatible with insecure patterns
- Complete infrastructure audit before code changes

## Architecture

**Revised Authorization Flow (No Fallback):**
```
User Login
    ↓
Cloud Functions onCreate (MUST exist before migration)
    ↓
Set Custom Claims (ONLY source of truth)
    ↓
Client reads claims (NO localStorage fallback)
    ↓
Firestore Rules validate claims (server-side enforcement)
    ↓
Token Revocation Check (blockedTokens collection)
    ↓
Function-Level Authorization (revalidate before DB writes)
```

**Hard Cutover Strategy:**
- Day X-1: Deploy infrastructure, verify working
- Day X: Migrate all users in maintenance window
- Day X+1: Remove ALL localStorage auth code
- No parallel systems, no fallback

## Related Code Files

**Create:**
- `functions/admin/infraAudit.js` - Verify Cloud Functions infrastructure
- `functions/auth/tokenRevocation.js` - Server-side session revocation
- `src/utils/serverSideFeatureFlags.js` - Firestore-based feature flags
- `firestore.rules.hardened` - Rules with token revocation checks
- `tests/security/attack-scenarios.test.js` - 100+ exploit tests

**Modify:**
- `functions/index.js` - Add minimum SuperAdmin enforcement
- `src/hooks/useAuthorization.js` - Remove localStorage fallback entirely
- `src/context/AppDataContext.jsx` - Add function-level auth checks

**Delete:**
- All `user?.email === 'nguyentienducbmt123@gmail.com'` checks
- Feature flag `VITE_USE_CUSTOM_CLAIMS` (replace with server-side)

## Implementation Steps

### Step 1: Infrastructure Prerequisites Audit (1h)

**STOP EVERYTHING** if any of these fail:

```bash
# Verify Cloud Functions project exists
firebase projects:list | grep -q "$(cat .firebaserc | jq -r '.projects.default')" || {
  echo "❌ BLOCKER: No Firebase project configured"
  exit 1
}

# Verify Admin SDK credentials
test -f "functions/service-account-key.json" || {
  echo "❌ BLOCKER: No service account key"
  exit 1
}

# Verify Firebase CLI installed
firebase --version || {
  echo "❌ BLOCKER: Firebase CLI not installed"
  exit 1
}

# Test Cloud Functions deployment
cd functions
npm install
npm test || {
  echo "❌ BLOCKER: Functions tests failing"
  exit 1
}

# Test emulator
firebase emulators:start --only functions,firestore &
EMULATOR_PID=$!
sleep 5
curl -f http://localhost:5001 || {
  echo "❌ BLOCKER: Functions emulator not working"
  kill $EMULATOR_PID
  exit 1
}
kill $EMULATOR_PID

echo "✅ Infrastructure audit passed"
```

### Step 2: Remove Dual Authorization System (1h)

**useAuthorization.js - REMOVE FALLBACK:**

```javascript
// BEFORE (VULNERABLE - Red Team VULN-001)
if (!USE_CUSTOM_CLAIMS) {
  // Fallback: use existing user.role
  setClaims({ role: user?.role || 'guest' });
  return;
}

// AFTER (SECURE - No fallback)
export function useAuthorization() {
  const [claims, setClaims] = useState(null);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchClaims = async () => {
      if (!auth.currentUser) {
        setClaims(null);
        setIsValidated(false);
        return;
      }

      try {
        // ONLY source of truth: Custom Claims
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        
        if (!mounted) return;

        // Verify claims exist (if not, user not migrated yet)
        if (!idTokenResult.claims.role) {
          console.error('User not migrated to Custom Claims yet');
          setClaims(null);
          setIsValidated(false);
          return;
        }

        setClaims(idTokenResult.claims);
        setIsValidated(true);
      } catch (error) {
        console.error('Custom Claims fetch failed:', error);
        // NO FALLBACK - fail securely
        setClaims(null);
        setIsValidated(false);
      }
    };

    fetchClaims();

    return () => { mounted = false; };
  }, []);

  return { claims, isValidated, /* ... */ };
}
```

**Remove feature flag entirely:**
```bash
# Delete from .env
sed -i '' '/VITE_USE_CUSTOM_CLAIMS/d' .env.local

# Grep to verify no references remain
grep -r "USE_CUSTOM_CLAIMS" src/ && {
  echo "❌ Feature flag still referenced"
  exit 1
}
```

### Step 3: Server-Side Token Revocation (1.5h)

**functions/auth/tokenRevocation.js:**

```javascript
const admin = require('firebase-admin');

// Revoke user's access immediately (not 1-hour wait)
exports.revokeUserAccess = async (uid, reason) => {
  // Add to blockedTokens collection
  await admin.firestore().collection('blockedTokens').doc(uid).set({
    blockedAt: admin.firestore.FieldValue.serverTimestamp(),
    reason: reason,
    // Token issued before this timestamp = invalid
    invalidBefore: admin.firestore.Timestamp.now()
  });

  // Also revoke all refresh tokens (Firebase built-in)
  await admin.auth().revokeRefreshTokens(uid);

  return { success: true };
};

// Callable function for admins
exports.revokeUser = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { uid, reason } = data;
  return await exports.revokeUserAccess(uid, reason);
});
```

**firestore.rules - Add revocation check:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Check if user's token is revoked
    function isTokenRevoked() {
      let blocked = get(/databases/$(database)/documents/blockedTokens/$(request.auth.uid));
      return blocked != null && 
             request.auth.token.auth_time < blocked.data.invalidBefore.toMillis() / 1000;
    }
    
    // All operations check revocation first
    match /{document=**} {
      allow read, write: if request.auth != null && 
                            !isTokenRevoked() && 
                            /* other checks */;
    }
  }
}
```

**Fixes Red Team VULN-003: Token cache bypass**

### Step 4: Fix Migration Race Condition (1h)

**functions/migration/migrateUsers.js:**

```javascript
exports.migrateUsersToClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.isSuperAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'SuperAdmin only');
  }

  // STEP 1: Create immutable snapshot BEFORE migration
  const snapshotRef = admin.firestore().collection('migrationSnapshots').doc();
  const usersSnapshot = await admin.firestore().collection('users').get();
  
  const snapshot = {};
  usersSnapshot.forEach(doc => {
    snapshot[doc.id] = {
      role: doc.data().role,
      email: doc.data().email,
      plan: doc.data().plan,
      snapshotAt: admin.firestore.FieldValue.serverTimestamp()
    };
  });
  
  // Write snapshot (immutable audit trail)
  await snapshotRef.set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: context.auth.uid,
    userCount: Object.keys(snapshot).length,
    users: snapshot
  });

  // STEP 2: Migrate using ONLY snapshot data (not live Firestore)
  const results = { success: 0, failed: 0 };
  
  for (const [uid, userData] of Object.entries(snapshot)) {
    try {
      // Set claims from SNAPSHOT, not current Firestore state
      await admin.auth().setCustomUserClaims(uid, {
        role: userData.role,
        plan: userData.plan,
        ownerId: uid,
        migratedAt: Date.now(),
        migratedFrom: snapshotRef.id
      });
      
      results.success++;
    } catch (err) {
      console.error(`Failed to migrate ${uid}:`, err);
      results.failed++;
    }
  }

  return { 
    ...results, 
    snapshotId: snapshotRef.id,
    message: 'Migration complete using immutable snapshot'
  };
});
```

**Fixes Red Team VULN-002: Migration race condition**

### Step 5: Function-Level Authorization (1h)

**src/context/AppDataContext.jsx - Add checks INSIDE functions:**

```javascript
// BEFORE (VULNERABLE - Red Team VULN-006)
const clearAllData = async () => {
  // NO CHECK - callable from console
  await deleteDoc(doc(db, 'settings', user.ownerId));
};

// AFTER (SECURE)
const clearAllData = async () => {
  // REVALIDATE role immediately before destructive operation
  const token = await auth.currentUser.getIdTokenResult(true); // Force refresh
  
  if (token.claims.role !== 'admin' && !token.claims.isSuperAdmin) {
    throw new Error('Permission denied: Admin only');
  }
  
  // Check not revoked
  const blockedDoc = await getDoc(doc(db, 'blockedTokens', auth.currentUser.uid));
  if (blockedDoc.exists()) {
    throw new Error('Session revoked');
  }
  
  // NOW safe to execute
  await deleteDoc(doc(db, 'settings', user.ownerId));
};
```

Apply to ALL destructive operations:
- `clearAllData()`
- `loadMockData()`
- `deleteBuilding()`
- `deleteRoom()`
- `deleteTenant()`
- `deleteInvoice()`

### Step 6: Remove ALL Hardcoded Email Checks (30min)

```bash
# Find all occurrences
grep -rn "nguyentienducbmt123@gmail.com" src/ firestore.rules functions/

# Replace in AuthContext
sed -i '' "s/user?.email === 'nguyentienducbmt123@gmail.com'/claims?.isSuperAdmin === true/g" src/context/AuthContext.jsx

# Replace in Firestore rules
sed -i '' "s/request.auth.token.email == 'nguyentienducbmt123@gmail.com'/request.auth.token.isSuperAdmin == true/g" firestore.rules

# Verify removed
grep -r "nguyentienducbmt123@gmail.com" src/ firestore.rules functions/ && {
  echo "❌ Hardcoded email still exists"
  exit 1
}
```

**Fixes Red Team VULN-004: Email-based auth**

### Step 7: Minimum SuperAdmin Enforcement (30min)

**functions/index.js - Update setUserRole:**

```javascript
exports.setUserRole = functions.https.onCall(async (data, context) => {
  const { uid, role } = data;
  
  // Check if demoting last SuperAdmin
  if (role !== 'superadmin') {
    const targetUser = await admin.auth().getUser(uid);
    const targetClaims = targetUser.customClaims || {};
    
    if (targetClaims.isSuperAdmin === true) {
      // Count SuperAdmins
      const allUsers = await admin.auth().listUsers();
      const superAdminCount = allUsers.users.filter(u => 
        u.customClaims?.isSuperAdmin === true
      ).length;
      
      if (superAdminCount <= 1) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cannot demote last SuperAdmin - system would be locked'
        );
      }
    }
  }
  
  // Proceed with role change
  await admin.auth().setCustomUserClaims(uid, { role, /* ... */ });
});
```

**Fixes Red Team VULN-007: SuperAdmin lockout**

### Step 8: Expand Security Tests to 100+ Scenarios (1h)

**tests/security/attack-scenarios.test.js:**

```javascript
describe('Authorization Attack Scenarios', () => {
  
  // VULN-001: Dual auth bypass
  test('localStorage injection fails when Custom Claims deployed', async () => {
    localStorage.setItem('chdv_user', JSON.stringify({ role: 'admin' }));
    const { hasRole } = renderHook(() => useAuthorization()).result.current;
    expect(hasRole(['admin'])).toBe(false); // Claims = null, no fallback
  });
  
  // VULN-002: Migration race condition
  test('migration uses snapshot, not live data', async () => {
    // Create user with role=guest
    await createUser({ uid: 'attacker', role: 'guest' });
    
    // Start migration (creates snapshot)
    const migrationPromise = migrateUsersToClaims();
    
    // While migration runs, upgrade role to admin
    await updateUser({ uid: 'attacker', role: 'admin' });
    
    // Wait for migration
    await migrationPromise;
    
    // Claims should be 'guest' (from snapshot), NOT 'admin'
    const user = await admin.auth().getUser('attacker');
    expect(user.customClaims.role).toBe('guest');
  });
  
  // VULN-003: Token cache bypass
  test('revoked token denied immediately', async () => {
    const userDb = authenticatedDb({ uid: 'user1', role: 'admin' });
    
    // Revoke user
    await revokeUserAccess('user1', 'compromised');
    
    // Try to write (should fail immediately, not wait 1 hour)
    await assertFails(userDb.collection('rooms').add({ name: 'test' }));
  });
  
  // VULN-004: Email spoofing
  test('hardcoded email checks removed', async () => {
    const code = fs.readFileSync('src/context/AuthContext.jsx', 'utf8');
    expect(code).not.toContain('nguyentienducbmt123@gmail.com');
  });
  
  // VULN-006: Function-level auth bypass
  test('clearAllData requires fresh token validation', async () => {
    const { clearAllData } = renderAppDataContext({ role: 'guest' });
    
    // Mock token with admin role
    mockTokenClaims({ role: 'admin' });
    
    // Call function directly (bypass UI)
    await expect(clearAllData()).rejects.toThrow('Permission denied');
  });
  
  // VULN-007: SuperAdmin lockout
  test('cannot demote last SuperAdmin', async () => {
    await createSuperAdmin('admin1');
    
    await expect(
      setUserRole({ uid: 'admin1', role: 'guest' })
    ).rejects.toThrow('Cannot demote last SuperAdmin');
  });
  
  // Add 93 more scenarios covering:
  // - TOCTOU attacks (check-then-act timing)
  // - Token replay attacks
  // - Session fixation
  // - IDOR (Insecure Direct Object Reference)
  // - Privilege escalation via API manipulation
  // - Cross-tenant data access
  // - Race conditions in concurrent role changes
  // - etc.
});
```

Run full suite:
```bash
npm run test:security
# Expected: 100+ tests, all passing
```

## Success Criteria

- [ ] Infrastructure audit passes (Cloud Functions, Admin SDK verified)
- [ ] localStorage fallback completely removed (grep finds 0 references)
- [ ] Token revocation working (test: revoke user, verify immediate denial)
- [ ] Migration race condition fixed (test: concurrent role change during migration)
- [ ] Function-level authorization added to all destructive operations
- [ ] Hardcoded email removed (grep finds 0 occurrences)
- [ ] Minimum SuperAdmin enforcement prevents lockout
- [ ] 100+ security tests written and passing
- [ ] Red team review re-run shows all 10 blockers resolved
- [ ] Plan risk rating drops from 8/10 to 3/10

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking ALL existing functionality | Critical | Hard cutover requires maintenance window; warn users |
| Removing fallback = no gradual rollout | High | Accept risk; dual system more dangerous than hard cutover |
| Infrastructure audit fails = plan blocked | Critical | Fix infrastructure FIRST before writing code |

## Verification

```bash
# Run comprehensive security validation
./scripts/verify-phase-0.sh

#!/bin/bash
set -e

echo "🔍 Phase 0 Verification"

# 1. Infrastructure
echo "Checking infrastructure..."
firebase projects:list | grep -q "$(cat .firebaserc | jq -r '.projects.default')"

# 2. No localStorage fallback
echo "Checking no localStorage fallback..."
! grep -r "USE_CUSTOM_CLAIMS" src/

# 3. No hardcoded email
echo "Checking no hardcoded email..."
! grep -r "nguyentienducbmt123@gmail.com" src/ firestore.rules functions/

# 4. Token revocation exists
echo "Checking token revocation..."
grep -q "isTokenRevoked" firestore.rules

# 5. Function-level auth
echo "Checking function-level authorization..."
grep -q "getIdTokenResult(true)" src/context/AppDataContext.jsx

# 6. Minimum SuperAdmin enforcement
echo "Checking SuperAdmin enforcement..."
grep -q "Cannot demote last SuperAdmin" functions/index.js

# 7. Security tests
echo "Running security tests..."
npm run test:security | tee test-results.txt
test_count=$(grep -c "✓" test-results.txt)
if [ "$test_count" -lt 100 ]; then
  echo "❌ Only $test_count security tests (need 100+)"
  exit 1
fi

echo "✅ Phase 0 verification passed"
```

## Notes

- **BLOCKING PHASE**: Phases 1-5 cannot start until Phase 0 completes
- **No compromises**: All 10 blockers must be fixed, not "partially addressed"
- **Hard cutover only**: Removing fallback means maintenance window required
- **Infrastructure first**: Audit BEFORE writing migration code
- **Re-run red team**: After Phase 0, red team must confirm blockers resolved
- **Accept breaking changes**: Security > convenience; old system was broken
