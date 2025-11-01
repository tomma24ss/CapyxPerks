#!/bin/bash
# Nginx startup script that handles Koyeb's PORT variable

# Get the port from environment or default to 80
PORT=${PORT:-80}

echo "Starting Nginx on port ${PORT}..."

# Update nginx configuration to use the correct port
sed -i "s/listen 80;/listen ${PORT};/" /etc/nginx/sites-available/default

echo "Nginx configuration updated to listen on port ${PORT}"

# Test nginx configuration
nginx -t

# Start nginx
echo "Starting Nginx..."
exec /usr/sbin/nginx -g 'daemon off;'

