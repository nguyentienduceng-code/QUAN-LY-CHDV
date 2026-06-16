---
phase: 1
title: "Backend Foundation"
status: pending
priority: P1
effort: "3 weeks"
dependencies: []
---

# Phase 1: Backend Foundation

## Overview

Establish Node.js + Express backend infrastructure with PostgreSQL database, JWT authentication system, and multi-tenant isolation middleware. This phase creates the foundation for all API development in Phase 2.

**Duration:** 3 weeks  
**Team:** 1-2 backend developers  
**Deliverables:** Working auth API, database schema, tenant isolation middleware

## Requirements

### Functional
- User registration and login with JWT tokens
- Access token (15min) + refresh token (7 days) pattern
- Password hashing with bcrypt (12 rounds)
- Multi-tenant isolation via tenant_id middleware
- PostgreSQL database with 14 core tables
- Database migration system (node-pg-migrate)

### Non-Functional
- JWT tokens stored in httpOnly cookies
- All passwords hashed with bcrypt salt rounds 12
- Database queries use parameterized statements (SQL injection prevention)
- Connection pooling configured (max 20, min 5)
- Error handling with centralized middleware
- Request/response logging for debugging

## Architecture

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection pool
│   │   ├── auth.js              # JWT configuration
│   │   └── app.js               # Express app setup
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── tenantContext.js     # Tenant isolation
│   │   ├── errorHandler.js      # Centralized error handling
│   │   └── asyncHandler.js      # Async wrapper utility
│   ├── controllers/
│   │   └── authController.js    # Auth endpoints
│   ├── services/
│   │   └── authService.js       # Auth business logic
│   ├── repositories/
│   │   └── userRepository.js    # User database queries
│   ├── utils/
│   │   ├── AppError.js          # Custom error class
│   │   └── validators.js        # Zod validation schemas
│   └── routes/
│       ├── index.js             # Route aggregator
│       └── authRoutes.js        # Auth routes
├── migrations/                   # Database migrations
├── .env.example
├── package.json
└── server.js                     # Entry point
```

### Layer Pattern

**Controller → Service → Repository**

- **Controller:** HTTP request/response handling, validation
- **Service:** Business logic, authorization checks
- **Repository:** Database queries, data access

### Database Schema (Phase 1)

**Core tables for auth:**
```sql
-- Tenants (SaaS customers)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (managers and residents)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'manager',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(tenant_id, email);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

**Remaining tables (created but not used until Phase 2):**
- buildings, rooms, contracts, invoices, invoice_items, maintenance_tickets, settings, audit_logs

## Related Code Files

### Create
- `backend/src/config/database.js` - PostgreSQL connection pool
- `backend/src/config/auth.js` - JWT secrets and expiry config
- `backend/src/middleware/auth.js` - JWT verification middleware
- `backend/src/middleware/tenantContext.js` - Tenant isolation middleware
- `backend/src/middleware/errorHandler.js` - Centralized error handler
- `backend/src/controllers/authController.js` - Auth endpoints
- `backend/src/services/authService.js` - Auth business logic
- `backend/src/repositories/userRepository.js` - User database access
- `backend/src/routes/authRoutes.js` - Auth routes
- `backend/src/utils/AppError.js` - Custom error class
- `backend/src/utils/asyncHandler.js` - Async wrapper
- `backend/src/utils/validators.js` - Zod schemas
- `backend/server.js` - Express app entry point
- `backend/package.json` - Dependencies
- `backend/.env.example` - Environment variables template
- `backend/Dockerfile` - Production Docker image
- `migrations/001_create_tenants.sql` - Tenants table
- `migrations/002_create_users.sql` - Users table
- `migrations/003_create_refresh_tokens.sql` - Refresh tokens table
- `migrations/004_create_remaining_tables.sql` - All other tables

### Modify
- None (all new files)

## Implementation Steps

### Week 1: Project Setup + Database

1. **Initialize Node.js project**
   ```bash
   mkdir backend && cd backend
   npm init -y
   npm install express pg bcrypt jsonwebtoken zod cors helmet express-rate-limit dotenv
   npm install --save-dev nodemon jest supertest
   ```

2. **Configure PostgreSQL connection pool**
   - Create `src/config/database.js`
   - Connection pool: max 20, min 5, idle timeout 30s
   - Error handling for connection failures
   - Test connection on startup

3. **Set up migration system**
   ```bash
   npm install node-pg-migrate
   ```
   - Create migrations folder
   - Write initial migrations (tenants, users, refresh_tokens)
   - Run migrations: `npm run migrate up`

4. **Create database schema**
   - Execute all 14 table migrations
   - Add indexes for tenant_id on all tables
   - Verify schema with `\d+ table_name` in psql

5. **Seed test data**
   - Create seed script: 1 tenant, 2 users (manager + resident)
   - Hash test passwords with bcrypt
   - Insert via migration or seed script

### Week 2: Authentication System

6. **Create error handling utilities**
   - `utils/AppError.js` - Custom error class with statusCode
   - `middleware/errorHandler.js` - Centralized error handler
   - `utils/asyncHandler.js` - Wrap async route handlers

7. **Implement JWT auth service**
   - `services/authService.js`:
     - `register(tenantId, userData)` - Create user with hashed password
     - `login(email, password)` - Verify credentials, generate tokens
     - `refreshAccessToken(refreshToken)` - Rotate refresh token
     - `revokeRefreshToken(token)` - Invalidate token
   - Use bcrypt.hash(password, 12) for hashing
   - Use bcrypt.compare(password, hash) for verification

8. **Create auth controller**
   - `controllers/authController.js`:
     - POST /register - Create new manager account
     - POST /login - Login, set refresh token in httpOnly cookie
     - POST /refresh - Generate new access token
     - GET /me - Get current user profile
     - POST /logout - Revoke refresh token, clear cookie
     - PUT /password - Change password (requires current password)

9. **Implement auth middleware**
   - `middleware/auth.js`:
     - Extract access token from Authorization header
     - Verify JWT signature and expiration
     - Attach decoded payload to req.user
     - Return 401 if invalid/expired

10. **Create validation schemas**
    - `utils/validators.js`:
      - registerSchema - email, password (min 8 chars, 1 uppercase, 1 number), fullName
      - loginSchema - email, password
      - passwordSchema - currentPassword, newPassword
    - Add validation middleware to routes

### Week 3: Tenant Isolation + Integration

11. **Implement tenant context middleware**
    - `middleware/tenantContext.js`:
      - Extract tenantId from req.user (set by auth middleware)
      - Attach to req.tenant = { id: tenantId }
      - Return 403 if tenant context missing

12. **Create user repository**
    - `repositories/userRepository.js`:
      - findByEmail(tenantId, email)
      - findById(id)
      - findByEmailWithPassword(email) - Include password_hash
      - create(tenantId, userData)
      - updatePassword(userId, passwordHash)
    - All queries use parameterized statements: `$1, $2, ...`

13. **Set up Express app**
    - `server.js`:
      - Apply helmet for security headers
      - Configure CORS (allow frontend origin)
      - Apply rate limiting (100 req/15min general, 5 req/15min auth)
      - Register auth routes
      - Apply error handler last
      - Listen on port 5000

14. **Create Docker configuration**
    - `Dockerfile`:
      ```dockerfile
      FROM node:20-alpine
      WORKDIR /app
      COPY package*.json ./
      RUN npm ci --only=production
      COPY . .
      EXPOSE 5000
      CMD ["node", "server.js"]
      ```

15. **Write integration tests**
    - Test auth flow: register → login → refresh → logout
    - Test tenant isolation (user A can't access user B's data)
    - Test validation errors
    - Test rate limiting
    - Target: 70%+ coverage

## Success Criteria

### Functional
- [ ] Backend server starts on port 5000
- [ ] Database connection successful
- [ ] All 14 tables created with migrations
- [ ] POST /api/auth/register creates new user with hashed password
- [ ] POST /api/auth/login returns access token + sets refresh token cookie
- [ ] GET /api/auth/me returns current user (requires valid access token)
- [ ] POST /api/auth/refresh generates new access token from refresh token
- [ ] POST /api/auth/logout revokes refresh token and clears cookie
- [ ] PUT /api/auth/password changes user password

### Security
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT access token expires in 15 minutes
- [ ] JWT refresh token expires in 7 days
- [ ] Refresh tokens stored in httpOnly cookies
- [ ] Refresh token rotation on every refresh
- [ ] All database queries use parameterized statements
- [ ] CORS configured to allow only frontend origin
- [ ] Rate limiting applied (5 req/15min on auth endpoints)
- [ ] Helmet.js applied for security headers

### Testing
- [ ] Auth endpoints integration tests pass (register, login, refresh, logout)
- [ ] Tenant isolation verified (users can't cross tenant boundaries)
- [ ] Invalid token returns 401 Unauthorized
- [ ] Expired token returns 401 Unauthorized
- [ ] Validation errors return 400 Bad Request
- [ ] Rate limit returns 429 Too Many Requests

### Documentation
- [ ] README.md with setup instructions
- [ ] .env.example with all required variables
- [ ] API documentation for auth endpoints (Postman collection or OpenAPI spec)
- [ ] Database schema diagram

## Risk Assessment

### High Risks

**1. JWT secret leaked**
- **Mitigation:** Store in .env, never commit to Git, rotate regularly
- **Impact:** Attackers can forge tokens
- **Probability:** Low (if following best practices)

**2. Database migration fails**
- **Mitigation:** Test on staging first, keep rollback scripts ready
- **Impact:** Production database corrupted
- **Probability:** Medium (complex schema)

**3. bcrypt too slow (>1s per hash)**
- **Mitigation:** Use 12 rounds (400ms), benchmark on production hardware
- **Impact:** Slow registration/login
- **Probability:** Low (12 rounds is standard)

### Medium Risks

**4. Connection pool exhausted**
- **Mitigation:** Monitor active connections, adjust max pool size if needed
- **Impact:** API requests fail with timeout
- **Probability:** Medium (under high load)

**5. Refresh token not rotated**
- **Mitigation:** Always generate new refresh token on refresh endpoint
- **Impact:** Token reuse vulnerability
- **Probability:** Low (implementation detail)

## Validation Checklist

Before proceeding to Phase 2:

- [ ] Can register new manager account via API
- [ ] Can login and receive access + refresh tokens
- [ ] Access token works for protected endpoints
- [ ] Refresh token generates new access token
- [ ] Logout invalidates refresh token
- [ ] Tenant isolation prevents cross-tenant access
- [ ] All auth tests pass (70%+ coverage)
- [ ] Database has all 14 tables with indexes
- [ ] Docker image builds successfully
- [ ] .env.example documented with all variables
- [ ] No security vulnerabilities in npm audit

## Dependencies for Next Phase

Phase 2 (API Development) requires:
- Working auth system (login returns valid JWT)
- Tenant context middleware functional
- Database schema complete with all tables
- Error handling middleware working
- Repository pattern established
