
#!/bin/bash

# Email Service Setup Script
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root. Use: sudo $0"
fi

log "Setting up email service..."

# Create server directory
SERVER_DIR="/var/www/html/crm/server"
mkdir -p "$SERVER_DIR"

# Copy email service files from current directory
if [ -f "server/email-service.js" ]; then
    cp server/email-service.js "$SERVER_DIR/"
    cp server/package.json "$SERVER_DIR/"
    log "Email service files copied"
else
    error "Email service files not found in server/ directory"
fi

# Install dependencies
cd "$SERVER_DIR"
npm install
log "Dependencies installed"

# Create systemd service file
cat > /etc/systemd/system/email-service.service << EOF
[Unit]
Description=FreePBX CRM Email Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$SERVER_DIR
ExecStart=/usr/bin/node email-service.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=EMAIL_PORT=3002

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chown -R www-data:www-data "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

# Enable and start service
systemctl daemon-reload
systemctl enable email-service
systemctl start email-service

# Check service status
sleep 3
if systemctl is-active --quiet email-service; then
    log "Email service started successfully"
    log "Service status: $(systemctl is-active email-service)"
    log "Listening on port 3002"
else
    error "Failed to start email service"
fi

log "Email service setup completed!"
EOF

chmod +x setup-email-service.sh
