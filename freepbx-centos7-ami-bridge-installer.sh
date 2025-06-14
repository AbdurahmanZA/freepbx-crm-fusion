
#!/bin/bash

# FreePBX CentOS 7 AMI Bridge Complete Installation Script
# This script installs Node.js 16, creates AMI bridge service, and configures FreePBX integration

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Configuration variables
SERVICE_USER="ami-bridge"
AMI_BRIDGE_DIR="/opt/ami-bridge"
AMI_USER="admin"
AMI_PASSWORD="amp111"

# Auto-detect server IP
detect_server_ip() {
    local ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
    if [ -z "$ip" ]; then
        ip=$(ip route get 8.8.8.8 | grep -oP 'src \K\S+' 2>/dev/null || echo "127.0.0.1")
    fi
    echo "$ip"
}

SERVER_IP=$(detect_server_ip)

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root. Use: sudo $0"
    fi
}

# Check system requirements
check_system() {
    log "Checking system requirements..."
    
    # Check OS
    if [ ! -f /etc/redhat-release ]; then
        error "This script is designed for RedHat/CentOS systems"
    fi
    
    local os_version=$(cat /etc/redhat-release)
    log "Detected OS: $os_version"
    log "Server IP: $SERVER_IP"
    
    # Check if CentOS 7
    if ! echo "$os_version" | grep -q "CentOS.*7"; then
        warn "This script is optimized for CentOS 7. Continue at your own risk."
        read -p "Continue anyway? (y/N): " choice
        case "$choice" in 
            y|Y ) log "Continuing...";;
            * ) exit 0;;
        esac
    fi
    
    # Check available space (minimum 2GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then
        error "Insufficient disk space. At least 2GB required"
    fi
    
    log "System requirements check passed"
}

# Install Node.js 16 (Multiple methods for CentOS 7 compatibility)
install_nodejs() {
    log "Installing Node.js 16 LTS (CentOS 7 compatible)..."
    
    # Remove existing Node.js
    yum remove -y nodejs npm 2>/dev/null || true
    
    # Clean up any existing repositories
    rm -f /etc/yum.repos.d/nodesource*.repo
    yum clean all
    
    # Method 1: Try EPEL repository first (most reliable for CentOS 7)
    log "Attempting installation via EPEL repository..."
    if install_nodejs_epel; then
        return 0
    fi
    
    # Method 2: Try direct binary installation
    log "EPEL method failed, trying direct binary installation..."
    if install_nodejs_binary; then
        return 0
    fi
    
    # Method 3: Try compilation from source (last resort)
    log "Binary method failed, trying source compilation..."
    if install_nodejs_source; then
        return 0
    fi
    
    error "All Node.js installation methods failed"
}

# Method 1: Install via EPEL
install_nodejs_epel() {
    log "Installing Node.js via EPEL repository..."
    
    # Install EPEL release
    yum install -y epel-release || return 1
    
    # Install development tools needed
    yum groupinstall -y "Development Tools" || return 1
    
    # Install Node.js from EPEL (usually older version, but compatible)
    yum install -y nodejs npm || return 1
    
    # Check if we got a working Node.js
    local node_version=$(node --version 2>/dev/null || echo "")
    if [[ -n "$node_version" ]]; then
        log "Node.js installed via EPEL: $node_version"
        
        # Update npm if possible
        npm install -g npm@latest 2>/dev/null || true
        
        return 0
    fi
    
    return 1
}

# Method 2: Install via pre-compiled binaries
install_nodejs_binary() {
    log "Installing Node.js via pre-compiled binaries..."
    
    local NODE_VERSION="16.20.2"
    local NODE_ARCH="linux-x64"
    local NODE_TARBALL="node-v${NODE_VERSION}-${NODE_ARCH}.tar.xz"
    local NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TARBALL}"
    local INSTALL_DIR="/usr/local"
    
    # Download Node.js binary
    cd /tmp
    if ! wget "$NODE_URL"; then
        error "Failed to download Node.js binary"
        return 1
    fi
    
    # Extract and install
    tar -xf "$NODE_TARBALL" || return 1
    
    # Copy files to system directories
    local NODE_DIR="node-v${NODE_VERSION}-${NODE_ARCH}"
    cp -r "${NODE_DIR}/bin"/* "${INSTALL_DIR}/bin/" || return 1
    cp -r "${NODE_DIR}/lib"/* "${INSTALL_DIR}/lib/" || return 1
    cp -r "${NODE_DIR}/include"/* "${INSTALL_DIR}/include/" || return 1
    cp -r "${NODE_DIR}/share"/* "${INSTALL_DIR}/share/" || return 1
    
    # Create symlinks if needed
    ln -sf "${INSTALL_DIR}/bin/node" /usr/bin/node 2>/dev/null || true
    ln -sf "${INSTALL_DIR}/bin/npm" /usr/bin/npm 2>/dev/null || true
    
    # Clean up
    rm -rf "/tmp/${NODE_TARBALL}" "/tmp/${NODE_DIR}"
    
    # Verify installation
    local node_version=$(node --version 2>/dev/null || echo "")
    if [[ -n "$node_version" ]]; then
        log "Node.js installed via binary: $node_version"
        return 0
    fi
    
    return 1
}

# Method 3: Compile from source (last resort)
install_nodejs_source() {
    log "Compiling Node.js from source (this may take 20-30 minutes)..."
    
    # Install build dependencies
    yum groupinstall -y "Development Tools" || return 1
    yum install -y gcc-c++ make python2 git || return 1
    
    local NODE_VERSION="16.20.2"
    local NODE_TARBALL="node-v${NODE_VERSION}.tar.gz"
    local NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TARBALL}"
    
    cd /tmp
    
    # Download source
    if ! wget "$NODE_URL"; then
        error "Failed to download Node.js source"
        return 1
    fi
    
    # Extract
    tar -xzf "$NODE_TARBALL" || return 1
    cd "node-v${NODE_VERSION}" || return 1
    
    # Configure (use Python 2 explicitly for CentOS 7)
    if ! python2 configure --prefix=/usr/local; then
        error "Node.js configure failed"
        return 1
    fi
    
    # Compile (this takes a long time)
    if ! make -j$(nproc); then
        error "Node.js compilation failed"
        return 1
    fi
    
    # Install
    if ! make install; then
        error "Node.js installation failed"
        return 1
    fi
    
    # Create symlinks
    ln -sf /usr/local/bin/node /usr/bin/node 2>/dev/null || true
    ln -sf /usr/local/bin/npm /usr/bin/npm 2>/dev/null || true
    
    # Clean up
    cd /
    rm -rf "/tmp/node-v${NODE_VERSION}" "/tmp/${NODE_TARBALL}"
    
    # Verify installation
    local node_version=$(node --version 2>/dev/null || echo "")
    if [[ -n "$node_version" ]]; then
        log "Node.js compiled and installed: $node_version"
        return 0
    fi
    
    return 1
}

# Create service user
create_service_user() {
    log "Creating service user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d "$AMI_BRIDGE_DIR" "$SERVICE_USER"
        log "Created user: $SERVICE_USER"
    else
        warn "User $SERVICE_USER already exists"
    fi
}

# Create AMI Bridge application
create_ami_bridge_app() {
    log "Creating AMI Bridge application..."
    
    # Create application directory
    mkdir -p "$AMI_BRIDGE_DIR"
    cd "$AMI_BRIDGE_DIR"
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "freepbx-ami-bridge",
  "version": "1.0.0",
  "description": "FreePBX AMI Bridge for CRM Integration",
  "main": "ami-bridge.js",
  "scripts": {
    "start": "node ami-bridge.js",
    "dev": "node ami-bridge.js"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

    # Create configuration file with comprehensive CORS origins
    cat > config.json << EOF
{
  "ami": {
    "host": "127.0.0.1",
    "port": 5038,
    "username": "$AMI_USER",
    "password": "$AMI_PASSWORD"
  },
  "bridge": {
    "port": 3001,
    "websocket_port": 8080
  },
  "security": {
    "allowed_origins": [
      "http://localhost",
      "http://127.0.0.1",
      "http://$SERVER_IP",
      "http://$SERVER_IP:80",
      "http://$SERVER_IP:3000",
      "http://$SERVER_IP/crm",
      "https://$SERVER_IP",
      "https://$SERVER_IP:443",
      "http://192.168.0.132",
      "http://192.168.0.132:80",
      "http://192.168.0.132:3000",
      "http://192.168.0.132/crm",
      "https://192.168.0.132",
      "*"
    ],
    "rate_limit": {
      "window_ms": 60000,
      "max_requests": 100
    }
  }
}
EOF

    # Create main application file
    cat > ami-bridge.js << 'EOF'
const express = require('express');
const WebSocket = require('ws');
const net = require('net');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// CORS configuration
const corsOptions = {
    origin: config.security.allowed_origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// AMI Connection management
let amiConnection = null;
let isConnected = false;
let reconnectTimer = null;

// WebSocket clients
const clients = new Set();

// AMI Event handlers
function handleAMIEvent(event) {
    console.log('[AMI Bridge] Event received:', event.Event);
    
    // Broadcast to all WebSocket clients
    const message = {
        type: 'event',
        data: event,
        timestamp: new Date().toISOString()
    };
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(message));
            } catch (error) {
                console.error('[AMI Bridge] Error sending to client:', error);
                clients.delete(client);
            }
        }
    });
}

// AMI Connection functions
function connectToAMI(amiConfig) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        
        socket.connect(amiConfig.port, amiConfig.host, () => {
            console.log('[AMI Bridge] Connected to Asterisk Manager Interface');
            
            // Send login
            const loginAction = `Action: Login\r\nUsername: ${amiConfig.username}\r\nSecret: ${amiConfig.password}\r\n\r\n`;
            socket.write(loginAction);
        });
        
        let buffer = '';
        socket.on('data', (data) => {
            buffer += data.toString();
            
            // Process complete messages
            let messages = buffer.split('\r\n\r\n');
            buffer = messages.pop() || '';
            
            messages.forEach(message => {
                if (message.trim()) {
                    const event = parseAMIMessage(message);
                    if (event) {
                        handleAMIEvent(event);
                        
                        // Handle login response
                        if (event.Response === 'Success' && event.Message === 'Authentication accepted') {
                            isConnected = true;
                            amiConnection = socket;
                            resolve(true);
                        } else if (event.Response === 'Error') {
                            reject(new Error(event.Message || 'AMI authentication failed'));
                        }
                    }
                }
            });
        });
        
        socket.on('error', (err) => {
            console.error('[AMI Bridge] AMI connection error:', err);
            isConnected = false;
            amiConnection = null;
            reject(err);
        });
        
        socket.on('close', () => {
            console.log('[AMI Bridge] AMI connection closed');
            isConnected = false;
            amiConnection = null;
            
            // Auto-reconnect after 5 seconds
            if (!reconnectTimer) {
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    connectToAMI(config.ami).catch(console.error);
                }, 5000);
            }
        });
    });
}

function parseAMIMessage(message) {
    const lines = message.split('\r\n');
    const event = {};
    
    lines.forEach(line => {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
            event[match[1]] = match[2];
        }
    });
    
    return Object.keys(event).length > 0 ? event : null;
}

function sendAMIAction(action) {
    return new Promise((resolve, reject) => {
        if (!amiConnection || !isConnected) {
            reject(new Error('AMI not connected'));
            return;
        }
        
        const actionId = Date.now().toString();
        action.ActionID = actionId;
        
        let actionString = '';
        for (const [key, value] of Object.entries(action)) {
            actionString += `${key}: ${value}\r\n`;
        }
        actionString += '\r\n';
        
        console.log('[AMI Bridge] Sending action:', action.Action);
        amiConnection.write(actionString);
        
        // Simple resolve for now - in production, you'd want to track responses
        setTimeout(() => resolve({ success: true, actionId }), 1000);
    });
}

// API Routes
app.post('/api/ami/connect', async (req, res) => {
    try {
        const result = await connectToAMI(req.body || config.ami);
        res.json({ success: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ami/disconnect', async (req, res) => {
    try {
        if (amiConnection) {
            amiConnection.end();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/ami/status', (req, res) => {
    res.json({ 
        connected: isConnected, 
        timestamp: new Date().toISOString(),
        clients: clients.size
    });
});

app.post('/api/ami/originate', async (req, res) => {
    try {
        const { channel, extension, context, callerID, priority } = req.body;
        
        if (!channel || !extension) {
            return res.status(400).json({ 
                success: false, 
                error: 'Channel and extension are required' 
            });
        }
        
        const action = {
            Action: 'Originate',
            Channel: channel,
            Exten: extension,
            Context: context || 'from-internal',
            Priority: priority || 1,
            CallerID: callerID || 'CRM System',
            Timeout: 30000
        };
        
        const result = await sendAMIAction(action);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ami/hangup', async (req, res) => {
    try {
        const { channel } = req.body;
        
        if (!channel) {
            return res.status(400).json({ 
                success: false, 
                error: 'Channel is required' 
            });
        }
        
        const action = {
            Action: 'Hangup',
            Channel: channel
        };
        
        const result = await sendAMIAction(action);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/ami/channels', async (req, res) => {
    try {
        const action = {
            Action: 'CoreShowChannels'
        };
        
        const result = await sendAMIAction(action);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        ami_connected: isConnected,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// WebSocket handling
wss.on('connection', (ws, req) => {
    console.log('[AMI Bridge] WebSocket client connected from:', req.connection.remoteAddress);
    clients.add(ws);
    
    // Send current status
    ws.send(JSON.stringify({
        type: 'status',
        connected: isConnected,
        timestamp: new Date().toISOString()
    }));
    
    ws.on('close', () => {
        console.log('[AMI Bridge] WebSocket client disconnected');
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('[AMI Bridge] WebSocket error:', error);
        clients.delete(ws);
    });
    
    // Handle ping/pong for connection health
    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

// WebSocket heartbeat
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            clients.delete(ws);
            return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Start servers
const PORT = config.bridge.port || 3001;
const WS_PORT = config.bridge.websocket_port || 8080;

// Start HTTP server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AMI Bridge] HTTP server running on port ${PORT}`);
    console.log(`[AMI Bridge] CORS origins: ${config.security.allowed_origins.join(', ')}`);
});

// Start WebSocket server
server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`[AMI Bridge] WebSocket server running on port ${WS_PORT}`);
});

// Initial AMI connection
connectToAMI(config.ami).catch(error => {
    console.error('[AMI Bridge] Initial connection failed:', error.message);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[AMI Bridge] Shutting down...');
    clearInterval(interval);
    if (amiConnection) {
        amiConnection.end();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[AMI Bridge] Shutting down...');
    clearInterval(interval);
    if (amiConnection) {
        amiConnection.end();
    }
    process.exit(0);
});
EOF

    # Install dependencies
    log "Installing Node.js dependencies..."
    npm install
    
    # Set permissions
    chown -R "$SERVICE_USER:$SERVICE_USER" "$AMI_BRIDGE_DIR"
    chmod 755 "$AMI_BRIDGE_DIR"
    chmod 644 "$AMI_BRIDGE_DIR"/*.js
    chmod 644 "$AMI_BRIDGE_DIR"/*.json
    
    log "AMI Bridge application created"
}

# Configure FreePBX AMI
configure_freepbx_ami() {
    log "Configuring FreePBX AMI..."
    
    # Backup original manager.conf
    cp /etc/asterisk/manager.conf /etc/asterisk/manager.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    # Check if AMI user already exists
    if ! grep -q "\[$AMI_USER\]" /etc/asterisk/manager.conf; then
        cat >> /etc/asterisk/manager.conf << EOF

[$AMI_USER]
secret = $AMI_PASSWORD
permit = 127.0.0.1/255.255.255.255
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
EOF
        log "Added AMI user: $AMI_USER"
    else
        warn "AMI user $AMI_USER already exists in manager.conf"
    fi
    
    # Ensure AMI is enabled
    sed -i 's/enabled = no/enabled = yes/' /etc/asterisk/manager.conf
    sed -i 's/^;enabled = yes/enabled = yes/' /etc/asterisk/manager.conf
    
    # Reload Asterisk manager
    asterisk -rx "manager reload" 2>/dev/null || true
    
    log "FreePBX AMI configured"
}

# Create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    
    cat > /etc/systemd/system/ami-bridge.service << EOF
[Unit]
Description=FreePBX AMI Bridge
After=network.target asterisk.service
Wants=asterisk.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$AMI_BRIDGE_DIR
ExecStart=/usr/bin/node ami-bridge.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable ami-bridge
    
    log "Systemd service created and enabled for auto-start"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Check if firewalld is running
    if systemctl is-active --quiet firewalld; then
        firewall-cmd --permanent --add-port=3001/tcp
        firewall-cmd --permanent --add-port=8080/tcp
        firewall-cmd --permanent --add-port=5038/tcp
        firewall-cmd --reload
        log "Firewalld rules added for ports 3001, 8080, 5038"
    # Check if iptables is available
    elif command -v iptables >/dev/null; then
        iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
        iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
        iptables -A INPUT -p tcp --dport 5038 -j ACCEPT
        service iptables save 2>/dev/null || true
        log "Iptables rules added for ports 3001, 8080, 5038"
    else
        warn "No firewall detected. Please manually open ports 3001, 8080, and 5038"
    fi
}

# Start services
start_services() {
    log "Starting AMI Bridge service..."
    
    systemctl start ami-bridge
    sleep 5
    
    if systemctl is-active --quiet ami-bridge; then
        log "AMI Bridge service started successfully"
        
        # Test the service
        if curl -s "http://localhost:3001/health" >/dev/null 2>&1; then
            log "AMI Bridge API health check passed"
        else
            warn "AMI Bridge API health check failed"
        fi
    else
        error "Failed to start AMI Bridge service"
        echo "Service status:"
        systemctl status ami-bridge --no-pager -l
        echo "Service logs:"
        journalctl -u ami-bridge --no-pager -n 20
        exit 1
    fi
}

# Create management scripts
create_management_scripts() {
    log "Creating management scripts..."
    
    cat > /usr/local/bin/ami-bridge-status << 'EOF'
#!/bin/bash
echo "FreePBX AMI Bridge Status"
echo "========================"
echo "Service Status: $(systemctl is-active ami-bridge)"
echo "Service Enabled: $(systemctl is-enabled ami-bridge)"
echo "Service Uptime: $(systemctl show ami-bridge --property=ActiveEnterTimestamp --value)"
echo ""
echo "Network Ports:"
netstat -tlnp | grep -E ':(3001|8080|5038)' || echo "No listening ports found"
echo ""
echo "API Health Check:"
curl -s http://localhost:3001/health | python -m json.tool 2>/dev/null || echo "API not responding"
echo ""
echo "Service Logs (last 10 lines):"
journalctl -u ami-bridge --no-pager -n 10
EOF

    chmod +x /usr/local/bin/ami-bridge-status
    
    cat > /usr/local/bin/ami-bridge-restart << 'EOF'
#!/bin/bash
echo "Restarting AMI Bridge service..."
systemctl restart ami-bridge
sleep 3
echo "Service status after restart:"
systemctl status ami-bridge --no-pager -l
echo ""
echo "Testing API..."
sleep 2
curl -s http://localhost:3001/health | python -m json.tool 2>/dev/null || echo "API test failed"
EOF

    chmod +x /usr/local/bin/ami-bridge-restart
    
    cat > /usr/local/bin/ami-bridge-logs << 'EOF'
#!/bin/bash
echo "Following AMI Bridge logs (Ctrl+C to exit)..."
journalctl -u ami-bridge -f
EOF

    chmod +x /usr/local/bin/ami-bridge-logs
    
    log "Management scripts created: ami-bridge-status, ami-bridge-restart, ami-bridge-logs"
}

# Main installation function
main() {
    log "Starting FreePBX AMI Bridge installation for CentOS 7..."
    
    check_root
    check_system
    install_nodejs
    create_service_user
    create_ami_bridge_app
    configure_freepbx_ami
    create_systemd_service
    configure_firewall
    start_services
    create_management_scripts
    
    log "Installation completed successfully!"
    
    echo ""
    echo "=============================================="
    echo "FreePBX AMI Bridge Installation Complete!"
    echo "=============================================="
    echo "Server IP: $SERVER_IP"
    echo "Bridge API URL: http://$SERVER_IP:3001"
    echo "WebSocket URL: ws://$SERVER_IP:8080"
    echo "Health Check: http://$SERVER_IP:3001/health"
    echo ""
    echo "Configuration:"
    echo "  AMI User: $AMI_USER"
    echo "  AMI Password: $AMI_PASSWORD"
    echo "  Service User: $SERVICE_USER"
    echo "  Install Directory: $AMI_BRIDGE_DIR"
    echo "  Auto-start: Enabled"
    echo ""
    echo "CORS Origins Configured:"
    echo "  - http://localhost"
    echo "  - http://127.0.0.1" 
    echo "  - http://$SERVER_IP (auto-detected)"
    echo "  - http://192.168.0.132 (CRM server)"
    echo "  - Plus HTTPS variants and wildcards"
    echo ""
    echo "Management Commands:"
    echo "  Status: ami-bridge-status"
    echo "  Restart: ami-bridge-restart"
    echo "  Logs: ami-bridge-logs"
    echo "  Service: systemctl status ami-bridge"
    echo ""
    echo "Firewall Ports Opened:"
    echo "  - 3001/tcp (HTTP API)"
    echo "  - 8080/tcp (WebSocket)"
    echo "  - 5038/tcp (AMI)"
    echo ""
    echo "Next Steps:"
    echo "1. Test API: curl http://$SERVER_IP:3001/health"
    echo "2. Update your CRM integration settings"
    echo "3. Configure your SIP extensions in FreePBX"
    echo "4. Test call origination from CRM"
    echo "=============================================="
}

# Run main installation
main "$@"
