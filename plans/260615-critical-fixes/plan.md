---
title: "Week 1 Critical Fixes - Security & Quality Gates"
description: "Critical security patches, lint error fixes, and quality gates to make the codebase safe for production development. Based on comprehensive code review findings (June 2026)."
status: pending
priority: P1
branch: "main"
tags: [security, quality, critical, week-1]
blockedBy: []
blocks: []
created: "2026-06-15T04:54:00.900Z"
createdBy: "ck:plan"
source: skill
---

# Week 1 Critical Fixes - Security & Quality Gates

## Overview

This plan addresses **immediate production blockers** identified in the comprehensive code review (June 15, 2026). Scope limited to Week 1 critical fixes that prevent data loss and security vulnerabilities.

**Risk Level:** HIGH → MEDIUM (after completion)  
**Timeline:** 5-7 days (1 developer)  
**Dependencies:** None (standalone fixes)

### What This Plan Fixes

1. **CRITICAL:** xlsx library HIGH severity vulnerabilities (Prototype Pollution + ReDoS)
2. **CRITICAL:** 9 ESLint errors blocking CI/CD pipeline
3. **HIGH:** React Hooks violations causing cascading renders
4. **HIGH:** Missing error boundaries (crash protection)
5. **MEDIUM:** Dead code cleanup (6 unused variables)

### What This Plan Does NOT Include

- Backend implementation (Phase 2-3 work, 4-6 weeks)
- Real authentication (requires backend API)
- TypeScript migration (Phase 2 work)
- Comprehensive testing (Phase 3 work)
- PropTypes addition (Phase 2 work)
- Style extraction (Phase 2 work)

## Success Metrics

- [ ] `npm audit` shows 0 HIGH/CRITICAL vulnerabilities
- [ ] `npm run lint` exits with 0 errors (warnings OK)
- [ ] `npm run build` succeeds without warnings
- [ ] Error boundary catches and logs uncaught errors
- [ ] No console errors in browser after loading app
- [ ] All Phase 3 verification tests pass

## Phases

| Phase | Name | Effort | Status |
|-------|------|--------|--------|
| 1 | [Security Patch & Dependencies](./phase-01-security-patch-dependencies.md) | 2h | Pending |
| 2 | [Lint Errors & Code Quality](./phase-02-lint-errors-code-quality.md) | 4h | Pending |
| 3 | [Testing & Verification](./phase-03-testing-verification.md) | 2h | Pending |

**Total Effort:** ~8 hours (1 working day)

## Dependencies

**Blocked By:** None (standalone fixes)  
**Blocks:** All future development work (must fix before feature work)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| xlsx upgrade breaks Excel export | Medium | High | Test export/import after upgrade, rollback plan ready |
| Hook fixes cause new bugs | Low | Medium | Verify each component manually, add error boundary first |
| Build breaks in production | Low | High | Test build locally, verify Vercel build preview |

## Rollback Plan

If any phase causes production issues:

1. **Immediate:** `git revert <commit-hash>` for breaking commit
2. **Phase 1:** Downgrade xlsx: `npm install xlsx@0.18.5` (accept vulnerability temporarily)
3. **Phase 2:** Disable specific ESLint rules in `.eslintrc` (technical debt)
4. **Phase 3:** Skip verification, flag for Phase 2 follow-up

## Next Steps After Completion

After all 3 phases pass verification, user should choose:

1. **Recommended:** Continue with Phase 2 (PropTypes, style extraction, error handling) - ~2-3 weeks
2. **Alternative:** Start backend implementation planning (requires architecture review)
3. **Conservative:** Deploy current state, gather user feedback, prioritize next fixes

## Related Documentation

- Code Review Report: `plans/reports/codebase-scout-code-review-260615-1126-report.md`
- Development Rules: `~/.claude/rules/development-rules.md`
- ESLint Output: 10 problems (9 errors, 1 warning) as of 2026-06-15
