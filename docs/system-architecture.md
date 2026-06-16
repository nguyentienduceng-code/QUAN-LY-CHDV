# System Architecture

**Project:** QUAN-LY-CHDV  
**Document Version:** 1.0  
**Last Updated:** June 16, 2026  
**Status:** Transition Architecture (MVP → Production)

---

## Overview

This document describes both the current MVP architecture (localStorage-based) and the planned production architecture (full-stack with PostgreSQL backend). The system is undergoing a complete rebuild to transform from a single-user browser app into a multi-tenant SaaS platform.

---

## Current Architecture (MVP)

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │           React 19 Application                     │  │
│  │  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │ AuthContext  │  │ AppDataContext│              │  │
│  │  │  (Firebase)  │  │  (CRUD Logic) │              │  │
│  │  └──────────────┘  └──────────────┘              │  │
│  │         │                  │                       │  │
│  │         ▼                  ▼                       │  │
│  │  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │  Firebase    │  │  localStorage │              │  │
│  │  │  Auth SDK    │  │  (6 keys)     │              │  │
│  │  └──────────────┘  └──────────────┘              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19.2.6 - UI framework
- Vite 8.0.12 - Bundler and dev server
- React Router - Client-side routing
- Recharts 3.8.1 - Financial charts
- Lucide React - Icon library
- XLSX - Excel export

**Data Persistence:**
- localStorage (6 keys):
  - `rentflow_rooms` - Room inventory
  - `rentflow_tenants` - Tenant profiles
  - `rentflow_contracts` - Lease agreements
  - `rentflow_invoices` - Billing records
  - `rentflow_tickets` - Maintenance requests
  - `rentflow_settings` - Per-building configuration

**Authentication:**
- Firebase Auth 12.14.0 (unused, credentials exposed)

### Component Architecture

```
App.jsx (Router)
├── Layout
│   ├── Header (user profile, logout)
│   └── Sidebar (navigation menu)
├── Pages (10 routes)
│   ├── Home (Dashboard)
│   ├── Rooms (Inventory management)
│   ├── Tenants (Resident profiles)
│   ├── Contracts (Lease tracking)
│   ├── Invoices (Billing)
│   ├── Maintenance (Kanban board)
│   ├── FinanceAndTenants (Analytics)
│   ├── Settings (Configuration)
│   ├── TenantPortal (Resident view)
│   └── Login (Authentication)
└── Contexts
    ├── AuthContext (user session)
    └── AppDataContext (CRUD operations)
```

### Data Flow (Current)

```
User Action (e.g., Create Room)
    ↓
React Component (Rooms.jsx)
    ↓
AppDataContext.addRoom()
    ↓
Update React State
    ↓
localStorage.setItem('rentflow_rooms', JSON.stringify(rooms))
    ↓
Re-render UI
```

### Limitations

❌ **Single-User:** Only one manager per browser  
❌ **No Backup:** Data lost if browser cache cleared  
❌ **No Collaboration:** No shared access for teams  
❌ **Security Issues:** Client-side only, no server validation  
❌ **No Multi-Tenancy:** Cannot scale to SaaS model  
❌ **Storage Limits:** 5-10MB localStorage quota per domain  

---

## Planned Production Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS (443)
                             ▼
                   ┌──────────────────┐
                   │  Cloudflare CDN  │
                   │  (SSL, DDoS)     │
                   └──────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                       VPS / Cloud Server                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Nginx Reverse Proxy                          │  │
│  │  (Load Balancer, Static Caching, Rate Limiting)          │  │
│  └─────────────────┬──────────────────┬─────────────────────┘  │
│                    │                  │                         │
│         ┌──────────▼──────────┐  ┌───▼──────────────────┐      │
│         │  Frontend Container │  │  Backend Container    │      │
│         │  (React + Nginx)    │  │  (Node.js + Express) │      │
│         │  Port: 80           │  │  Port: 5000          │      │
│         └─────────────────────┘  └───────────┬──────────┘      │
│                                               │                 │
│                                    ┌──────────▼──────────┐      │
│                                    │ PostgreSQL Container│      │
│                                    │ Port: 5432          │      │
│                                    │ (14 tables)         │      │
│                                    └─────────────────────┘      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend (Keep Existing):**
- React 19 + Vite 8
- Axios (API client)
- React Router
- Recharts, Lucide React

**Backend (New):**
- Node.js 20
- Express 5 (REST API)
- JWT + bcrypt (authentication)
- Multer + Sharp (file upload)
- ExcelJS (export)
- Zod (input validation)

**Database:**
- PostgreSQL 16
- 14 tables with multi-tenant isolation
- Row-level security via `tenant_id`

**Infrastructure:**
- Docker 24 + Docker Compose
- Nginx 1.25 (reverse proxy)
- Let's Encrypt (SSL certificates)

### API Architecture

**RESTful Endpoints (30+):**

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/refresh
  GET    /api/auth/me
  POST   /api/auth/logout
  PUT    /api/auth/password

Buildings:
  GET    /api/buildings
  POST   /api/buildings
  GET    /api/buildings/:id
  PUT    /api/buildings/:id
  DELETE /api/buildings/:id

Rooms:
  GET    /api/rooms?building_id=&status=
  POST   /api/rooms
  GET    /api/rooms/:id
  PUT    /api/rooms/:id
  DELETE /api/rooms/:id
  POST   /api/rooms/:id/image

Contracts:
  GET    /api/contracts?status=&room_id=
  POST   /api/contracts
  GET    /api/contracts/:id
  PUT    /api/contracts/:id
  DELETE /api/contracts/:id

Invoices:
  GET    /api/invoices?status=&month=&year=
  POST   /api/invoices
  POST   /api/invoices/batch
  GET    /api/invoices/:id
  PUT    /api/invoices/:id
  DELETE /api/invoices/:id
  PUT    /api/invoices/:id/status

Maintenance:
  GET    /api/tickets?status=
  POST   /api/tickets
  GET    /api/tickets/:id
  PUT    /api/tickets/:id
  DELETE /api/tickets/:id

Dashboard:
  GET    /api/dashboard/stats

Export:
  GET    /api/export/excel

Settings:
  GET    /api/settings?building_id=
  PUT    /api/settings/:id
```

### Database Schema

**14 Core Tables:**

```sql
tenants                   -- SaaS customers (building owners)
  ├── id (UUID, PK)
  ├── name, slug
  ├── status, created_at, updated_at

users                     -- Managers and residents
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── email, password_hash
  ├── role (manager, resident)
  ├── name, phone, photo_url
  ├── assigned_room_id (for residents)

buildings                 -- Property buildings
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── name, address, floors

rooms                     -- Rental units
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── building_id (FK → buildings)
  ├── room_number, floor, area, price
  ├── status (vacant, occupied, maintenance)
  ├── image_url

contracts                 -- Lease agreements
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── room_id (FK → rooms)
  ├── resident_id (FK → users)
  ├── contract_number, start_date, end_date
  ├── deposit, monthly_rent, status

invoices                  -- Billing records
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── room_id (FK → rooms)
  ├── contract_id (FK → contracts)
  ├── invoice_number, month, year
  ├── total_amount, paid_amount, status
  ├── due_date, paid_at

invoice_items             -- Line items
  ├── id (UUID, PK)
  ├── invoice_id (FK → invoices)
  ├── item_name, quantity, unit_price, total
  ├── old_index, new_index (meter readings)

maintenance_tickets       -- Repair requests
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── room_id (FK → rooms)
  ├── reported_by (FK → users)
  ├── category, title, description, status
  ├── assignee_id, total_cost

settings                  -- Per-building pricing
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── building_id (FK → buildings)
  ├── base_rent, base_electric_price, base_water_price
  ├── collect_electric_price, collect_water_price
  ├── service_fee, bank_name, bank_account

refresh_tokens            -- JWT token storage
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── token, expires_at, created_at

audit_logs                -- Activity tracking
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── user_id (FK → users)
  ├── action, entity_type, entity_id
  ├── changes (JSONB), ip_address

files                     -- Uploaded documents
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── entity_type, entity_id
  ├── file_name, file_path, file_size, mime_type

notifications             -- System alerts
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── user_id (FK → users)
  ├── title, message, type, is_read, link

meter_readings            -- Utility history
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants)
  ├── room_id (FK → rooms)
  ├── reading_date, electric_index, water_index
```

**Multi-Tenancy Pattern:**
- All tables include `tenant_id` column
- Composite indexes: `(tenant_id, entity_key)` for performance
- Middleware auto-filters all queries by `tenant_id` from JWT token
- ON DELETE CASCADE ensures data cleanup

### Data Flow (Production)

```
User Action (e.g., Create Room)
    ↓
React Component (Rooms.jsx)
    ↓
API Service (api.js)
    ↓
axios.post('/api/rooms', data, { headers: { Authorization: 'Bearer JWT' }})
    ↓
[Network Request]
    ↓
Nginx Reverse Proxy
    ↓
Express Route Handler (POST /api/rooms)
    ↓
Auth Middleware (verify JWT, extract tenant_id)
    ↓
Input Validation (Zod schema)
    ↓
Controller (rooms.controller.js)
    ↓
Database Query (INSERT INTO rooms WHERE tenant_id = ?)
    ↓
PostgreSQL (persist data)
    ↓
[Response]
    ↓
React State Update (optimistic UI)
    ↓
Re-render UI
```

### Authentication Flow

**Login Sequence:**

```
1. User submits email + password
2. Frontend: POST /api/auth/login { email, password }
3. Backend:
   a. Find user in database by email
   b. bcrypt.compare(password, user.password_hash)
   c. Generate JWT access token (15min expiry)
   d. Generate JWT refresh token (7day expiry)
   e. Store refresh token in database
   f. Set httpOnly cookie with refresh token
4. Frontend:
   a. Store access token in memory (React state)
   b. Set axios default header: Authorization: Bearer <token>
5. Redirect to dashboard
```

**Token Refresh:**

```
1. Access token expires (15min)
2. API returns 401 Unauthorized
3. Frontend intercepts error
4. POST /api/auth/refresh (httpOnly cookie sent automatically)
5. Backend:
   a. Verify refresh token from cookie
   b. Check if token exists in database (not revoked)
   c. Generate new access token
   d. Return new token
6. Frontend:
   a. Update access token in memory
   b. Retry original request
```

**Logout:**

```
1. User clicks logout
2. POST /api/auth/logout
3. Backend:
   a. Delete refresh token from database
   b. Clear httpOnly cookie
4. Frontend:
   a. Clear access token from memory
   b. Redirect to /login
```

### Multi-Tenancy Model

**Shared Database with Tenant Isolation:**

```
┌─────────────────────────────────────────┐
│          PostgreSQL Database            │
│  ┌────────────────────────────────────┐ │
│  │  Tenant A Data (tenant_id = uuid1) │ │
│  │    - 3 buildings, 50 rooms         │ │
│  │    - 200 invoices                  │ │
│  ├────────────────────────────────────┤ │
│  │  Tenant B Data (tenant_id = uuid2) │ │
│  │    - 5 buildings, 120 rooms        │ │
│  │    - 500 invoices                  │ │
│  ├────────────────────────────────────┤ │
│  │  Tenant C Data (tenant_id = uuid3) │ │
│  │    - 2 buildings, 30 rooms         │ │
│  │    - 100 invoices                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Middleware Enforcement:**

```javascript
// backend/middleware/tenantIsolation.js
function enforceTenantIsolation(req, res, next) {
  // Extract tenant_id from verified JWT token
  const tenantId = req.user.tenant_id;
  
  // Inject tenant_id into all database queries
  req.dbFilter = { tenant_id: tenantId };
  
  next();
}

// Usage in route handler
app.get('/api/rooms', enforceTenantIsolation, (req, res) => {
  // Query automatically filtered by tenant_id
  const rooms = await db.query(
    'SELECT * FROM rooms WHERE tenant_id = $1',
    [req.user.tenant_id]
  );
  res.json(rooms);
});
```

### Security Architecture

**Defense in Depth:**

```
Layer 1: Cloudflare
  - DDoS protection
  - SSL/TLS termination
  - Rate limiting (10 req/s per IP)

Layer 2: Nginx
  - HTTPS only (redirect HTTP → HTTPS)
  - Security headers (HSTS, CSP, X-Frame-Options)
  - Rate limiting on /api/auth/* (3 req/s)
  - Static file caching

Layer 3: Express Middleware
  - Helmet.js (12 security headers)
  - CORS (whitelist frontend domain only)
  - express-rate-limit (100 req/15min per IP)
  - Body size limit (10MB max)

Layer 4: Authentication
  - JWT with short expiry (15min access, 7day refresh)
  - bcrypt with 12 rounds for password hashing
  - httpOnly cookies for refresh token (XSS protection)
  - Token rotation on refresh

Layer 5: Authorization
  - Middleware checks user role (manager vs resident)
  - Tenant isolation via tenant_id filtering
  - Row-level security enforcement

Layer 6: Input Validation
  - Zod schemas on all POST/PUT endpoints
  - SQL injection prevention (parameterized queries)
  - XSS prevention (sanitize HTML inputs)
  - File upload validation (type, size, magic bytes)

Layer 7: Database
  - Foreign key constraints (data integrity)
  - ON DELETE CASCADE (prevent orphaned records)
  - Encrypted at rest (future: PostgreSQL pgcrypto)
  - TLS connections only
```

### Deployment Architecture

**Docker Compose Services:**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    restart: unless-stopped

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/db
      JWT_SECRET: <secret>
    networks:
      - app_network
    restart: unless-stopped

  frontend:
    build: ./frontend
    depends_on:
      - backend
    networks:
      - app_network
    restart: unless-stopped

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - app_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  app_network:
    driver: bridge
```

### Performance Optimizations

**Database:**
- Composite indexes on `(tenant_id, entity_id)` for all tables
- Pagination (50 items per page) on list endpoints
- Connection pooling (pg.Pool with max 20 connections)
- Query optimization (EXPLAIN ANALYZE on slow queries)
- Future: Redis cache for hot data (dashboard stats, settings)

**API:**
- Gzip compression on responses >1KB
- ETag support for conditional requests
- Rate limiting to prevent abuse
- Async/await for all I/O operations

**Frontend:**
- Code splitting (React.lazy for routes)
- Optimistic UI updates (instant feedback)
- Debounced search inputs (300ms)
- Image lazy loading
- Service Worker for offline support (future)

**Network:**
- Cloudflare CDN for static assets
- Nginx caching (static files: 1 year, API: no cache)
- HTTP/2 for multiplexing
- Brotli compression (future)

### Monitoring and Observability

**Health Checks:**
- Docker health checks every 30s
- Nginx `/health` endpoint
- Backend `/api/health` endpoint with DB ping

**Logging:**
- Application logs: Winston (info, warn, error)
- Access logs: Nginx combined format
- Audit logs: PostgreSQL table (all CRUD operations)
- Future: Centralized logging (Loki or ELK)

**Metrics (Future):**
- Prometheus + Grafana dashboard
- API response time percentiles
- Database query performance
- Error rate by endpoint
- Active users count

**Alerting (Future):**
- Uptime monitoring (UptimeRobot or Pingdom)
- Error tracking (Sentry)
- Slack notifications for critical errors

### Backup and Disaster Recovery

**Backup Strategy:**
- Daily full backup: `pg_dump` at 2 AM
- Incremental: WAL archiving (continuous)
- Retention: 30 days daily, 12 months monthly
- Storage: S3 or Cloudflare R2 (encrypted)

**Recovery Procedures:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Automated restore script tested monthly
- Blue-green deployment for rollback

---

## Migration Strategy

### Phase 1: Backend Development (Parallel)
- Build backend API alongside existing frontend
- No impact on current MVP usage
- Can test API independently with Postman

### Phase 2: Frontend Integration (Feature Flag)
- Add feature flag: `USE_API_MODE`
- Toggle between localStorage and API
- Gradual rollout per feature

### Phase 3: Data Migration (One-Time)
1. Export localStorage to JSON (browser console script)
2. User uploads JSON via admin panel
3. Backend parses and inserts into PostgreSQL
4. Verify data integrity (count records)
5. Switch frontend to API mode permanently
6. Delete localStorage data

### Phase 4: Production Deployment
- Deploy Docker containers to VPS
- Configure Cloudflare DNS
- Run smoke tests (login, create room, generate invoice)
- Monitor for 24 hours

---

## Technical Decisions

### Why PostgreSQL over MongoDB?
✅ **Relational Data:** Invoices → Contracts → Rooms (foreign keys)  
✅ **ACID Transactions:** Critical for financial data integrity  
✅ **Mature Ecosystem:** pgAdmin, backups, replication  
✅ **Cost:** Free, self-hosted  
❌ MongoDB better for: Document-heavy, schema-less data

### Why JWT over Session Cookies?
✅ **Stateless:** No server-side session storage needed  
✅ **Scalable:** Works across multiple backend instances  
✅ **Mobile Ready:** Easy to integrate with React Native app  
❌ Session cookies better for: Server-rendered apps, higher security requirements

### Why Docker over Bare Metal?
✅ **Reproducibility:** Same environment dev → staging → prod  
✅ **Isolation:** Each service in separate container  
✅ **Easy Rollback:** Switch to previous image version  
✅ **Portable:** Move between VPS providers easily  
❌ Bare metal better for: Maximum performance, lower overhead

### Why Monorepo over Separate Repos?
✅ **Shared Types:** Frontend/backend can share TypeScript types  
✅ **Atomic Commits:** Change API + frontend in one commit  
✅ **Easier Development:** Clone once, work on both layers  
❌ Separate repos better for: Large teams, microservices

---

## Scalability Roadmap

### Current Target: 100 Tenants, 10,000 Rooms
- Single VPS (4GB RAM, 2 CPU)
- PostgreSQL single instance
- 1 backend container

### Future (500+ Tenants, 50,000+ Rooms)
- Load balancer (Nginx) → 3 backend instances
- PostgreSQL primary-replica replication
- Redis cache for hot data
- CDN for all static assets
- Object storage (S3) for room images

### Future (1,000+ Tenants, 100,000+ Rooms)
- Kubernetes orchestration
- PostgreSQL sharding by tenant_id
- Microservices (auth, billing, notifications separate)
- Message queue (RabbitMQ) for async tasks
- Elasticsearch for full-text search

---

## Related Documents

- `docs/project-overview-pdr.md` - Product requirements
- `docs/project-roadmap.md` - Implementation timeline
- `docs/deployment-guide.md` - Docker setup instructions
- `docs/code-standards.md` - Development conventions
- `plans/reports/brainstorm-260616-1942-production-architecture-report.md` - Architecture analysis

---

**Document Owner:** Architecture Team  
**Last Reviewed:** June 16, 2026  
**Next Review:** Phase 2 completion (Week 6)
