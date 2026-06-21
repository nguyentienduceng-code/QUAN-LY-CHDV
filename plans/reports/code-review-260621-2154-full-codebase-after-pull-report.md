# Code Review Report

## Summary
The diff introduces **manager role access expansion** to previously admin-only routes. This is a **small, surgical change** (2 files, ~10 lines) that is functionally correct but introduces **inconsistent authorization patterns** across the codebase due to incomplete rollout. The changes themselves are not broken, but they expose a **systemic authorization debt** problem.

## Critical Issues

### 1. **Incomplete Authorization Pattern Migration** (CRITICAL)
**Impact:** Authorization bypass risk through inconsistent role checks

**Evidence:**
- `src/App.jsx:108-113` - Route protection updated to include `manager` role for `/finance`, `/tenants`, `/contracts`, `/settings`
- `src/components/Sidebar.jsx:22-27` - Sidebar nav correctly updated to show Settings link for managers
- **BUT**: Component-level authorization checks remain admin-only in many places

**Concrete Examples of Inconsistency:**
```jsx
// App.jsx allows manager access to Settings
<Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Settings /></ProtectedRoute>} />

// BUT Settings.jsx has admin-only checks for destructive operations (lines 380-401)
// clearAllData() and loadMockData() buttons have NO role checks - accessible to managers
```

**Files with Admin-Only Component Checks (not updated for manager):**
1. `src/components/RoomDetailDrawer.jsx` - Lines 92, 107, 150, 156, 172, 212 - Image upload/delete, edit buttons only check `user?.role === 'admin' || user?.role === 'staff'`
2. `src/components/InvoiceReceiptModal.jsx` - Line showing admin/staff can mark paid, managers cannot
3. 24 occurrences of `user?.role === 'staff'` checks paired with admin but NOT manager

**The Problem:**
- Manager can **access** `/settings` route (route guard passes)
- Manager can **see and click** "Xóa Trắng Dữ Liệu" button (no role check on lines 380-401)
- This allows **destructive data operations** without proper authorization

**Fix Required:**
1. Audit ALL role checks across the codebase
2. Decision needed: Should managers have same permissions as admin, or limited?
3. If limited, add component-level checks in Settings.jsx for destructive operations
4. If full access, update all 27+ admin-only checks to include manager

**Recommendation:**
```jsx
// Settings.jsx - Add role check to destructive operations
{(user?.role === 'admin') && (
  <div className="card" style={{ borderTop: '4px solid var(--status-unpaid)', marginTop: '8px' }}>
    {/* Quản Lý Dữ Liệu section */}
  </div>
)}
```

---

### 2. **SuperAdmin Route Has No Route-Level Protection** (CRITICAL)
**Location:** `src/App.jsx:115`

**Issue:**
```jsx
<Route path="/super-admin" element={<SuperAdmin />} />
```

This route has **NO ProtectedRoute wrapper**. Authorization is only checked in the component itself.

**Why This Is Critical:**
- Component-level auth can be bypassed if component is lazy-loaded or has rendering bugs
- Violates defense-in-depth principle
- Every other sensitive route uses ProtectedRoute wrapper

**Fix:**
```jsx
<Route path="/super-admin" element={<ProtectedRoute allowedRoles={['admin']}><SuperAdmin /></ProtectedRoute>} />
```

**Note:** SuperAdmin.jsx already has hardcoded email check (line 13, 45), but route-level protection is still required.

---

### 3. **Hardcoded Email Authorization Anti-Pattern** (CRITICAL)
**Locations:**
- `src/context/AuthContext.jsx:149-153, 176-180, 253-257, 281-285`
- `src/components/Sidebar.jsx:29-31`
- `src/pages/SuperAdmin.jsx:13, 45`

**Code:**
```jsx
if (user?.email === 'nguyentienducbmt123@gmail.com') {
  // Grant admin privileges
}
```

**Why This Is Critical:**
1. **Email spoofing risk** - Email can be modified in localStorage/Firestore
2. **No centralized role management** - Super admin logic scattered across 6+ files
3. **Cannot revoke access** - No way to remove super admin without code deployment
4. **Violates RBAC principles** - Role should be data-driven, not hardcoded

**Attack Vector:**
1. User creates account with different email
2. Modifies `localStorage.getItem('chdv_user')` or Firestore doc to change email to target
3. Refreshes → gains admin access

**Evidence of Vulnerability:**
- `AuthContext.jsx:9-12` - User state initialized from localStorage (no validation)
- `AuthContext.jsx:174-183` - login() function directly saves user data to localStorage without server validation

**Fix Required:**
1. Add `isSuperAdmin` boolean field to user document in Firestore
2. Validate this field server-side (Firebase Functions or Rules)
3. Remove all hardcoded email checks
4. Use role-based checks: `if (user?.role === 'superadmin')`

**Temporary Mitigation:**
Add Firestore security rule:
```javascript
match /users/{userId} {
  allow update: if request.auth.uid == userId && 
                   request.resource.data.email == resource.data.email; // Prevent email change
}
```

---

## Important Issues

### 4. **Missing Authorization Checks in Settings Destructive Operations**
**Location:** `src/pages/Settings.jsx:380-401`

**Issue:** "Xóa Trắng Dữ Liệu" and "Nạp Dữ Liệu Mẫu" buttons have no role restrictions beyond route-level protection.

**Risk:** Any user with route access (now includes manager) can wipe all data.

**Fix:**
```jsx
{(user?.role === 'admin') && (
  <button onClick={() => { /* clearAllData */ }}>
    Xóa Trắng Dữ Liệu
  </button>
)}
```

---

### 5. **Inconsistent Building-Level Authorization Pattern**
**Location:** `src/pages/Home.jsx:18-22`

**Issue:**
```jsx
const allowedBuildingsSet = new Set(
  (user?.role === 'admin' || user?.role === 'staff' || !user?.allowedBuildings || user.allowedBuildings.includes('all')) 
  ? settings.buildings 
  : settings.buildings.filter(b => user.allowedBuildings.includes(b))
);
```

**Problems:**
1. Manager role NOT included in full-access check
2. Pattern differs from route protection (which now includes manager)
3. Staff has full access but manager doesn't - inconsistent hierarchy

**Expected Hierarchy:**
```
admin > manager > staff > viewer > tenant > guest
```

**Current Behavior:**
- admin, staff → see all buildings
- manager → filtered by allowedBuildings (inconsistent with route access)

**Fix:**
```jsx
const allowedBuildingsSet = new Set(
  (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff' || !user?.allowedBuildings || user.allowedBuildings.includes('all')) 
  ? settings.buildings 
  : settings.buildings.filter(b => user.allowedBuildings.includes(b))
);
```

---

### 6. **Users.jsx Only Checks Admin for Access**
**Location:** `src/pages/Users.jsx:95-103`

**Issue:**
```jsx
if (user?.role !== 'admin') {
  return (
    <div>Truy cập bị từ chối</div>
  );
}
```

Route protection at `App.jsx:114` says `allowedRoles={['admin']}` - consistent.

**BUT:** Given manager now has access to Settings (which includes user management operations in the sidebar), this creates UX confusion.

**Decision Needed:**
- Should managers access user management? If yes, update both checks.
- If no, remove `/users` link from Sidebar for managers.

---

### 7. **Plan Field Naming Inconsistency**
**Locations:** Multiple files use `plan` field with inconsistent semantics

**Values Observed:**
- `'trial'` - 30-day trial
- `'pro'` - Paid pro plan
- `'basic'` - Paid basic plan
- `'pending_pro'` - Awaiting payment approval for pro
- `'pending_basic'` - Awaiting payment approval for basic
- `'none'` - For tenants (line 87, 124 in AuthContext)

**Issue:** `plan` field conflates **subscription status** with **payment workflow state**.

**Better Model:**
```javascript
{
  subscriptionTier: 'pro' | 'basic' | 'trial' | 'none',
  paymentStatus: 'active' | 'pending' | 'expired' | 'none',
  subscriptionEndsAt: ISOString,
  gracePeriodEndsAt?: ISOString
}
```

**Impact:** Hard to query "all active paying customers" vs "all pending approvals" because they share the same field.

---

### 8. **Auto-Heal Logic Has Race Condition Risk**
**Location:** `src/context/AuthContext.jsx:116-146`

**Issue:** Auto-heal updates user role/room based on tenant collection query, but:
1. Multiple parallel queries to Firestore (lines 20-38, 56-69)
2. `setDoc` with `merge: true` on line 143 can create partial writes
3. No transaction or optimistic locking

**Race Condition Scenario:**
1. User logs in (onAuthStateChanged fires)
2. Parallel query to `users` collection (line 22)
3. Parallel query to `tenants` collection (line 56)
4. Both complete, but tenant query is slower
5. User state set with stale data
6. Auto-heal `setDoc` fires with outdated `updatedFields`

**Impact:** User might get wrong role or room assignment

**Fix:** Use Firestore transaction or server-side Firebase Function for role assignment.

---

### 9. **Missing Error Boundaries for Async Auth Operations**
**Location:** `src/context/AuthContext.jsx:185-193, 195-303`

**Issue:** `loginWithGoogle`, `loginWithEmail`, `signUpWithEmail` throw errors but callers may not catch them.

**Evidence:**
```jsx
const loginWithGoogle = async () => {
  try {
    const result = await signInWithGoogle();
    return result.user;
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    throw error; // Re-throws, but where is it caught?
  }
};
```

**Problem:** If Login component doesn't wrap these in try-catch, unhandled promise rejection crashes the app.

**Audit Required:** Check `src/pages/Login.jsx` for proper error handling.

---

## Medium Priority

### 10. **Component-Level Role Checks Duplicate Route Protection**
Multiple components check `user?.role === 'admin'` when the route already has ProtectedRoute wrapper.

**Examples:**
- `Users.jsx:95` - Already protected by route
- `SuperAdmin.jsx:45` - Already has email check on line 13

**Impact:** Code duplication, maintenance burden

**Recommendation:** Remove redundant checks OR add comments explaining defense-in-depth strategy.

---

### 11. **Missing TypeScript/PropTypes Validation**
No runtime type checking for user object shape across components.

**Risk:** Silent failures if user object structure changes.

**Recommendation:** Add PropTypes or migrate to TypeScript.

---

### 12. **localStorage Used for Authentication State**
**Location:** `src/context/AuthContext.jsx:9-12, 174-183`

**Issue:**
- `chdv_user` in localStorage is treated as source of truth
- Can be modified by user via DevTools
- No signature or validation

**Better Approach:**
- Store only sessionToken in localStorage
- Fetch user data from Firestore on app load
- Validate token server-side

---

## Low Priority

### 13. **Console.error Instead of Proper Logging**
Multiple `console.error` and `console.warn` throughout AuthContext.

**Recommendation:** Use structured logging library (e.g., Winston, Sentry).

---

### 14. **Magic Numbers in Trial Period Calculation**
```jsx
new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
```

**Recommendation:** Extract to constant:
```jsx
const TRIAL_PERIOD_DAYS = 30;
const TRIAL_PERIOD_MS = TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000;
```

---

## Edge Cases Found

### 15. **What Happens If User Has Both `users` Collection Entry AND `tenants` Collection Entry?**
**Location:** `src/context/AuthContext.jsx:55-69`

Auto-heal logic (lines 120-134) will force role to `'tenant'` even if user was previously admin.

**Scenario:**
1. Admin creates their own account with email admin@test.com
2. Admin accidentally adds themselves to tenant list with same email
3. Next login → auto-heal demotes admin to tenant

**Fix:** Add check: Don't auto-heal if existing role is admin/manager.

---

### 16. **Manager Role Can Be Assigned But AuthContext Doesn't Auto-Assign It**
**Evidence:**
- `AuthContext.jsx:309, 315, 320` - upgradeUserAccount assigns manager role for basic plan
- `AuthContext.jsx:84-93` - New user logic only assigns `'admin'` or `'tenant'`, never manager

**Gap:** No natural way to become a manager except via upgradeUserAccount payment flow.

**Question:** Can managers be created through Users.jsx interface? (Requires audit of Users.jsx form).

---

## Positive Observations

1. **Route-level protection properly uses allowedRoles array** - Clean pattern in App.jsx
2. **Sidebar correctly updated in sync with route changes** - No UX mismatch
3. **Changes are minimal and surgical** - Low blast radius for this specific diff
4. **Consistent variable naming** (`user`, `role`, `allowedRoles`)
5. **No direct DOM manipulation** - All React-idiomatic

---

## Recommended Actions

### Immediate (Block Merge)
1. **Fix SuperAdmin route protection** - Add ProtectedRoute wrapper (App.jsx:115)
2. **Add role check to Settings destructive operations** - Prevent managers from wiping data (Settings.jsx:380-401)
3. **Document manager role scope** - Create AUTHORIZATION.md explaining what managers can/cannot do

### High Priority (Fix This Sprint)
4. **Audit and standardize all role checks** - Search for all 27+ admin checks, decide on manager inclusion
5. **Replace hardcoded email with role-based super admin** - Remove `nguyentienducbmt123@gmail.com` checks
6. **Add Firestore security rule** - Prevent email field modification
7. **Fix building-level authorization pattern** - Include manager in Home.jsx full-access check

### Medium Priority (Next Sprint)
8. **Refactor plan field** - Separate subscription tier from payment status
9. **Add error boundaries** - Wrap async auth operations
10. **Remove localStorage as auth source of truth** - Validate against Firestore

### Low Priority (Tech Debt Backlog)
11. Add PropTypes or TypeScript
12. Implement structured logging
13. Extract magic numbers to constants

---

## Unresolved Questions

1. **What is the intended permission model for manager role?**
   - Same as admin?
   - Limited to non-destructive operations?
   - Building-scoped only?

2. **Should managers be able to create other users/managers?**
   - Users.jsx currently admin-only
   - But manager has Settings access (could conflict)

3. **Is the hardcoded super admin email a temporary development convenience or production design?**
   - If temporary, needs migration plan
   - If production, needs security hardening

4. **Why does staff have full building access but manager doesn't?**
   - Seems inverted from typical hierarchy

---

## Metrics

- **Files Changed:** 2
- **Lines Changed:** ~10
- **Critical Issues:** 3
- **Important Issues:** 6
- **Medium Priority:** 4
- **Low Priority:** 3
- **Edge Cases:** 2
- **Total Role Checks in Codebase:** 50+ (estimated from grep results)
- **Inconsistent Role Checks:** 27+ (admin-only checks that might need manager inclusion)

---

## Conclusion

The diff itself is **technically correct** and won't break existing functionality. However, it **exposes a deeper authorization architecture problem**: role checks are scattered, inconsistent, and lack a unified authorization strategy.

**This is a symptom of incremental AI-assisted development** where individual changes are locally correct but globally inconsistent. The codebase needs an authorization audit and refactoring to establish clear permission boundaries.

**Recommendation:** Accept this diff with **blocking conditions** (fix SuperAdmin route, add Settings role check), then schedule authorization architecture refactor as high-priority technical debt.
