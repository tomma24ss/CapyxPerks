# Multi-stage build: Build frontend first
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Main image with all services
FROM python:3.11-slim

# Install system dependencies and add PostgreSQL repository
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    procps \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y \
    postgresql-15 \
    postgresql-client-15 \
    redis-server \
    redis-tools \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Set up PostgreSQL
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql && \
    mkdir -p /var/run/postgresql && \
    chown -R postgres:postgres /var/run/postgresql

# Initialize PostgreSQL as postgres user
USER postgres
RUN /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data
USER root

# Configure PostgreSQL
RUN echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf && \
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf && \
    echo "port=5432" >> /var/lib/postgresql/data/postgresql.conf

# Set up backend
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./

# Set up frontend with nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY nginx-production.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Create uploads directory
RUN mkdir -p /app/backend/uploads && chmod 777 /app/backend/uploads

# Copy supervisord configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy initialization and startup scripts
COPY init.sh /app/init.sh
COPY start-backend.sh /app/start-backend.sh
RUN chmod +x /app/init.sh /app/start-backend.sh

# Set default environment variables
ENV SECRET_KEY=change-this-in-production \
    ALGORITHM=HS256 \
    ACCESS_TOKEN_EXPIRE_MINUTES=30 \
    ENVIRONMENT=production \
    CORS_ORIGINS=http://localhost

# Expose port 80 (nginx will serve both frontend and proxy backend)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start services with supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
