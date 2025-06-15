
#!/bin/bash

source "$(dirname "$0")/utils.sh"

configure_security() {
    log "Configuring security settings..."
    
    # Configure UFW firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000:3010/tcp  # CRM services range
    ufw allow 5038/tcp       # Asterisk AMI
    ufw --force enable

    # Configure Fail2ban
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[apache-auth]
enabled = true

[apache-noscript]
enabled = true

[apache-overflows]
enabled = true
EOF

    systemctl enable fail2ban
    systemctl start fail2ban

    log "Security configuration completed"
}

restart_services() {
    log "Restarting all services..."
    
    # Restart core services
    systemctl restart apache2
    systemctl restart mysql
    systemctl restart asterisk
    
    # Restart CRM services
    systemctl restart email-service
    
    # Check service status
    systemctl is-active apache2 || error "Apache failed to start"
    systemctl is-active mysql || error "MySQL failed to start"
    systemctl is-active asterisk || error "Asterisk failed to start"
    systemctl is-active email-service || error "Email service failed to start"
    
    log "All services restarted successfully"
}

create_status_script() {
    cat > /usr/local/bin/freepbx-crm-status << 'EOF'
#!/bin/bash
echo "FreePBX CRM System Status"
echo "========================"
echo ""
echo "Core Services:"
systemctl is-active apache2 && echo "✓ Apache Web Server" || echo "✗ Apache Web Server"
systemctl is-active mysql && echo "✓ MySQL Database" || echo "✗ MySQL Database"
systemctl is-active asterisk && echo "✓ Asterisk PBX" || echo "✗ Asterisk PBX"
systemctl is-active email-service && echo "✓ Email Service" || echo "✗ Email Service"
echo ""
echo "Network Ports:"
netstat -tlnp | grep :80 > /dev/null && echo "✓ Web Interface (Port 80)" || echo "✗ Web Interface (Port 80)"
netstat -tlnp | grep :3002 > /dev/null && echo "✓ Email Service (Port 3002)" || echo "✗ Email Service (Port 3002)"
netstat -tlnp | grep :5038 > /dev/null && echo "✓ Asterisk AMI (Port 5038)" || echo "✗ Asterisk AMI (Port 5038)"
echo ""
echo "Access URLs:"
IP=$(hostname -I | awk '{print $1}')
echo "Web Interface: http://$IP/crm/"
echo "Email Service: http://$IP:3002/"
EOF

    chmod +x /usr/local/bin/freepbx-crm-status
}

create_installation_summary() {
    cat > $CRM_PATH/INSTALLATION_INFO.txt << EOF
FreePBX CRM Installation Summary
==============================

Installation Date: $(date)
Hostname: $HOSTNAME
IP Address: $IP_ADDRESS

Database Configuration:
- Database: $CRM_DB_NAME
- User: $CRM_DB_USER
- Password: $CRM_DB_PASSWORD

Service Ports:
- Web Interface: 80
- Email Service: 3002
- Asterisk AMI: 5038

File Paths:
- CRM Application: $CRM_PATH
- Web Root: $WEB_ROOT
- Configuration: $CRM_PATH/config/

Default Credentials:
- Username: admin
- Password: admin123

Important Commands:
- Status Check: freepbx-crm-status
- Restart Services: systemctl restart apache2 mysql asterisk email-service
- View Logs: journalctl -u email-service -f

Security Notes:
- Change all default passwords immediately
- Configure SMTP settings in Integration Settings
- Review firewall rules for your environment
- Set up SSL certificates for production use
EOF

    log "Installation summary created at $CRM_PATH/INSTALLATION_INFO.txt"
}
