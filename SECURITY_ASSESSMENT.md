# 🔒 SECURITY ASSESSMENT - P0 Issues Analysis

**Generated**: 2026-07-27  
**Production URL**: https://quan-ly-chdv-eight.vercel.app/login  
**Status**: Based on production deployment verification

---

## 📊 Executive Summary

| Issue | Severity | Production Status | Risk Level | Action Required |
|-------|----------|-------------------|------------|-----------------|
| P0-1: DevBackdoor | CRITICAL | ✅ **NOT IN BUNDLE** | 🟢 LOW | Monitor only |
| P0-2: Hardcoded Email | CRITICAL | ❌ **EXPOSED 8x** | 🔴 **HIGH** | **FIX IMMEDIATELY** |
| P0-3: Input Validation | CRITICAL | ❌ **MISSING** | 🟡 MEDIUM | Fix soon |

---

## P0-1: DevBackdoor Component ✅ SAFE

### Current Implementation
**File**: `src/components/DevBackdoor.jsx`  
**Referenced in**: `src/App.jsx:191`

```javascript
// Line 191 in App.jsx
{import.meta.env.DEV && <DevBackdoorLoader />}

// Lines 202-206
function DevBackdoorLoader() {
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    if (import.meta.env.DEV)
      import('./components/DevBackdoor').then(m => setComp(() => m.default));
  }, []);
  return Comp ? <Comp /> : null;
}
```

### Production Verification
- **Grep result**: 0 occurrences of "DevBackdoor" in production bundle
- **Vite behavior**: `import.meta.env.DEV` is replaced with `false` during build
- **Dead code elimination**: Vite's tree-shaking removes the entire conditional block

### Risk Assessment: 🟢 LOW
✅ **SAFE** - The DevBackdoor is correctly excluded from production builds through:
1. Environment check (`import.meta.env.DEV`)
2. Dynamic import (only loads in dev)
3. Vite's tree-shaking removes dead code

### Recommendation
**NO ACTION NEEDED** - The current implementation is secure. Keep monitoring during builds.

---

## P0-2: Hardcoded Super Admin Email ❌ CRITICAL

### Current Implementation

**File 1**: `src/config/constants.js`
```javascript
// Line 7 - Loads from environment variable
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';

// Line 10-12 - Check function
export const isSuperAdmin = (email) => {
  return SUPER_ADMIN_EMAIL && email && email === SUPER_ADMIN_EMAIL;
};
```

**File 2**: `.env` (tracked in .gitignore, but Vite embeds it at build time!)
```
VITE_SUPER_ADMIN_EMAIL=nguyentienducbmt123@gmail.com
```

**File 3**: `firestore.rules:7`
```javascript
function isSuperAdmin() {
  return request.auth != null && 
         request.auth.token.email == 'nguyentienducbmt123@gmail.com';
}
```

### Production Verification
- **Grep result**: 8 occurrences of `nguyentienducbmt123@gmail.com` in production JavaScript bundle
- **Why**: Vite replaces `import.meta.env.VITE_SUPER_ADMIN_EMAIL` with the literal string at build time
- **Exposure**: Anyone can inspect the production bundle and find the super admin email

### Risk Assessment: 🔴 **HIGH - CRITICAL VULNERABILITY**

**Attack vectors**:
1. ✅ Attacker finds super admin email by inspecting production JS bundle (takes 2 minutes)
2. ✅ Attacker attempts to login with that email
3. ✅ If attacker compromises that Gmail account → full system access
4. ✅ Firestore rules also have hardcoded email → double exposure

**Impact**:
- **Data breach**: Access to ALL tenant data, invoices, contracts
- **System takeover**: Ability to delete/modify any data
- **Multi-tenant violation**: Access to ALL owners' data, not just one

### Root Cause
Vite bundles environment variables starting with `VITE_` directly into the client-side bundle. This is by design for client-side configuration, but creates a security issue when used for access control secrets.

### ✅ Recommended Fix

**Option A: Firebase Custom Claims (BEST PRACTICE)**

1. **Remove email from client-side code**:
```javascript
// src/config/constants.js - DELETE THIS FILE
// Move check to server-side only
```

2. **Set custom claim on super admin user** (via Firebase Admin SDK):
```javascript
// Run once via Firebase Cloud Function or Admin script
admin.auth().setCustomUserClaims(superAdminUID, { 
  isSuperAdmin: true 
});
```

3. **Update Firestore rules to use custom claim**:
```javascript
// firestore.rules:6-8
function isSuperAdmin() {
  return request.auth != null && 
         request.auth.token.isSuperAdmin == true;
}
```

4. **Client-side check** (read from auth token):
```javascript
// src/hooks/useAuth.js or similar
export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult();
        setUser({
          ...firebaseUser,
          isSuperAdmin: token.claims.isSuperAdmin === true
        });
      }
    });
  }, []);
  
  return { user };
};
```

**Benefits**:
- ✅ No secrets in client-side bundle
- ✅ Cannot be bypassed (enforced by Firebase Auth)
- ✅ Easy to add/remove super admins
- ✅ Follows Firebase best practices

**Option B: Server-Side Check Only (SIMPLER)**

1. Remove all client-side super admin checks
2. Keep hardcoded email ONLY in `firestore.rules`
3. Client checks user role from Firestore user document instead

**Tradeoff**: Firestore rules are public, but at least not in the JS bundle.

---

## P0-3: Missing Input Validation ⚠️ VULNERABLE

### Current State
**Analysis**: Checked `AddTenantModal.jsx` and other forms - NO validation found beyond basic checks:

```javascript
// AddTenantModal.jsx:32-39 - ONLY checks
if (!name || !phone) {
  toast.error('Vui lòng nhập Tên và Số điện thoại!');
  return;
}
if (!selectedRoom) {
  toast.error('Vui lòng chọn phòng cư trú!');
  return;
}

// Line 48 - Basic sanitization (lowercase email)
email: email.trim().toLowerCase()
```

**Missing validations**:
- ❌ No phone number format validation
- ❌ No email format validation
- ❌ No ID card format validation
- ❌ No XSS prevention (user inputs directly rendered)
- ❌ No SQL injection protection (not applicable, using Firestore)
- ❌ No maximum length checks
- ❌ No special character sanitization

### Risk Assessment: 🟡 MEDIUM

**Attack vectors**:
1. **XSS**: User enters `<script>alert('xss')</script>` in name field
   - **Impact**: Moderate - Can steal other users' sessions if rendered in admin panel
   
2. **Data corruption**: User enters 500-character name
   - **Impact**: Low - UI breaks, but data still saved
   
3. **Invalid data**: Phone number = "abc123xyz"
   - **Impact**: Low - Cannot call user, but not a security issue

4. **Email bombing**: Invalid email formats saved
   - **Impact**: Low - Email notifications fail silently

### Why It's Not P0 Critical (Yet)
- ✅ Using Firestore (NoSQL) - No SQL injection risk
- ✅ Firebase Auth handles authentication validation
- ✅ Firestore rules provide server-side access control
- ⚠️ BUT: XSS is still a risk if user-generated content is rendered without escaping

### ✅ Recommended Fix

**1. Add validation utility** (`src/utils/validation.js`):
```javascript
export const validatePhone = (phone) => {
  // Vietnamese phone: 10-11 digits, starts with 0
  const phoneRegex = /^0\d{9,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateIdCard = (idCard) => {
  // CCCD: 12 digits
  const idRegex = /^\d{9,12}$/;
  return idRegex.test(idCard.replace(/\s/g, ''));
};

export const sanitizeString = (str, maxLength = 200) => {
  return str.trim().slice(0, maxLength);
};
```

**2. Use in forms**:
```javascript
// Before submitting
if (!validatePhone(phone)) {
  toast.error('Số điện thoại không hợp lệ (10-11 số)');
  return;
}
if (email && !validateEmail(email)) {
  toast.error('Email không hợp lệ');
  return;
}
```

**3. React already escapes by default**:
React automatically escapes text content, so basic XSS is already prevented UNLESS you use `dangerouslySetInnerHTML`. Verify no usage of:
- `dangerouslySetInnerHTML`
- `innerHTML`
- Direct DOM manipulation with user content

---

## 🎯 Action Plan

### Immediate (This Week)
1. **FIX P0-2**: Implement Firebase Custom Claims for super admin
   - Remove `VITE_SUPER_ADMIN_EMAIL` from client code
   - Update Firestore rules to use custom claims
   - Rebuild and redeploy

### Short Term (This Month)  
2. **FIX P0-3**: Add input validation
   - Create validation utility
   - Update all forms with validation
   - Add Firestore rules validation

### Monitoring
3. **P0-1**: Keep current implementation (already secure)
   - Continue using `import.meta.env.DEV` check
   - Verify after each build that DevBackdoor is not in bundle

---

## 📝 Notes

- `.env` file is correctly in `.gitignore`
- BUT: Vercel/Firebase hosting still has access to environment variables
- Need to ensure `VITE_SUPER_ADMIN_EMAIL` is NOT set in Vercel environment variables
- After fixing P0-2, remove from Vercel env vars and redeploy

