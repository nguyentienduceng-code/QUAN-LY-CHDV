---
phase: 3
title: "Testing & Verification"
status: pending
priority: P1
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Testing & Verification

## Overview

Comprehensive manual testing and verification of all Phase 1-2 fixes. Ensure no regressions, confirm security patches work, and validate error boundary catches errors. Create verification checklist for future deployments.

**Why Critical:** Validates that fixes didn't break existing functionality and security vulnerabilities are actually patched.

## Requirements

**Functional:**
- All existing features work identically to pre-fix state
- Excel export produces valid files
- Modals/drawers open and close correctly
- Error boundary catches and recovers from errors

**Non-functional:**
- Zero browser console errors during normal operation
- Performance baseline maintained (no new slow renders)
- Build artifact size within acceptable range
- Security scanner confirms vulnerabilities patched

## Architecture

**Testing Strategy:**
```
Verification Layers:
├── 1. Static Analysis
│   ├── npm audit (security)
│   ├── npm run lint (code quality)
│   └── npm run build (compilation)
├── 2. Manual Functional Testing
│   ├── Core user flows (login, navigation, CRUD)
│   ├── Phase 1 fixes (Excel export)
│   └── Phase 2 fixes (modals, error boundary)
├── 3. Edge Case Testing
│   ├── Empty states
│   ├── Error conditions
│   └── Boundary testing
└── 4. Performance Baseline
    ├── Page load times
    ├── Bundle size comparison
    └── Render count measurement
```

## Related Code Files

**Read (for verification):**
- All modified files from Phase 1 & 2
- `src/App.jsx` - error boundary integration
- `src/components/ErrorBoundary.jsx` - error handling
- `src/utils/exportExcel.js` - export functionality
- `package.json` - dependency versions

**Create (documentation):**
- `plans/260615-critical-fixes/verification-report.md` - test results
- `plans/260615-critical-fixes/regression-checklist.md` - future reference

## Implementation Steps

### 1. Static Analysis Verification

```bash
cd /Users/dominhxuan/Desktop/QUAN-LY-CHDV

# Security audit
npm audit --production
# Expected: 0 high/critical vulnerabilities

# Verify xlsx version
npm list xlsx
# Expected: xlsx@0.20.3 or higher

# Lint check
npm run lint
# Expected: 0 errors (warnings acceptable)

# Build verification
npm run build
# Expected: Success, check output for warnings

# Build size comparison
du -sh dist/
# Compare to previous: should be within ±100KB
```

### 2. Development Server Setup

```bash
# Clean start
rm -rf node_modules/.vite
npm run dev
# Open http://localhost:5173
```

### 3. Core Functionality Testing

**Test Suite A: Authentication & Navigation**
- [ ] Login as Manager (any credentials work - known issue, Phase 2+)
- [ ] Login as Tenant with email (khach1@gmail.com)
- [ ] Navigate to all pages via sidebar (Home, Rooms, Tenants, Contracts, Invoices, Maintenance)
- [ ] Mobile view - bottom tab bar navigation works
- [ ] Logout and verify redirects to login

**Test Suite B: Data Operations (Manager Role)**
- [ ] Home page loads with correct statistics
- [ ] Rooms page displays 40 rooms in grid
- [ ] Tenants page shows tenant list
- [ ] Contracts page displays contracts
- [ ] Invoices page shows invoice list
- [ ] Maintenance page shows Kanban board

**Test Suite C: CRUD Operations**
- [ ] Create new invoice (CreateInvoiceModal opens, saves)
- [ ] Generate periodic invoices (GeneratePeriodicInvoicesModal) - **Phase 2 fix critical**
  - [ ] Modal opens without infinite loop
  - [ ] All tenants selected by default
  - [ ] Month selector works
  - [ ] "Chọn tất cả" / "Bỏ chọn tất cả" toggles correctly
  - [ ] Generate invoices succeeds
  - [ ] Duplicate warning works (generate twice for same month)
- [ ] Open tenant drawer (TenantDetailDrawer) - **Phase 2 fix critical**
  - [ ] Tenant details display correctly
  - [ ] Phone and ID Card fields populated
  - [ ] Edit form works
- [ ] Open room drawer (RoomDetailDrawer)
  - [ ] Room details display
  - [ ] No console errors (unused err variable fixed)

**Test Suite D: Tenant Portal**
- [ ] Login as tenant
- [ ] View invoices
- [ ] Report maintenance issue (ReportIssueModal)
- [ ] Issue appears in maintenance board when logged back as manager

### 4. Phase 1 Specific Testing (Excel Export)

```bash
# Test Excel export functionality
```

**Excel Export Checklist:**
- [ ] Click "Backup Dữ Liệu (Excel)" on Home page
- [ ] File downloads (check Downloads folder)
- [ ] File name format: `CHDV_Backup_YYYY-MM-DD.xlsx`
- [ ] Open file in Excel/LibreOffice/Numbers
- [ ] Verify sheets present: Rooms, Tenants, Contracts, Invoices, Tickets
- [ ] Check Rooms sheet has 40 rows
- [ ] Check Tenants sheet has Vietnamese characters (Nguyễn Văn, etc.)
- [ ] Check invoice amounts formatted correctly (4.500.000 format)
- [ ] Verify no #REF! or #VALUE! errors in cells
- [ ] File size reasonable (<100KB for default data)

**If Excel export fails:**
```bash
# Check browser console for errors
# Check Network tab for download issues
# Verify xlsx API calls in exportExcel.js match new version
```

### 5. Phase 2 Specific Testing (Error Boundary)

**Error Boundary Test - Intentional Crash:**

1. Open browser console
2. Go to any page (e.g., Home)
3. Execute in console:
```javascript
// Trigger error boundary
setTimeout(() => { throw new Error('Test error boundary'); }, 100);
```
4. Verify:
   - [ ] Error boundary catches error (page doesn't go blank)
   - [ ] Vietnamese error message displays: "Đã xảy ra lỗi"
   - [ ] "Tải lại trang" button visible
   - [ ] Click button reloads app successfully
   - [ ] In dev mode, error details shown in collapsible section
   - [ ] Console shows error log

**Error Boundary Test - Component Crash:**

Temporarily add crash to component:
```jsx
// In src/pages/Home.jsx, add before return:
if (true) throw new Error('Component crash test');
```
Verify error boundary catches it, then remove test code.

### 6. Performance Verification

**Render Count Check (GeneratePeriodicInvoicesModal):**
```jsx
// Temporarily add to component:
console.log('GeneratePeriodicInvoicesModal render');

// Open modal, change month
// Expected: 2-3 renders max (not 10+ from cascading useEffect)
// Remove console.log after test
```

**Page Load Timing:**
```javascript
// In browser console on each page:
performance.getEntriesByType('navigation')[0].loadEventEnd
// Record times, compare to baseline (if available)
```

**Bundle Size Analysis:**
```bash
npm run build
ls -lh dist/assets/*.js
# Main bundle should be ~300-500KB (compressed)
```

### 7. Edge Case Testing

**Empty State Tests:**
- [ ] Clear localStorage: `localStorage.clear()` in console
- [ ] Reload app
- [ ] Verify app doesn't crash with empty data
- [ ] Verify default mock data loads

**Boundary Tests:**
- [ ] Generate invoices with 0 tenants selected (should error)
- [ ] Create invoice with negative price (should accept - known issue for Phase 2)
- [ ] Export with maximum data (add 100+ test records)

**Browser Compatibility:**
- [ ] Test in Chrome (primary)
- [ ] Test in Safari (if on Mac)
- [ ] Test in Firefox (if available)
- [ ] Mobile responsive - resize browser to 375px width

### 8. Regression Checklist Creation

Create `plans/260615-critical-fixes/regression-checklist.md`:

```markdown
# Regression Testing Checklist

Run before every deployment.

## Static Checks
- [ ] `npm audit --production` → 0 high/critical
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → success

## Functional Tests
- [ ] Login works (manager + tenant)
- [ ] All pages load without errors
- [ ] Excel export downloads valid file
- [ ] Generate periodic invoices modal works
- [ ] Tenant drawer displays data
- [ ] Error boundary catches test error

## Performance
- [ ] Build size < 1MB (dist/)
- [ ] Page loads < 3s (dev mode)
- [ ] No infinite render loops

## Security
- [ ] No HIGH/CRITICAL npm audit issues
- [ ] No exposed credentials in console
- [ ] localStorage only has expected keys
```

### 9. Documentation Update

Update `plans/260615-critical-fixes/verification-report.md` with results:

```markdown
# Verification Report - Week 1 Critical Fixes

**Date:** 2026-06-15
**Tester:** [Your Name]
**Branch:** fix/xlsx-security-patch + fix/lint-errors-quality-gates

## Phase 1 Results (Security Patch)
- npm audit: ✅ PASS (0 high/critical)
- xlsx version: ✅ 0.20.3
- Excel export: ✅ PASS (file valid)

## Phase 2 Results (Lint & Quality)
- npm run lint: ✅ PASS (0 errors)
- GeneratePeriodicInvoicesModal: ✅ PASS (no infinite loop)
- TenantDetailDrawer: ✅ PASS (form loads)
- Error Boundary: ✅ PASS (catches errors)

## Phase 3 Results (Verification)
- Core flows: ✅ ALL PASS
- Edge cases: ✅ ALL PASS
- Performance: ✅ BASELINE MAINTAINED
- Build: ✅ 487KB (previous: 485KB)

## Issues Found
[List any issues discovered during testing]

## Recommendation
✅ APPROVED FOR MERGE
```

## Success Criteria

- [ ] All static analysis checks pass (audit, lint, build)
- [ ] All Test Suite A-D items pass
- [ ] Excel export produces valid file with correct data
- [ ] Error boundary catches and recovers from test error
- [ ] No console errors during normal operation
- [ ] Performance baseline maintained (no 10x+ render increases)
- [ ] Build size within ±100KB of previous build
- [ ] Regression checklist created and validated
- [ ] Verification report completed and filed

## Risk Assessment

**Risk:** Missed edge case causes production bug  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:** Follow comprehensive test suite, create regression checklist for future

**Risk:** Performance regression not caught by manual testing  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:** Check render counts, measure page load times, compare bundle sizes

**Risk:** Browser-specific bug not caught (Safari, Firefox)  
**Likelihood:** Low  
**Impact:** Low  
**Mitigation:** Test in multiple browsers if available, flag for user testing

## Verification Commands

```bash
# Full verification script
cd /Users/dominhxuan/Desktop/QUAN-LY-CHDV

echo "=== Static Analysis ==="
npm audit --production | grep -E "vulnerabilities|found"
npm run lint
npm run build

echo "=== Version Check ==="
npm list xlsx | grep xlsx

echo "=== Build Size ==="
du -sh dist/

echo "=== Start Dev Server ==="
npm run dev
# Follow manual test suite
```

## Rollback Plan

If verification fails Phase 1 or 2:

1. **Identify which phase failed:**
```bash
# Phase 1 failure (security):
git revert <phase-1-commit>
npm install xlsx@0.18.5  # Temporary rollback

# Phase 2 failure (lint/quality):
git revert <phase-2-commit>
```

2. **Document failure:**
```bash
echo "FAILED: [describe issue]" >> plans/260615-critical-fixes/verification-report.md
```

3. **Escalate to Phase 2 planning** (full investigation needed)

## Notes

- Manual testing is critical - no automated tests exist yet
- Performance metrics are baseline establishment (no prior data)
- Some known issues NOT fixed this phase:
  - Fake authentication (requires backend - Phase 2+)
  - No PropTypes (Phase 2 work)
  - Inline styles (Phase 2 work)
  - localStorage-only persistence (Phase 2-3 work)
- Regression checklist should be run before every deployment
- Consider adding Playwright/Cypress tests in future phases
- Error boundary only catches render errors, not async errors
