---
phase: 5
title: "Deployment & Monitoring"
status: pending
priority: P1
effort: "4h"
dependencies: ["phase-04-testing-hardening"]
---

# Phase 5: Deployment & Monitoring

## Overview
Migrate existing production users to Custom Claims, deploy updated Firestore security rules, establish security monitoring infrastructure, and implement feature flag rollout strategy for safe production deployment.

## Requirements

**Functional:**
- All existing users have Custom Claims set in Firebase Auth
- Updated Firestore security rules deployed to production
- Security monitoring alerts active (unauthorized access attempts)
- Feature flag system for gradual rollout
- Rollback plan tested and documented

**Non-functional:**
- Zero downtime during migration
- Migration script idempotent (can re-run safely)
- Monitoring alerts fire within 30 seconds of suspicious activity
- All changes reversible within 5 minutes

## Architecture

**Migration Flow:**
```
Existing Users (Firestore role only)
          ↓
Migration Script (Cloud Function)
          ↓
Custom Claims Set (Firebase Auth)
          ↓
Firestore role kept as backup
          ↓
New authorization flow active
```

**Monitoring Architecture:**
```
Client Authorization Check Failure
          ↓
Log to security_alerts collection
          ↓
Cloud Function trigger
          ↓
Alert via email/Slack (if threshold exceeded)
```

## Related Code Files

**Create:**
- `functions/migrateUsersToClaims.js` - Migration Cloud Function
- `functions/monitorSecurityAlerts.js` - Alert monitoring function
- `scripts/verify-migration.js` - Verification script
- `docs/deployment-runbook.md` - Step-by-step deployment guide
- `.env.production` - Feature flags configuration

**Modify:**
- `firestore.rules` - Deploy to production
- `functions/index.js` - Register new functions
- `src/config/featureFlags.js` - Add authorization migration flag

**Deploy:**
- Firebase Cloud Functions
- Firestore security rules
- Environment variables

## Implementation Steps

### Step 1: Create User Migration Cloud Function (1h)

**File:** `functions/migrateUsersToClaims.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Migrate existing users from Firestore-only roles to Custom Claims
 * Idempotent: Safe to run multiple times
 */
exports.migrateUsersToClaims = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onCall(async (data, context) => {
    // Only SuperAdmin can trigger migration
    if (context.auth.token.role !== 'SuperAdmin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only SuperAdmin can trigger user migration'
      );
    }
    
    const db = admin.firestore();
    const auth = admin.auth();
    
    const results = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: [],
    };
    
    try {
      // Fetch all users from Firestore
      const usersSnapshot = await db.collection('users').get();
      results.total = usersSnapshot.size;
      
      console.log(`Starting migration for ${results.total} users`);
      
      // Process in batches of 10 to avoid rate limits
      const batchSize = 10;
      const users = usersSnapshot.docs;
      
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (userDoc) => {
          const userData = userDoc.data();
          const uid = userDoc.id;
          const firestoreRole = userData.role || 'Guest';
          
          try {
            // Get current Custom Claims
            const userRecord = await auth.getUser(uid);
            const currentClaims = userRecord.customClaims || {};
            
            // Skip if already migrated and matching
            if (currentClaims.role === firestoreRole) {
              results.skipped++;
              console.log(`User ${uid} already has correct claims, skipping`);
              return;
            }
            
            // Set Custom Claims
            await auth.setCustomUserClaims(uid, {
              role: firestoreRole,
              migratedAt: Date.now(),
              migratedBy: context.auth.uid,
            });
            
            // Update Firestore with migration metadata
            await db.collection('users').doc(uid).update({
              customClaimsMigrated: true,
              customClaimsMigratedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastUpdatedBy: context.auth.uid,
            });
            
            results.migrated++;
            console.log(`Migrated user ${uid} to role: ${firestoreRole}`);
            
          } catch (error) {
            console.error(`Error migrating user ${uid}:`, error);
            results.errors.push({
              uid,
              email: userData.email,
              error: error.message,
            });
          }
        }));
        
        // Rate limiting pause between batches
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log('Migration complete:', results);
      
      // Log migration event
      await db.collection('system_logs').add({
        event: 'user_claims_migration',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        results,
        triggeredBy: context.auth.uid,
      });
      
      return results;
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Migration failed: ' + error.message
      );
    }
  });

/**
 * Verify migration status for a single user
 */
exports.verifyUserClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }
  
  const { userId } = data;
  const targetUid = userId || context.auth.uid;
  
  // Non-SuperAdmin can only check themselves
  if (targetUid !== context.auth.uid && context.auth.token.role !== 'SuperAdmin') {
    throw new functions.https.HttpsError('permission-denied', 'Cannot check other users');
  }
  
  try {
    const userRecord = await admin.auth().getUser(targetUid);
    const userDoc = await admin.firestore().collection('users').doc(targetUid).get();
    
    return {
      uid: targetUid,
      email: userRecord.email,
      customClaims: userRecord.customClaims,
      firestoreRole: userDoc.data()?.role,
      migrated: userDoc.data()?.customClaimsMigrated || false,
      claimsMatch: userRecord.customClaims?.role === userDoc.data()?.role,
    };
  } catch (error) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
});
```

**Register in functions/index.js:**
```javascript
const { migrateUsersToClaims, verifyUserClaims } = require('./migrateUsersToClaims');

exports.migrateUsersToClaims = migrateUsersToClaims;
exports.verifyUserClaims = verifyUserClaims;
```

**Deploy:**
```bash
cd /Users/dominhxuan/Desktop/QUAN-LY-CHDV/functions
npm install
cd ..
firebase deploy --only functions:migrateUsersToClaims,functions:verifyUserClaims
```

### Step 2: Create Security Monitoring Function (1h)

**File:** `functions/monitorSecurityAlerts.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Monitor security_alerts collection for suspicious activity
 * Triggers on new alert documents
 */
exports.monitorSecurityAlerts = functions.firestore
  .document('security_alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const db = admin.firestore();
    
    console.log('Security alert triggered:', alert);
    
    // Check alert severity
    const severity = alert.severity || 'medium';
    
    // Count recent alerts from same user (rate limiting check)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentAlerts = await db.collection('security_alerts')
      .where('userId', '==', alert.userId)
      .where('timestamp', '>', fiveMinutesAgo)
      .get();
    
    const alertCount = recentAlerts.size;
    
    // Threshold: 5 failed auth checks in 5 minutes = suspicious
    if (alertCount >= 5) {
      console.warn(`SECURITY WARNING: User ${alert.userId} triggered ${alertCount} alerts in 5 minutes`);
      
      // Create incident record
      await db.collection('security_incidents').add({
        userId: alert.userId,
        email: alert.email,
        alertCount,
        timeWindow: '5m',
        firstAlert: recentAlerts.docs[0].data(),
        latestAlert: alert,
        status: 'open',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // TODO: Send notification (email/Slack)
      // await sendSecurityNotification({
      //   subject: 'Security Alert: Multiple Authorization Failures',
      //   userId: alert.userId,
      //   count: alertCount,
      // });
    }
    
    // Auto-close old alerts after 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldAlerts = await db.collection('security_alerts')
      .where('timestamp', '<', oneDayAgo)
      .limit(100)
      .get();
    
    const batch = db.batch();
    oldAlerts.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!oldAlerts.empty) {
      await batch.commit();
      console.log(`Cleaned up ${oldAlerts.size} old security alerts`);
    }
  });

/**
 * Client-side helper to log security alerts
 * Call from frontend when authorization check fails
 */
exports.logSecurityAlert = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  
  const alert = {
    userId: context.auth?.uid || 'anonymous',
    email: context.auth?.token?.email || 'unknown',
    attemptedAction: data.action,
    requiredRole: data.requiredRole,
    actualRole: context.auth?.token?.role || 'Guest',
    route: data.route,
    timestamp: Date.now(),
    severity: data.severity || 'medium',
    userAgent: context.rawRequest.headers['user-agent'],
    ip: context.rawRequest.ip,
  };
  
  await db.collection('security_alerts').add(alert);
  
  return { logged: true };
});
```

**Register in functions/index.js:**
```javascript
const { monitorSecurityAlerts, logSecurityAlert } = require('./monitorSecurityAlerts');

exports.monitorSecurityAlerts = monitorSecurityAlerts;
exports.logSecurityAlert = logSecurityAlert;
```

**Deploy:**
```bash
firebase deploy --only functions:monitorSecurityAlerts,functions:logSecurityAlert
```

**Client-side integration (add to useAuthorization.js):**
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const logSecurityAlert = httpsCallable(functions, 'logSecurityAlert');

export const useAuthorization = () => {
  // ... existing code ...
  
  const canAccess = useCallback((route) => {
    const allowed = checkPermission(route);
    
    if (!allowed) {
      // Log unauthorized access attempt
      logSecurityAlert({
        action: 'route_access',
        route,
        requiredRole: getRequiredRole(route),
        severity: route === 'settings' ? 'high' : 'medium',
      }).catch(console.error);
    }
    
    return allowed;
  }, [userRole]);
  
  // ... rest of hook ...
};
```

### Step 3: Create Migration Verification Script (30min)

**File:** `scripts/verify-migration.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function verifyMigration() {
  console.log('Starting migration verification...\n');
  
  const results = {
    total: 0,
    verified: 0,
    mismatched: [],
    missing: [],
  };
  
  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    results.total = usersSnapshot.size;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const firestoreRole = userData.role || 'Guest';
      
      try {
        const userRecord = await auth.getUser(uid);
        const claims = userRecord.customClaims || {};
        
        if (!claims.role) {
          results.missing.push({
            uid,
            email: userRecord.email,
            firestoreRole,
          });
          console.log(`❌ User ${userRecord.email}: Missing Custom Claims`);
        } else if (claims.role !== firestoreRole) {
          results.mismatched.push({
            uid,
            email: userRecord.email,
            firestoreRole,
            claimsRole: claims.role,
          });
          console.log(`⚠️  User ${userRecord.email}: Mismatch (Firestore: ${firestoreRole}, Claims: ${claims.role})`);
        } else {
          results.verified++;
          console.log(`✅ User ${userRecord.email}: Verified (${claims.role})`);
        }
      } catch (error) {
        console.error(`Error checking user ${uid}:`, error.message);
      }
    }
    
    console.log('\n=== Migration Verification Summary ===');
    console.log(`Total users: ${results.total}`);
    console.log(`Verified: ${results.verified}`);
    console.log(`Missing claims: ${results.missing.length}`);
    console.log(`Mismatched: ${results.mismatched.length}`);
    
    if (results.missing.length > 0) {
      console.log('\nUsers missing Custom Claims:');
      results.missing.forEach(u => console.log(`  - ${u.email} (${u.firestoreRole})`));
    }
    
    if (results.mismatched.length > 0) {
      console.log('\nUsers with mismatched roles:');
      results.mismatched.forEach(u => 
        console.log(`  - ${u.email}: Firestore=${u.firestoreRole}, Claims=${u.claimsRole}`)
      );
    }
    
    const success = results.missing.length === 0 && results.mismatched.length === 0;
    console.log(`\n${success ? '✅ Migration successful!' : '❌ Migration incomplete'}`);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration();
```

**Run verification:**
```bash
node scripts/verify-migration.js
```

### Step 4: Deploy Firestore Rules to Production (30min)

**Backup existing rules first:**
```bash
cd /Users/dominhxuan/Desktop/QUAN-LY-CHDV

# Download current production rules
firebase firestore:rules:get > firestore.rules.backup.$(date +%Y%m%d-%H%M%S)

# Test rules with emulator first
firebase emulators:start --only firestore
npm run test:security
```

**Deploy new rules:**
```bash
# Review rules diff
git diff firestore.rules

# Deploy to production
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules:get
```

**Monitor for errors:**
```bash
# Watch Firebase Console > Firestore > Rules
# Check for sudden spike in permission denied errors
```

### Step 5: Execute Production Migration (1h)

**Pre-migration checklist:**
- [ ] All Phase 4 tests passing
- [ ] Firestore rules deployed and verified
- [ ] Cloud Functions deployed
- [ ] Backup of current Firestore rules saved
- [ ] Rollback plan documented
- [ ] Off-peak hours scheduled

**Execute migration:**

```javascript
// In browser console (logged in as SuperAdmin)
import { httpsCallable } from 'firebase/functions';
import { functions } from './config/firebase';

const migrate = httpsCallable(functions, 'migrateUsersToClaims');

// Trigger migration
const result = await migrate();
console.log('Migration results:', result.data);
```

**Alternative: Admin script:**
```javascript
// scripts/run-migration.js
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function runMigration() {
  const migrateFunction = admin.functions().httpsCallable('migrateUsersToClaims');
  
  try {
    const result = await migrateFunction();
    console.log('Migration completed:', result.data);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

**Post-migration verification:**
```bash
# Run verification script
node scripts/verify-migration.js

# Check sample users in Firebase Console
# Verify Custom Claims appear in Auth > Users > User Details
```

### Step 6: Enable Monitoring and Gradual Rollout (30min)

**Create feature flags config:**

**File:** `src/config/featureFlags.js`

```javascript
export const featureFlags = {
  useCustomClaimsAuth: true, // Set to true after migration
  enableSecurityAlerts: true,
  strictFirestoreRules: true,
};

// For gradual rollout (optional)
export const isFeatureEnabled = (flagName, userId) => {
  if (!featureFlags[flagName]) return false;
  
  // Enable for all users after migration
  return true;
  
  // For percentage rollout (if needed):
  // const rolloutPercentage = 100; // 0-100
  // const hash = userId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  // return Math.abs(hash) % 100 < rolloutPercentage;
};
```

**Update AuthContext to use feature flag:**
```javascript
import { featureFlags } from '../config/featureFlags';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    
    if (user && featureFlags.useCustomClaimsAuth) {
      // Use Custom Claims (new system)
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      setUserRole(claims.role || 'Guest');
      setUserClaims(claims);
    } else if (user) {
      // Fallback to Firestore (old system - remove after migration)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setUserRole(userDoc.data()?.role || 'Guest');
    }
    
    setLoading(false);
  });
  
  return unsubscribe;
}, []);
```

**Deployment runbook:**

**File:** `docs/deployment-runbook.md`

```markdown
# Authorization Migration Deployment Runbook

## Pre-deployment Checklist
- [ ] All Phase 4 tests passing
- [ ] Code reviewed and approved
- [ ] Firestore rules tested in emulator
- [ ] Cloud Functions deployed to staging
- [ ] Backup of production database created
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window

## Deployment Steps

### 1. Deploy Cloud Functions (15min)
```bash
firebase deploy --only functions
```
Verify functions appear in Firebase Console > Functions

### 2. Deploy Firestore Rules (10min)
```bash
firebase firestore:rules:get > rules.backup
firebase deploy --only firestore:rules
```
Monitor Firebase Console for permission errors

### 3. Run User Migration (20min)
```bash
node scripts/run-migration.js
```
Expected output: All users migrated successfully

### 4. Verify Migration (10min)
```bash
node scripts/verify-migration.js
```
Expected: 100% verified, 0 missing claims

### 5. Enable Feature Flag (5min)
Update featureFlags.useCustomClaimsAuth = true
Deploy frontend

### 6. Monitor (30min)
Watch for:
- Security alerts in security_alerts collection
- Error rates in Firebase Console
- User-reported issues

## Rollback Procedure

If issues detected:

1. Disable feature flag (5min)
```javascript
featureFlags.useCustomClaimsAuth = false
```

2. Restore old Firestore rules (5min)
```bash
firebase deploy --only firestore:rules --config rules.backup
```

3. Investigate issues before retry

## Success Criteria
- [ ] Migration script reports 100% success
- [ ] Verification script shows 0 errors
- [ ] All user roles match between Firestore and Custom Claims
- [ ] No spike in security alerts
- [ ] No user-reported access issues
- [ ] Settings page only accessible to SuperAdmin

## Post-Deployment
- [ ] Monitor for 24 hours
- [ ] Review security_incidents collection
- [ ] Update documentation
- [ ] Schedule Phase 6 (cleanup) if needed
```

## Success Criteria

- [ ] All existing users migrated to Custom Claims (100% success rate)
- [ ] Verification script shows 0 mismatches
- [ ] Firestore rules deployed to production
- [ ] Security monitoring active and alerting correctly
- [ ] Zero downtime during migration
- [ ] Rollback tested and documented
- [ ] Feature flag system operational
- [ ] Deployment runbook followed successfully

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration script failure mid-execution | HIGH | Idempotent script design, can safely re-run |
| Firestore rules too restrictive | HIGH | Test extensively in emulator, deploy during off-peak |
| Users locked out after migration | CRITICAL | Keep Firestore role as backup, feature flag for quick disable |
| Security monitoring false positives | MEDIUM | Tune alert thresholds, manual review for 48h |
| Cloud Function timeout on large user base | MEDIUM | Process in batches, extend timeout to 9min |

## Verification

**Migration verification:**
```bash
node scripts/verify-migration.js
# Expected output: ✅ Migration successful!
```

**Security monitoring test:**
```bash
# In browser console (as non-SuperAdmin)
window.location.href = '/settings'
# Should create alert in security_alerts collection
```

**Check Firestore rules active:**
```bash
firebase firestore:rules:get | grep "request.auth.token.role"
# Should show Custom Claims checks
```

**Monitor production health:**
```bash
# Firebase Console > Firestore > Usage
# Check for permission denied spike
# Should remain stable after deployment
```

## Rollback Instructions

**Emergency rollback (5 minutes):**

1. Disable feature flag:
```javascript
// src/config/featureFlags.js
export const featureFlags = {
  useCustomClaimsAuth: false, // Revert to Firestore-only
  enableSecurityAlerts: false,
  strictFirestoreRules: false,
};
```

2. Deploy frontend:
```bash
npm run build
firebase deploy --only hosting
```

3. Restore old Firestore rules:
```bash
firebase deploy --only firestore:rules --config firestore.rules.backup.*
```

4. Verify system operational:
- Login as SuperAdmin
- Access Settings page
- Verify CRUD operations work

## Notes

- Migration is idempotent - safe to run multiple times
- Custom Claims take up to 1 hour to propagate (force refresh with getIdTokenResult(true))
- Keep Firestore users.role field indefinitely as backup
- Security alerts auto-delete after 24 hours
- Monitor security_incidents collection daily for first week
- Schedule cleanup phase to remove deprecated localStorage code
- Document any production issues for post-mortem
- Plan Phase 6 for technical debt cleanup if needed
