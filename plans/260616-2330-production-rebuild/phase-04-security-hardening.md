---
phase: 4
title: "Security Hardening"
status: pending
priority: P1
effort: "1 week"
dependencies: [3]
---

# Phase 4: Security Hardening

## Overview

Fix all 6 CRITICAL and 8 HIGH security vulnerabilities identified in code review. Implement security best practices including HTTPS, rate limiting, input validation, CORS, Helmet.js, and CSRF protection. Achieve OWASP Top 10 compliance.

**Duration:** 1 week  
**Team:** 1 security-focused developer  
**Deliverables:** All security issues resolved, security audit passed, production-ready security posture

## Requirements

### Functional
- Remove Firebase credentials and dependencies
- Implement proper RBAC (tenants can't become managers)
- Fix tenant isolation (email→room mapping in database)
- Remove hardcoded passwords
- Validate manager credentials via backend
- Store bank details in settings table (not hardcoded)
- Implement session validation on logout
- Use UUID for all entity IDs
- Enable cascade deletes in database
- Add input validation on all forms
- Implement search filters
- Remove demo data wipe
- Fix Excel export field mapping
- Define CSS variables

### Non-Functional
- HTTPS enabled in production (Nginx + Let's Encrypt)
- Rate limiting on all endpoints (100 req/15min general, 5 req/15min auth)
- Helmet.js applied for security headers
- CORS restricted to frontend domain only
- Input validation with Zod on all endpoints
- SQL injection prevention (parameterized queries verified)
- CSRF protection via SameSite cookies
- XSS prevention (sanitize user input)
- Password strength requirements enforced
- Security audit passed (0 critical/high findings)

## Architecture

### Security Layers

```
Client (HTTPS)
    ↓
Cloudflare (DDoS protection)
    ↓
Nginx (SSL termination, rate limiting)
    ↓
Backend (Helmet, CORS, input validation)
    ↓
PostgreSQL (parameterized queries, tenant isolation)
```

### Security Checklist Structure

**6 CRITICAL Issues:**
1. Firebase credentials exposed
2. RBAC bypass (tenants can become managers)
3. Tenant isolation broken (hardcoded room assignment)
4. Hardcoded password in Login.jsx
5. Manager login doesn't validate credentials
6. Bank details hardcoded in code

**8 HIGH Issues:**
7. Session not validated on logout
8. Non-UUID IDs (collision risk)
9. Missing cascade deletes
10. Missing input validation
11. Missing search filters
12. Demo data wipe on login
13. Excel export field error
14. Missing CSS variables

## Related Code Files

### Modify
- `backend/src/middleware/rateLimiter.js` - Add rate limiting config
- `backend/server.js` - Apply Helmet, CORS, rate limiting
- `backend/src/utils/validators.js` - Add validation schemas for all endpoints
- `backend/src/routes/*.js` - Apply validation middleware to all routes
- `frontend/src/pages/Login.jsx` - Remove hardcoded password
- `frontend/src/contexts/AuthContext.jsx` - Remove Firebase imports
- `frontend/src/components/Sidebar.jsx` - Remove hardcoded room assignment
- `frontend/src/pages/Settings.jsx` - Read bank details from API
- `frontend/src/utils/excelExport.js` - Fix field mapping
- `frontend/src/index.css` - Add CSS variables
- `nginx/nginx.conf` - Add SSL configuration
- `docker-compose.yml` - Add SSL certificate volumes

### Delete
- `frontend/src/firebase.js` - Remove Firebase config
- `frontend/src/firebase-config.js` - Remove Firebase credentials
- All Firebase imports across frontend

### Create
- `backend/src/middleware/sanitize.js` - XSS prevention middleware
- `nginx/ssl/` - SSL certificate directory
- `scripts/setup-ssl.sh` - Let's Encrypt automation script

## Implementation Steps

### Day 1-2: Critical Security Fixes (Issues #1-6)

1. **Remove Firebase credentials and dependencies**
   - Delete `frontend/src/firebase.js`
   - Delete `frontend/src/firebase-config.js`
   - Remove `firebase` from package.json
   - Search codebase for `import.*firebase` and remove
   - Verify no Firebase code remains

2. **Fix RBAC (tenants can't become managers)**
   - Backend already enforces role via database (users.role column)
   - Frontend: Hide "Become Manager" option completely
   - Verify role can't be changed via API (only on registration)

3. **Fix tenant isolation (hardcoded 'P.101' room)**
   - Remove hardcoded room assignment from Sidebar.jsx
   - Call API to get resident's assigned room: `GET /api/users/me`
   - Display actual room from `users.assigned_room_id`
   - If no room assigned, show "No room assigned"

4. **Remove hardcoded password from Login.jsx**
   - Find and remove: `if (password === 'admin123')`
   - Already using authService.login() from Phase 3
   - Verify login only succeeds with valid backend credentials

5. **Verify manager login validates credentials**
   - Already implemented in Phase 1 (bcrypt.compare)
   - Test: Invalid password returns 401 Unauthorized
   - Test: Valid password returns JWT token

6. **Move bank details to settings table**
   - Already implemented in Phase 2 (settings API)
   - Remove hardcoded bank details from Invoice components
   - Fetch from `GET /api/settings?building_id=`
   - Display bank_name, bank_account, bank_owner from API

### Day 3-4: High Security Issues (Issues #7-14)

7. **Validate session on logout**
   - Already implemented in Phase 1 (refresh token revocation)
   - Verify refresh token marked as revoked in database
   - Verify revoked token can't be used to refresh

8. **Verify UUID IDs (no collision risk)**
   - Already using UUID in database schema (Phase 1)
   - Verify all IDs are UUID format in API responses
   - Test: Create 1000 entities, verify no ID collisions

9. **Verify cascade deletes**
   - Already implemented in schema: `ON DELETE CASCADE`
   - Test: Delete building → All rooms deleted
   - Test: Delete room → All contracts, invoices deleted
   - Test: Delete tenant → All data deleted

10. **Add input validation on all forms**
    - Frontend: Add client-side validation with HTML5 + React
    - Backend: Already using Zod in Phase 2
    - Verify validation errors return 400 Bad Request
    - Test: Submit invalid data, verify error messages

11. **Verify search filters implemented**
    - Already implemented in Phase 2 query params
    - Test: Filter rooms by building_id
    - Test: Filter invoices by month/year
    - Test: Filter tickets by status

12. **Remove demo data wipe from login**
    - Find and remove `clearDemoData()` or similar functions
    - Remove any data reset buttons from Login page
    - Verify data persists after login/logout

13. **Fix Excel export field mapping**
    - Find error: `c.tenantName` → Should be `c.tenant.name`
    - Fix field references in excelGenerator.js
    - Test: Export Excel, verify all fields correct
    - Verify no undefined values in exported data

14. **Add CSS variables**
    - Add to `frontend/src/index.css`:
      ```css
      :root {
        --sidebar-width: 280px;
        --header-height: 64px;
        --primary-color: #3b82f6;
        --secondary-color: #64748b;
        --success-color: #22c55e;
        --danger-color: #ef4444;
        --warning-color: #f59e0b;
      }
      ```
    - Replace hardcoded values with CSS variables
    - Verify UI looks correct

### Day 5-6: Additional Security Hardening

15. **Apply Helmet.js security headers**
    ```bash
    npm install helmet
    ```
    - Configure in server.js:
      - Content-Security-Policy
      - X-Frame-Options: DENY
      - X-Content-Type-Options: nosniff
      - Strict-Transport-Security (HSTS)
      - Referrer-Policy: strict-origin-when-cross-origin

16. **Configure CORS properly**
    - Already implemented in Phase 1
    - Verify CORS only allows frontend domain
    - Test: Request from unauthorized origin returns CORS error
    - Production: Set `ALLOWED_ORIGINS=https://yourdomain.com`

17. **Add rate limiting**
    - Already implemented in Phase 1
    - Verify general API: 100 req/15min
    - Verify auth endpoints: 5 req/15min
    - Test: Exceed limit, verify 429 Too Many Requests

18. **Implement XSS prevention**
    - Create sanitize middleware:
      ```javascript
      const xss = require('xss');
      
      module.exports = (req, res, next) => {
        if (req.body) {
          Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
              req.body[key] = xss(req.body[key]);
            }
          });
        }
        next();
      };
      ```
    - Apply to all POST/PUT routes
    - Test: Submit `<script>alert('xss')</script>`, verify sanitized

19. **Enforce password strength**
    - Already implemented in Phase 1 (Zod validation)
    - Verify requirements: min 8 chars, 1 uppercase, 1 number
    - Add frontend validation to match backend
    - Test: Weak password rejected with 400 Bad Request

20. **Verify SQL injection prevention**
    - Audit all database queries
    - Verify 100% use parameterized statements: `$1, $2, ...`
    - Test: Inject SQL in input fields, verify no execution
    - Example test: `email='; DROP TABLE users; --`

### Day 7: SSL/TLS + Security Audit

21. **Set up HTTPS with Let's Encrypt**
    - Create nginx SSL configuration
    - Install certbot for Let's Encrypt
    - Generate SSL certificates
    - Configure nginx to redirect HTTP → HTTPS
    - Test: Access via HTTPS, verify certificate valid

22. **Configure nginx SSL**
    ```nginx
    server {
      listen 443 ssl http2;
      server_name yourdomain.com;
      
      ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;
      ssl_prefer_server_ciphers on;
      
      # ... rest of config
    }
    ```

23. **Run security audit**
    - npm audit (backend and frontend)
    - Fix all HIGH/CRITICAL vulnerabilities
    - Target: 0 HIGH/CRITICAL findings
    - Document any accepted MEDIUM/LOW risks

24. **OWASP Top 10 checklist**
    - [ ] A01:2021 – Broken Access Control → Fixed (tenant isolation, RBAC)
    - [ ] A02:2021 – Cryptographic Failures → Fixed (bcrypt, HTTPS)
    - [ ] A03:2021 – Injection → Fixed (parameterized queries, XSS prevention)
    - [ ] A04:2021 – Insecure Design → Fixed (proper auth flow, validation)
    - [ ] A05:2021 – Security Misconfiguration → Fixed (Helmet, CORS, rate limiting)
    - [ ] A06:2021 – Vulnerable Components → Fixed (npm audit)
    - [ ] A07:2021 – Identification and Authentication Failures → Fixed (JWT, bcrypt)
    - [ ] A08:2021 – Software and Data Integrity Failures → Fixed (input validation)
    - [ ] A09:2021 – Security Logging and Monitoring → Fixed (audit logs)
    - [ ] A10:2021 – Server-Side Request Forgery → Not applicable (no SSRF endpoints)

25. **Document security measures**
    - Create SECURITY.md in repository
    - Document: Auth flow, JWT expiration, rate limits, input validation
    - Add responsible disclosure policy
    - Include security contact email

## Success Criteria

### Critical Issues Fixed
- [ ] Firebase credentials removed from codebase
- [ ] RBAC enforced (tenants can't become managers)
- [ ] Tenant isolation working (no hardcoded room assignment)
- [ ] Hardcoded password removed from Login.jsx
- [ ] Manager login validates credentials via backend
- [ ] Bank details read from settings API (not hardcoded)

### High Issues Fixed
- [ ] Session validated on logout (refresh token revoked)
- [ ] All IDs are UUIDs (no collision risk)
- [ ] Cascade deletes working (delete building → rooms deleted)
- [ ] Input validation on all forms (frontend + backend)
- [ ] Search filters implemented and working
- [ ] Demo data wipe removed from login
- [ ] Excel export field mapping fixed
- [ ] CSS variables defined and used

### Security Hardening
- [ ] HTTPS enabled in production (nginx + Let's Encrypt)
- [ ] Helmet.js applied with all security headers
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting working (429 on exceeded limit)
- [ ] XSS prevention implemented
- [ ] SQL injection prevented (parameterized queries verified)
- [ ] Password strength enforced (8+ chars, uppercase, number)
- [ ] npm audit shows 0 HIGH/CRITICAL vulnerabilities

### OWASP Compliance
- [ ] All OWASP Top 10 items addressed
- [ ] Security audit passed
- [ ] SECURITY.md documented
- [ ] Responsible disclosure policy in place

## Risk Assessment

### High Risks

**1. SSL certificate not renewed automatically**
- **Mitigation:** Set up certbot auto-renewal cron job, monitor expiry
- **Impact:** HTTPS breaks, site inaccessible
- **Probability:** Low (certbot handles auto-renewal)

**2. Rate limiting too strict (blocks legitimate users)**
- **Mitigation:** Monitor 429 responses, adjust limits if needed
- **Impact:** Poor UX, users can't use app
- **Probability:** Low (100 req/15min is generous)

**3. XSS sanitization breaks legitimate content**
- **Mitigation:** Test with various inputs, use allowlist instead of denylist
- **Impact:** User can't save certain content
- **Probability:** Medium (depends on sanitization rules)

### Medium Risks

**4. Helmet.js breaks frontend functionality**
- **Mitigation:** Test all features after applying Helmet, adjust CSP if needed
- **Impact:** Frontend broken, features don't work
- **Probability:** Low (if CSP configured correctly)

**5. CORS blocks legitimate requests**
- **Mitigation:** Test from all environments (localhost, staging, prod)
- **Impact:** API calls fail, app unusable
- **Probability:** Low (CORS configured in Phase 1)

## Validation Checklist

Before proceeding to Phase 5:

- [ ] All 6 CRITICAL issues fixed and verified
- [ ] All 8 HIGH issues fixed and verified
- [ ] Security headers present in all responses
- [ ] Rate limiting working correctly
- [ ] HTTPS enabled and certificate valid
- [ ] npm audit shows 0 HIGH/CRITICAL
- [ ] OWASP Top 10 checklist completed
- [ ] No hardcoded secrets in codebase
- [ ] No sensitive data in logs
- [ ] Manual penetration testing completed
- [ ] Security documentation complete

## Dependencies for Next Phase

Phase 5 (Testing and Deployment) requires:
- All security issues resolved
- HTTPS configured and working
- Security audit passed
- No HIGH/CRITICAL vulnerabilities
- Production-ready security posture
