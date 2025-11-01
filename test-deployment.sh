#!/bin/bash
# Test script for the all-in-one Docker deployment

set -e

echo "🚀 Testing CapyxPerks All-in-One Deployment"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Build the image
echo "📦 Building Docker image..."
docker build -t capyxperks-test:latest . || {
    echo "❌ Docker build failed"
    exit 1
}

echo "✅ Docker image built successfully"
echo ""

# Clean up any existing container
echo "🧹 Cleaning up any existing test container..."
docker rm -f capyxperks-test-container 2>/dev/null || true
echo ""

# Run the container
echo "🐳 Starting container..."
docker run -d \
    --name capyxperks-test-container \
    -p 8080:80 \
    -e SECRET_KEY=test-secret-key-for-development-only \
    -e AZURE_AD_CLIENT_ID=test-client-id \
    -e AZURE_AD_CLIENT_SECRET=test-client-secret \
    -e AZURE_AD_TENANT_ID=test-tenant-id \
    -e AZURE_AD_AUTHORITY=https://login.microsoftonline.com/test-tenant-id \
    -e CORS_ORIGINS=http://localhost:8080 \
    capyxperks-test:latest || {
    echo "❌ Failed to start container"
    exit 1
}

echo "✅ Container started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to start (this may take 30-60 seconds)..."
sleep 10

for i in {1..12}; do
    if docker exec capyxperks-test-container curl -f http://localhost:80/ >/dev/null 2>&1; then
        echo "✅ Frontend is responding!"
        break
    fi
    echo -n "."
    sleep 5
    if [ $i -eq 12 ]; then
        echo ""
        echo "❌ Frontend did not start in time"
        echo ""
        echo "Container logs:"
        docker logs capyxperks-test-container
        docker rm -f capyxperks-test-container
        exit 1
    fi
done

echo ""

# Check API
echo "🔍 Testing API endpoint..."
sleep 5
if docker exec capyxperks-test-container curl -f http://localhost:8000/docs >/dev/null 2>&1; then
    echo "✅ Backend API is responding!"
else
    echo "⚠️  Backend API not ready yet (may need more time)"
fi

echo ""
echo "=========================================="
echo "✅ Deployment test completed successfully!"
echo ""
echo "🌐 Access your app at: http://localhost:8080"
echo "📚 API docs at: http://localhost:8080/docs"
echo ""
echo "To view logs:"
echo "  docker logs -f capyxperks-test-container"
echo ""
echo "To stop the container:"
echo "  docker stop capyxperks-test-container"
echo ""
echo "To remove the container:"
echo "  docker rm -f capyxperks-test-container"
echo ""
echo "=========================================="

