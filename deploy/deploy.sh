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

# Install & build MCP HTTP server
cd ../mcp
npm ci --production=false
npx tsc

# Install MCP HTTP service if not present
if [ ! -f /etc/systemd/system/ayni-mcp-http.service ]; then
  sudo cp /home/deploy/ayni-protocol/deploy/ayni-mcp-http.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable ayni-mcp-http
fi

# Restart services
sudo systemctl restart ayni-server
sudo systemctl restart ayni-mcp-http

# Wait and check health
sleep 2
if curl -sf http://localhost:3000/health > /dev/null; then
  echo "Deploy OK - API server healthy"
  curl -s http://localhost:3000/health | head -c 200
  echo
else
  echo "DEPLOY FAILED - API server not healthy"
  sudo journalctl -u ayni-server --no-pager -n 20
  exit 1
fi

if curl -sf http://localhost:3001/health > /dev/null; then
  echo "Deploy OK - MCP HTTP server healthy"
  curl -s http://localhost:3001/health | head -c 200
  echo
else
  echo "WARN - MCP HTTP server not healthy (non-critical)"
  sudo journalctl -u ayni-mcp-http --no-pager -n 10
fi
EOF

echo "Deployment complete."
