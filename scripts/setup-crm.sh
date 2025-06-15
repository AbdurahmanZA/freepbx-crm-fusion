
#!/bin/bash

source "$(dirname "$0")/utils.sh"

setup_crm_application() {
    # Delete existing CRM folder if it exists
    if [ -d "$CRM_PATH" ]; then
        warning "Existing CRM folder found at $CRM_PATH - removing it..."
        rm -rf "$CRM_PATH"
        log "Existing CRM folder removed successfully"
    fi

    log "Setting up CRM application structure at $CRM_PATH..."
    mkdir -p $CRM_PATH/{api,assets,config,includes,uploads,recordings,logs,backup,server}

    # Create database schema
    cat > $CRM_PATH/schema.sql << 'EOF'
-- FreePBX CRM Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('agent', 'manager', 'administrator') DEFAULT 'agent',
    extension VARCHAR(10),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    company VARCHAR(100),
    source VARCHAR(50),
    status ENUM('new', 'contacted', 'qualified', 'converted', 'do_not_call') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assigned_agent_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_assigned_agent (assigned_agent_id)
);

CREATE TABLE IF NOT EXISTS call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    agent_id INT NOT NULL,
    call_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    call_end TIMESTAMP NULL,
    duration INT DEFAULT 0,
    status ENUM('connected', 'busy', 'no_answer', 'failed', 'voicemail') DEFAULT 'connected',
    recording_path VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lead_id (lead_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_call_start (call_start)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role, first_name, last_name) 
VALUES ('admin', 'admin@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrator', 'System', 'Administrator')
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample leads
INSERT INTO leads (first_name, last_name, phone, email, company, source, status, priority) VALUES
('John', 'Doe', '+1234567890', 'john.doe@email.com', 'Tech Corp', 'website', 'new', 'high'),
('Jane', 'Smith', '+1234567891', 'jane.smith@email.com', 'Marketing Inc', 'referral', 'new', 'medium'),
('Bob', 'Johnson', '+1234567892', 'bob.johnson@email.com', 'Sales LLC', 'cold_call', 'contacted', 'low')
ON DUPLICATE KEY UPDATE id=id;
EOF

    # Import database schema
    mysql -u $CRM_DB_USER -p$CRM_DB_PASSWORD $CRM_DB_NAME < $CRM_PATH/schema.sql

    # Create configuration files and application files
    create_config_files
    create_application_files
    setup_email_service_files

    log "CRM application setup completed"
}

create_config_files() {
    # Create PHP configuration file
    cat > $CRM_PATH/config/database.php << EOF
<?php
return [
    'host' => 'localhost',
    'database' => '$CRM_DB_NAME',
    'username' => '$CRM_DB_USER',
    'password' => '$CRM_DB_PASSWORD',
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
EOF

    # Create FreePBX AMI configuration
    cat > $CRM_PATH/config/asterisk.php << EOF
<?php
return [
    'ami' => [
        'host' => '127.0.0.1',
        'port' => 5038,
        'username' => 'crmuser',
        'password' => 'CRM_AMI_Secret2024!',
        'timeout' => 10
    ],
    'recordings_path' => '/var/spool/asterisk/monitor/',
    'default_context' => 'default'
];
EOF
}

setup_email_service_files() {
    log "Setting up email service files..."
    
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

    # Install Node.js dependencies
    cd $CRM_PATH/server
    npm install
    
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

create_application_files() {
    # Create application files in separate script for better organization
    source "$(dirname "$0")/create-app-files.sh"
    create_main_files
    create_api_files
    create_includes_files
    create_asset_files
}
