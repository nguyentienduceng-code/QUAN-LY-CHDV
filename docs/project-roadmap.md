# Project Roadmap

**Project:** QUAN-LY-CHDV Property Management System  
**Roadmap Version:** 1.0  
**Last Updated:** June 16, 2026  
**Timeline:** 10-12 weeks to production v1.0

---

## Overview

This roadmap outlines the complete transformation from localStorage-based MVP to production-ready multi-tenant SaaS platform. The rebuild is structured into 5 phases with clear deliverables and acceptance criteria.

**Strategic Goal:** Launch production-ready system with zero critical security vulnerabilities and support for 5-10 property management companies within 6 months.

---

## Phase 1: Backend Foundation (Weeks 1-3)

**Goal:** Establish secure, scalable API infrastructure with JWT authentication

### Week 1: Project Setup + Authentication

**Tasks:**
- [ ] Initialize Node.js backend project structure
- [ ] Configure PostgreSQL connection with pg library
- [ ] Set up environment variables (.env configuration)
- [ ] Create tenants and users tables
- [ ] Implement bcrypt password hashing (12 rounds)
- [ ] Build JWT token generation (access + refresh)
- [ ] Create auth endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/refresh
  - GET /api/auth/me
  - POST /api/auth/logout
  - PUT /api/auth/password

**Deliverables:**
- Working authentication system
- Manager can register and login
- JWT tokens generated and validated
- Refresh token rotation implemented

**Acceptance Criteria:**
- Access token expires after 15 minutes
- Refresh token valid for 7 days
- Passwords hashed with bcrypt (salt rounds: 12)
- Postman collection with 6 auth endpoints tested

**Effort:** 5 days (1 developer)

---

### Week 2: Database Schema + Migrations

**Tasks:**
- [ ] Design complete PostgreSQL schema (14 tables)
- [ ] Create migration scripts:
  - 001_create_tenants_users.sql
  - 002_create_buildings_rooms.sql
  - 003_create_contracts.sql
  - 004_create_invoices_items.sql
  - 005_create_maintenance_tickets.sql
  - 006_create_settings.sql
  - 007_create_refresh_tokens.sql
  - 008_create_audit_logs.sql
  - 009_create_files_notifications.sql
  - 010_create_meter_readings.sql
- [ ] Add indexes for performance:
  - (tenant_id, entity_id) composite indexes
  - Foreign key indexes
  - Status column indexes for filtering
- [ ] Implement updated_at triggers
- [ ] Create seed data script for testing

**Deliverables:**
- Complete database schema deployed
- 14 tables with relationships
- 20+ indexes for query optimization
- Seed data script with 3 sample buildings

**Acceptance Criteria:**
- All foreign key constraints working
- ON DELETE CASCADE verified
- Indexes created on tenant_id for all tables
- Seed script populates 50 sample rooms

**Effort:** 5 days (1 developer)

---

### Week 3: Core API Endpoints - Part 1

**Tasks:**
- [ ] Implement tenant isolation middleware
- [ ] Create buildings CRUD endpoints:
  - GET /api/buildings (list with filters)
  - POST /api/buildings (create)
  - GET /api/buildings/:id (details)
  - PUT /api/buildings/:id (update)
  - DELETE /api/buildings/:id (soft delete)
- [ ] Create rooms CRUD endpoints:
  - GET /api/rooms?building_id=&status= (list with filters)
  - POST /api/rooms (create)
  - GET /api/rooms/:id (details)
  - PUT /api/rooms/:id (update)
  - DELETE /api/rooms/:id (cascade to contracts)
- [ ] Add input validation with Zod:
  - Building schema
  - Room schema
- [ ] Implement error handling middleware
- [ ] Add request logging (Winston)

**Deliverables:**
- Buildings API fully functional
- Rooms API fully functional
- Input validation on all endpoints
- Tenant isolation verified (cannot access other tenants' data)

**Acceptance Criteria:**
- GET /api/rooms returns only authenticated tenant's rooms
- Invalid input returns 400 with clear error messages
- All responses follow consistent JSON format
- Rate limiting: 100 requests per 15 minutes per IP

**Effort:** 5 days (1 developer)

---

## Phase 2: API Development (Weeks 4-6)

**Goal:** Complete REST API for all entities with advanced features

### Week 4: Contracts + Invoices APIs

**Tasks:**
- [ ] Create contracts CRUD endpoints:
  - GET /api/contracts?status=&room_id= (list with filters)
  - POST /api/contracts (create, auto-update room status)
  - GET /api/contracts/:id (details)
  - PUT /api/contracts/:id (update)
  - DELETE /api/contracts/:id
  - GET /api/contracts/expiring?days=30 (alert endpoint)
- [ ] Create invoices CRUD endpoints:
  - GET /api/invoices?status=&month=&year= (list with filters)
  - POST /api/invoices (create single invoice)
  - GET /api/invoices/:id (details)
  - PUT /api/invoices/:id (update)
  - DELETE /api/invoices/:id
  - PUT /api/invoices/:id/status (mark as paid)
- [ ] Implement invoice calculation logic:
  - Electricity: (current - previous) × price
  - Water: (current - previous) × price
  - Total = rent + electricity + water + service_fee - discount
- [ ] Create invoice_items nested routes

**Deliverables:**
- Contracts API functional
- Invoices API functional
- Business logic for invoice calculations
- Contract expiry alerts working

**Acceptance Criteria:**
- Creating contract auto-marks room as "occupied"
- Invoice total calculated correctly
- Cannot create overlapping contracts for same room
- Soft delete preserves paid invoice data

**Effort:** 5 days (1 developer)

---

### Week 5: Advanced Features

**Tasks:**
- [ ] Create maintenance tickets CRUD:
  - GET /api/tickets?status= (list by status)
  - POST /api/tickets (create)
  - GET /api/tickets/:id (details)
  - PUT /api/tickets/:id (update)
  - DELETE /api/tickets/:id
  - PUT /api/tickets/:id/move (change status/column)
- [ ] Create settings endpoints:
  - GET /api/settings?building_id= (per-building config)
  - PUT /api/settings/:id (update pricing)
- [ ] Create dashboard stats endpoint:
  - GET /api/dashboard/stats
  - Return: revenue, expenses, profit, occupancy, alerts
- [ ] Implement batch invoice generation:
  - POST /api/invoices/batch
  - Generate invoices for all occupied rooms
- [ ] Add search and filtering:
  - Query params: ?search=&sort=&order=&limit=&offset=

**Deliverables:**
- Maintenance tickets Kanban API
- Settings configuration API
- Dashboard aggregation endpoint
- Batch invoice generation (1-click)

**Acceptance Criteria:**
- Dashboard returns data in <200ms
- Batch generation creates invoices for 50+ rooms in <5 seconds
- Search works across room numbers and tenant names
- Pagination returns max 50 items per page

**Effort:** 5 days (1 developer)

---

### Week 6: File Upload + Excel Export

**Tasks:**
- [ ] Implement room image upload:
  - POST /api/rooms/:id/image
  - Use multer for file handling
  - Use sharp for image resizing (800x600)
  - Store in /uploads or S3-compatible storage
  - Validate: JPG/PNG only, max 5MB
- [ ] Create Excel export endpoint:
  - GET /api/export/excel
  - Use exceljs library
  - Generate workbook with 7 sheets:
    1. Buildings summary
    2. Rooms inventory
    3. Tenant list
    4. Active contracts
    5. Invoice history
    6. Maintenance log
    7. Financial summary
  - Stream file download (no memory buffering)
- [ ] Add file metadata tracking (files table)
- [ ] Implement file cleanup (delete old uploads)

**Deliverables:**
- Room image upload functional
- Excel export generates complete workbook
- File storage organized by tenant_id
- Image thumbnails generated

**Acceptance Criteria:**
- Upload handles multipart/form-data correctly
- Images resized to max 800x600 (preserve aspect ratio)
- Excel file downloads with correct MIME type
- Export includes all current tenant data (multi-tenant safe)

**Effort:** 5 days (1 developer)

---

## Phase 3: Frontend Migration (Weeks 7-8)

**Goal:** Replace localStorage with API integration

### Week 7: API Integration Layer

**Tasks:**
- [ ] Create API service layer (src/services/api.js):
  - Configure axios with base URL
  - Add JWT token interceptor
  - Add response/error interceptors
  - Implement auto-retry on 401 (token refresh)
- [ ] Replace AppDataContext methods:
  - addRoom → apiService.createRoom()
  - updateRoom → apiService.updateRoom()
  - deleteRoom → apiService.deleteRoom()
  - (Repeat for all entities: tenants, contracts, invoices, tickets)
- [ ] Implement optimistic UI updates:
  - Show change immediately
  - Revert if API call fails
- [ ] Add loading states:
  - isLoading flag per entity
  - Skeleton loaders for tables
  - Spinner for buttons during save
- [ ] Add error handling:
  - Display error toasts (react-hot-toast)
  - Show retry button on failure
  - Log errors to console (dev mode)

**Deliverables:**
- API service layer fully functional
- All CRUD operations use API instead of localStorage
- Loading states on all actions
- Error handling with user-friendly messages

**Acceptance Criteria:**
- Creating room shows loading spinner → success toast
- Network error shows retry button
- Token refresh happens automatically on 401
- No localStorage writes except JWT token

**Effort:** 5 days (1 developer)

---

### Week 8: Auth Flow Migration

**Tasks:**
- [ ] Replace AuthContext with API-based auth:
  - Remove Firebase SDK
  - Login → POST /api/auth/login
  - Register → POST /api/auth/register (if applicable)
  - Logout → POST /api/auth/logout
  - Store JWT in memory (React state) or localStorage
- [ ] Implement protected routes:
  - Redirect to /login if no token
  - Auto-refresh token on app load
  - Handle expired tokens gracefully
- [ ] Update Header component:
  - Fetch user profile from /api/auth/me
  - Display user name and role
- [ ] Fix tenant room assignment:
  - Fetch from users.assigned_room_id
  - Remove hardcoded 'P.101' references
- [ ] Update role-based UI:
  - Hide "Settings" for residents
  - Show only assigned room invoices for residents
- [ ] Remove demo data wipe functionality

**Deliverables:**
- Login/logout working with backend API
- Firebase completely removed
- Role-based UI rendering correctly
- Tenant portal shows only assigned room data

**Acceptance Criteria:**
- User can login with email/password
- JWT token stored securely (httpOnly cookie or memory)
- Logout clears token and redirects to /login
- Tenant users cannot access management features

**Effort:** 5 days (1 developer)

---

## Phase 4: Security Hardening (Week 9)

**Goal:** Fix all critical and high security vulnerabilities

### Week 9: Security Audit Fixes

**Tasks:**
- [ ] Remove Firebase credentials from source code
- [ ] Remove hardcoded passwords from Login.jsx
- [ ] Implement server-side RBAC:
  - Middleware checks user.role on protected routes
  - Tenants can only access their own invoices/tickets
  - Managers can access all data for their tenant_id
- [ ] Add input sanitization:
  - HTML escaping to prevent XSS
  - SQL parameterization (already done with pg)
  - File upload validation (magic bytes check)
- [ ] Implement CSRF protection:
  - Add csurf middleware
  - Include CSRF token in forms
- [ ] Add rate limiting:
  - express-rate-limit on /api/auth/* (3 req/s)
  - General API rate limit (100 req/15min per IP)
- [ ] Configure Helmet.js:
  - HSTS, CSP, X-Frame-Options
  - Remove X-Powered-By header
- [ ] Enable HTTPS:
  - Generate Let's Encrypt SSL certificate
  - Configure Nginx for HTTPS redirect
  - Set secure cookie flags
- [ ] Implement audit logging:
  - Log all CRUD operations to audit_logs table
  - Include user_id, action, entity, changes

**Deliverables:**
- All 6 critical security issues fixed
- All 8 high security issues fixed
- HTTPS enabled with valid SSL certificate
- Audit logs tracking all sensitive operations

**Acceptance Criteria:**
- No hardcoded credentials in source code
- Pass OWASP Top 10 security checklist
- Rate limiting prevents brute force attacks
- CSRF tokens validated on state-changing requests
- Audit log entries created for create/update/delete operations

**Effort:** 5 days (1 developer)

---

## Phase 5: Testing & Deployment (Weeks 10-12)

**Goal:** Production deployment with monitoring and backups

### Week 10: Testing Infrastructure

**Tasks:**
- [ ] Backend unit tests (Jest):
  - Auth endpoints (login, register, token refresh)
  - CRUD endpoints (rooms, invoices, contracts)
  - Middleware (auth, tenant isolation, error handling)
  - Utility functions (invoice calculation, date formatting)
  - Target: 70% code coverage
- [ ] Backend integration tests (Supertest):
  - Full API workflows (create room → contract → invoice)
  - Multi-tenant isolation tests
  - Error handling edge cases
- [ ] Frontend tests (Vitest + React Testing Library):
  - Component rendering tests
  - User interaction tests (form submission)
  - API integration mocks
  - Target: 60% code coverage
- [ ] Manual testing checklist:
  - User flows (manager and tenant personas)
  - Cross-browser compatibility
  - Mobile responsiveness
  - Edge cases (expired contracts, overdue invoices)

**Deliverables:**
- 100+ automated tests passing
- Test coverage reports generated
- Manual testing checklist completed
- Bug tracker with priority labels

**Acceptance Criteria:**
- All tests pass: `npm test`
- Code coverage ≥70% backend, ≥60% frontend
- Zero critical bugs in manual testing
- Test suite runs in CI pipeline

**Effort:** 5 days (1 developer)

---

### Week 11: Docker + CI/CD

**Tasks:**
- [ ] Create production Dockerfiles:
  - frontend/Dockerfile (multi-stage: build + nginx)
  - backend/Dockerfile (Node.js production image)
- [ ] Create docker-compose.yml:
  - postgres service (with volume)
  - backend service (depends on postgres)
  - frontend service (depends on backend)
  - nginx service (reverse proxy)
- [ ] Write nginx.conf:
  - Reverse proxy rules (/api → backend:5000)
  - Static file serving (frontend)
  - SSL/TLS configuration
  - Rate limiting, caching, gzip
- [ ] Set up GitHub Actions CI/CD:
  - Run tests on every commit
  - Build Docker images
  - Push to GitHub Container Registry
  - Deploy to staging on develop branch
  - Deploy to production on main branch
- [ ] Create deployment scripts:
  - deploy.sh (SSH to server, docker-compose pull/up)
  - rollback.sh (revert to previous image)

**Deliverables:**
- Docker images for all services
- docker-compose.yml for production
- Nginx reverse proxy configured
- CI/CD pipeline functional

**Acceptance Criteria:**
- `docker-compose up` starts all services
- Nginx routes /api to backend, / to frontend
- CI runs tests and builds images on push
- Zero-downtime deployment via blue-green strategy

**Effort:** 5 days (1 developer)

---

### Week 12: Production Deployment + Monitoring

**Tasks:**
- [ ] Provision production VPS:
  - 4GB RAM, 2 vCPU, 80GB SSD
  - Install Docker + Docker Compose
  - Configure firewall (ports 22, 80, 443 only)
  - Disable root SSH, use key-based auth
- [ ] Deploy to production:
  - Clone repository
  - Set environment variables (.env.production)
  - Run docker-compose up -d
  - Generate SSL certificate (certbot)
  - Configure Cloudflare DNS
- [ ] Set up monitoring:
  - Docker health checks
  - Uptime monitoring (UptimeRobot)
  - Error tracking (Sentry or self-hosted)
  - Log aggregation (optional: Loki)
- [ ] Configure backups:
  - Daily pg_dump at 2 AM (cron job)
  - Store backups in S3 or Cloudflare R2
  - Retention: 30 days daily, 12 months monthly
  - Test restore procedure
- [ ] Performance testing:
  - Load test with k6 (50 concurrent users)
  - Identify slow queries (PostgreSQL slow query log)
  - Optimize with indexes or caching
- [ ] Create operations runbook:
  - Deployment procedure
  - Rollback procedure
  - Backup/restore procedure
  - Common troubleshooting

**Deliverables:**
- Production system live on custom domain
- HTTPS enabled via Cloudflare
- Monitoring and alerting configured
- Daily backups automated
- Operations runbook documented

**Acceptance Criteria:**
- System accessible at https://yourdomain.com
- API response time <500ms for 95th percentile
- Load test passed: 50 users, 100 req/s
- Backup script runs successfully
- Rollback tested and documented

**Effort:** 5 days (1 developer)

---

## Post-Launch Roadmap (Months 4-12)

### Version 1.1 (Month 4)

**Features:**
- Real-time notifications (WebSockets with Socket.io)
- Email notifications (SendGrid or SMTP)
- Zalo ZNS integration (official business messaging API)
- Advanced search (PostgreSQL full-text search with tsvector)
- Bulk operations (delete multiple rooms, batch invoice updates)

**Effort:** 3 weeks (1 developer)

---

### Version 1.2 (Month 5)

**Features:**
- Mobile app (React Native, reuses backend API)
- Multi-language support (i18next: Vietnamese + English)
- Custom invoice templates (PDF generation with pdfkit)
- Automated invoice generation (node-cron: 1st of each month)
- Revenue forecasting (analytics dashboard improvements)

**Effort:** 4 weeks (1 frontend + 1 backend developer)

---

### Version 2.0 (Months 6-12)

**Features:**
- Sub-user management (multiple managers per tenant)
- Role-based permissions (admin, manager, accountant, maintenance)
- White-label support (custom branding: logo, colors, domain)
- Public tenant portal (QR code login for residents)
- Payment gateway integration:
  - VNPay (Vietnamese e-wallet)
  - Momo (popular mobile wallet)
  - ZaloPay
- API webhooks (third-party integrations)
- Reporting engine (custom reports with filters)
- Mobile-first redesign

**Effort:** 6 months (team of 3-4 developers)

---

## Risk Management

### High Priority Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Data loss during migration | Critical | Export localStorage to JSON, test on staging, rollback plan | Backend Dev |
| Performance slower than localStorage | High | Redis cache, PostgreSQL indexes, load testing | Backend Dev |
| Security vulnerabilities in production | Critical | Phase 4 audit, penetration testing, bug bounty | Security Lead |
| Scope creep delays launch | High | Strict YAGNI enforcement, defer features to v1.1 | PM |
| Single point of failure (one dev) | Medium | Documentation, code reviews, knowledge sharing | Team Lead |

### Medium Priority Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| User resistance to new auth | Medium | Keep UI identical, gradual rollout | UX Designer |
| Infrastructure downtime | Medium | Health checks, monitoring, 24/7 alerts | DevOps |
| Database scaling issues | Low | Pagination, indexes, future: read replicas | Backend Dev |

---

## Success Metrics

### Technical Metrics

- **API Performance:** 95th percentile <500ms
- **Uptime:** 99.5% (max 3.6 hours downtime/month)
- **Test Coverage:** ≥70% backend, ≥60% frontend
- **Security Audit:** 0 critical, 0 high vulnerabilities
- **Load Capacity:** 50 concurrent users, 100 req/s

### Business Metrics

- **User Adoption:** 10+ property management companies in 6 months
- **Time Savings:** 80% reduction in invoice creation time
- **Payment Speed:** 30% fewer overdue invoices (via VietQR)
- **Customer Satisfaction:** 4.5/5 stars average rating
- **Churn Rate:** <10% monthly churn

---

## Timeline Summary

| Phase | Duration | Effort (dev-weeks) | Key Milestone |
|-------|----------|---------------------|---------------|
| Phase 1: Backend Foundation | 3 weeks | 3 | JWT auth working |
| Phase 2: API Development | 3 weeks | 3 | All CRUD APIs complete |
| Phase 3: Frontend Migration | 2 weeks | 2 | localStorage removed |
| Phase 4: Security Hardening | 1 week | 1 | All issues fixed |
| Phase 5: Testing & Deployment | 3 weeks | 3 | Production live |
| **Total** | **12 weeks** | **12** | **v1.0 Launch** |

**Buffer:** 2 weeks included for unknowns  
**Team Size:** 1-2 developers (full-stack or specialized)

---

## Milestones

### M1: Backend MVP (End of Week 3)
- Authentication working
- Database schema deployed
- Buildings + Rooms APIs functional

### M2: API Complete (End of Week 6)
- All CRUD endpoints implemented
- File upload working
- Excel export functional

### M3: Frontend Integrated (End of Week 8)
- localStorage removed
- All features work with API
- Auth flow migrated

### M4: Security Hardened (End of Week 9)
- All critical issues fixed
- HTTPS enabled
- Audit logging implemented

### M5: Production Launch (End of Week 12)
- Deployed to production
- Monitoring configured
- Backups automated
- **🚀 LAUNCH v1.0**

---

## Dependencies

**External Dependencies:**
- VPS provider (DigitalOcean, Vultr, or Hetzner)
- Domain name (Namecheap or GoDaddy)
- Cloudflare account (free tier)
- SSL certificate (Let's Encrypt - free)

**Internal Dependencies:**
- All 5 phases must complete sequentially (no parallel work)
- Phase 3 depends on Phase 2 API completion
- Production deployment depends on security hardening (Phase 4)

---

## Related Documents

- `docs/project-overview-pdr.md` - Product requirements
- `docs/system-architecture.md` - Technical architecture
- `docs/deployment-guide.md` - Docker deployment instructions
- `plans/260616-2330-production-rebuild/plan.md` - Executable implementation plan

---

**Roadmap Owner:** Product Manager  
**Last Reviewed:** June 16, 2026  
**Next Review:** End of Phase 1 (Week 3)  
**Approval Status:** Approved for execution
