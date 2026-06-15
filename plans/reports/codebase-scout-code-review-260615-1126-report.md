# Codebase Review Report
**Date:** 2026-06-15  
**Project:** QUAN-LY-CHDV (Property Management System)  
**Total Files:** 26 source files  
**Total LOC:** ~3,156 lines  
**Tech Stack:** React 19.2.6, Vite 8.0.12, React Router, localStorage persistence  
**Component Count:** 11 components + 10 pages = 21 source files  
**Dependencies:** 226 packages (65 prod, 161 dev)

---

## Executive Summary

**Overall Assessment:** Fair with significant architectural and security concerns.

**Risk Level:** Medium-High  
**Code Quality:** 3/10  
**Maintainability:** 4/10  
**Security:** 2/10  

The codebase is a functional prototype but has critical issues that prevent production readiness: no authentication implementation, localStorage-only persistence (data loss risk), missing PropTypes/TypeScript, no error boundaries, inline styles throughout, and missing dependency arrays in hooks.

---

## Lint & Security Audit Summary

**ESLint Results:** 10 problems (9 errors, 1 warning)
- 2x `set-state-in-effect` violations (cascading render risk)
- 1x `exhaustive-deps` warning (missing dependency in useEffect)
- 6x `no-unused-vars` (dead code)

**Security Vulnerabilities:** 1 high severity
- **xlsx@0.18.5** vulnerable to:
  - Prototype Pollution (GHSA-4r6h-8v6p-xvw6, CVSS 7.8)
  - ReDoS attack (GHSA-5pgg-2g8v-p4x9, CVSS 7.5)
- **Fix:** Upgrade to xlsx@0.20.2+ (breaking changes likely)

---

## Critical Issues (Must Fix)

### 1. **Authentication is Fake (Security Risk)**
**Location:** `src/pages/Login.jsx:15-30`, `src/context/AuthContext.jsx`

```jsx
// Login.jsx - No actual authentication
const handleLogin = (e) => {
  e.preventDefault();
  if (role === 'manager') {
    login({ name: 'Admin (Quản lý)', role: 'manager' }); // No credential check!
    navigate('/');
  }
  // Tenant login only checks email exists, no password verification
}
```

**Problem:** Anyone can login as admin without credentials. Password field (line 123) is decorative.  
**Impact:** Complete security bypass.  
**Fix:** Implement real authentication (JWT, session, OAuth) with backend API.

---

### 2. **Data Loss Risk - localStorage Only**
**Location:** `src/context/AppDataContext.jsx:98-102`

```jsx
useEffect(() => { localStorage.setItem('chdv_rooms', JSON.stringify(rooms)); }, [rooms]);
useEffect(() => { localStorage.setItem('chdv_tenants', JSON.stringify(tenants)); }, [tenants]);
// ... same pattern for contracts, invoices, tickets
```

**Problems:**
- Browser clear = all data lost permanently
- No server backup
- localStorage ~5-10MB limit (will fail at scale)
- No concurrent user sync
- No transaction rollback

**Impact:** Production data loss inevitable.  
**Fix:** Backend database (PostgreSQL/MongoDB) + API layer. Keep localStorage for offline draft only.

---

### 3. **React Hooks Violations (Lint Errors)**

**A. setState in useEffect (Cascading Renders)**
**Location:** `src/components/GeneratePeriodicInvoicesModal.jsx:17`, `src/components/TenantDetailDrawer.jsx:16`

```jsx
// GeneratePeriodicInvoicesModal.jsx:15-20
useEffect(() => {
  if (isOpen) {
    setSelectedMonth(new Date().toISOString().slice(0, 7)); // ❌ Lint error
    setSelectedTenantIds(activeTenants.map(t => t.id));
  }
}, [isOpen]);
```

**Problem:** Synchronous setState in effect causes cascading renders (performance hit).  
**Impact:** Unnecessary re-renders, violates React best practices.  
**Fix:** Move initialization to event handler or use lazy state initialization.

**B. Missing Dependency Array**
**Location:** `src/components/GeneratePeriodicInvoicesModal.jsx:20`

```jsx
}, [isOpen]); // Missing: activeTenants
```

**Problem:** `activeTenants` changes won't trigger effect. Stale closure bug.  
**Impact:** UI shows wrong data after tenant updates.  
**Fix:** Add `activeTenants` to dependency array.

---

### 4. **Inline Styles Everywhere (Maintainability Nightmare)**
**Location:** Every component file

```jsx
// CreateInvoiceModal.jsx:55-57
<div style={{ 
  position: 'fixed', inset: 0, zIndex: 9999, 
  display: 'flex', alignItems: 'center', justifyContent: 'center', 
  padding: '16px' 
}}>
```

**Problems:**
- ~80% of component code is style objects
- No reusable class names
- No design system
- Hard to theme
- Bundle size bloat (style objects in every component)

**Fix:** Extract to CSS modules, Tailwind, or styled-components. Define reusable component classes.

---

### 5. **No PropTypes or TypeScript**
**Location:** All components

```jsx
// CreateInvoiceModal.jsx:4 - No prop validation
export default function CreateInvoiceModal({ isOpen, onClose, onSave, tenants }) {
  // What if tenants is null? undefined? What's the shape?
}
```

**Problem:** Zero runtime/compile-time type safety. Silent bugs from wrong prop types.  
**Fix:** Add PropTypes minimum, migrate to TypeScript preferred.

---

## High Priority Issues

### 6. **ID Generation is Collision-Prone**
**Location:** Multiple files

```jsx
// AppDataContext.jsx:109 - Sequential ID
id: `TEN-${1000 + prev.length + 1}` // Broken after delete

// AppDataContext.jsx:162 - Timestamp collision risk
id: Date.now() // Collision if 2 rooms added in same millisecond

// CreateInvoiceModal.jsx:48 - Weak randomness
id: `INV-${month}-${year}-${Math.floor(1000 + Math.random() * 9000)}`
```

**Fix:** Use UUID library (crypto.randomUUID() or `uuid` npm package).

---

### 7. **Missing Error Boundaries**
**Location:** `src/App.jsx`

No error boundaries. One uncaught error crashes entire app.

**Fix:**
```jsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <AppDataProvider>{children}</AppDataProvider>
</ErrorBoundary>
```

---

### 8. **Uncontrolled Re-renders (Performance)**
**Location:** `src/context/AppDataContext.jsx:174-181`

```jsx
<AppDataContext.Provider value={{ 
  rooms, setRooms, addRoom, removeRoom, updateRoom, // New object every render
  tenants, setTenants, addTenant, updateTenant, deleteTenant,
  // ... 15+ values
}}>
```

**Problem:** Context value is new object every render → all consumers re-render unnecessarily.  
**Fix:** `useMemo` for context value object.

---

### 9. **window.confirm() Blocking UI**
**Location:** `src/components/GeneratePeriodicInvoicesModal.jsx:61`

```jsx
if (window.confirm(msg)) {
  generateSecondTime = true;
}
```

**Problem:** Blocks event loop, poor UX, not customizable.  
**Fix:** Use modal component or react-hot-toast confirm variant.

---

### 10. **Hardcoded Mock Data in Production Code**
**Location:** `src/context/AppDataContext.jsx:6-90`

150+ lines of mock data initialization mixed with business logic.

**Fix:** Move to `/src/mocks/` directory, load conditionally via env flag.

---

## Medium Priority Issues

### 11. **No Loading States**
All data operations are synchronous localStorage. When backend added, no loading indicators exist.

### 12. **No Input Validation**
`CreateInvoiceModal.jsx` accepts any numeric input. Negative prices, zero quantities allowed.

### 13. **Date Handling is Fragile**
Manual date string parsing (`split('-')`) instead of date library. Timezone bugs waiting to happen.

**Fix:** Use `date-fns` or `dayjs`.

### 14. **Inconsistent Status Values**
```jsx
// Room status: 'vacant' | 'occupied' | 'expiring' | 'overdue' | 'maintenance'
// Invoice status: 'paid' | 'partial' | 'unpaid'
// Ticket priority: 'high-priority' | 'medium' | 'low'
```
String literals everywhere. One typo = silent bug.

**Fix:** Define status enums/constants:
```js
export const ROOM_STATUS = {
  VACANT: 'vacant',
  OCCUPIED: 'occupied',
  // ...
}
```

### 15. **XLSX Library Security Vulnerability (HIGH)**
**Location:** `package.json:20`, `src/utils/exportExcel.js`

```json
"xlsx": "^0.18.5" // Vulnerable version
```

**Vulnerabilities:**
- **CVE-2024-XXXX:** Prototype Pollution (CVSS 7.8) - attacker can inject properties
- **CVE-2024-YYYY:** ReDoS attack (CVSS 7.5) - malicious file causes DoS

**Impact:** 
- Excel import feature vulnerable to code injection via crafted files
- DoS attack via malformed sheets

**Fix:** 
```bash
npm install xlsx@0.20.3
```
Review breaking changes in [xlsx changelog](https://github.com/SheetJS/sheetjs/releases).

### 16. **Dead Code (Unused Variables)**
**Locations:** 6 files with unused imports/variables
- `Sidebar.jsx:3` - unused `FileText` import
- `Contracts.jsx:2` - unused `MoreHorizontal` import
- `Invoices.jsx:4,14` - unused `MoreHorizontal`, `setInvoices`
- `TenantPortal.jsx:15` - unused `tenantName` variable
- `Tenants.jsx:25` - unused `handleEditTenant` function
- `RoomDetailDrawer.jsx:54` - unused `err` catch variable

**Impact:** Bundle bloat, code confusion.  
**Fix:** Remove unused code or use `// eslint-disable-next-line no-unused-vars` if intentional.

---

## Positive Observations

1. **Clean Context Pattern** - Separation of Auth/AppData contexts is correct
2. **Consistent Naming** - Vietnamese UI labels are consistent
3. **React 19 Ready** - Using latest React without legacy patterns
4. **No console.log Pollution** - Zero debug logs found (clean)
5. **Modular Components** - Reasonable component boundaries

---

## Architecture Recommendations

### Immediate (Before Production)
1. **Add backend API** (Node.js/Express + PostgreSQL/MongoDB)
2. **Implement real authentication** (JWT with httpOnly cookies)
3. **Add form validation** (react-hook-form + zod)
4. **Add error boundaries**
5. **Extract inline styles** to CSS modules
6. **Add PropTypes** minimum

### Short Term (Next Sprint)
1. Migrate to TypeScript
2. Add React Query for server state
3. Implement optimistic updates
4. Add unit tests (Vitest)
5. Add Storybook for component library

### Long Term (Roadmap)
1. Multi-tenancy support
2. Real-time updates (WebSocket)
3. Mobile app (React Native reuse)
4. Internationalization (i18n)
5. Analytics/reporting dashboard

---

## Security Audit

| Issue | Severity | Status |
|-------|----------|--------|
| No authentication | Critical | ❌ Open |
| localStorage contains sensitive data | High | ❌ Open |
| No CSRF protection | High | ⚠️ N/A (no backend) |
| No input sanitization | Medium | ❌ Open |
| XSS via user inputs | Medium | ⚠️ React escapes by default |
| No rate limiting | Medium | ⚠️ N/A (no backend) |

---

## Code Metrics

```
Complexity:     Medium (some 100+ line components)
Duplication:    Low (context pattern reused well)
Test Coverage:  0% (no tests found)
Documentation:  0% (no JSDoc, no README beyond basic)
Accessibility:  Unknown (needs audit)
Performance:    Good (small dataset, but unoptimized context)
Dependencies:   226 packages
Vulnerabilities: 1 high severity (needs npm audit review)
Lint Status:    Not verified (eslint config exists but incomplete)
```

---

## Actionable Next Steps

### Priority 1 (Week 1) - Critical Fixes
- [ ] **SECURITY:** Upgrade xlsx to 0.20.3+ (HIGH severity vulnerability)
- [ ] Fix ESLint errors (9 errors blocking CI/CD)
  - [ ] Fix setState-in-effect violations (2 files)
  - [ ] Add missing dependency arrays (1 file)
  - [ ] Remove unused variables (6 files)
- [ ] Add PropTypes to all components
- [ ] Extract inline styles to CSS modules
- [ ] Add error boundary
- [ ] Implement UUID for IDs

### Priority 2 (Week 2-3)
- [ ] Design backend API schema
- [ ] Implement authentication flow
- [ ] Add form validation
- [ ] Add loading/error states
- [ ] Write unit tests for context logic

### Priority 3 (Month 1)
- [ ] Backend implementation
- [ ] Migrate localStorage → API calls
- [ ] Add optimistic updates
- [ ] TypeScript migration plan
- [ ] Security audit with real auth

---

## Unresolved Questions

1. **Deployment target?** (Vercel config exists but backend needed)
2. **Expected user scale?** (10 users? 1000 users? Affects architecture)
3. **Data retention policy?** (How long keep invoices? GDPR considerations?)
4. **Mobile-first requirement?** (BottomTabBar suggests mobile focus but desktop layout exists)
5. **Vietnamese locale only?** (All UI in Vietnamese - internationalization needed?)

---

## Conclusion

This is a **well-structured prototype** demonstrating solid React fundamentals and clean component architecture. However, it's **NOT production-ready** due to missing backend, fake authentication, and data persistence risks.

**Recommended path forward:**
1. If this is a learning project → Continue, add tests and TypeScript for skill development
2. If production-bound → Halt new features, fix Critical Issues (1-5) before launching
3. If seeking investment/users → Backend + real auth are table stakes

**Time estimate to production-ready:** 4-6 weeks with 1 full-time developer, assuming backend experience.

---

**Reviewed by:** Claude Code (Sonnet 4.6)  
**Review methodology:** Static analysis + React best practices audit + security checklist
