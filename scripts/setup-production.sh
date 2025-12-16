#!/bin/bash
# Production Deployment Script for 378x492 Fraud Detection Platform
# This script sets up a production-ready environment

set -e

echo "🚀 378x492 Fraud Detection Platform - Production Setup"
echo "=================================================="

# Check if we're running as root (not recommended for production)
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons."
   exit 1
fi

# Create production user
echo "👤 Creating production user..."
sudo useradd -m -s /bin/bash fraud-detection || echo "User already exists"

# Set up directories
echo "📁 Setting up directories..."
sudo mkdir -p /opt/378x492
sudo mkdir -p /var/log/378x492
sudo mkdir -p /var/backups/378x492
sudo mkdir -p /etc/378x492/ssl

# Set permissions
sudo chown -R fraud-detection:fraud-detection /opt/378x492
sudo chown -R fraud-detection:fraud-detection /var/log/378x492
sudo chown -R fraud-detection:fraud-detection /var/backups/378x492

# Generate secure keys
echo "🔐 Generating secure encryption keys..."
SQLCIPHER_KEY=$(openssl rand -hex 32)
IPC_SECRET=$(openssl rand -hex 32)
AUTH_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Create environment file
echo "📝 Creating production environment configuration..."
cat > /opt/378x492/.env << EOF
# Production Environment Configuration
SQLCIPHER_KEY=${SQLCIPHER_KEY}
IPC_SECRET=${IPC_SECRET}
AUTH_ENCRYPTION_KEY=${AUTH_ENCRYPTION_KEY}

NODE_ENV=production
PYTHON_ENV=production
HOST=0.0.0.0
PORT=8000
WORKERS=4

DATABASE_URL=sqlite:////opt/378x492/fraud_detection_prod.db
REDIS_URL=redis://localhost:6379/0

LOG_LEVEL=WARNING
ENABLE_METRICS=true
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
ENABLE_ENCRYPTION=true
DEBUG=false
EOF

# Set proper permissions on env file
sudo chmod 600 /opt/378x492/.env
sudo chown fraud-detection:fraud-detection /opt/378x492/.env

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip postgresql redis-server nginx certbot

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
sudo -u fraud-detection pip3 install -r requirements.txt

# Set up database
echo "🗄️ Setting up database..."
sudo -u fraud-detection python3 -c "from backend.core.database import create_tables; create_tables()"

# Create admin user
echo "👨‍💼 Creating admin user..."
sudo -u fraud-detection python3 scripts/create_admin_user.py

# Set up systemd service
echo "⚙️ Setting up systemd service..."
cat > /etc/systemd/system/378x492.service << EOF
[Unit]
Description=378x492 Fraud Detection Platform
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=fraud-detection
WorkingDirectory=/opt/378x492
Environment=PATH=/home/fraud-detection/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/home/fraud-detection/.local/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable 378x492
sudo systemctl start 378x492

# Set up Nginx reverse proxy
echo "🌐 Setting up Nginx reverse proxy..."
cat > /etc/nginx/sites-available/378x492 << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files
    location /static/ {
        alias /opt/378x492/frontend/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/378x492 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up SSL certificate
echo "🔒 Setting up SSL certificate..."
sudo certbot --nginx -d your-domain.com

# Set up log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/378x492 << EOF
/var/log/378x492/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 fraud-detection fraud-detection
    postrotate
        systemctl reload 378x492
    endscript
}
EOF

# Set up automated backups
echo "💾 Setting up automated backups..."
cat > /etc/cron.daily/378x492-backup << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/378x492"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_FILE="/opt/378x492/fraud_detection_prod.db"

# Create backup
sqlite3 \$DB_FILE ".backup '\${BACKUP_DIR}/fraud_detection_\${DATE}.db'"

# Encrypt backup
openssl enc -aes-256-cbc -salt -in "\${BACKUP_DIR}/fraud_detection_\${DATE}.db" -out "\${BACKUP_DIR}/fraud_detection_\${DATE}.db.enc" -k "\${ENCRYPTION_KEY}"

# Remove unencrypted backup
rm "\${BACKUP_DIR}/fraud_detection_\${DATE}.db"

# Clean old backups (keep last 30 days)
find \$BACKUP_DIR -name "fraud_detection_*.db.enc" -mtime +30 -delete
EOF

sudo chmod +x /etc/cron.daily/378x492-backup

echo "✅ Production setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update your-domain.com in Nginx configuration"
echo "2. Configure PostgreSQL database (recommended for production)"
echo "3. Set up monitoring (Prometheus/Grafana recommended)"
echo "4. Configure firewall rules"
echo "5. Set up automated updates and security patches"
echo ""
echo "🔐 Important: Store these credentials securely:"
echo "Admin Username: admin"
echo "Admin Password: admin123"
echo "Database Encryption Key: ${SQLCIPHER_KEY}"
echo "IPC Secret: ${IPC_SECRET}"
echo "Auth Encryption Key: ${AUTH_ENCRYPTION_KEY}"
echo ""
echo "📊 Service Status:"
sudo systemctl status 378x492 --no-pager
echo ""
echo "🌐 Application will be available at: https://your-domain.com"