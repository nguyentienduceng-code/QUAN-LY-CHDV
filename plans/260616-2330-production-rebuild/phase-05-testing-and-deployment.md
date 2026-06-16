---
phase: 5
title: "Testing and Deployment"
status: pending
priority: P1
effort: "2 weeks"
dependencies: [4]
---

# Phase 5: Testing and Deployment

## Overview

Comprehensive testing (unit, integration, E2E, load), Docker deployment setup, CI/CD pipeline configuration, production deployment, monitoring, and backup automation. Achieve production-ready deployment with zero-downtime updates.

**Duration:** 2 weeks  
**Team:** 1-2 DevOps + QA engineers  
**Deliverables:** Dockerized app, CI/CD pipeline, production deployment, monitoring, backups

## Requirements

### Functional
- Unit tests for backend services (70%+ coverage)
- Integration tests for API endpoints (80%+ coverage)
- Frontend component tests (60%+ coverage)
- E2E tests for critical user flows (login, CRUD operations)
- Load testing (50 concurrent users, <500ms p95 response time)
- Docker Compose setup for multi-container deployment
- CI/CD pipeline (test → build → deploy)
- Blue-green deployment for zero downtime
- Daily automated PostgreSQL backups
- Error tracking and monitoring

### Non-Functional
- Test suite runs in <5 minutes
- Docker images optimized (<200MB backend, <150MB frontend)
- CI/CD pipeline build time <10 minutes
- Deployment downtime <30 seconds
- Database backups stored securely (encrypted)
- Monitoring dashboards for uptime, response time, errors
- Automated SSL certificate renewal
- Rollback capability in <2 minutes

## Architecture

### Docker Deployment Stack

```
Docker Compose
├── postgres:16-alpine       # Database
├── backend:latest           # Node.js API
├── frontend:latest          # React SPA (nginx)
└── nginx:alpine            # Reverse proxy
```

### CI/CD Pipeline

```
Git Push
    ↓
GitHub Actions
    ├─→ Run Tests
    ├─→ Build Docker Images
    ├─→ Push to Registry
    └─→ Deploy to Server (Blue-Green)
```

### Monitoring Architecture

```
Application Logs
    ↓
Docker Logs
    ↓
Log Aggregation (optional: Loki/ELK)
    ↓
Metrics Dashboard (Grafana/Prometheus)
    ↓
Alerts (Email/Slack)
```

## Related Code Files

### Create
- `backend/tests/unit/` - Unit tests
- `backend/tests/integration/` - API integration tests
- `frontend/tests/` - Component tests
- `tests/e2e/` - Playwright E2E tests
- `backend/Dockerfile` - Production backend image
- `frontend/Dockerfile` - Production frontend image
- `docker-compose.yml` - Multi-container orchestration
- `docker-compose.prod.yml` - Production overrides
- `nginx/nginx.conf` - Reverse proxy configuration
- `.github/workflows/ci.yml` - CI/CD pipeline
- `scripts/deploy.sh` - Blue-green deployment script
- `scripts/backup.sh` - Database backup automation
- `scripts/restore.sh` - Database restore script
- `scripts/health-check.sh` - Application health check
- `docs/DEPLOYMENT.md` - Deployment documentation

### Modify
- `backend/package.json` - Add test scripts
- `frontend/package.json` - Add test scripts
- `.env.example` - Add production environment variables
- `.gitignore` - Ignore backup files, SSL certs

## Implementation Steps

### Week 1: Testing Infrastructure

1. **Set up backend unit tests**
   ```bash
   npm install --save-dev jest supertest
   ```
   - Test authService: register, login, token refresh
   - Test buildingService: create, update, delete
   - Test roomService: create, update, upload image
   - Test invoiceService: create, calculate total, batch generation
   - Target: 70%+ coverage

2. **Set up backend integration tests**
   - Test API endpoints with supertest
   - Test auth flow: register → login → access protected endpoint → logout
   - Test CRUD operations for all entities
   - Test tenant isolation (user A can't access user B's data)
   - Test validation errors (400 responses)
   - Test rate limiting (429 responses)
   - Target: 80%+ coverage

3. **Set up frontend component tests**
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/user-event
   ```
   - Test Login component: form submission, error display
   - Test BuildingList: render, filter, delete
   - Test RoomDetailDrawer: create, update, image upload
   - Test Dashboard: stats display, loading states
   - Target: 60%+ coverage

4. **Set up E2E tests**
   ```bash
   npm install --save-dev @playwright/test
   ```
   - Test critical flows:
     - User registration and login
     - Create building, room, contract, invoice
     - Upload room image
     - Generate batch invoices
     - Export Excel file
     - Logout
   - Run on Chrome, Firefox, Safari
   - Target: All critical flows pass

5. **Run load testing**
   ```bash
   npm install --save-dev k6
   ```
   - Simulate 50 concurrent users
   - Test scenarios:
     - Login (5 req/s)
     - List rooms (10 req/s)
     - Create invoice (2 req/s)
     - Dashboard stats (3 req/s)
   - Measure response times (p50, p95, p99)
   - Target: p95 <500ms for all endpoints

6. **Fix performance issues**
   - Identify slow queries (enable PostgreSQL slow query log)
   - Add missing database indexes
   - Optimize N+1 queries (use joins)
   - Add Redis caching for hot data (if needed)
   - Re-run load tests, verify improvements

### Week 2: Docker + CI/CD + Deployment

7. **Create backend Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   
   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/src ./src
   COPY --from=builder /app/package.json ./
   EXPOSE 5000
   USER node
   CMD ["node", "src/server.js"]
   ```
   - Multi-stage build for smaller image
   - Run as non-root user
   - Target: <200MB image size

8. **Create frontend Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```
   - Multi-stage build (Vite build → nginx)
   - Target: <150MB image size

9. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: ${DB_NAME}
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
         interval: 10s
         timeout: 5s
         retries: 5
   
     backend:
       build: ./backend
       depends_on:
         postgres:
           condition: service_healthy
       environment:
         DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
         JWT_SECRET: ${JWT_SECRET}
         NODE_ENV: production
       healthcheck:
         test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   
     frontend:
       build: ./frontend
       depends_on:
         - backend
   
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/nginx.conf:/etc/nginx/nginx.conf
         - ./nginx/ssl:/etc/nginx/ssl
       depends_on:
         - frontend
         - backend
   
   volumes:
     postgres_data:
   ```

10. **Create nginx reverse proxy config**
    ```nginx
    upstream backend {
      server backend:5000;
    }
    
    upstream frontend {
      server frontend:80;
    }
    
    server {
      listen 80;
      server_name _;
      return 301 https://$host$request_uri;
    }
    
    server {
      listen 443 ssl http2;
      server_name yourdomain.com;
      
      ssl_certificate /etc/nginx/ssl/fullchain.pem;
      ssl_certificate_key /etc/nginx/ssl/privkey.pem;
      
      # API routes
      location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
      }
      
      # Frontend
      location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
      }
    }
    ```

11. **Create CI/CD pipeline (.github/workflows/ci.yml)**
    ```yaml
    name: CI/CD Pipeline
    
    on:
      push:
        branches: [main, develop]
      pull_request:
        branches: [main]
    
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version: '20'
          
          - name: Install backend dependencies
            working-directory: ./backend
            run: npm ci
          
          - name: Run backend tests
            working-directory: ./backend
            run: npm test -- --coverage
          
          - name: Install frontend dependencies
            working-directory: ./frontend
            run: npm ci
          
          - name: Run frontend tests
            working-directory: ./frontend
            run: npm test -- --coverage
      
      build:
        needs: test
        runs-on: ubuntu-latest
        if: github.ref == 'refs/heads/main'
        steps:
          - uses: actions/checkout@v4
          
          - name: Build Docker images
            run: docker-compose build
          
          - name: Push to registry (if configured)
            run: |
              # docker push your-registry/backend:latest
              # docker push your-registry/frontend:latest
      
      deploy:
        needs: build
        runs-on: ubuntu-latest
        if: github.ref == 'refs/heads/main'
        steps:
          - name: Deploy to production
            run: |
              # ssh to server and run deploy script
              # ./scripts/deploy.sh
    ```

12. **Create blue-green deployment script**
    ```bash
    #!/bin/bash
    # scripts/deploy.sh
    
    set -e
    
    echo "Starting blue-green deployment..."
    
    # Pull latest images
    docker-compose pull
    
    # Start new containers (green)
    docker-compose up -d --no-deps --scale backend=2
    
    # Wait for health check
    echo "Waiting for health check..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:5000/health; then
      echo "Health check passed"
      
      # Stop old containers (blue)
      docker-compose up -d --no-deps --scale backend=1
      
      echo "Deployment successful"
    else
      echo "Health check failed, rolling back..."
      docker-compose up -d --no-deps --scale backend=1
      exit 1
    fi
    ```

13. **Create database backup script**
    ```bash
    #!/bin/bash
    # scripts/backup.sh
    
    set -e
    
    BACKUP_DIR="/backups"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"
    
    echo "Starting database backup..."
    
    # Create backup
    docker exec postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE
    
    echo "Backup created: $BACKUP_FILE"
    
    # Upload to S3/R2 (optional)
    # aws s3 cp $BACKUP_FILE s3://your-bucket/backups/
    
    # Delete backups older than 30 days
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
    
    echo "Backup completed"
    ```

14. **Set up automated backups (cron)**
    ```bash
    # Run daily at 2 AM
    0 2 * * * /path/to/scripts/backup.sh >> /var/log/backup.log 2>&1
    ```

15. **Deploy to production server**
    - Provision VPS (4GB RAM, 2 CPU) - DigitalOcean, Vultr, Hetzner
    - Install Docker and Docker Compose
    - Clone repository to server
    - Copy .env file with production secrets
    - Generate SSL certificates with Let's Encrypt
    - Run `docker-compose up -d`
    - Verify all services healthy
    - Configure Cloudflare DNS to point to server IP

16. **Set up monitoring**
    - Add health check endpoint: `GET /health` → Returns 200 if healthy
    - Add metrics endpoint: `GET /metrics` → Returns uptime, memory, CPU
    - Configure uptime monitoring (UptimeRobot or Pingdom)
    - Set up error tracking (Sentry or similar)
    - Create alerting rules (email/Slack on downtime)

17. **Configure log aggregation**
    - Collect Docker logs: `docker-compose logs -f`
    - Rotate logs to prevent disk fill
    - Optional: Set up centralized logging (Loki + Grafana)
    - Monitor error rates, slow queries, 5xx responses

18. **Create deployment documentation**
    - Write DEPLOYMENT.md:
      - Prerequisites (Docker, Docker Compose, domain, SSL)
      - Environment variables setup
      - Database migration steps
      - Deployment commands
      - Rollback procedure
      - Backup and restore instructions
      - Troubleshooting common issues

## Success Criteria

### Testing
- [ ] Backend unit tests pass (70%+ coverage)
- [ ] Backend integration tests pass (80%+ coverage)
- [ ] Frontend component tests pass (60%+ coverage)
- [ ] E2E tests pass for all critical flows
- [ ] Load test passes (50 concurrent users, p95 <500ms)
- [ ] Test suite runs in <5 minutes
- [ ] No flaky tests (tests pass consistently)

### Docker
- [ ] Backend Docker image builds successfully (<200MB)
- [ ] Frontend Docker image builds successfully (<150MB)
- [ ] docker-compose up starts all services
- [ ] All services pass health checks
- [ ] Services can communicate (backend → postgres, frontend → backend)

### CI/CD
- [ ] GitHub Actions pipeline runs on every push
- [ ] Tests run automatically in CI
- [ ] Docker images build in CI
- [ ] Pipeline completes in <10 minutes
- [ ] Failed tests block deployment

### Deployment
- [ ] Production server provisioned
- [ ] Docker Compose running on server
- [ ] SSL certificates installed and valid
- [ ] Application accessible via HTTPS
- [ ] All features working in production
- [ ] Database migrations applied
- [ ] No errors in production logs

### Monitoring & Backups
- [ ] Health check endpoint working
- [ ] Uptime monitoring configured
- [ ] Error tracking working (Sentry)
- [ ] Daily backups running automatically
- [ ] Backups can be restored successfully
- [ ] Alerting configured (email/Slack)
- [ ] SSL auto-renewal configured (certbot)

### Documentation
- [ ] DEPLOYMENT.md complete
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Backup/restore instructions documented
- [ ] Troubleshooting guide included

## Risk Assessment

### High Risks

**1. Database migration fails in production**
- **Mitigation:** Test on staging first, keep backup before migration, rollback script ready
- **Impact:** Production downtime, data loss
- **Probability:** Medium (complex schema changes)

**2. Blue-green deployment fails, downtime occurs**
- **Mitigation:** Test deployment script on staging, manual rollback plan ready
- **Impact:** 5-30 minutes downtime
- **Probability:** Low (tested deployment process)

**3. SSL certificate expires, site goes down**
- **Mitigation:** Set up certbot auto-renewal, monitor expiry 30 days ahead
- **Impact:** HTTPS broken, site inaccessible
- **Probability:** Low (certbot handles renewal)

### Medium Risks

**4. Docker images too large, deployment slow**
- **Mitigation:** Multi-stage builds, optimize layers, use alpine base images
- **Impact:** Slow deployments, high bandwidth costs
- **Probability:** Low (already using alpine)

**5. Load test reveals performance issues**
- **Mitigation:** Fix before production, add indexes, optimize queries, consider caching
- **Impact:** Poor UX, slow response times
- **Probability:** Medium (depends on query optimization)

**6. Backups not tested, restore fails when needed**
- **Mitigation:** Test restore procedure monthly, verify backup integrity
- **Impact:** Data loss, unable to recover
- **Probability:** Low (if tested regularly)

## Validation Checklist

Before production launch:

- [ ] All tests passing (unit, integration, E2E)
- [ ] Load test passed (50 concurrent users, p95 <500ms)
- [ ] Docker Compose working on production server
- [ ] SSL certificates installed and valid
- [ ] Cloudflare DNS configured
- [ ] Database migrated successfully
- [ ] All features tested manually in production
- [ ] Monitoring and alerting configured
- [ ] Daily backups running and tested
- [ ] Deployment documentation complete
- [ ] Rollback procedure tested
- [ ] Team trained on deployment process
- [ ] Post-launch support plan in place

## Post-Launch Monitoring (Week 1)

After production launch, monitor closely:

**Day 1-3 (Critical Window):**
- [ ] Monitor error rates (target: <1% 5xx responses)
- [ ] Monitor response times (target: p95 <500ms)
- [ ] Check database query performance
- [ ] Verify backups running successfully
- [ ] Monitor disk usage (database, logs, uploads)
- [ ] Check SSL certificate validity
- [ ] Verify all features working

**Day 4-7 (Stabilization):**
- [ ] Analyze user feedback
- [ ] Identify and fix high-priority bugs
- [ ] Optimize slow queries if found
- [ ] Adjust rate limits if needed
- [ ] Review error logs for patterns
- [ ] Verify monitoring alerts working

**Week 2+:**
- [ ] Weekly backup restore test
- [ ] Performance optimization if needed
- [ ] Plan feature enhancements (v1.1)
- [ ] Document lessons learned

## Success Metrics

**Must-Have (Launch Day):**
- ✅ Zero-downtime deployment achieved
- ✅ Application accessible via HTTPS
- ✅ All core features working
- ✅ No critical bugs reported
- ✅ Backups running daily

**Nice-to-Have (Week 1):**
- 99% uptime
- Response time p95 <500ms
- Zero data loss incidents
- <5 minor bugs reported
- Positive user feedback
