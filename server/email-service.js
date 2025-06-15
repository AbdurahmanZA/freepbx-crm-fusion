
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const configPath = path.join(__dirname, 'config.json');

// Get SMTP configuration from config.json or environment
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
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
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
        rejectUnauthorized: false // Allow self-signed certificates
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
