
#!/bin/bash

# FreePBX CRM Integration - Main Installation Script for Debian 12
# This script orchestrates the complete CRM system installation

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

# Source utilities and configuration
source "$SCRIPTS_DIR/utils.sh"

# Main installation function
main() {
    log "Starting FreePBX CRM Integration installation on Debian 12"
    
    # Initialize
    check_root
    get_system_info
    set_config_vars
    
    log "Hostname: $HOSTNAME"
    log "IP Address: $IP_ADDRESS"
    
    # Execute installation steps
    source "$SCRIPTS_DIR/check-system.sh"
    check_dependencies
    check_system_requirements
    
    source "$SCRIPTS_DIR/install-packages.sh"
    install_packages
    
    source "$SCRIPTS_DIR/setup-database.sh"
    setup_database
    
    source "$SCRIPTS_DIR/configure-webserver.sh"
    configure_webserver
    
    source "$SCRIPTS_DIR/configure-asterisk.sh"
    configure_asterisk
    
    source "$SCRIPTS_DIR/setup-crm.sh"
    setup_crm_application
    
    # Setup email service automatically
    log "Setting up email service..."
    setup_email_service
    
    source "$SCRIPTS_DIR/configure-security.sh"
    configure_security
    restart_services
    create_status_script
    create_installation_summary
    
    # Final status
    display_completion_message
}

# Email service setup function (integrated)
setup_email_service() {
    log "Setting up email service..."
    
    # Create server directory in CRM path
    mkdir -p $CRM_PATH/server
    
    # Copy email service files from current directory
    if [ -f "$SCRIPT_DIR/server/email-service.js" ]; then
        cp "$SCRIPT_DIR/server/email-service.js" $CRM_PATH/server/
        cp "$SCRIPT_DIR/server/package.json" $CRM_PATH/server/
        log "Email service files copied"
    else
        log "Creating email service files..."
        create_email_service_files
    fi
    
    # Install Node.js dependencies
    cd $CRM_PATH/server
    npm install
    log "Email service dependencies installed"
    
    # Create systemd service file
    cat > /etc/systemd/system/email-service.service << EOF
[Unit]
Description=FreePBX CRM Email Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$CRM_PATH/server
ExecStart=/usr/bin/node email-service.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=EMAIL_PORT=3002

[Install]
WantedBy=multi-user.target
EOF

    # Set proper permissions
    chown -R www-data:www-data $CRM_PATH/server
    chmod -R 755 $CRM_PATH/server
    
    # Enable and start service
    systemctl daemon-reload
    systemctl enable email-service
    systemctl start email-service
    
    # Check service status
    sleep 3
    if systemctl is-active --quiet email-service; then
        log "Email service started successfully on port 3002"
    else
        warn "Email service failed to start - check logs with: sudo journalctl -u email-service"
    fi
}

create_email_service_files() {
    # Create email service JavaScript file
    cat > $CRM_PATH/server/email-service.js << 'EOF'
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const configPath = path.join(__dirname, 'config.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
}

// Get SMTP configuration from config.json
function getSMTPConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.smtp || {};
  } catch (error) {
    console.error('Error reading config:', error);
    return {};
  }
}

// Save SMTP configuration to config.json
function saveSMTPConfig(smtpConfig) {
  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    config.smtp = smtpConfig;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// Test SMTP connection
app.post('/api/test-smtp', async (req, res) => {
  const { host, port, username, password, encryption } = req.body;
  
  try {
    const transporter = nodemailer.createTransporter({
      host: host,
      port: parseInt(port),
      secure: encryption === 'ssl',
      auth: {
        user: username,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    
    // Save working config
    saveSMTPConfig(req.body);
    
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (error) {
    console.error('SMTP test failed:', error);
    res.status(400).json({ 
      success: false, 
      message: 'SMTP connection failed', 
      error: error.message 
    });
  }
});

// Send email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, fromEmail, fromName } = req.body;
  
  try {
    const smtpConfig = getSMTPConfig();
    
    if (!smtpConfig.host || !smtpConfig.username) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMTP not configured. Please configure SMTP settings first.' 
      });
    }

    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.encryption === 'ssl',
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `${fromName || smtpConfig.fromName} <${fromEmail || smtpConfig.fromEmail}>`,
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Email send failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
});

const PORT = process.env.EMAIL_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});
EOF

    # Create package.json for email service
    cat > $CRM_PATH/server/package.json << 'EOF'
{
  "name": "crm-email-service",
  "version": "1.0.0",
  "description": "Email service for CRM",
  "main": "email-service.js",
  "scripts": {
    "start": "node email-service.js",
    "dev": "nodemon email-service.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "nodemailer": "^6.9.7",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF
}

display_completion_message() {
    log "Installation completed successfully!"
    echo ""
    echo "================================================================"
    echo "FreePBX CRM Integration - Installation Complete"
    echo "================================================================"
    echo ""
    echo "System Information:"
    echo "  Hostname: $HOSTNAME"
    echo "  IP Address: $IP_ADDRESS"
    echo "  Web Interface: http://$IP_ADDRESS/crm/"
    echo ""
    echo "Default Credentials:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "Installed Components:"
    echo "  ✓ Apache Web Server"
    echo "  ✓ MySQL Database Server"
    echo "  ✓ PHP $(php -v | head -n1 | cut -d' ' -f2)"
    echo "  ✓ Asterisk PBX"
    echo "  ✓ FreePBX CRM Application"
    echo "  ✓ Email Service (Port 3002)"
    echo "  ✓ Security (UFW + Fail2ban)"
    echo ""
    echo "Services Status:"
    echo "  - CRM Web: http://$IP_ADDRESS/crm/"
    echo "  - Email Service: Running on port 3002"
    echo "  - AMI Bridge: Running on port 3001"
    echo ""
    echo "Important Security Notes:"
    echo "  - Change ALL default passwords immediately"
    echo "  - Configure SSL certificate for production use"
    echo "  - Review firewall rules for your environment"
    echo "  - Configure regular database backups"
    echo ""
    echo "Status Check Command: freepbx-crm-status"
    echo "Installation Details: $CRM_PATH/INSTALLATION_INFO.txt"
    echo "================================================================"
}

# Run main installation
main "$@"
