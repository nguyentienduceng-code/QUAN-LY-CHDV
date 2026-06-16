# Codebase Scout Report - Full Analysis
**Date:** 2026-06-16  
**Scope:** Complete codebase analysis for production readiness  
**Status:** Completed

---

## Executive Summary

**QUAN-LY-CHDV** is a Vietnamese **Property Management & Tenant Portal System** for multi-building rental properties. It's a React 19 + Vite SPA with Firebase auth integration (prepared but not implemented), localStorage-based state management, and dual user roles (manager/tenant).

**Current State:** Functional MVP/demo with critical security flaws and incomplete features  
**Production Ready:** ❌ NO - Requires security hardening, backend implementation, and feature completion  
**Risk Level:** 🔴 HIGH (exposed credentials, no real authentication, data integrity issues)

---

## Business Purpose & Features

### What Problem Does It Solve?
Manages rental properties across multiple buildings with:
- **Hierarchical organization:** Building → Floor → Room structure
- **Financial tracking:** Invoice generation, payment tracking, profit calculation (revenue - base rent - utilities - maintenance)
- **Tenant services:** Self-service portal for invoices, maintenance requests, announcements
- **Operations:** Contract management, maintenance Kanban board, meter reading updates

### Target Users
1. **Property Managers** - Full control over rooms, tenants, contracts, invoices, settings
2. **Tenants** - Read-only view of own invoices, ability to report maintenance issues

### Core Features
- **Room Management:** Visual floorplan, status filtering (vacant/occupied/expiring/overdue), drag-drop
- **Tenant Directory:** Hierarchical view with contracts, unpaid invoice counts, search
- **Invoice System:** Periodic generation, meter readings (electricity/water), VietQR payment codes
- **Maintenance Board:** Kanban workflow (Reported → In Progress → Resolved) with cost tracking
- **Dashboard:** Revenue/expense breakdown, occupancy chart, alerts
- **Settings:** Per-building pricing (base vs collection prices), bank details

---

## Architecture Overview

### Tech Stack
- **Frontend:** React 19.2.6 + Vite 8.0.12
- **Routing:** React Router (latest)
- **State:** React Context (AppDataContext + AuthContext) + localStorage
- **Auth:** Firebase 12.14.0 (Google OAuth) + hardcoded manager credentials
- **UI:** Custom CSS with design tokens (no Tailwind), inline styles
- **Charts:** Recharts 3.8.1
- **Excel Export:** xlsx 0.20.3 (from CDN)
- **Notifications:** react-hot-toast
- **Drag-Drop:** @hello-pangea/dnd 18.0.1

### State Architecture
```
App.jsx
├── AuthProvider (user, role, login/logout)
│   └── AppDataProvider (rooms, tenants, contracts, invoices, tickets, settings)
│       └── Router → Pages
```

**Persistence:** 6 separate localStorage keys written on every state change (no debouncing)

### File Structure
```
src/
├── components/     13 files (modals, drawers, navigation)
├── context/        2 files (AppDataContext.jsx, AuthContext.jsx)
├── pages/          10 files (Home, Rooms, Tenants, Invoices, etc)
├── styles/         index.css, layout.css
├── utils/          exportExcel.js, mockData.js
├── firebase.js     Firebase config (HARDCODED CREDENTIALS ⚠️)
└── main.jsx
```

---

## Critical Production Issues

### 🔴 CRITICAL (Blocks Production)

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 1 | **Exposed Firebase API keys** | `src/firebase.js:4-12` | Anyone can read/write Firebase project | Move to `.env.local` with `VITE_*` prefix |
| 2 | **No role-based access control** | `AuthContext.jsx`, `App.jsx` | Tenants can become managers via localStorage edit | Implement backend auth + JWT tokens |
| 3 | **All tenants share default room** | `AuthContext.jsx:25` | Data leakage between tenants | Server-side email→room mapping |
| 4 | **Hardcoded password visible** | `Login.jsx:141` | Password "password123" in HTML source | Remove default value, implement real auth |
| 5 | **Manager login has zero validation** | `Login.jsx:36` | Any username + "password123" works | Backend credential verification |
| 6 | **Hardcoded bank details** | `InvoiceReceiptModal.jsx:17-19` | VietQR codes fail if settings missing | Read from settings.prices[building] |

### 🟠 HIGH (Severe Impact)

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 7 | **Session not cleared on Firebase logout** | `AuthContext.jsx:27-29` | Stale localStorage sessions persist | Compare storedUser.uid with firebaseUser.uid |
| 8 | **No ID collision detection** | `AppDataContext.jsx:83,96,101,112` | Duplicate IDs in concurrent scenarios | Use UUID or server-assigned IDs |
| 9 | **No data cascade delete** | `AppDataContext.jsx:90-92` | Orphaned contracts/invoices after tenant delete | Implement cascading deletes |
| 10 | **No input validation in CreateInvoiceModal** | `CreateInvoiceModal.jsx:73-95` | Negative meter readings allowed | Add validation to reject invalid sequences |
| 11 | **Search filters non-functional** | `Contracts.jsx:31`, `Invoices.jsx:84` | Users can't search; UI is misleading | Implement filter handlers |
| 12 | **Demo data wipe button on login** | `Login.jsx:200-204` | Accidental data loss | Remove or move to Settings with strong confirmation |
| 13 | **Field mismatch in Excel export** | `exportExcel.js:38` | Export crashes: `c.tenantName` should be `c.tenant` | Fix field name |
| 14 | **Missing CSS variables** | `layout.css` | Layout broken: refs `--sidebar-width`, `--header-height` undefined | Define in index.css |

### 🟡 MEDIUM (Functional Issues)

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 15 | **Unoptimized localStorage writes** | `AppDataContext.jsx:70-75` | Performance hit with large datasets | Debounce writes (300ms) |
| 16 | **No audit trail** | `AppDataContext.jsx` | Cannot track who changed what/when | Add timestamp + user metadata to CRUD |
| 17 | **Duplicate invoice IDs** | `CreateInvoiceModal.jsx:129` | `Math.random()` can collide | Use UUID library |
| 18 | **Invoice amount type inconsistency** | Multiple files | Sometimes string, sometimes number | Store as numbers, format on display |
| 19 | **Meter readings missing in mockData** | `mockData.js` | Generated invoices have qty: 0 | Add oldIndex/newIndex to mock items |
| 20 | **Prompt() inputs not validated** | `Rooms.jsx:50-63`, `Contracts.jsx:15-22` | Garbage data (negative prices, special chars) | Use proper modals with validation |
| 21 | **"Thêm Khách" button incomplete** | `Tenants.jsx:27` | Shows "Under renovation" toast | Implement add tenant form |
| 22 | **Vite config missing build opts** | `vite.config.js` | No minification, code splitting | Add rollupOptions, chunk splitting |
| 23 | **No confirmation on payment toggle** | `Invoices.jsx:240-260` | Accidental revenue entry | Add confirmation dialog |

### 🔵 LOW (Polish Issues)

- Modal accessibility (no focus trap, missing aria-labels)
- Export Excel exports all data, not filtered view
- Inline styles everywhere (no design system)
- Color-only status indicators (not WCAG compliant)
- package.json version still 0.0.0

---

## Security Assessment

### Authentication Vulnerabilities
1. **Client-side role enforcement** - localStorage can be edited with DevTools
2. **No password hashing** - Plaintext password in source code
3. **No session validation** - Firebase user vs localStorage user mismatch
4. **Email-only tenant lookup** - No password verification for tenants

### Data Security
1. **Exposed Firebase credentials** - Public API keys in source
2. **No CSRF protection** - No tokens, all state in localStorage
3. **No input sanitization** - Prompt() inputs directly stored
4. **No rate limiting** - Can spam invoice generation

### Recommendation: 🔴 **DO NOT DEPLOY WITHOUT BACKEND AUTH**

---

## Data Integrity Issues

### Race Conditions
- 6 separate localStorage writes on every state change (no debouncing)
- Sequential ID generation (`TEN-1001`, `TEN-1002`) not atomic
- Concurrent invoice generation can create duplicate IDs

### Data Consistency
- Deleting tenant doesn't clean up contracts/invoices (orphaned records)
- Building rename requires manual updates across 3 arrays (risk of desync)
- Meter readings stored separately from invoice items (can drift)

### Type Safety
- Invoice amounts stored as strings (`"5.000.000"`) and numbers (inconsistent)
- Parsing with `parseInt(amount.replace(/\./g, ''))` silently fails to 0
- No PropTypes or TypeScript for type checking

---

## Missing Features

### Incomplete UI
- ❌ Search filters (rendered but non-functional)
- ❌ Add Tenant button (shows "Under renovation")
- ❌ Export Excel filter buttons (no handlers)
- ❌ Meter readings in batch invoice generation (defaults to 0)

### Backend Not Implemented
- ❌ Real authentication server
- ❌ Firestore integration (only localStorage)
- ❌ User role management
- ❌ Invoice persistence
- ❌ API endpoints
- ❌ File upload (room images use base64 strings)

### Firebase Integration Prepared But Not Active
- Firebase SDK installed but config incomplete
- AuthContext.jsx has Firebase hooks commented/unused
- FIREBASE_SETUP.md documentation ready but not executed
- Requires: Firebase project creation, .env setup, Firestore rules deployment

---

## Performance Concerns

### Client-Side
- All data loaded into memory (no pagination)
- 6 localStorage writes on every state change (no debouncing)
- No lazy loading of modals/drawers
- Full image compression on main thread (blocks UI)
- Unoptimized re-renders (no useMemo in list components)

### Build
- Vite config minimal (no code splitting, minification not optimized)
- xlsx library loads from CDN (unusual, should be npm)
- No bundle size limits configured

### Scalability Limits
- 100+ rooms: UI becomes slow (no virtualization)
- 1000+ invoices: localStorage quota exceeded (5-10MB limit)
- Concurrent users: Race conditions on localStorage writes

---

## Testing Status

### Week 1 Critical Fixes (Verified ✅)
- npm audit: 0 vulnerabilities (xlsx upgraded to 0.20.3)
- ESLint: 0 errors
- Error Boundary: Successfully catches errors
- Core flows: All tests passed
- Performance: Baseline maintained

### Missing Tests
- No unit tests (Jest/Vitest not configured)
- No integration tests
- No E2E tests (Playwright/Cypress not present)
- No accessibility tests
- No load tests

---

## Deployment Blockers

### Must Fix Before Production

1. **Security**
   - [ ] Move Firebase credentials to environment variables
   - [ ] Implement backend authentication with JWT
   - [ ] Add role-based access control (RBAC) server-side
   - [ ] Remove hardcoded passwords from source code
   - [ ] Add session validation and timeout

2. **Data Integrity**
   - [ ] Implement proper multi-tenancy (room-to-user mapping)
   - [ ] Add cascade deletes for related records
   - [ ] Use UUID for all entity IDs
   - [ ] Add optimistic locking or version fields
   - [ ] Implement data backup strategy

3. **Feature Completion**
   - [ ] Implement search filters in Contracts, Invoices
   - [ ] Add tenant creation form (remove "Under renovation" message)
   - [ ] Fix Excel export field mismatch (tenantName → tenant)
   - [ ] Add input validation on all forms
   - [ ] Complete Firebase integration or remove references

4. **Configuration**
   - [ ] Define missing CSS variables (--sidebar-width, --header-height)
   - [ ] Add .env.example file with required vars
   - [ ] Optimize Vite build config (code splitting, minification)
   - [ ] Update package.json version to 1.0.0

### Should Fix (High Priority)

- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement proper modal component (replace prompt())
- [ ] Add accessibility (focus trap, ARIA labels, keyboard nav)
- [ ] Debounce localStorage writes (300ms)
- [ ] Add audit trail (user, timestamp on all changes)
- [ ] Implement error boundaries per page
- [ ] Add loading states for async operations

### Nice to Have (Medium Priority)

- [ ] Add unit tests (Vitest + React Testing Library)
- [ ] Extract inline styles to CSS modules or Tailwind
- [ ] Implement pagination for large lists
- [ ] Add data export filtering (not just all data)
- [ ] Implement Zalo ZNS API properly (not just zalo.me links)
- [ ] Add image upload to cloud storage (not base64)

---

## Recommended Rebuild Strategy

### Phase 1: Security Hardening (1-2 weeks)
**Priority:** 🔴 CRITICAL
1. Create `.env.local` and move all Firebase credentials
2. Implement backend auth service (Node.js + Express or Firebase Auth properly)
3. Add JWT token validation on protected routes
4. Remove hardcoded credentials from Login.jsx
5. Implement proper role management with server-side checks

### Phase 2: Data Architecture (2-3 weeks)
**Priority:** 🟠 HIGH
1. Replace localStorage with Firestore or PostgreSQL
2. Implement proper multi-tenancy (user → building → room mapping)
3. Add cascade delete rules
4. Switch to UUID for all entities
5. Add created_at, updated_at, created_by, updated_by fields

### Phase 3: Feature Completion (2-3 weeks)
**Priority:** 🟡 MEDIUM
1. Implement search/filter functionality
2. Replace prompt() with proper modal forms
3. Add input validation with error messages
4. Complete tenant creation workflow
5. Fix Excel export bugs

### Phase 4: Performance & Polish (1-2 weeks)
**Priority:** 🔵 LOW
1. Add pagination/virtualization for large lists
2. Implement debouncing on expensive operations
3. Add loading states and skeletons
4. Optimize bundle size (code splitting)
5. Add accessibility features (WCAG AA compliance)

### Phase 5: Testing & Deployment (1-2 weeks)
**Priority:** 🟢 FINAL
1. Write unit tests (80%+ coverage goal)
2. Add E2E tests for critical flows
3. Load testing (simulate 100+ concurrent users)
4. Security audit (OWASP top 10)
5. Deploy to staging, then production

**Total Estimated Effort:** 8-12 weeks (2-3 months) with 1-2 developers

---

## Alternative: Quick Production Patch (2-3 weeks)

If timeline is urgent, minimal viable fixes:

1. **Security** (1 week)
   - Move Firebase credentials to .env
   - Disable manager login (tenant-only mode)
   - Add HTTPS enforcement
   - Remove demo data wipe button

2. **Stability** (1 week)
   - Fix CSS variable issues
   - Fix Excel export bugs
   - Add error boundaries
   - Debounce localStorage writes

3. **Communication** (few days)
   - Add prominent "BETA" badge
   - Add warning about data limits (max 50 rooms)
   - Terms of service acknowledging security limitations
   - Backup reminder (Excel export daily)

**Risk:** Still insecure, but functional for small-scale internal use with trusted users.

---

## Codebase Health Metrics

| Metric | Status | Target |
|--------|--------|--------|
| Security vulnerabilities | 🔴 Critical | 0 high/critical |
| ESLint errors | ✅ 0 | 0 |
| Test coverage | 🔴 0% | 80%+ |
| TypeScript | 🔴 None | Consider migration |
| Bundle size | 🟡 Unknown | < 500KB gzipped |
| Lighthouse score | 🟡 Not measured | 90+ |
| Accessibility | 🔴 Fails | WCAG AA |
| Documentation | 🟡 Minimal | Comprehensive |

---

## Unresolved Questions

1. **Business Requirements:**
   - How many buildings/rooms is the target scale?
   - Is this for internal use or SaaS product?
   - What is acceptable downtime during migration?

2. **Technical Decisions:**
   - Migrate to TypeScript? (Recommended for scale)
   - Use Firestore or PostgreSQL for backend?
   - Keep localStorage or full migration?
   - Should we keep Firebase or switch to alternative auth?

3. **Compliance:**
   - Does this need to comply with GDPR/Vietnamese data protection laws?
   - Are there financial audit requirements for invoice data?
   - What is data retention policy?

4. **Timeline:**
   - Is 8-12 week rebuild acceptable?
   - Or is quick 2-3 week patch preferred for immediate use?
   - Can we phase rollout (beta → staging → production)?

---

## Conclusion

**QUAN-LY-CHDV** is a well-structured MVP with a clear business purpose and thoughtful UX design. The codebase demonstrates good React patterns (Context API, component separation) and the features are comprehensive for property management needs.

**However, it is NOT production-ready due to:**
1. 🔴 Critical security flaws (exposed credentials, no real auth, client-side role enforcement)
2. 🟠 Missing backend infrastructure (localStorage is not a database)
3. 🟡 Incomplete features (search, add tenant, proper validation)
4. 🔵 Performance concerns (no pagination, unoptimized localStorage writes)

**Recommendation:** Proceed with **Phase 1-5 rebuild strategy** (8-12 weeks) for production deployment to paying customers. If timeline is critical and users are internal/trusted, consider **Quick Production Patch** (2-3 weeks) with clear warnings and limitations.

**Next Steps:**
1. Prioritize security fixes (Phase 1)
2. Decide on backend architecture (Firestore vs PostgreSQL)
3. Create .env.example and migrate credentials
4. Implement proper authentication flow
5. Set up staging environment for testing

---

**Report compiled by:** Scout Agent Team (5 parallel agents)  
**Analysis scope:** 44 files across src/, plans/, config  
**Lines analyzed:** ~6,000 LOC  
**Findings:** 23 production issues (6 critical, 8 high, 9 medium/low)
