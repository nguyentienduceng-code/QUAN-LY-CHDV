---
title: "Production Architecture Rebuild - Multi-Tenant SaaS Backend"
description: "Complete rebuild from localStorage to production-ready Node.js + Express + PostgreSQL backend with Docker deployment. Addresses all 6 critical + 8 high security issues."
status: pending
priority: P1
branch: "main"
tags: [production, backend, security, docker, multi-tenant]
blockedBy: []
blocks: []
created: "2026-06-16T16:30:17.071Z"
createdBy: "ck:plan"
source: skill
---

# Production Architecture Rebuild - Multi-Tenant SaaS Backend

## Overview

Complete production rebuild of QUAN-LY-CHDV property management system from localStorage-based React app to production-ready multi-tenant SaaS with:
- **Backend:** Node.js 20 + Express 5 + PostgreSQL 16
- **Frontend:** React 19 + Vite 8 (existing, migrated to API)
- **Auth:** Custom JWT + bcrypt (no third-party dependencies)
- **Deployment:** Docker Compose + Nginx reverse proxy
- **Multi-tenancy:** Shared database with tenant_id column isolation

**Timeline:** 10-12 weeks (1-2 developers)  
**Risk Level:** HIGH → MEDIUM (after security hardening)  
**Scale Target:** 5-10 buildings, 50-200 rooms, 5+ managers per tenant

## Problem Statement

**Current State:**
- localStorage-only data persistence (no backend)
- 6 CRITICAL security vulnerabilities
- 8 HIGH severity issues
- Hardcoded credentials and Firebase dependencies
- No authentication system
- No multi-tenant isolation
- Not production-deployable

**Target State:**
- Production-ready REST API backend
- PostgreSQL with proper relational schema
- JWT authentication with refresh tokens
- Multi-tenant with tenant_id isolation
- Docker deployment with SSL/TLS
- All security issues resolved
- CI/CD pipeline functional

## Architecture Decision

**Selected Approach:** Monorepo with Separate Services (Approach 1 from brainstorm)

**Rationale:**
- Meets all requirements (custom JWT, Docker, multi-tenant, scalable)
- Industry-standard pattern (90% of SaaS products)
- Clean API contract enables future mobile app
- Frontend and backend can scale independently
- Team can work in parallel on different layers

```
quan-ly-chdv/
├── frontend/           # React + Vite (existing code migrated)
├── backend/            # Node.js + Express (new)
├── database/           # PostgreSQL migrations
├── docker-compose.yml
└── nginx/             # Reverse proxy config
```

## Phases

| Phase | Name | Effort | Status | Dependencies |
|-------|------|--------|--------|--------------|
| 1 | [Backend Foundation](./phase-01-backend-foundation.md) | 3 weeks | Pending | None |
| 2 | [API Development](./phase-02-api-development.md) | 3 weeks | Pending | Phase 1 |
| 3 | [Frontend Migration](./phase-03-frontend-migration.md) | 2 weeks | Pending | Phase 2 |
| 4 | [Security Hardening](./phase-04-security-hardening.md) | 1 week | Pending | Phase 3 |
| 5 | [Testing and Deployment](./phase-05-testing-and-deployment.md) | 2 weeks | Pending | Phase 4 |

**Total Effort:** 10-12 weeks

## Success Metrics

**Security (Must-Have):**
- [ ] All 6 CRITICAL issues resolved (Firebase creds, hardcoded passwords, RBAC, tenant isolation)
- [ ] All 8 HIGH issues resolved (session validation, UUID IDs, cascade deletes, input validation)
- [ ] OWASP Top 10 compliance verified
- [ ] Security audit passed with 0 critical/high findings

**Functionality (Must-Have):**
- [ ] Backend API deployed with JWT auth
- [ ] All localStorage data migrated to PostgreSQL
- [ ] Frontend integrated with backend (no localStorage)
- [ ] Multi-tenant isolation verified (users can't see other tenants' data)
- [ ] Docker deployment on production server with HTTPS

**Performance (Nice-to-Have):**
- [ ] API response time <500ms for 95th percentile
- [ ] 50 concurrent users load test passed
- [ ] Database queries optimized with proper indexes
- [ ] Daily automated backups configured

## Dependencies

**Blocked By:** 
- None (critical fixes plan can run in parallel, focuses on lint errors only)

**Blocks:** 
- All future feature development (must complete before adding features)
- Mobile app development (requires stable API)

**Related Plans:**
- `260615-critical-fixes` - Can run in parallel, focuses on immediate lint/vulnerability fixes

## Technology Stack

### Backend (New)
```json
{
  "express": "^5.0.0",
  "pg": "^8.11.0",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.22.0",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0",
  "exceljs": "^4.4.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

### Frontend (Keep Existing)
```json
{
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "react-router-dom": "latest",
  "recharts": "^3.8.1",
  "axios": "^1.6.5"
}
```

### Infrastructure
- **Database:** PostgreSQL 16
- **Deployment:** Docker 24 + Docker Compose
- **Web Server:** Nginx 1.25
- **CI/CD:** GitHub Actions

## Database Schema Overview

**14 Core Tables:**
1. `tenants` - SaaS customers (building owners)
2. `users` - Managers and residents
3. `buildings` - Property buildings
4. `rooms` - Individual rental units
5. `contracts` - Lease agreements
6. `invoices` - Billing records
7. `invoice_items` - Line items for invoices
8. `maintenance_tickets` - Repair requests
9. `settings` - Per-tenant pricing configuration
10. `refresh_tokens` - JWT refresh token storage
11. `audit_logs` - All CRUD operations logged
12. `files` - Uploaded documents/images
13. `notifications` - System notifications
14. `meter_readings` - Utility meter history

**Multi-Tenancy Pattern:** All tables include `tenant_id UUID` foreign key with composite indexes for performance.

## API Endpoint Overview

**Authentication (6 endpoints):**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/auth/me
- POST /api/auth/logout
- PUT /api/auth/password

**Core Resources (30+ endpoints):**
- Buildings: GET, POST, PUT, DELETE /api/buildings
- Rooms: GET, POST, PUT, DELETE /api/rooms + image upload
- Contracts: GET, POST, PUT, DELETE /api/contracts
- Invoices: GET, POST, PUT, DELETE /api/invoices + batch generation
- Maintenance: GET, POST, PUT, DELETE /api/tickets
- Settings: GET, PUT /api/settings
- Dashboard: GET /api/dashboard/stats
- Export: GET /api/export/excel

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration loses data | Critical | Medium | Export localStorage to Excel before migration, test on staging first |
| JWT token stolen | High | Low | Short 15min expiry, httpOnly cookies, HTTPS only, refresh token rotation |
| API performance issues | Medium | Medium | Database indexes on tenant_id, pagination (50/page), Redis cache for hot data |
| Downtime during deployment | Medium | Low | Blue-green deployment, health checks, rollback plan ready |
| Team unfamiliar with Express | Low | High | Code review after Phase 1, comprehensive documentation |
| Scope creep (adding features) | Medium | High | Strict adherence to YAGNI principle, defer all non-critical features |

## Deployment Architecture

```
User Browser
    ↓ HTTPS (443)
Cloudflare CDN
    ↓
Nginx Reverse Proxy (Docker)
    ├─→ Frontend (React + Vite) :80
    └─→ Backend (Express) :5000
         ↓
    PostgreSQL :5432
```

**Infrastructure Cost:**
- VPS (4GB RAM, 2 CPU): $20-40/month
- Cloudflare: $0 (Free plan)
- Backups (S3/R2): $5-10/month
- **Total:** ~$30-50/month per deployment

## Rollback Plan

**Phase 1-2 (Backend Development):**
- No rollback needed (frontend still works with localStorage)
- Can abandon backend and restart if architecture wrong

**Phase 3 (Frontend Migration):**
- Keep localStorage code in separate branch
- Git revert if API integration breaks
- Feature flag to toggle between localStorage/API

**Phase 4-5 (Security + Deployment):**
- Blue-green deployment allows instant rollback
- Database backup before any migration
- Docker Compose down/up to previous images

## Post-Launch Roadmap

**Version 1.1 (Month 4):**
- Real-time notifications (WebSockets)
- Email notifications for overdue invoices
- Zalo ZNS integration
- Advanced search (full-text search)

**Version 1.2 (Month 5):**
- Mobile app (React Native)
- Multi-language support (Vietnamese + English)
- Custom invoice templates
- Automated invoice generation (cron job)

**Version 2.0 (Month 6-12):**
- Sub-user management (multiple managers per tenant)
- Role-based permissions (admin, manager, accountant)
- White-label support (custom branding)
- Payment gateway integration (VNPay, Momo)

## Research Reports

This plan synthesizes findings from:
1. `brainstormer-260616-2314-docker-deployment-research-report.md` - Docker architecture, Nginx config, migration strategy
2. Backend architecture research (Node.js patterns, PostgreSQL multi-tenancy, JWT best practices)
3. `brainstorm-260616-1942-production-architecture-report.md` - Original architecture brainstorming with 3 approaches
4. `codebase-scout-260615-report.md` - Security vulnerabilities and code quality issues

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Run red team review:** `/ck:plan red-team /Users/dominhxuan/Desktop/QUAN-LY-CHDV/plans/260616-2330-production-rebuild/plan.md`
3. **Start Phase 1:** Backend foundation (3 weeks)
4. **Set up development environment:** Docker, PostgreSQL, Node.js

## Notes

- **YAGNI strictly enforced** - No features beyond MVP requirements
- **Security first** - All auth/tenant isolation code reviewed before proceeding
- **No premature optimization** - Add Redis cache only if performance issues found
- **Test on staging** - All phases deployed to staging before production
