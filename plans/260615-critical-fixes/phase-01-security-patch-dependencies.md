---
phase: 1
title: "Security Patch & Dependencies"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Security Patch & Dependencies

## Overview

Upgrade xlsx library from 0.18.5 to 0.20.3+ to patch HIGH severity vulnerabilities (Prototype Pollution CVSS 7.8, ReDoS CVSS 7.5). Verify Excel export functionality still works after upgrade.

**Why Critical:** Current xlsx version allows prototype pollution attacks via crafted Excel files and DoS via malformed sheets.

## Requirements

**Functional:**
- Excel export functionality must work identically after upgrade
- All existing export features preserved (rooms, tenants, invoices, etc.)
- Vietnamese locale/formatting maintained

**Non-functional:**
- Zero HIGH/CRITICAL npm audit vulnerabilities
- No breaking API changes exposed to users
- Build succeeds without warnings

## Architecture

**Current State:**
```
src/utils/exportExcel.js
  └── uses xlsx@0.18.5 (VULNERABLE)
       ├── XLSX.utils.book_new()
       ├── XLSX.utils.json_to_sheet()
       └── XLSX.writeFile()

Used by:
  - src/pages/Home.jsx:36 (Backup Data button)
  - Potentially other pages for specific exports
```

**Target State:**
```
package.json: xlsx@0.20.3 (PATCHED)
  └── API compatibility verified
       └── Breaking changes handled if any
```

## Related Code Files

**Modify:**
- `package.json` - upgrade xlsx dependency
- `package-lock.json` - lock file update
- `src/utils/exportExcel.js` - verify API compatibility, fix breaking changes if any

**Read (for verification):**
- `src/pages/Home.jsx` - primary export caller
- Any other files importing `exportExcel`

## Implementation Steps

### 1. Backup Current State
```bash
git checkout -b fix/xlsx-security-patch
cp package.json package.json.backup
cp src/utils/exportExcel.js src/utils/exportExcel.js.backup
```

### 2. Check Breaking Changes
```bash
# Review changelog for breaking API changes
curl -s https://raw.githubusercontent.com/SheetJS/sheetjs/master/CHANGELOG.md | grep -A 20 "0.20.3"
```

### 3. Upgrade xlsx
```bash
npm uninstall xlsx
npm install xlsx@0.20.3
npm audit --production  # Verify vulnerability gone
```

### 4. Review API Usage
```bash
# Find all xlsx API calls in codebase
grep -r "XLSX\." src/utils/exportExcel.js
```

Common breaking changes between 0.18.5 → 0.20.3:
- `XLSX.writeFile()` may have signature change
- Sheet naming conventions may differ
- Date formatting may require explicit locale

### 5. Update exportExcel.js (if needed)

**IF breaking changes exist**, update accordingly:

```javascript
// Example potential fix (check actual changelog)
// Before (0.18.5):
XLSX.writeFile(wb, filename);

// After (0.20.3) - IF signature changed:
XLSX.writeFile(wb, filename, { compression: true });
```

### 6. Verify Locally
```bash
npm run dev
# Open http://localhost:5173
# Login as manager
# Click "Backup Dữ Liệu (Excel)" button
# Verify Excel file downloads
# Open Excel file, verify data intact
```

### 7. Verify Build
```bash
npm run build
npm run preview
# Test export in production build
```

## Success Criteria

- [ ] `npm audit --production` shows 0 HIGH severity vulnerabilities
- [ ] `npm audit --production | grep xlsx` returns no results
- [ ] `npm run build` succeeds without errors
- [ ] Excel export button in Home page downloads file
- [ ] Downloaded Excel file opens without errors
- [ ] All sheets present (Rooms, Tenants, Contracts, Invoices, Tickets)
- [ ] Vietnamese characters render correctly in Excel
- [ ] File size similar to pre-upgrade (~50KB for default data)
- [ ] No browser console errors when clicking export

## Risk Assessment

**Risk:** xlsx 0.20.x has breaking API changes  
**Likelihood:** Medium  
**Impact:** Medium (export breaks)  
**Mitigation:** 
- Review changelog before upgrade
- Test export in dev before committing
- Rollback plan: `npm install xlsx@0.18.5` (accept vuln temporarily)

**Risk:** Vietnamese locale formatting breaks  
**Likelihood:** Low  
**Impact:** Low (cosmetic only)  
**Mitigation:**
- Test with Vietnamese data in Excel
- Add explicit locale config if needed

## Verification Commands

```bash
# Check installed version
npm list xlsx

# Verify no vulnerabilities
npm audit --production

# Build test
npm run build

# Check for xlsx-related warnings
npm run build 2>&1 | grep -i xlsx
```

## Rollback Plan

If export breaks after upgrade:

1. **Immediate rollback:**
```bash
npm install xlsx@0.18.5
git checkout src/utils/exportExcel.js
npm run build
git add .
git commit -m "Revert: xlsx upgrade (export broken)"
```

2. **Document issue:**
```bash
echo "xlsx upgrade blocked - export broken" >> plans/260615-critical-fixes/blockers.md
```

3. **Alternative:** Accept vulnerability temporarily, escalate to Phase 2 investigation

## Notes

- Breaking changes reference: https://github.com/SheetJS/sheetjs/releases
- Security advisories: 
  - GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)
  - GHSA-5pgg-2g8v-p4x9 (ReDoS)
- Current usage is read-only in production (export only, no import), so attack surface limited but still serious
