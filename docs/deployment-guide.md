# Deployment Guide

**Project:** QUAN-LY-CHDV  
**Version:** 1.0  
**Last Updated:** June 16, 2026  
**Target:** Production deployment with Docker Compose

---

## Overview

This guide covers deploying the QUAN-LY-CHDV property management system to production using Docker Compose with Nginx reverse proxy. The deployment includes PostgreSQL database, Node.js backend, React frontend, and SSL/TLS encryption.

**Architecture:**
```
Internet → Cloudflare CDN → Nginx (SSL) → Frontend (React) + Backend (Express) → PostgreSQL
```

---

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- 2 vCPU
- 4GB RAM
- 80GB SSD storage
- Ubuntu 22.04 LTS or Debian 12
- Public IP address

**Recommended VPS Providers:**
- DigitalOcean ($24/month for 4GB Droplet)
- Vultr ($18/month for 4GB Cloud Compute)
- Hetzner ($10/month for 4GB CX22)
- Linode ($24/month for 4GB Shared)

### Software Requirements

- Docker 24+ with Compose V2
- Domain name (e.g., yourdomain.com)
- Cloudflare account (free tier)

---

## Pre-Deployment Setup

### 1. Server Provisioning

```bash
# SSH into your server
ssh root@your-server-ip

# Update system packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose V2 (included with Docker 24+)
docker compose version

# Create non-root user
adduser deployer
usermod -aG docker deployer
usermod -aG sudo deployer

# Switch to deployer user
su - deployer
```

### 2. Firewall Configuration

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 3. SSH Security

```bash
# Generate SSH key on your local machine
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id deployer@your-server-ip

# Disable root login and password authentication
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

sudo systemctl restart sshd
```

### 4. Domain Setup

**Cloudflare DNS:**
1. Log in to Cloudflare
2. Add your domain
3. Create A record: `@` → `your-server-ip`
4. Create A record: `www` → `your-server-ip`
5. Enable proxy (orange cloud icon)
6. SSL/TLS mode: Full (Strict)

**Wait for DNS propagation (5-30 minutes)**

```bash
# Verify DNS resolution
dig yourdomain.com
nslookup yourdomain.com
```

---

## Deployment Steps

### Step 1: Clone Repository

```bash
# Create deployment directory
sudo mkdir -p /opt/rentflow
sudo chown deployer:deployer /opt/rentflow
cd /opt/rentflow

# Clone repository (or upload files via SCP)
git clone https://github.com/yourusername/quan-ly-chdv.git .

# Or upload via SCP from local machine
scp -r /path/to/quan-ly-chdv/* deployer@your-server-ip:/opt/rentflow/
```

### Step 2: Environment Configuration

```bash
# Create environment file
nano .env.production
```

**Contents of `.env.production`:**

```bash
# Database Configuration
DB_NAME=rentflow
DB_USER=rentflow_admin
DB_PASSWORD=<generate-strong-password>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${DB_NAME}

# Backend Configuration
NODE_ENV=production
PORT=5000
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info

# Frontend Build Args
VITE_API_URL=https://yourdomain.com/api

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate secrets:**

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate database password (32 chars, alphanumeric + symbols)
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### Step 3: SSL Certificate Setup

**Option A: Let's Encrypt (Recommended)**

```bash
# Install certbot
sudo apt install certbot

# Stop any service using port 80/443
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates stored in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Copy to project directory
sudo mkdir -p /opt/rentflow/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/rentflow/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/rentflow/nginx/ssl/
sudo chown deployer:deployer /opt/rentflow/nginx/ssl/*
```

**Option B: Self-Signed Certificate (Development Only)**

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=yourdomain.com"
```

### Step 4: Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: rentflow-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - rentflow-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: rentflow-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN}
      CORS_ORIGIN: ${CORS_ORIGIN}
      LOG_LEVEL: ${LOG_LEVEL}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - rentflow-network
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: rentflow-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - rentflow-network

  nginx:
    image: nginx:1.25-alpine
    container_name: rentflow-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_cache:/var/cache/nginx
      - nginx_logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - rentflow-network

volumes:
  postgres_data:
    driver: local
  nginx_cache:
    driver: local
  nginx_logs:
    driver: local

networks:
  rentflow-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### Step 5: Nginx Configuration

Create `nginx/conf.d/rentflow.conf`:

```nginx
upstream backend_api {
    least_conn;
    server backend:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream frontend_app {
    server frontend:80;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=3r/s;

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    server_tokens off;
    client_max_body_size 10M;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;
        
        proxy_pass http://backend_api/;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Auth endpoints with stricter rate limit
    location ~ ^/api/(login|register|refresh) {
        limit_req zone=auth_limit burst=5 nodelay;
        limit_req_status 429;
        
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }
    
    # Static assets with aggressive caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend_app;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Frontend SPA fallback
    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # SPA routing support
        proxy_intercept_errors on;
        error_page 404 = /index.html;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Step 6: Database Initialization

Create `backend/db/init.sql` with the complete PostgreSQL schema (14 tables). Reference the schema from the Docker deployment research report.

### Step 7: Build and Deploy

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build Docker images
docker compose build --no-cache

# Start services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f

# Check individual service logs
docker compose logs backend
docker compose logs postgres
docker compose logs nginx
```

### Step 8: Verify Deployment

```bash
# Test health endpoints
curl http://localhost/health
curl http://localhost/api/health

# Test from external
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health

# Check database connection
docker compose exec postgres psql -U rentflow_admin -d rentflow -c "\dt"

# Check SSL certificate
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## Database Migration

### Export localStorage Data

Run this in the browser console on the current MVP site:

```javascript
(function exportLocalStorage() {
  const data = {
    rentflow_rooms: JSON.parse(localStorage.getItem('rentflow_rooms') || '[]'),
    rentflow_tenants: JSON.parse(localStorage.getItem('rentflow_tenants') || '[]'),
    rentflow_contracts: JSON.parse(localStorage.getItem('rentflow_contracts') || '[]'),
    rentflow_invoices: JSON.parse(localStorage.getItem('rentflow_invoices') || '[]'),
    rentflow_tickets: JSON.parse(localStorage.getItem('rentflow_tickets') || '{"reported":[],"inProgress":[],"resolved":[]}'),
    rentflow_settings: JSON.parse(localStorage.getItem('rentflow_settings') || '{}'),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rentflow-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
})();
```

### Import Data to PostgreSQL

```bash
# Copy export file to server
scp rentflow-export-*.json deployer@your-server-ip:/opt/rentflow/backend/

# Run migration script
docker compose exec backend node scripts/migrate-localstorage.js /app/rentflow-export-*.json

# Verify data
docker compose exec postgres psql -U rentflow_admin -d rentflow -c "SELECT COUNT(*) FROM rooms;"
docker compose exec postgres psql -U rentflow_admin -d rentflow -c "SELECT COUNT(*) FROM tenants;"
```

---

## Backup and Restore

### Automated Daily Backup

Create `/opt/rentflow/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/opt/rentflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rentflow_backup_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Run pg_dump
docker compose exec -T postgres pg_dump -U rentflow_admin rentflow | gzip > $BACKUP_FILE

# Upload to S3 or Cloudflare R2 (optional)
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Set up cron job:**

```bash
chmod +x /opt/rentflow/scripts/backup.sh

# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/rentflow/scripts/backup.sh >> /var/log/rentflow-backup.log 2>&1
```

### Manual Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U rentflow_admin rentflow > backup.sql

# Backup uploaded files
tar -czf uploads-backup.tar.gz backend/uploads/

# Backup entire Docker volumes
docker run --rm -v rentflow_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-volume.tar.gz -C /data .
```

### Restore from Backup

```bash
# Stop services
docker compose down

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U rentflow_admin rentflow

# Or restore from compressed backup
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U rentflow_admin rentflow

# Restore uploaded files
tar -xzf uploads-backup.tar.gz

# Start services
docker compose up -d
```

---

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check service health
docker compose ps

# View resource usage
docker stats

# Check disk space
df -h

# Check logs for errors
docker compose logs --tail=100 backend | grep -i error
```

### Log Rotation

Create `/etc/logrotate.d/rentflow`:

```
/opt/rentflow/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 deployer deployer
}

/opt/rentflow/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 deployer deployer
    sharedscripts
    postrotate
        docker compose exec nginx nginx -s reload > /dev/null 2>&1
    endscript
}
```

### SSL Certificate Renewal

```bash
# Auto-renewal via cron (every 3 months)
crontab -e

# Add: Run certbot renewal every Monday at 3 AM
0 3 * * 1 certbot renew --quiet --post-hook "docker compose restart nginx"
```

### Update Deployment

```bash
cd /opt/rentflow

# Pull latest code
git pull origin main

# Rebuild images
docker compose build

# Rolling update (zero downtime)
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build frontend

# Or full restart
docker compose down
docker compose up -d
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Database not ready - wait for postgres healthcheck
# 2. Wrong DATABASE_URL - check .env.production
# 3. Port conflict - ensure port 5000 not used

# Restart backend
docker compose restart backend
```

### Database Connection Errors

```bash
# Test database connection
docker compose exec postgres psql -U rentflow_admin -d rentflow

# Check database is running
docker compose ps postgres

# Reset database (DANGER: deletes all data)
docker compose down
docker volume rm rentflow_postgres_data
docker compose up -d
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
docker compose ps backend

# Check backend health endpoint
docker compose exec backend wget -O- http://localhost:5000/health

# Check nginx config syntax
docker compose exec nginx nginx -t

# Reload nginx
docker compose exec nginx nginx -s reload
```

### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# Renew certificate
sudo certbot renew --force-renewal

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/rentflow/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/rentflow/nginx/ssl/

# Restart nginx
docker compose restart nginx
```

### High Memory Usage

```bash
# Check container memory usage
docker stats

# Limit PostgreSQL memory
# Add to docker-compose.yml under postgres service:
    deploy:
      resources:
        limits:
          memory: 1G

# Restart with limits
docker compose up -d
```

---

## Performance Optimization

### Enable Redis Cache (Optional)

Add to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: rentflow-redis
  restart: unless-stopped
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  networks:
    - rentflow-network
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 3s
    retries: 3
```

### Database Query Optimization

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries >1s
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add missing indexes (if needed)
CREATE INDEX idx_invoices_room_month ON invoices(room_id, period_year, period_month);
```

---

## Security Checklist

- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] SSL/TLS certificates installed
- [ ] Database password is strong (32+ characters)
- [ ] JWT secrets are randomly generated
- [ ] `.env.production` not committed to git
- [ ] Docker containers running as non-root user
- [ ] Rate limiting enabled on API endpoints
- [ ] CORS restricted to frontend domain only
- [ ] Security headers configured in Nginx
- [ ] Database port not exposed publicly (127.0.0.1:5432)
- [ ] Daily backups automated
- [ ] Log monitoring configured

---

## Cost Estimation

**Monthly Infrastructure Costs:**

| Resource | Provider | Cost |
|----------|----------|------|
| VPS (4GB RAM) | Vultr | $18 |
| Domain (.com) | Namecheap | $1.17 |
| SSL Certificate | Let's Encrypt | $0 |
| CDN | Cloudflare | $0 |
| Backups (50GB) | Cloudflare R2 | $0.30 |
| **Total** | | **~$20/month** |

---

## Related Documents

- `docs/system-architecture.md` - Architecture details
- `docs/project-roadmap.md` - Implementation timeline
- `plans/reports/brainstormer-260616-2314-docker-deployment-research-report.md` - Docker research

---

**Document Owner:** DevOps Team  
**Last Updated:** June 16, 2026  
**Next Review:** After first production deployment
