#!/bin/bash

# Configuration
PI_USER="pi"
PI_HOST="192.168.1.130"
PI_DIR="~/node_temperature"
IMAGE_NAME="temp-monitor"
TAR_FILE="temp-monitor.tar"
DOCKER_COMPOSE_FILE="docker-compose.yaml"

if [ "$1" == "--quick" ]; then
    echo "🚀 Quick Deploy Mode (Code Sync Only)..."
    
    # Sync source files only (skipping node_modules, .git, etc via rsync exclusions if needed)
    # Using scp for simplicity
    echo "📤 Syncing code to Pi..."
    scp -r server.js package.json TemperatureService.js index.html entrypoint.sh public services $PI_USER@$PI_HOST:$PI_DIR/
    
    echo "🔄 Restarting server on Pi..."
    ssh -t $PI_USER@$PI_HOST "cd $PI_DIR && \
        echo 'Restarting container to pick up changes...' && \
        sudo docker compose restart temp-monitor && \
        echo 'Done!'"
        
    echo "✅ Quick update complete!"
    exit 0
fi

echo "🚀 Full Deployment to Raspberry Pi ($PI_HOST)..."

# 1. Build & Export directly to tar
echo "📦 Building & Exporting Docker image for ARMv6..."
docker buildx build --platform linux/arm/v6 -t $IMAGE_NAME:latest --output type=docker,dest=$TAR_FILE .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 2. Transfer to Pi
echo "📤 Transferring image to Pi..."
scp $TAR_FILE $PI_USER@$PI_HOST:$PI_DIR/
scp $DOCKER_COMPOSE_FILE $PI_USER@$PI_HOST:$PI_DIR/

# 3. Load and Restart on Pi
echo "🔄 Connecting to Pi to load image (this may take a few minutes)..."
ssh -t $PI_USER@$PI_HOST "cd $PI_DIR && \
    echo 'Loading Docker image...' && \
    sudo docker load -i $TAR_FILE && \
    echo 'Restarting containers...' && \
    sudo docker compose -f $DOCKER_COMPOSE_FILE up -d && \
    rm $TAR_FILE && \
    echo 'Done!'"

# 4. Cleanup local file
rm $TAR_FILE

echo "✅ Full Deployment complete!"
