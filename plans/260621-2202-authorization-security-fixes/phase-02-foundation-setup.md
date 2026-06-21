---
phase: 2
title: "Foundation Setup"
status: pending
priority: P1
effort: "8h"
dependencies: [1]
---

# Phase 2: Foundation Setup

## Overview

Build authorization infrastructure without breaking existing functionality. Deploy Firebase Cloud Functions for Custom Claims management, create centralized React hooks, define role hierarchy, and set up testing infrastructure. All changes are backwards-compatible.

**Goal:** Deploy authorization foundation that runs parallel to existing system with feature flag control.

## Requirements

**Functional:**
- Firebase Cloud Functions project for Custom Claims management
- `useAuthorization` React hook with backwards-compatible fallback
- Role hierarchy constants with permission mappings
- Firestore emulator setup for rules testing
- Feature flag system for gradual rollout

**Non-functional:**
- Zero breaking changes (must not disrupt existing features)
- Backwards-compatible fallback to old `user.role` system
- Performance: <50ms overhead for authorization checks
- Cloud Functions: <200ms cold start, <50ms warm start

## Architecture

**Custom Claims Flow:**
```
User signs up/login
    ↓
Cloud Function onCreate
    ↓
Set Custom Claims via Admin SDK (server-side)
    ↓
Claims embedded in JWT token (cryptographically signed)
    ↓
Client reads via auth.currentUser.getIdTokenResult()
    ↓
useAuthorization hook provides hasRole/hasPermission
    ↓
Components check permissions via hook
```

**Defense-in-Depth Layers:**
```
Layer 1: Custom Claims (JWT token)
    ↓ validated by
Layer 2: Firestore Rules (DB level)
    ↓ checked by
Layer 3: useAuthorization hook (client)
    ↓ rendered by
Layer 4: Component role checks (UI)
```

**Feature Flag Control:**
```javascript
// .env.local
VITE_USE_CUSTOM_CLAIMS=true  // Enable new system
VITE_USE_CUSTOM_CLAIMS=false // Revert to old system
```

## Related Code Files

**Create:**
- `functions/index.js` - Cloud Functions for Custom Claims
- `functions/package.json` - Cloud Functions dependencies
- `src/hooks/useAuthorization.js` - Centralized authorization hook
- `src/constants/permissions.js` - Role hierarchy and permissions
- `src/constants/roles.js` - Role level definitions
- `firestore.test.js` - Security rules test suite
- `.firebaserc` - Firebase project configuration (if not exists)
- `firebase.json` - Firebase emulator configuration

**Modify:**
- None (all changes are additive in this phase)

## Implementation Steps

### Step 1: Firebase Cloud Functions Setup (2h)

Initialize Cloud Functions project:

```bash
# Initialize Functions (skip if already exists)
firebase init functions

# Select:
# - Language: JavaScript
# - ESLint: Yes
# - Install dependencies: Yes

cd functions
npm install firebase-admin@^12.0.0
```

**functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Role hierarchy levels
const ROLE_LEVELS = {
  guest: 0,
  tenant: 10,
  viewer: 20,
  staff: 40,
  manager: 60,
  admin: 80,
  superadmin: 100
};

// Callable function to set user role (admin/superadmin only)
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Verify caller is admin or superadmin
  const callerLevel = ROLE_LEVELS[context.auth.token.role] || 0;
  if (callerLevel < ROLE_LEVELS.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can modify roles');
  }

  const { uid, role, plan, ownerId } = data;

  // Validate inputs
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing uid or role');
  }

  if (!ROLE_LEVELS.hasOwnProperty(role)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid role: ${role}`);
  }

  // Prevent privilege escalation (can't assign higher role than caller)
  const targetLevel = ROLE_LEVELS[role];
  if (targetLevel > callerLevel && !context.auth.token.isSuperAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot assign role higher than your own'
    );
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(uid, {
    role: role,
    plan: plan || 'none',
    ownerId: ownerId || uid,
    isSuperAdmin: role === 'superadmin',
    admin: role === 'admin' || role === 'superadmin',
    manager: role === 'manager' || role === 'admin' || role === 'superadmin'
  });

  // Update Firestore for persistence
  await admin.firestore().collection('users').doc(uid).update({
    role: role,
    plan: plan || 'none',
    ownerId: ownerId || uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Trigger client token refresh
  await admin.firestore().collection('metadata').doc(uid).set({
    refreshTime: admin.firestore.FieldValue.serverTimestamp(),
    reason: 'role_change'
  }, { merge: true });

  return { success: true, message: `Role updated to ${role}` };
});

// Auto-set claims on user creation
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  let role = 'guest';
  let ownerId = user.uid;
  let plan = 'none';

  // Check if user is tenant
  const tenantQuery = await admin.firestore()
    .collection('tenants')
    .where('email', '==', user.email)
    .limit(1)
    .get();

  if (!tenantQuery.empty) {
    role = 'tenant';
    const tenantData = tenantQuery.docs[0].data();
    ownerId = tenantData.ownerId || user.uid;
  } else {
    // New signup defaults to admin with trial
    role = 'admin';
    plan = 'trial';
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(user.uid, {
    role: role,
    plan: plan,
    ownerId: ownerId,
    isSuperAdmin: false,
    admin: role === 'admin',
    manager: role === 'manager' || role === 'admin'
  });

  // Create user document
  await admin.firestore().collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    name: user.displayName || 'User',
    role: role,
    plan: plan,
    ownerId: ownerId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return null;
});

// Security monitoring: detect privilege escalation
exports.detectPrivilegeEscalation = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Alert on role elevation
    const beforeLevel = ROLE_LEVELS[before.role] || 0;
    const afterLevel = ROLE_LEVELS[after.role] || 0;

    if (afterLevel > beforeLevel && afterLevel >= ROLE_LEVELS.admin) {
      await admin.firestore().collection('security_alerts').add({
        type: 'PRIVILEGE_ESCALATION',
        userId: context.params.userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: {
          before: before.role,
          after: after.role
        }
      });
    }

    // Alert on email changes
    if (before.email !== after.email) {
      await admin.firestore().collection('security_alerts').add({
        type: 'EMAIL_CHANGE',
        userId: context.params.userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: {
          before: before.email,
          after: after.email
        }
      });
    }

    return null;
  });
```

Deploy Cloud Functions:
```bash
firebase deploy --only functions
```

### Step 2: Role Hierarchy Constants (1h)

**src/constants/roles.js:**
```javascript
// Role hierarchy with numeric levels
export const ROLE_LEVELS = {
  guest: 0,
  tenant: 10,
  viewer: 20,
  staff: 40,
  manager: 60,
  admin: 80,
  superadmin: 100
};

// Role display names
export const ROLE_NAMES = {
  guest: 'Khách',
  tenant: 'Khách Thuê',
  viewer: 'Người Xem',
  staff: 'Nhân Viên',
  manager: 'Quản Lý',
  admin: 'Quản Trị Viên',
  superadmin: 'Super Admin'
};

// Check if role A has higher or equal privilege than role B
export function hasHigherRole(roleA, roleB) {
  return (ROLE_LEVELS[roleA] || 0) >= (ROLE_LEVELS[roleB] || 0);
}
```

**src/constants/permissions.js:**
```javascript
// Permission mappings for each role
export const ROLE_PERMISSIONS = {
  superadmin: ['*'], // Wildcard = all permissions

  admin: [
    'workspace.manage',
    'users.create', 'users.read', 'users.update', 'users.delete',
    'settings.read', 'settings.write', 'settings.delete',
    'buildings.create', 'buildings.read', 'buildings.update', 'buildings.delete',
    'rooms.create', 'rooms.read', 'rooms.update', 'rooms.delete',
    'tenants.create', 'tenants.read', 'tenants.update', 'tenants.delete',
    'contracts.create', 'contracts.read', 'contracts.update', 'contracts.delete',
    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
    'maintenance.create', 'maintenance.read', 'maintenance.update', 'maintenance.delete',
    'maintenance.assign', 'maintenance.close'
  ],

  manager: [
    'settings.read', 'settings.write', // Can modify settings, not delete
    'buildings.read',
    'rooms.create', 'rooms.read', 'rooms.update', // Cannot delete
    'tenants.create', 'tenants.read', 'tenants.update', 'tenants.delete',
    'contracts.create', 'contracts.read', 'contracts.update',
    'invoices.create', 'invoices.read', 'invoices.update',
    'maintenance.create', 'maintenance.read', 'maintenance.update', 'maintenance.assign'
  ],

  staff: [
    'buildings.read',
    'rooms.read', 'rooms.update', // Can mark vacant/occupied
    'tenants.read', 'tenants.update',
    'contracts.read',
    'invoices.create', 'invoices.read',
    'maintenance.create', 'maintenance.read', 'maintenance.update'
  ],

  viewer: [
    'buildings.read',
    'rooms.read',
    'tenants.read',
    'contracts.read',
    'invoices.read',
    'maintenance.read'
  ],

  tenant: [
    'rooms.read_vacant', // Browse vacant rooms
    'invoices.read_own', // Only their invoices
    'maintenance.create_own', // Create tickets for their room
    'maintenance.read_own'
  ],

  guest: [
    'rooms.read_vacant' // Browse only
  ]
};

// Check if role has specific permission
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  // Wildcard permission
  if (permissions.includes('*')) return true;
  
  // Exact match
  if (permissions.includes(permission)) return true;
  
  // Prefix match (e.g., 'rooms.read' matches 'rooms.read_own')
  return permissions.some(p => permission.startsWith(p + '.') || p.startsWith(permission + '.'));
}
```

### Step 3: Centralized Authorization Hook (2h)

**src/hooks/useAuthorization.js:**
```javascript
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS, hasPermission as checkPermission } from '../constants/permissions';

// Feature flag
const USE_CUSTOM_CLAIMS = import.meta.env.VITE_USE_CUSTOM_CLAIMS === 'true';

export function useAuthorization() {
  const { user } = useAuth(); // Existing auth context
  const [claims, setClaims] = useState(null);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    if (!USE_CUSTOM_CLAIMS) {
      // Fallback: use existing user.role
      setClaims({
        role: user?.role || 'guest',
        plan: user?.plan || 'none',
        ownerId: user?.ownerId || user?.uid,
        isSuperAdmin: user?.email === 'nguyentienducbmt123@gmail.com'
      });
      setIsValidated(true);
      return;
    }

    let mounted = true;

    const fetchClaims = async () => {
      try {
        if (!auth.currentUser) {
          setClaims(null);
          setIsValidated(false);
          return;
        }

        // Fetch custom claims from token
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        
        if (!mounted) return;

        setClaims(idTokenResult.claims);
        setIsValidated(true);
      } catch (error) {
        console.error('Failed to fetch custom claims:', error);
        
        // Fallback to user object
        if (mounted && user) {
          setClaims({
            role: user.role || 'guest',
            plan: user.plan || 'none',
            ownerId: user.ownerId || user.uid,
            isSuperAdmin: user.email === 'nguyentienducbmt123@gmail.com'
          });
          setIsValidated(true);
        }
      }
    };

    fetchClaims();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Check if user has any of the allowed roles
  const hasRole = useCallback((allowedRoles) => {
    if (!claims || !claims.role) return false;
    
    // Super admin has all roles
    if (claims.isSuperAdmin) return true;
    
    return allowedRoles.includes(claims.role);
  }, [claims]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!claims || !claims.role) return false;
    
    // Super admin has all permissions
    if (claims.isSuperAdmin) return true;
    
    return checkPermission(claims.role, permission);
  }, [claims]);

  // Check if user owns the resource
  const isOwner = useCallback((resourceOwnerId) => {
    if (!claims) return false;
    
    // Super admin owns everything
    if (claims.isSuperAdmin) return true;
    
    return claims.ownerId === resourceOwnerId || auth.currentUser?.uid === resourceOwnerId;
  }, [claims]);

  return {
    claims,
    isValidated,
    hasRole,
    hasPermission,
    isOwner,
    isSuperAdmin: claims?.isSuperAdmin || false,
    role: claims?.role || 'guest',
    ownerId: claims?.ownerId
  };
}
```

### Step 4: Firebase Emulator Setup (1h)

**firebase.json:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**package.json** (add scripts):
```json
{
  "scripts": {
    "emulators": "firebase emulators:start",
    "test:rules": "firebase emulators:exec --only firestore 'npm run test:firestore'",
    "test:firestore": "node --test firestore.test.js"
  },
  "devDependencies": {
    "@firebase/rules-unit-testing": "^3.0.0"
  }
}
```

Install dependencies:
```bash
npm install --save-dev @firebase/rules-unit-testing
```

### Step 5: Security Rules Test Suite (2h)

**firestore.test.js:**
```javascript
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080
    }
  });
});

after(async () => {
  await testEnv.cleanup();
});

describe('Security Rules Tests', () => {
  it('prevents localStorage role injection', async () => {
    const db = testEnv.authenticatedContext('attacker', {
      role: 'guest'
    });

    // Attacker tries to create user with admin role
    await assertFails(
      db.collection('users').doc('attacker').set({
        email: 'attacker@test.com',
        role: 'admin', // Should fail
        ownerId: 'attacker'
      })
    );
  });

  it('prevents email spoofing', async () => {
    const db = testEnv.authenticatedContext('attacker', {
      role: 'guest'
    });

    // Create user first
    await db.collection('users').doc('attacker').set({
      email: 'attacker@test.com',
      role: 'guest',
      ownerId: 'attacker'
    });

    // Try to change email
    await assertFails(
      db.collection('users').doc('attacker').update({
        email: 'admin@test.com' // Should fail
      })
    );
  });

  it('allows admin to modify roles', async () => {
    const adminDb = testEnv.authenticatedContext('admin', {
      role: 'admin',
      isSuperAdmin: true
    });

    await assertSucceeds(
      adminDb.collection('users').doc('target').set({
        email: 'target@test.com',
        role: 'manager',
        ownerId: 'admin'
      })
    );
  });

  it('prevents ownerId tampering on create', async () => {
    const attackerDb = testEnv.authenticatedContext('attacker', {
      role: 'manager',
      ownerId: 'attacker'
    });

    // Try to create room with victim ownerId
    await assertFails(
      attackerDb.collection('rooms').add({
        name: 'Malicious Room',
        ownerId: 'victim' // Should fail
      })
    );
  });
});
```

Run tests:
```bash
npm run test:rules
```

## Success Criteria

- [ ] Cloud Functions deployed successfully (verify with `firebase functions:list`)
- [ ] `setUserRole` callable function tested and working
- [ ] `onUserCreate` trigger sets claims for new users
- [ ] `useAuthorization` hook returns correct role/permissions
- [ ] Feature flag `VITE_USE_CUSTOM_CLAIMS=false` reverts to old system
- [ ] Role constants and permissions defined in `src/constants/`
- [ ] Firebase emulator running successfully (port 8080 for Firestore)
- [ ] Security rules test suite passes (all tests green)
- [ ] No breaking changes to existing features (manual smoke test)
- [ ] Documentation added to `docs/authorization.md`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloud Functions deployment fails | High | Test locally with emulator first; validate IAM permissions |
| Claims not propagating to clients | High | Test token refresh; add metadata-based invalidation |
| Feature flag not working | Medium | Test both true/false states; add runtime validation |
| Performance degradation | Low | Benchmark claim fetch time; should be <50ms |

## Verification

```bash
# Verify Cloud Functions deployed
firebase functions:list | grep setUserRole

# Verify emulator running
curl http://localhost:8080

# Verify feature flag
echo $VITE_USE_CUSTOM_CLAIMS

# Run test suite
npm run test:rules

# Manual verification
# 1. Create test user
# 2. Call setUserRole function
# 3. Verify claims in token
# 4. Toggle feature flag and test fallback
```

## Notes

- All changes are additive (no deletions in this phase)
- Feature flag allows instant rollback
- Claims cached in token for 1 hour (performance vs staleness trade-off)
- Super admin setup requires one-time manual Cloud Function call
- Keep existing localStorage logic for backwards compatibility
