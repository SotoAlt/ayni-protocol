#!/usr/bin/env bash
set -euo pipefail

# Ayni Protocol deployment script
# Usage: ./deploy.sh [user@host]

HOST="${1:-deploy@ayni.example.com}"
REPO_DIR="/home/deploy/ayni-protocol"
SERVER_DIR="$REPO_DIR/packages/server"

echo "Deploying Ayni Protocol to $HOST..."

ssh "$HOST" << 'EOF'
set -euo pipefail

cd /home/deploy/ayni-protocol

# Pull latest
git pull --ff-only origin main

# Install & build server
cd packages/server
npm ci --production=false
npx tsc

# Restart service
sudo systemctl restart ayni-server

# Wait and check health
sleep 2
if curl -sf http://localhost:3000/health > /dev/null; then
  echo "Deploy OK - server healthy"
  curl -s http://localhost:3000/health | head -c 200
  echo
else
  echo "DEPLOY FAILED - server not healthy"
  sudo journalctl -u ayni-server --no-pager -n 20
  exit 1
fi
EOF

echo "Deployment complete."
