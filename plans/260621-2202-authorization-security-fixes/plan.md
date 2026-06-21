---
title: "Authorization Architecture Fix - Critical Security Issues"
description: "Fix 3 critical + 6 important authorization vulnerabilities: scattered role checks, hardcoded email auth, unprotected routes, localStorage tampering, race conditions. Implement Custom Claims + centralized authorization hooks."
status: pending
priority: P1
branch: "main"
tags: [security, critical, authorization, firebase, custom-claims]
blockedBy: []
blocks: [260616-2330-production-rebuild]
created: "2026-06-21T15:24:07.151Z"
createdBy: "ck:plan"
source: skill
---

# Authorization Architecture Fix - Critical Security Issues

## Overview

Fix **critical authorization vulnerabilities** identified in comprehensive code review. Current system has 3 **CRITICAL** and 6 **IMPORTANT** security issues allowing privilege escalation, data tampering, and unauthorized access.

**Risk Level:** 🔴 CRITICAL (9.5/10) → 🟡 MEDIUM (3/10) after Phase 0 → 🟢 LOW (2/10) after all phases  
**Timeline:** 6-8 days (1 developer)  
**Effort:** ~46 hours (includes Phase 0 critical fixes)  
**Impact:** Prevents any authenticated user from escalating to admin via browser DevTools

**⚠️ RED TEAM REVIEW FINDINGS:**
Original plan had **10 blocking vulnerabilities** that would make system LESS secure. Phase 0 added to fix all blockers before main implementation.

### Critical Issues Fixed

1. **Incomplete Authorization Pattern Migration** - Manager role added to routes but missing from 50+ component-level checks (authorization bypass risk)
2. **Unprotected SuperAdmin Route** - `/super-admin` has no route-level guard
3. **Hardcoded Email Authorization** - Super admin tied to `nguyentienducbmt123@gmail.com` across 6+ files (email spoofing vulnerability)

### Important Issues Fixed

4. Missing authorization checks in Settings destructive operations
5. Inconsistent building-level authorization (staff has full access, manager doesn't)
6. Race conditions in auto-heal logic
7. localStorage as auth source of truth (client-side tampering)
8. No server-side role validation
9. Missing error boundaries for async auth operations

### Solution Architecture

**Defense-in-Depth Approach:**
- **Layer 1:** Firebase Custom Claims (cryptographically signed, server-side truth)
- **Layer 2:** Firestore Security Rules (cryptographic verification at DB level)
- **Layer 3:** Centralized React Hooks (`useAuthorization`)
- **Layer 4:** Route Guards (UX protection)
- **Layer 5:** Component-Level Checks (fine-grained UI)
- **Layer 6:** Cloud Functions Validation (privileged operations)
- **Layer 7:** Monitoring & Alerting (detect suspicious activity)

## Phases

| Phase | Name | Effort | Status | Priority |
|-------|------|--------|--------|----------|
| 0 | [**Critical Fixes - Red Team Blockers**](./phase-00-critical-fixes-red-team-blockers.md) | 6h | Pending | P0 |
| 1 | [Security Analysis](./phase-01-security-analysis.md) | 4h | Pending | P1 |
| 2 | [Foundation Setup](./phase-02-foundation-setup.md) | 8h | Pending | P1 |
| 3 | [Core Implementation](./phase-03-core-implementation.md) | 16h | Pending | P1 |
| 4 | [Testing & Hardening](./phase-04-testing-hardening.md) | 8h | Pending | P1 |
| 5 | [Deployment & Monitoring](./phase-05-deployment-monitoring.md) | 4h | Pending | P1 |

**Total Effort:** 46 hours (6 days)

**⚠️ CRITICAL:** Phase 0 must complete before any other phase. It fixes 10 blocking vulnerabilities identified by red team review.

## Success Metrics

**Security (Must-Have):**
- [ ] All 3 CRITICAL issues resolved (verified via security tests)
- [ ] All 6 IMPORTANT issues resolved
- [ ] No localStorage-based authorization remaining
- [ ] All 50+ role checks migrated to `useAuthorization` hook
- [ ] Hardcoded email removed from all 6+ locations
- [ ] Firestore rules prevent privilege escalation (tested with emulator)
- [ ] Custom Claims deployed and validated

**Functionality (Must-Have):**
- [ ] All existing features work with new authorization system
- [ ] SuperAdmin route has ProtectedRoute wrapper
- [ ] Settings destructive operations restricted to admin-only
- [ ] Manager role permissions clearly documented
- [ ] Zero authorization bypass vulnerabilities (penetration tested)

**Quality (Must-Have):**
- [ ] 100% of authorization code covered by unit tests
- [ ] Firestore rules tested with Firebase emulator
- [ ] Manual QA passed for all user roles (admin, manager, staff, viewer, tenant, guest)
- [ ] Security monitoring alerts configured

## Dependencies

**Blocked By:** None  
**Blocks:** 
- `260616-2330-production-rebuild` - Authorization must be secure before backend migration
- All future feature development (insecure auth cannot go to production)

**Related Plans:**
- `260616-2330-production-rebuild` - Full backend rebuild (this plan secures current Firebase setup)
- `260615-critical-fixes` - Lint errors and dependency fixes (separate concerns, can run in parallel)

**Dependency Rationale:**
This plan focuses on **immediate security patching** of the current Firebase-based system. Production rebuild plan involves multi-week backend migration. Since authorization vulnerabilities are **actively exploitable**, this plan takes priority and must complete first.

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing features during migration | 🔴 High | Medium | Backwards-compatible fallback; gradual migration; comprehensive testing |
| Custom Claims not propagating (1hr token cache) | 🟡 Medium | High | Force token refresh; metadata-based invalidation; user education |
| Cloud Functions deployment fails | 🟡 Medium | Low | Test locally with emulator; deploy to staging first; rollback plan ready |
| Existing compromised accounts | 🔴 High | Low | Audit all admin accounts; revoke suspicious tokens; force password reset |
| Performance degradation (token validation overhead) | 🟢 Low | Low | Custom Claims cached in token; no DB reads needed |
| Team unfamiliar with Custom Claims | 🟢 Low | Medium | Comprehensive documentation; code examples; hands-on training |

## Rollback Plan

**Phase 1-2 (Analysis + Setup):**
- No rollback needed (no production changes)
- Can abort and restart if approach wrong

**Phase 3 (Core Implementation):**
- Feature flag: `VITE_USE_CUSTOM_CLAIMS=false` reverts to old logic
- Keep parallel systems for 2-week observation period
- Git revert available for all commits

**Phase 4-5 (Testing + Deployment):**
- Firestore rules rollback: Keep previous rules in `firestore.rules.backup`
- Cloud Functions rollback: Deploy previous version via `firebase deploy --only functions:previous`
- Emergency lockdown: Temporarily disable all writes in Firestore rules

## Technology Stack

**No New Dependencies:**
- Firebase Admin SDK (for Cloud Functions - already available)
- Firebase Emulator Suite (for rules testing - dev-only)
- All other changes use existing React/Firebase setup

**Environment Variables:**
```bash
# .env.local
VITE_USE_CUSTOM_CLAIMS=true
VITE_FIREBASE_USE_EMULATOR=false
```

## Migration Strategy

**Backwards-Compatible Approach:**
1. Deploy Custom Claims infrastructure (no breaking changes)
2. Migrate users to claims (parallel to existing system)
3. Update components incrementally (one file at a time)
4. Feature flag allows instant rollback
5. Remove old system after 2-week validation period

**Migration Priority:**
1. ✅ **High Risk First**: Settings.jsx destructive operations
2. ✅ **Route Guards**: App.jsx ProtectedRoute + SuperAdmin route
3. ✅ **Navigation**: Sidebar.jsx, BottomTabBar.jsx
4. ✅ **Auth Context**: Remove hardcoded email checks
5. ✅ **Components**: RoomDetailDrawer, InvoiceReceiptModal, etc.

## Research Reports

This plan synthesizes findings from:
1. **Code Review Report:** `plans/reports/code-review-260621-2154-full-codebase-after-pull-report.md` - Identified 3 critical + 6 important issues
2. **Authorization Patterns Research:** `plans/reports/auth-researcher-260621-2202-authorization-patterns-report.md` - Recommended Custom Claims + centralized hooks
3. **Firebase Security Research:** `plans/reports/security-researcher-260621-2202-firebase-security-hardening-report.md` - Attack vectors, hardening strategies, defense-in-depth
4. **Red Team Review:** `plans/reports/red-team-260621-2235-authorization-plan-adversarial-review-report.md` - Found 10 blocking vulnerabilities in original plan requiring Phase 0 fixes

## Role Hierarchy

**Standardized Permission Model:**
```
superadmin (level 100) - System owner, global access
    ↓
admin (level 80) - Workspace owner, full CRUD
    ↓
manager (level 60) - Settings write, tenant/invoice CRUD
    ↓
staff (level 40) - Room/invoice updates, no deletes
    ↓
viewer (level 20) - Read-only access
    ↓
tenant (level 10) - Own invoices/maintenance only
    ↓
guest (level 0) - Unauthenticated, browse vacant rooms
```

**Permission Matrix:** See `phase-02-foundation-setup.md` for detailed permission mappings.

## Post-Completion Next Steps

After all phases verified:
1. **Recommended:** Monitor for 2 weeks, then proceed with production rebuild plan
2. **Alternative:** Add additional security monitoring (anomaly detection, rate limiting)
3. **Optional:** Implement advanced features (2FA, session management, IP whitelisting)

## Notes

- **YAGNI strictly enforced** - No features beyond security fixes
- **Security first** - All auth code reviewed before proceeding to next phase
- **Defense-in-depth** - Multiple layers prevent single point of failure
- **Backwards compatible** - Can rollback instantly via feature flag
- **Well-documented** - Clear permission model, code comments, migration guides
