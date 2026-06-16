# Project Overview - Product Development Requirements

**Project Name:** QUAN-LY-CHDV (Property Management System)  
**Document Type:** Product Development Requirements (PDR)  
**Version:** 1.0  
**Last Updated:** June 16, 2026  
**Status:** Active Development - Production Rebuild Phase

---

## Executive Summary

QUAN-LY-CHDV is a comprehensive property management SaaS platform designed for Vietnamese building owners and property managers to streamline operations across multiple rental properties. The system manages the entire rental lifecycle from room availability to contract management, billing, and maintenance.

**Current State:** MVP with localStorage-based persistence (~4,900 LOC React app)  
**Target State:** Production SaaS with Node.js backend, PostgreSQL database, and Docker deployment  
**Timeline:** 10-12 week rebuild to production-ready system

---

## Vision and Goals

### Vision Statement

To become the leading property management platform for small to medium-sized rental businesses in Vietnam, enabling efficient operations through automated billing, tenant communication, and data-driven insights.

### Business Goals

1. **Operational Efficiency** - Reduce manual invoice creation time by 80% through automation
2. **Financial Transparency** - Provide real-time revenue, expense, and profit visibility
3. **Tenant Satisfaction** - Enable self-service portal for invoice viewing and maintenance requests
4. **Scalability** - Support property managers with 5-10 buildings, 50-200 rooms per tenant
5. **Data Security** - Ensure tenant isolation and GDPR-compliant data handling

### Success Metrics

- **User Adoption:** 10+ property management companies using the platform within 6 months
- **Time Savings:** 5+ hours per week saved on invoice generation per manager
- **Payment Speed:** 30% reduction in overdue invoices through VietQR instant payment
- **System Reliability:** 99.5% uptime, <500ms API response time for 95th percentile
- **Security:** Zero data breaches, pass OWASP Top 10 security audit

---

## Target Users

### Primary User: Property Manager

**Profile:**
- Age: 30-50 years old
- Role: Building owner or hired property manager
- Tech Literacy: Medium (comfortable with smartphones, basic software)
- Pain Points:
  - Manual invoice creation for 50+ rooms is time-consuming
  - Tracking meter readings (electricity, water) across multiple buildings
  - Following up on overdue payments
  - Coordinating maintenance requests
  - Excel spreadsheets become unmanageable at scale

**User Stories:**
- "As a property manager, I want to generate all monthly invoices with one click so I can save 5 hours per month"
- "As a manager, I want to see which contracts are expiring soon so I can renew them proactively"
- "As a manager, I want to track maintenance costs per building to optimize my budget"
- "As a manager, I want to export financial data to Excel for my accountant"

### Secondary User: Tenant (Resident)

**Profile:**
- Age: 20-40 years old
- Role: Room renter
- Tech Literacy: High (smartphone native, uses banking apps daily)
- Pain Points:
  - Receiving paper invoices is inconvenient
  - Unclear billing breakdown (electricity, water, service fees)
  - No way to track payment history
  - Difficulty reporting maintenance issues

**User Stories:**
- "As a tenant, I want to view my invoices on my phone so I don't lose paper receipts"
- "As a tenant, I want to pay via QR code so I can complete payment in 30 seconds"
- "As a tenant, I want to report maintenance issues with photos so the landlord understands the problem"
- "As a tenant, I want to see my payment history to confirm I paid on time"

---

## Core Features

### 1. Building & Room Management

**Functionality:**
- Create multiple buildings (A, B, C) with custom floor counts
- Define rooms with number, floor, area (m²), status (vacant, occupied, maintenance)
- Upload room images for marketing
- Track room occupancy rate per building

**Business Rules:**
- Room numbers must be unique within a building
- Only vacant rooms can be assigned to new tenants
- Room status auto-updates when contract is created (vacant → occupied)

**Priority:** HIGH (Foundation for all other features)

### 2. Tenant & Contract Management

**Functionality:**
- Create tenant profiles with personal info (name, ID, phone, email, emergency contact)
- Generate lease contracts with start/end dates, deposit, monthly rent
- Auto-alert for contracts expiring within 30 days
- Assign tenant to specific room
- Track move-in/move-out dates

**Business Rules:**
- One active contract per room (no overlapping dates)
- Contract end date must be after start date
- Deposit amount typically equals 1-2 months rent
- Contract auto-expires when end date passes

**Priority:** HIGH (Required for invoicing)

### 3. Invoice Generation & Billing

**Functionality:**
- Manual invoice creation with line items (rent, electricity, water, service fee)
- Batch invoice generation for all occupied rooms in one click
- Meter reading input (old index → new index) with auto-calculation
- Invoice status tracking (unpaid, partial, paid, overdue)
- Generate VietQR code for instant bank transfer payment
- Email/Zalo notification for new invoices (future)

**Business Rules:**
- Invoice due date is typically 5th of each month
- Electricity/water calculated as: (current - previous) × unit price
- Total = Rent + Electricity + Water + Service Fee - Discount
- Invoice marked "overdue" if unpaid 3 days after due date
- Cannot delete paid invoices (data integrity)

**Priority:** CRITICAL (Core revenue-generating feature)

### 4. Maintenance Request Tracking

**Functionality:**
- Tenants report issues via form (title, description, category, photo)
- Kanban board with 3 columns: Reported, In Progress, Resolved
- Drag-and-drop to move tickets between statuses
- Track repair cost per ticket
- Assign tickets to maintenance staff (future)

**Business Rules:**
- Only managers can move tickets to "Resolved"
- Tenants can only report issues for their assigned room
- Resolved tickets are read-only (cannot edit)
- Total maintenance cost aggregated in financial dashboard

**Priority:** MEDIUM (Quality of life improvement)

### 5. Financial Dashboard & Analytics

**Functionality:**
- Real-time revenue calculation (sum of paid invoices)
- Expense tracking (base rent to landlord, utilities, maintenance)
- Profit calculation (revenue - expenses)
- Monthly revenue trend chart (Recharts line graph)
- Occupancy rate per building
- Expiring contracts alert
- Overdue invoices count

**Business Rules:**
- Revenue only counts "paid" invoices
- Expenses include: base rent, base utility costs, maintenance repairs
- Profit margin = (Revenue - Expenses) / Revenue × 100%
- Dashboard updates in real-time as invoices are paid

**Priority:** HIGH (Business decision-making)

### 6. Settings & Configuration

**Functionality:**
- Per-building pricing configuration:
  - Base rent paid to landlord (monthly)
  - Base utility prices (what manager pays)
  - Collection prices (what tenants pay) - markup for profit
  - Service fee (cleaning, security, internet)
- Bank account details for VietQR payment
- Manager profile settings

**Business Rules:**
- Collection price must be ≥ base price (prevent loss)
- Typical markup: Electricity 3,500 VND/kWh (base 2,500), Water 100,000 VND/m³ (base 50,000)
- Bank details encrypted in database (production only)

**Priority:** MEDIUM (Required for invoice calculation)

### 7. Excel Export

**Functionality:**
- Export all data to Excel workbook with multiple sheets:
  - Buildings summary
  - Rooms inventory
  - Tenant list
  - Active contracts
  - Invoice history
  - Maintenance log
- Formatted with headers, borders, auto-width columns

**Business Rules:**
- Export includes all data for current tenant (multi-tenant isolation)
- File naming: `RentFlow_Export_YYYYMMDD_HHMMSS.xlsx`
- Maximum 10,000 rows per sheet (pagination for larger datasets)

**Priority:** MEDIUM (Accountant integration)

---

## Current State Analysis

### Strengths
✅ **Feature Complete:** All core workflows implemented (MVP proven)  
✅ **Modern UI:** React 19 with responsive design (mobile-friendly)  
✅ **User Tested:** 2+ months of internal usage with real data  
✅ **Performance:** Instant load time (localStorage, no network latency)  
✅ **Vietnamese Localized:** UI text, currency (VND), date formats

### Critical Limitations
❌ **No Backend:** localStorage only, data lost on browser clear  
❌ **No Multi-Tenancy:** Single-user system (cannot scale to SaaS)  
❌ **Security Flaws:** 6 critical + 8 high severity issues (see scout report)  
❌ **No Collaboration:** One manager per browser, no team access  
❌ **No Backup:** Data loss risk if browser crashes  
❌ **Firebase Dependency:** Unused auth system with exposed credentials

### Technical Debt
- Hardcoded passwords in Login component
- Client-side role checking (can be bypassed in dev tools)
- No input validation (XSS and SQL injection risks)
- No rate limiting (DDoS vulnerable)
- Mixed component patterns (some use Context, others direct state)
- Large component files (Rooms.jsx 550 lines, Maintenance.jsx 520 lines)

---

## Production Roadmap

### Phase 1: Backend Foundation (Weeks 1-3)
**Goal:** Build secure, scalable API with JWT authentication

**Deliverables:**
- Node.js + Express REST API server
- PostgreSQL database with multi-tenant schema (14 tables)
- JWT authentication with bcrypt password hashing
- Auth endpoints (register, login, refresh, logout)
- Database migrations with indexes

**Acceptance Criteria:**
- Manager can register and login via API
- JWT token expires after 15 minutes
- Refresh token valid for 7 days
- All queries filtered by `tenant_id` (tenant isolation)

### Phase 2: API Development (Weeks 4-6)
**Goal:** Complete CRUD endpoints for all entities

**Deliverables:**
- Buildings, Rooms, Contracts, Invoices, Maintenance CRUD APIs
- Invoice batch generation endpoint
- File upload for room images (multer + sharp)
- Excel export endpoint (exceljs)
- Dashboard stats aggregation endpoint

**Acceptance Criteria:**
- All frontend localStorage operations replaced with API calls
- Pagination implemented (50 items per page)
- Input validation with Zod schemas
- Error handling with proper HTTP status codes

### Phase 3: Frontend Migration (Weeks 7-8)
**Goal:** Integrate frontend with backend API

**Deliverables:**
- Replace AppDataContext with API service layer
- Update AuthContext to use JWT instead of Firebase
- Add loading states and error handling
- Optimistic UI updates for better UX

**Acceptance Criteria:**
- All data persists to PostgreSQL database
- No localStorage usage except JWT token
- Loading spinners during API calls
- Error toasts with retry functionality

### Phase 4: Security Hardening (Week 9)
**Goal:** Fix all critical and high security issues

**Deliverables:**
- Remove Firebase and hardcoded credentials
- Server-side RBAC middleware
- Input sanitization and CSRF protection
- Rate limiting on auth endpoints
- HTTPS with Let's Encrypt certificates
- Security headers (Helmet.js)

**Acceptance Criteria:**
- Pass OWASP Top 10 security checklist
- All 6 critical issues resolved
- All 8 high issues resolved
- Security audit completed with 0 critical findings

### Phase 5: Testing & Deployment (Weeks 10-12)
**Goal:** Production deployment with monitoring

**Deliverables:**
- Docker Compose configuration (frontend, backend, postgres, nginx)
- CI/CD pipeline with GitHub Actions
- Unit tests (70% backend coverage)
- Integration tests (API endpoint tests)
- Production deployment on VPS
- Database backup automation (daily pg_dump)

**Acceptance Criteria:**
- Docker containers running on production server
- HTTPS via Cloudflare + custom domain
- Load test with 50 concurrent users passed
- Monitoring dashboard with uptime alerts
- Rollback procedure documented and tested

---

## Post-Launch Roadmap (v1.1 - v2.0)

### Version 1.1 (Month 4)
- Real-time notifications via WebSockets
- Email notifications for overdue invoices
- Zalo ZNS integration (official business messaging)
- Full-text search with PostgreSQL tsvector
- Bulk operations (delete multiple rooms, batch updates)

### Version 1.2 (Month 5)
- Mobile app (React Native, reuses same backend API)
- Multi-language support (Vietnamese + English)
- Custom invoice templates (PDF generation)
- Automated invoice generation via cron job
- Advanced analytics (revenue forecasting)

### Version 2.0 (Month 6-12)
- Sub-user management (multiple managers per tenant)
- Role-based permissions (admin, manager, accountant, maintenance staff)
- White-label support (custom branding per tenant)
- Public tenant portal (QR code login for residents)
- Payment gateway integration (VNPay, Momo, ZaloPay)
- API webhooks for third-party integrations

---

## Technical Requirements

### Performance
- API response time: <500ms for 95th percentile
- Page load time: <2 seconds on 3G connection
- Database queries: <100ms with proper indexes
- Support 100+ concurrent users per server instance

### Scalability
- Horizontal scaling: Add backend instances behind load balancer
- Database: Support 100+ tenants, 10,000+ rooms in single database
- File storage: S3-compatible object storage for room images
- Cache layer: Redis for hot data (dashboard stats, settings)

### Security
- Authentication: JWT with httpOnly cookies
- Authorization: Row-level security via tenant_id middleware
- Data encryption: TLS 1.3 in transit, AES-256 at rest (future)
- Audit logging: All CRUD operations logged with user_id and timestamp
- Backup: Daily full backup + incremental WAL archiving

### Reliability
- Uptime: 99.5% target (max 3.6 hours downtime per month)
- Data durability: 99.999% (PostgreSQL with replication)
- Backup retention: 30 days daily, 12 months monthly
- Disaster recovery: RTO <4 hours, RPO <1 hour

### Browser Support
- Chrome 120+ (primary)
- Safari 17+ (iOS compatibility)
- Firefox 120+
- Edge 120+

### Mobile Support
- Responsive design for 375px - 1920px viewport
- Touch-friendly UI (44px minimum tap target)
- Mobile-first CSS with Flexbox/Grid

---

## Constraints and Assumptions

### Constraints
- **Budget:** Self-funded, minimize third-party service costs
- **Team:** 1-2 developers (full-stack or specialized)
- **Timeline:** 10-12 weeks to production (cannot extend due to MVP data loss risk)
- **Technology:** Must use Node.js + PostgreSQL (team expertise)
- **Compliance:** Must handle Vietnamese personal data (GDPR-like requirements)

### Assumptions
- Property managers have stable internet connection
- Tenants have smartphones with QR code scanner (banking app)
- Monthly billing cycle (not daily or weekly)
- Vietnamese market only (no internationalization needed in v1.0)
- Single currency (VND)
- One tenant per room (no roommate splitting)

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | Critical | Medium | Export localStorage to JSON before migration, test on staging |
| Performance degradation vs localStorage | High | Medium | Implement Redis cache, optimize PostgreSQL queries with indexes |
| User resistance to new auth flow | Medium | Low | Keep UI identical, add "Forgot Password" feature |
| Scope creep (adding new features) | High | High | Strict YAGNI enforcement, defer all non-critical features to v1.1 |
| Security vulnerabilities in production | Critical | Low | Security audit in Phase 4, penetration testing before launch |
| Infrastructure downtime | Medium | Low | Multi-region deployment, automated health checks, 24h monitoring |

---

## Success Criteria

### Must-Have (Launch Blockers)
- [ ] All 6 critical security issues fixed
- [ ] Backend API deployed with HTTPS
- [ ] Frontend integrated with API (no localStorage)
- [ ] Multi-tenant isolation verified (cannot access other tenants' data)
- [ ] Database backup automation working
- [ ] Production deployment completed

### Should-Have (Launch Ready)
- [ ] 70% test coverage (backend)
- [ ] Load test passed (50 concurrent users)
- [ ] Monitoring dashboard configured
- [ ] Documentation complete (API docs, deployment guide)
- [ ] Rollback procedure tested

### Nice-to-Have (Post-Launch)
- [ ] CI/CD pipeline with auto-deployment
- [ ] Error tracking (Sentry or similar)
- [ ] Performance monitoring (APM)
- [ ] User analytics (privacy-respecting)

---

## Appendix

### Related Documents
- `docs/system-architecture.md` - Technical architecture details
- `docs/project-roadmap.md` - Detailed implementation timeline
- `docs/code-standards.md` - Development conventions
- `docs/deployment-guide.md` - Docker deployment instructions
- `plans/260616-2330-production-rebuild/plan.md` - Executable implementation plan

### Research Reports
- `plans/reports/brainstorm-260616-1942-production-architecture-report.md` - Architecture analysis (3 approaches)
- `plans/reports/brainstormer-260616-2314-docker-deployment-research-report.md` - Docker best practices
- `plans/reports/codebase-scout-260615-report.md` - Security audit findings

### Glossary
- **Tenant (System):** SaaS customer (building owner/property manager)
- **Tenant (Domain):** Room renter (resident)
- **Contract:** Lease agreement between landlord and resident
- **Invoice:** Monthly bill for rent and utilities
- **VietQR:** Vietnamese bank QR code payment standard

---

**Document Owner:** Product Team  
**Reviewed By:** Architecture Team  
**Approval Date:** June 16, 2026  
**Next Review:** Upon Phase 3 completion (Week 8)
