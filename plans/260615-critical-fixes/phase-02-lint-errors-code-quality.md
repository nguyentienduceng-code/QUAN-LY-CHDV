---
phase: 2
title: "Lint Errors & Code Quality"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Lint Errors & Code Quality

## Overview

Fix 9 ESLint errors and 1 warning identified in the code review. Addresses React Hooks violations (setState-in-effect, missing dependencies) and dead code (unused variables). Add minimal error boundary to prevent app-wide crashes.

**Why Critical:** Lint errors block CI/CD pipelines, and React Hooks violations cause performance issues (cascading renders) and stale closure bugs.

## Requirements

**Functional:**
- All React components render correctly after fixes
- Modal initialization works without side effects
- Tenant selection updates trigger correct re-renders

**Non-functional:**
- `npm run lint` exits 0 (zero errors)
- No performance regressions (measure render counts)
- Build size unchanged (±5KB acceptable)
- Error boundary logs errors without breaking UI

## Architecture

**Current State - Lint Errors:**
```
ESLint Results: 10 problems (9 errors, 1 warning)

Errors by File:
├── GeneratePeriodicInvoicesModal.jsx
│   ├── [ERROR] set-state-in-effect (line 17) - setState in useEffect body
│   └── [WARN] exhaustive-deps (line 20) - missing activeTenants dependency
├── TenantDetailDrawer.jsx
│   └── [ERROR] set-state-in-effect (line 16) - setState in useEffect body
├── RoomDetailDrawer.jsx
│   └── [ERROR] no-unused-vars (line 54) - unused catch variable 'err'
├── Sidebar.jsx
│   └── [ERROR] no-unused-vars (line 3) - unused import 'FileText'
├── Contracts.jsx
│   └── [ERROR] no-unused-vars (line 2) - unused import 'MoreHorizontal'
├── Invoices.jsx
│   ├── [ERROR] no-unused-vars (line 4) - unused import 'MoreHorizontal'
│   └── [ERROR] no-unused-vars (line 14) - unused variable 'setInvoices'
├── TenantPortal.jsx
│   └── [ERROR] no-unused-vars (line 15) - unused variable 'tenantName'
└── Tenants.jsx
    └── [ERROR] no-unused-vars (line 25) - unused function 'handleEditTenant'
```

**Target State:**
```
All components:
  ├── Zero lint errors
  ├── Hooks follow exhaustive-deps
  ├── No setState in useEffect bodies
  └── No unused imports/variables

New: ErrorBoundary component wraps app
```

## Related Code Files

**Modify (Lint Fixes):**
- `src/components/GeneratePeriodicInvoicesModal.jsx` - fix setState-in-effect + missing dep
- `src/components/TenantDetailDrawer.jsx` - fix setState-in-effect
- `src/components/RoomDetailDrawer.jsx` - remove unused catch variable
- `src/components/Sidebar.jsx` - remove unused FileText import
- `src/pages/Contracts.jsx` - remove unused MoreHorizontal import
- `src/pages/Invoices.jsx` - remove unused MoreHorizontal import, handle setInvoices
- `src/pages/TenantPortal.jsx` - remove unused tenantName variable
- `src/pages/Tenants.jsx` - remove unused handleEditTenant function

**Create (Error Boundary):**
- `src/components/ErrorBoundary.jsx` - new error boundary component

**Modify (Error Boundary Integration):**
- `src/App.jsx` - wrap AppDataProvider with ErrorBoundary

## Implementation Steps

### 1. Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b fix/lint-errors-quality-gates
```

### 2. Fix setState-in-effect Violations (2 files)

**File:** `src/components/GeneratePeriodicInvoicesModal.jsx`

**Current (lines 15-20):**
```jsx
useEffect(() => {
  if (isOpen) {
    setSelectedMonth(new Date().toISOString().slice(0, 7)); // ❌ setState in effect
    setSelectedTenantIds(activeTenants.map(t => t.id));
  }
}, [isOpen]); // ❌ Missing activeTenants
```

**Fix - Option A (Lazy State Initialization):**
```jsx
const [selectedMonth, setSelectedMonth] = useState(() => 
  new Date().toISOString().slice(0, 7)
);
const [selectedTenantIds, setSelectedTenantIds] = useState([]);

useEffect(() => {
  if (isOpen && activeTenants.length > 0) {
    setSelectedTenantIds(activeTenants.map(t => t.id));
  }
}, [isOpen, activeTenants]); // ✅ All deps included
```

**File:** `src/components/TenantDetailDrawer.jsx`

**Current (lines 14-18):**
```jsx
useEffect(() => {
  if (tenant) {
    setEditForm({ phone: tenant.phone || '', idCard: tenant.idCard || '', note: tenant.note || '' });
  }
}, [tenant]);
```

**Fix - Move to Derived State:**
```jsx
// Remove useEffect entirely
const editForm = tenant ? {
  phone: tenant.phone || '',
  idCard: tenant.idCard || '',
  note: tenant.note || ''
} : { phone: '', idCard: '', note: '' };

// OR if form needs local edits, initialize with useMemo:
const [editForm, setEditForm] = useState({ phone: '', idCard: '', note: '' });

useMemo(() => {
  if (tenant) {
    setEditForm({ phone: tenant.phone || '', idCard: tenant.idCard || '', note: tenant.note || '' });
  }
}, [tenant]); // Only recompute when tenant changes
```

### 3. Fix Unused Variables (6 files)

**File:** `src/components/RoomDetailDrawer.jsx` (line 54)
```jsx
// Before:
try {
  // ...
} catch (err) {  // ❌ unused
  toast.error('...');
}

// After:
try {
  // ...
} catch {  // ✅ anonymous catch
  toast.error('...');
}
```

**File:** `src/components/Sidebar.jsx` (line 3)
```jsx
// Before:
import { Home, Users, FileText, DollarSign, Wrench, LogOut } from 'lucide-react';

// After (remove FileText):
import { Home, Users, DollarSign, Wrench, LogOut } from 'lucide-react';
```

**File:** `src/pages/Contracts.jsx` (line 2)
```jsx
// Before:
import { Search, Plus, MoreHorizontal, FileText, Download } from 'lucide-react';

// After (remove MoreHorizontal):
import { Search, Plus, FileText, Download } from 'lucide-react';
```

**File:** `src/pages/Invoices.jsx` (lines 4, 14)
```jsx
// Line 4 - Before:
import { Search, Plus, MoreHorizontal, Eye, Download, DollarSign, Receipt } from 'lucide-react';

// Line 4 - After:
import { Search, Plus, Eye, Download, DollarSign, Receipt } from 'lucide-react';

// Line 14 - Before:
const { invoices, setInvoices, addInvoice, tenants } = useAppData();

// Line 14 - After (remove setInvoices if truly unused, or keep and use):
const { invoices, addInvoice, tenants } = useAppData();
// Check if setInvoices is used anywhere in file first!
```

**File:** `src/pages/TenantPortal.jsx` (line 15)
```jsx
// Before:
const tenantName = user?.name || 'Khách hàng';

// After (remove if unused):
// Delete line 15 entirely
// OR if used somewhere, keep it and fix the lint config
```

**File:** `src/pages/Tenants.jsx` (line 25)
```jsx
// Before:
const handleEditTenant = (id) => {
  // ... function body
};

// After (if truly unused):
// Delete entire function
// OR if planned for future, add eslint-disable comment:
// eslint-disable-next-line no-unused-vars
const handleEditTenant = (id) => {
  // TODO: Implement edit functionality
};
```

### 4. Create Error Boundary Component

**Create:** `src/components/ErrorBoundary.jsx`

```jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Optional: Send to error reporting service
    // Example: Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: '16px', color: 'var(--status-overdue)' }}>
            Đã xảy ra lỗi
          </h1>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Tải lại trang
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                Chi tiết lỗi (Development only)
              </summary>
              <pre style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.85rem'
              }}>
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Integrate Error Boundary in App.jsx

**File:** `src/App.jsx`

**Before (line 75-79):**
```jsx
function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Toaster ...>
```

**After:**
```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppDataProvider>
          <Toaster ...>
```

**And close the boundary at the end (after Router close tag):**
```jsx
        </Router>
      </AppDataProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
}
```

### 6. Verify Lint Passes
```bash
npm run lint
# Expected: ✓ 0 problems
```

### 7. Test Components Manually
```bash
npm run dev
# Test scenarios:
# 1. GeneratePeriodicInvoicesModal - Open modal, verify tenant selection works
# 2. TenantDetailDrawer - Open tenant details, verify form loads
# 3. All pages load without console errors
# 4. Test error boundary by throwing error in dev tools console
```

### 8. Build Verification
```bash
npm run build
# Expected: Build succeeds, no lint errors in build output
```

## Success Criteria

- [ ] `npm run lint` exits with code 0 (zero errors, warnings OK)
- [ ] `npm run build` succeeds without errors
- [ ] GeneratePeriodicInvoicesModal opens and shows all tenants selected by default
- [ ] Changing month in modal doesn't cause infinite re-renders
- [ ] TenantDetailDrawer shows tenant phone/ID correctly
- [ ] No browser console errors when navigating all pages
- [ ] Error boundary catches test error: `throw new Error('test')` in console
- [ ] Error boundary shows Vietnamese error message
- [ ] Error boundary "Tải lại trang" button reloads app successfully
- [ ] In dev mode, error boundary shows error details
- [ ] Build size within ±5KB of previous build

## Risk Assessment

**Risk:** Hook fixes break modal/drawer functionality  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:** Test each component after fix, verify no infinite loops

**Risk:** Error boundary doesn't catch errors  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:** Test with intentional throw, verify logs in console

**Risk:** Removing "unused" code that's actually used  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:** Search entire codebase for variable usage before deleting

## Verification Commands

```bash
# Lint check
npm run lint

# Search for specific variable usage before removing
grep -r "handleEditTenant" src/
grep -r "tenantName" src/pages/TenantPortal.jsx
grep -r "setInvoices" src/pages/Invoices.jsx

# Check component imports
grep -r "ErrorBoundary" src/

# Build
npm run build
du -h dist/ # Check build size
```

## Rollback Plan

If any component breaks:

1. **Identify broken component** via browser console errors
2. **Revert specific file:**
```bash
git checkout main -- src/components/BrokenComponent.jsx
npm run lint  # Check if error returns
```
3. **If hook fixes cause issues:**
```bash
# Temporarily disable specific rule:
echo "rules: { 'react-hooks/set-state-in-effect': 'warn' }" >> eslint.config.js
```
4. **If error boundary causes issues:**
```bash
git checkout main -- src/components/ErrorBoundary.jsx src/App.jsx
```

## Notes

- setState-in-effect is a React 19 stricter lint rule; older React versions may not flag this
- Error boundary uses class component (required for componentDidCatch)
- Some "unused" variables may be planned for future features - confirm before deleting
- Keep setInvoices if invoice status updates are planned
- Keep handleEditTenant if edit modal is planned
- Error boundary only catches render errors, not async/event handler errors
