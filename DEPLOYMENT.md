# Deployment Guide

This guide covers deploying the Blood Match API to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Database Migrations](#database-migrations)
- [Health Checks](#health-checks)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker & Docker Compose installed
- PostgreSQL 16+ (or use Docker)
- Node.js 20+ (for local builds)
- Git

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] Code formatted (`npm run format:check`)
- [ ] No audit vulnerabilities (`npm audit`)
- [ ] Environment variables configured
- [ ] Database backup taken
- [ ] Health endpoint implemented (`/health`)
- [ ] Production Dockerfile in place
- [ ] Error handling middleware added
- [ ] CORS configured for your domain
- [ ] JWT_SECRET is secure and not hardcoded

---

## Environment Setup

### 1. Create `.env.production` file

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=blood_match

# JWT - Generate with: openssl rand -base64 32
JWT_SECRET=your_long_random_secret_here_min_32_chars
JWT_ISSUER=BLOOD-MATCH-API
JWT_AUDIENCE=BLOOD-MATCH-API-CLIENT
JWT_EXPIRATION=1h

# CORS - Restrict to your domains
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Logging (optional)
LOG_LEVEL=info
```

### 2. Secure Environment Variables

**Never commit `.env.production`:**

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.*.local" >> .gitignore
```

**For production, use:**

- Container orchestration secrets (Kubernetes, Docker Swarm)
- Cloud provider secrets (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
- CI/CD pipeline secrets (GitHub Actions, GitLab CI)

---

## Docker Deployment

### 1. Build the Image

```bash
# Build production image
docker build -t blood-match-api:latest .

# Tag with version
docker build -t blood-match-api:v1.0.0 .
```

### 2. Run Container

#### Standalone Container

```bash
docker run -d \
  --name blood-match-api \
  -p 3000:3000 \
  --env-file .env.production \
  --health-cmd="curl -f http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  blood-match-api:latest
```

#### With Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  api:
    image: blood-match-api:latest
    container_name: blood-match-api
    ports:
      - '3000:3000'
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
    healthcheck:
      test: ['CMD-SHELL', 'curl -fsS http://localhost:3000/health || exit 1']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    networks:
      - blood-match-network

  db:
    image: postgres:16-alpine
    container_name: blood-match-db
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME} -d ${DB_NAME}']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - blood-match-network

volumes:
  pgdata:

networks:
  blood-match-network:
    driver: bridge
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Database Migrations

### 1. Initial Setup (Fresh Database)

```bash
# Inside container
docker exec blood-match-api npm run migration:run
```

### 2. Generate New Migrations

After modifying entities:

```bash
npm run migration:generate --name=DescriptiveNameOfChanges
npm run migration:run
```

### 3. View Migration Status

```bash
docker exec blood-match-api npm run migration:show
```

### 4. Revert Last Migration (Emergency Only)

```bash
docker exec blood-match-api npm run migration:revert
```

### 5. Backup Database Before Migrations

```bash
docker exec blood-match-db pg_dump -U postgres blood_match > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Health Checks

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-05-22T10:30:00.000Z"
}
```

### 2. Container Health Status

```bash
docker ps --filter "name=blood-match-api" --format "{{.Status}}"
```

### 3. Kubernetes Probes (if using K8s)

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Monitoring & Logging

### 1. Container Logs

```bash
# Real-time logs
docker logs -f blood-match-api

# Last 100 lines
docker logs --tail 100 blood-match-api

# With timestamps
docker logs -f --timestamps blood-match-api
```

### 2. Recommended Logging Tools

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Datadog**: Application monitoring
- **New Relic**: Performance monitoring
- **CloudWatch**: AWS logging
- **Stackdriver**: GCP logging

### 3. Add Logging to Application (Optional)

```bash
npm install winston
```

### 4. Monitor Resource Usage

```bash
# CPU, Memory, Network
docker stats blood-match-api

# Detailed inspect
docker inspect blood-match-api
```

---

## Scaling Considerations

### 1. Load Balancing

Use Nginx/HAProxy:

```nginx
upstream blood_match_api {
  server localhost:3000;
  server localhost:3001;
}

server {
  listen 80;
  location / {
    proxy_pass http://blood_match_api;
  }
}
```

### 2. Database Connection Pooling

Consider using PgBouncer for PostgreSQL connection pooling.

### 3. Kubernetes Deployment (Optional)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blood-match-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blood-match-api
  template:
    metadata:
      labels:
        app: blood-match-api
    spec:
      containers:
        - name: api
          image: blood-match-api:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs blood-match-api

# Check image exists
docker images | grep blood-match-api

# Remove and rebuild
docker rm blood-match-api
docker rmi blood-match-api:latest
docker build -t blood-match-api:latest .
```

### Database Connection Issues

```bash
# Test connection
docker exec blood-match-db psql -U postgres -d blood_match -c "SELECT 1"

# Check environment variables
docker exec blood-match-api env | grep DB_

# Check connectivity between containers
docker network inspect blood-match-network
```

### Health Check Failing

```bash
# Test endpoint directly
docker exec blood-match-api curl -f http://localhost:3000/health

# Check application logs
docker logs blood-match-api

# Verify port is exposed
docker port blood-match-api
```

### Out of Memory

```bash
# Check container stats
docker stats blood-match-api

# Increase memory limit
docker run -m 1g blood-match-api:latest
```

### Migration Failed

```bash
# Check migration status
docker exec blood-match-api npm run migration:show

# Revert last migration
docker exec blood-match-api npm run migration:revert

# Restore from backup
psql -U postgres blood_match < backup_file.sql
```

---

## Post-Deployment Verification

After deployment, verify:

1. ✅ Health endpoint returns 200
2. ✅ Can authenticate with API
3. ✅ Database migrations completed
4. ✅ Container restarts on failure
5. ✅ Logs are being captured
6. ✅ CORS headers are set correctly
7. ✅ All environment variables loaded
8. ✅ No sensitive data in logs

---

## Rollback Plan

If issues occur:

```bash
# Stop current container
docker stop blood-match-api

# Start previous version
docker run -d \
  --name blood-match-api-old \
  --env-file .env.production \
  blood-match-api:v1.0.0

# Revert database (if needed)
psql -U postgres blood_match < backup_file.sql

# Fix issues, rebuild, redeploy
```

---

## Production Security Checklist

- [ ] JWT_SECRET is 32+ characters and randomly generated
- [ ] Database password is strong (16+ chars, mixed case, symbols)
- [ ] `.env.production` is NOT in git
- [ ] CORS is restricted to your domain
- [ ] All secrets use container secrets/env vars
- [ ] SSL/TLS certificate configured
- [ ] Database backups automated
- [ ] Error handling middleware in place
- [ ] Logging is configured and centralized
- [ ] Container runs as non-root user

---

## Support & References

- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
