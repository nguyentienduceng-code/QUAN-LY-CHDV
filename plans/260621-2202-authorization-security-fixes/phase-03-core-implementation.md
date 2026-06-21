---
phase: 3
title: "Core Implementation"
status: pending
priority: P1
effort: "16h"
dependencies: ["phase-01-discovery-analysis", "phase-02-foundation-setup"]
---

# Phase 3: Core Implementation

## Overview
Migrate 50+ scattered role checks to centralized `useAuthorization` hook, eliminate critical vulnerabilities (SuperAdmin route exposure, Settings destructive operations, hardcoded admin emails), update Firestore security rules, and remove localStorage authorization logic.

## Requirements

**Functional:**
- All authorization decisions use Custom Claims via `useAuthorization` hook
- SuperAdmin routes protected by role-based routing guards
- Settings destructive operations require SuperAdmin role verification
- Firestore security rules enforce server-side authorization
- No client-side authorization state in localStorage

**Non-functional:**
- Zero breaking changes to existing user sessions
- Performance: authorization checks < 5ms
- All changes must pass existing test suite
- Backward compatible with Phase 2 Custom Claims structure

## Architecture

**Authorization Flow (After Phase 3):**
```
User Action → Component → useAuthorization hook → Custom Claims (from token)
                                                 ↓
                                    Permission Check (memoized)
                                                 ↓
                                    Allow/Deny + UI State
```

**Firestore Security Rules Pattern:**
```javascript
// Before: Dangerous client-side trust
allow write: if request.auth != null;

// After: Claims-based enforcement
allow write: if request.auth.token.role == 'SuperAdmin' 
             || request.auth.token.role == 'Manager';
```

## Related Code Files

**Modify:**
- `src/hooks/useAuthorization.js` - Add permission helper methods
- `src/contexts/AuthContext.jsx` - Remove localStorage role logic
- `src/App.jsx` - Add role-based route guards
- `src/pages/Settings.jsx` - Replace all role checks
- `src/components/rooms/RoomCard.jsx` - Migrate inline checks
- `src/components/buildings/BuildingCard.jsx` - Migrate inline checks
- `src/components/maintenance/MaintenanceList.jsx` - Migrate inline checks
- `src/components/invoices/InvoiceList.jsx` - Migrate inline checks
- `firestore.rules` - Implement claims-based security

**Delete:**
- Lines in `AuthContext.jsx` reading `localStorage.getItem('userRole')`
- Hardcoded email checks (gokiday14@gmail.com, xuanhoa301@gmail.com)

## Implementation Steps

### Step 1: Enhance useAuthorization Hook (2h)

**File:** `src/hooks/useAuthorization.js`

Add permission helper methods:

```javascript
// Add after existing canAccess method
export const useAuthorization = () => {
  const { userRole, userClaims } = useAuth();
  
  // Existing canAccess method...
  
  // NEW: Granular permission checks
  const canCreateBuilding = useCallback(() => {
    return ['SuperAdmin', 'Manager'].includes(userRole);
  }, [userRole]);
  
  const canDeleteBuilding = useCallback(() => {
    return userRole === 'SuperAdmin';
  }, [userRole]);
  
  const canEditMaintenanceRequest = useCallback(() => {
    return ['SuperAdmin', 'Manager', 'Technician'].includes(userRole);
  }, [userRole]);
  
  const canApproveInvoice = useCallback(() => {
    return ['SuperAdmin', 'Manager'].includes(userRole);
  }, [userRole]);
  
  const canAccessSettings = useCallback(() => {
    return userRole === 'SuperAdmin';
  }, [userRole]);
  
  return {
    userRole,
    userClaims,
    canAccess,
    canCreateBuilding,
    canDeleteBuilding,
    canEditMaintenanceRequest,
    canApproveInvoice,
    canAccessSettings,
    isLoading,
  };
};
```

**Verification:**
```bash
grep -n "canAccessSettings" src/hooks/useAuthorization.js
```

### Step 2: Fix Critical Vulnerability - SuperAdmin Route (1h)

**File:** `src/App.jsx`

Replace unprotected SuperAdmin route:

```javascript
// BEFORE (Line ~45):
<Route path="/settings" element={<Settings />} />

// AFTER:
import { useAuthorization } from './hooks/useAuthorization';

function ProtectedRoute({ children, requiredRole }) {
  const { userRole, isLoading } = useAuthorization();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// In routes section:
<Route 
  path="/settings" 
  element={
    <ProtectedRoute requiredRole="SuperAdmin">
      <Settings />
    </ProtectedRoute>
  } 
/>
```

**Verification:**
```bash
# Test as non-SuperAdmin user
# Should redirect to /dashboard
curl -I http://localhost:5173/settings
```

### Step 3: Fix Settings Destructive Operations (3h)

**File:** `src/pages/Settings.jsx`

**Priority Changes:**

1. **Remove hardcoded emails (Lines ~78-82):**
```javascript
// BEFORE:
const adminEmails = ['gokiday14@gmail.com', 'xuanhoa301@gmail.com'];
if (!adminEmails.includes(user.email)) {
  alert('Unauthorized');
  return;
}

// AFTER:
const { canAccessSettings } = useAuthorization();
if (!canAccessSettings()) {
  alert('Chỉ SuperAdmin mới có quyền thực hiện thao tác này');
  return;
}
```

2. **Delete user operation (Lines ~120-145):**
```javascript
// Add at top of component:
const { userRole, canAccessSettings } = useAuthorization();

// In handleDeleteUser function:
const handleDeleteUser = async (userId) => {
  if (!canAccessSettings()) {
    toast.error('Không có quyền xóa người dùng');
    return;
  }
  
  // Prevent self-deletion
  if (userId === auth.currentUser.uid) {
    toast.error('Không thể xóa chính mình');
    return;
  }
  
  // existing deletion logic...
};
```

3. **Update user role operation (Lines ~180-210):**
```javascript
const handleUpdateUserRole = async (userId, newRole) => {
  if (!canAccessSettings()) {
    toast.error('Không có quyền thay đổi vai trò');
    return;
  }
  
  // Prevent self-demotion from SuperAdmin
  if (userId === auth.currentUser.uid && userRole === 'SuperAdmin') {
    toast.error('Không thể thay đổi vai trò của chính mình');
    return;
  }
  
  try {
    // Call Cloud Function to update Custom Claims
    const updateRoleFunction = httpsCallable(functions, 'updateUserRole');
    await updateRoleFunction({ userId, role: newRole });
    
    // Update Firestore
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid,
    });
    
    toast.success('Cập nhật vai trò thành công');
  } catch (error) {
    console.error('Error updating role:', error);
    toast.error('Lỗi khi cập nhật vai trò');
  }
};
```

**Verification:**
```bash
# Check all hardcoded emails removed
grep -r "gokiday14@gmail.com" src/
grep -r "xuanhoa301@gmail.com" src/
# Should return no results
```

### Step 4: Remove localStorage Authorization Logic (2h)

**File:** `src/contexts/AuthContext.jsx`

**Remove these lines (Lines ~55-62):**
```javascript
// DELETE:
const storedRole = localStorage.getItem('userRole');
if (storedRole) {
  setUserRole(storedRole);
}

// DELETE:
localStorage.setItem('userRole', role);

// DELETE:
localStorage.removeItem('userRole');
```

**Keep only Custom Claims logic:**
```javascript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    
    if (user) {
      // Only source of truth: Custom Claims
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      
      setUserRole(claims.role || 'Guest');
      setUserClaims(claims);
      
      // Fetch user document for additional metadata
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } else {
      setUserRole('Guest');
      setUserClaims(null);
      setUserData(null);
    }
    
    setLoading(false);
  });
  
  return unsubscribe;
}, []);
```

**Verification:**
```bash
# Check localStorage never used for auth
grep -n "localStorage.*[Rr]ole" src/contexts/AuthContext.jsx
# Should return 0 results
```

### Step 5: Migrate Component Authorization Checks (6h)

**Migration Priority Order (High-Risk First):**

1. **Settings.jsx** (already done in Step 3)
2. **BuildingCard.jsx** - Delete building operations
3. **RoomCard.jsx** - Edit/delete room operations
4. **MaintenanceList.jsx** - Status changes, assignments
5. **InvoiceList.jsx** - Approval, payment recording

**Example: BuildingCard.jsx (Lines ~88-95)**

```javascript
// BEFORE:
const handleDelete = async () => {
  if (userRole !== 'SuperAdmin') {
    alert('Unauthorized');
    return;
  }
  // delete logic...
};

// AFTER:
import { useAuthorization } from '../../hooks/useAuthorization';

function BuildingCard({ building }) {
  const { canDeleteBuilding } = useAuthorization();
  
  const handleDelete = async () => {
    if (!canDeleteBuilding()) {
      toast.error('Chỉ SuperAdmin mới có quyền xóa tòa nhà');
      return;
    }
    
    const confirmed = window.confirm(
      `Xác nhận xóa tòa nhà "${building.name}"? Thao tác này không thể hoàn tác.`
    );
    
    if (!confirmed) return;
    
    try {
      await deleteDoc(doc(db, 'buildings', building.id));
      toast.success('Đã xóa tòa nhà');
    } catch (error) {
      console.error('Error deleting building:', error);
      toast.error('Lỗi khi xóa tòa nhà');
    }
  };
  
  // Only show delete button if authorized
  return (
    <div className="building-card">
      {/* card content */}
      {canDeleteBuilding() && (
        <button onClick={handleDelete}>Xóa</button>
      )}
    </div>
  );
}
```

**Verification script for all components:**
```bash
# Find remaining inline role checks
grep -rn "userRole ===" src/components/ | grep -v "useAuthorization"
# Should return 0 results after migration
```

### Step 6: Update Firestore Security Rules (2h)

**File:** `firestore.rules`

Replace permissive rules with claims-based enforcement:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }
    
    function hasAnyRole(roles) {
      return isAuthenticated() && request.auth.token.role in roles;
    }
    
    function isSuperAdmin() {
      return hasRole('SuperAdmin');
    }
    
    // Users collection - CRITICAL
    match /users/{userId} {
      // Anyone authenticated can read all users (for assignment dropdowns)
      allow read: if isAuthenticated();
      
      // Only SuperAdmin can create users
      allow create: if isSuperAdmin();
      
      // Users can update their own profile (except role field)
      // SuperAdmin can update anyone
      allow update: if isSuperAdmin() 
                    || (request.auth.uid == userId 
                        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
      
      // Only SuperAdmin can delete
      allow delete: if isSuperAdmin();
    }
    
    // Buildings collection
    match /buildings/{buildingId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['SuperAdmin', 'Manager']);
      allow update: if hasAnyRole(['SuperAdmin', 'Manager']);
      allow delete: if isSuperAdmin();
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['SuperAdmin', 'Manager']);
      allow update: if hasAnyRole(['SuperAdmin', 'Manager']);
      allow delete: if isSuperAdmin();
    }
    
    // Maintenance requests
    match /maintenance/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated(); // Any role can create
      allow update: if hasAnyRole(['SuperAdmin', 'Manager', 'Technician']);
      allow delete: if isSuperAdmin();
    }
    
    // Invoices
    match /invoices/{invoiceId} {
      allow read: if isAuthenticated();
      allow create: if hasAnyRole(['SuperAdmin', 'Manager']);
      allow update: if hasAnyRole(['SuperAdmin', 'Manager']);
      allow delete: if isSuperAdmin();
    }
    
    // Security alerts collection (write-only for monitoring)
    match /security_alerts/{alertId} {
      allow read: if isSuperAdmin();
      allow write: if isAuthenticated();
    }
  }
}
```

**Deploy rules:**
```bash
cd /Users/dominhxuan/Desktop/QUAN-LY-CHDV
firebase deploy --only firestore:rules
```

**Verification:**
```bash
# Test rules with Firebase emulator
firebase emulators:start --only firestore
# Run integration tests against emulator (Phase 4)
```

## Success Criteria

- [ ] All 50+ inline role checks migrated to `useAuthorization` hook
- [ ] SuperAdmin route protected with role guard in App.jsx
- [ ] Settings destructive operations require SuperAdmin verification
- [ ] No hardcoded admin emails in codebase
- [ ] No localStorage used for authorization state
- [ ] Firestore rules deployed and enforcing Custom Claims
- [ ] All existing tests pass
- [ ] Manual QA confirms no broken functionality

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing user sessions | HIGH | Keep backward compatibility with Firestore `users.role` field during transition |
| Firestore rules too restrictive | MEDIUM | Test with all 4 roles (SuperAdmin, Manager, Technician, Guest) before deploy |
| Missed inline role checks | MEDIUM | Use grep verification script after each file migration |
| Self-lockout from Settings | HIGH | Always keep at least one SuperAdmin account, add self-deletion prevention |
| Performance regression | LOW | Memoize useAuthorization checks, monitor with Performance tab |

## Verification

**Automated checks:**
```bash
# 1. No localStorage auth logic
grep -r "localStorage.*[Rr]ole" src/ && echo "FAIL: localStorage found" || echo "PASS"

# 2. No hardcoded admin emails
grep -r "gokiday14@gmail.com\|xuanhoa301@gmail.com" src/ && echo "FAIL: Hardcoded emails found" || echo "PASS"

# 3. All components use useAuthorization
grep -rn "userRole ===" src/components/ | grep -v "useAuthorization" | wc -l
# Should output: 0

# 4. Firestore rules deployed
firebase firestore:rules:get | grep "request.auth.token.role"
# Should show rules with Custom Claims checks
```

**Manual QA (30 minutes):**
1. Test Settings page as non-SuperAdmin (should redirect)
2. Attempt to delete building as Manager (should fail with toast)
3. Verify Guest cannot create maintenance requests
4. Check Manager can approve invoices
5. Confirm Technician can update maintenance status

## Rollback Instructions

If critical issues found:

```bash
# 1. Revert Firestore rules
firebase deploy --only firestore:rules # (deploy previous version from git)

# 2. Restore localStorage logic temporarily
git checkout HEAD~1 src/contexts/AuthContext.jsx

# 3. Disable route guards
# Comment out ProtectedRoute wrapper in App.jsx

# 4. Notify team and investigate
```

## Notes

- **Do not delete** Firestore `users.role` field yet - still used as fallback during migration
- Settings page is highest priority - contains most dangerous operations
- Always test with multiple roles before marking complete
- Keep audit trail: add `updatedBy` field when modifying user roles
- Phase 4 will add comprehensive tests to prevent regressions
- Reference code review report: 3 critical vulnerabilities addressed in this phase
