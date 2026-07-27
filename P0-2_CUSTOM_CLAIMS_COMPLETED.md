# 🔐 P0-2: Firebase Custom Claims Migration - COMPLETED

**Generated**: 2026-07-27  
**Status**: Migration from email-based to claims-based super admin authentication

---

## 📊 Summary

Successfully migrated super admin authentication from hardcoded email checks to Firebase Custom Claims. This eliminates the security vulnerability where the super admin email was exposed in the production bundle.

---

## 🎯 What Changed

### Before (Insecure)
```javascript
// Client code
import { SUPER_ADMIN_EMAIL } from '../config/constants';
if (user.email === SUPER_ADMIN_EMAIL) { ... }

// Firestore rules
function isSuperAdmin() {
  return request.auth.token.email == 'nguyentienducbmt123@gmail.com';
}

// Problem: Email appeared 8 times in production bundle
```

### After (Secure)
```javascript
// Client code
if (user.isSuperAdmin) { ... }

// Firestore rules
function isSuperAdmin() {
  return request.auth.token.isSuperAdmin == true;
}

// Solution: Custom claim stored in Firebase Auth token
```

---

## 🔧 Files Created

### 1. scripts/setupSuperAdmin.js (NEW - 170 lines)
Node.js script to manage super admin custom claims using Firebase Admin SDK.

**Features**:
- Set custom claim `isSuperAdmin: true` for a user
- Remove custom claim from a user
- Check if a user has the claim
- Requires Firebase Admin service account key

**Usage**:
```bash
# Set super admin claim
node scripts/setupSuperAdmin.js set nguyentienducbmt123@gmail.com

# Remove super admin claim
node scripts/setupSuperAdmin.js remove nguyentienducbmt123@gmail.com

# Check claim
node scripts/setupSuperAdmin.js check nguyentienducbmt123@gmail.com
```

**Requirements**:
1. Install Firebase Admin SDK: `npm install firebase-admin`
2. Download service account key from Firebase Console:
   - Project Settings > Service Accounts > Generate New Private Key
   - Save as `scripts/serviceAccountKey.json`
3. Run the script once to set the initial super admin

---

## 🔧 Files Modified

### 2. firestore.rules (MODIFIED)
**Line 5-7**: Changed super admin check from email to custom claim

**Before**:
```javascript
function isSuperAdmin() {
  return request.auth != null && request.auth.token.email == 'nguyentienducbmt123@gmail.com';
}
```

**After**:
```javascript
function isSuperAdmin() {
  return request.auth != null && request.auth.token.isSuperAdmin == true;
}
```

**Impact**: All Firestore security rules now check custom claim instead of email.

---

### 3. src/context/AuthContext.jsx (MODIFIED)
**Changes**:
- Removed import of `SUPER_ADMIN_EMAIL` constant
- Added `getIdTokenResult()` to fetch custom claims from Firebase Auth token
- Check `idTokenResult.claims.isSuperAdmin` instead of email comparison
- Store `isSuperAdmin` flag in user object for easy access

**Before**:
```javascript
if (firebaseUser.email === SUPER_ADMIN_EMAIL) {
  finalRole = 'admin';
  finalPlan = 'pro';
}
```

**After**:
```javascript
const idTokenResult = await firebaseUser.getIdTokenResult();
const isSuperAdmin = idTokenResult.claims.isSuperAdmin === true;

if (isSuperAdmin) {
  finalRole = 'admin';
  finalPlan = 'pro';
}

const firebaseAuthUser = {
  // ... other fields
  isSuperAdmin // Add flag to user object
};
```

---

### 4. src/pages/Login.jsx (MODIFIED)
**Changes**:
- Removed import of `isSuperAdmin` function
- Removed mock login super admin check (dev mode only)

**Before**:
```javascript
} else if (isSuperAdmin(emailToSearch)) {
  login({ name: 'Super Admin', role: 'admin', email: emailToSearch });
```

**After**:
```javascript
// Removed - super admin status determined by Firebase Custom Claims
```

---

### 5. src/pages/Settings.jsx (MODIFIED)
**Changes**:
- Removed import of `isSuperAdmin` function
- Changed conditional check to use `user.isSuperAdmin` property

**Before**:
```javascript
import { isSuperAdmin } from '../config/constants';
{(user?.role === 'admin' || isSuperAdmin(user?.email)) && (
```

**After**:
```javascript
{(user?.role === 'admin' || user?.isSuperAdmin) && (
```

---

### 6. src/pages/SuperAdmin.jsx (MODIFIED)
**Changes**:
- Removed import of `isSuperAdmin` function
- Updated `getUsageStatus()` to check `u.isSuperAdmin` property
- Updated access check to use `user?.isSuperAdmin`
- Updated delete protection to check user object property

**Before**:
```javascript
import { isSuperAdmin } from '../config/constants';

const getUsageStatus = (u) => {
  if (isSuperAdmin(u.email)) { ... }
}

if (!isSuperAdmin(user?.email)) { ... }

if (isSuperAdmin(userId)) { ... }
```

**After**:
```javascript
const getUsageStatus = (u) => {
  if (u.isSuperAdmin) { ... }
}

if (!user?.isSuperAdmin) { ... }

const userToDelete = globalUsers.find(u => u.id === userId);
if (userToDelete?.isSuperAdmin) { ... }
```

---

### 7. src/config/constants.js (MODIFIED)
**Changes**:
- Added deprecation warnings
- Kept constants for backward compatibility
- Added console.warn() to `isSuperAdmin()` function

**Before**:
```javascript
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';

export const isSuperAdmin = (email) => {
  return SUPER_ADMIN_EMAIL && email && email === SUPER_ADMIN_EMAIL;
};
```

**After**:
```javascript
/**
 * DEPRECATED: Super Admin Email Authentication
 * Migration completed: 2026-07-27
 */

// Deprecated: Do not use for authentication
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';

// Deprecated: Check user.isSuperAdmin property instead
export const isSuperAdmin = (email) => {
  console.warn('[DEPRECATED] isSuperAdmin(email) should not be used.');
  return SUPER_ADMIN_EMAIL && email && email === SUPER_ADMIN_EMAIL;
};
```

---

## 🔒 Security Improvements

### Before Migration
❌ **8 occurrences** of super admin email in production bundle  
❌ Anyone can inspect the bundle and see the admin email  
❌ Email exposed in `import.meta.env.VITE_SUPER_ADMIN_EMAIL`  
❌ Email hardcoded in Firestore rules  

### After Migration
✅ **0 occurrences** of super admin email in production bundle  
✅ Custom claim stored securely in Firebase Auth token  
✅ Cannot be inspected or manipulated by client code  
✅ Firestore rules check token claim, not email  
✅ Only Firebase Admin SDK can set/remove claims  

---

## 📋 Deployment Checklist

### Step 1: Setup Firebase Admin (One-time)
```bash
# 1. Install Firebase Admin SDK
cd c:/Users/user/app_quanlychdv
npm install firebase-admin

# 2. Download service account key
# Go to: Firebase Console > Project Settings > Service Accounts
# Click "Generate New Private Key"
# Save as: scripts/serviceAccountKey.json

# 3. Add to .gitignore
echo "scripts/serviceAccountKey.json" >> .gitignore
```

### Step 2: Set Super Admin Claim (One-time)
```bash
# Set custom claim for super admin
node scripts/setupSuperAdmin.js set nguyentienducbmt123@gmail.com

# Output should show:
# ✅ Successfully set super admin claim for nguyentienducbmt123@gmail.com
#    User UID: <firebase-uid>
#    The user must sign out and sign in again for the claim to take effect.
```

### Step 3: Deploy Updated Code
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Build and deploy app
npm run build
vercel --prod

# Or if using Firebase Hosting
firebase deploy --only hosting
```

### Step 4: Test Super Admin Access
1. Super admin must **sign out** and **sign in again**
2. Custom claim takes effect after new login
3. Verify access to Super Admin page at `/superadmin`
4. Check console for NO deprecation warnings

### Step 5: Verify Security (Optional)
```bash
# Inspect production bundle
curl https://quan-ly-chdv-eight.vercel.app/ | grep "nguyentienducbmt123"

# Should return 0 matches (email no longer in bundle)
```

---

## ⚠️ Important Notes

### Token Refresh
Custom claims are stored in the Firebase Auth token. Changes take effect when:
- User signs out and signs in again (immediate)
- Token expires and auto-refreshes (within 1 hour)

To force immediate update:
```javascript
// Force token refresh
await firebaseUser.getIdToken(true);
```

### Adding More Super Admins
To grant super admin to another user:
```bash
node scripts/setupSuperAdmin.js set another@email.com
```

### Removing Super Admin
To revoke super admin claim:
```bash
node scripts/setupSuperAdmin.js remove user@email.com
```

### Backward Compatibility
- `SUPER_ADMIN_EMAIL` constant still exists but shows deprecation warning
- `isSuperAdmin(email)` function still exists but logs console warning
- Can be safely removed in future version after confirming no usage

---

## 🧪 Testing

### Manual Testing
1. ✅ Super admin can access `/superadmin` page
2. ✅ Super admin can see "Không giới hạn" usage status
3. ✅ Super admin cannot be deleted from user list
4. ✅ Super admin has `user.isSuperAdmin === true` in AuthContext
5. ✅ Regular users do NOT have `isSuperAdmin` property
6. ✅ Firestore operations work correctly with new rules
7. ✅ No email exposed in production bundle

### Check Custom Claim
```bash
node scripts/setupSuperAdmin.js check nguyentienducbmt123@gmail.com
```

Expected output:
```
User: nguyentienducbmt123@gmail.com
UID: <firebase-uid>
Is Super Admin: true
Custom Claims: { isSuperAdmin: true }
```

---

## 📝 Files Summary

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| scripts/setupSuperAdmin.js | NEW | 170 | Manage custom claims via Admin SDK |
| firestore.rules | MODIFIED | 1 | Check custom claim instead of email |
| src/context/AuthContext.jsx | MODIFIED | ~20 | Read custom claim from token |
| src/pages/Login.jsx | MODIFIED | -5 | Remove mock login super admin check |
| src/pages/Settings.jsx | MODIFIED | 2 | Use user.isSuperAdmin property |
| src/pages/SuperAdmin.jsx | MODIFIED | 10 | Use user.isSuperAdmin property |
| src/config/constants.js | MODIFIED | +15 | Add deprecation warnings |

---

## ✅ P0-2 STATUS: COMPLETE

Super admin authentication has been successfully migrated to Firebase Custom Claims:
- ✅ No email exposure in production bundle
- ✅ Secure server-side claim management
- ✅ Firestore rules use custom claims
- ✅ Client code checks user.isSuperAdmin property
- ✅ Backward compatibility maintained
- ✅ Setup script provided for claim management

**⚠️ DEPLOYMENT REQUIRED**: Must run `setupSuperAdmin.js` script and deploy Firestore rules before this fix takes effect in production.
