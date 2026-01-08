# Oracle Cloud Free Forever - Complete Setup Guide

> **Run ALL 4 Zenith containers on Oracle Cloud's FREE ARM VM (24GB RAM + 4 CPUs)**

## 🆓 What You Get FREE Forever

| Resource | Amount | Notes |
|----------|--------|-------|
| **ARM Ampere CPUs** | 4 OCPUs | Equivalent to 4 vCPUs |
| **RAM** | 24 GB | More than enough for all services |
| **Block Storage** | 200 GB | Boot volume |
| **Outbound Data** | 10 TB/month | Generous bandwidth |
| **Public IP** | 1 | Static IPv4 |

**This is the best free tier in the cloud industry!**

---

## 📋 Prerequisites

1. Valid email address
2. Phone number for verification
3. Credit/debit card (for verification only, not charged)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Oracle Cloud Account

1. Go to [cloud.oracle.com/free](https://www.oracle.com/cloud/free/)
2. Click **"Start for free"**
3. Fill in your details:
   - Country: Select yours
   - Email: Your email
   - Name: Your name
4. Verify email
5. Set password
6. **Home Region**: Choose closest to you:
   - US East (Ashburn) - `us-ashburn-1`
   - US West (Phoenix) - `us-phoenix-1`
   - UK South (London) - `uk-london-1`
   - Japan East (Tokyo) - `ap-tokyo-1`
   - Singapore - `ap-singapore-1`
7. Complete phone verification
8. Add payment method (required but NOT charged)
9. Wait for account provisioning (5-30 minutes)

---

### Step 2: Create Always Free VM

1. **Login** to [cloud.oracle.com](https://cloud.oracle.com)

2. **Navigate**: Hamburger Menu → Compute → Instances

3. **Click "Create Instance"**

4. **Configure the instance:**

   **Name:**

   ```
   zenith-platform
   ```

   **Placement:** Leave default

   **Image and Shape:**
   - Click **"Edit"** on Image and Shape
   - Click **"Change Image"**
   - Select: **Oracle Linux 8** or **Ubuntu 22.04** (Canonical)
   - Click **"Change Shape"**
   - Select: **Ampere** (ARM-based processor)
   - Shape: **VM.Standard.A1.Flex**
   - **CRITICAL:** Set OCPUs to **4** and Memory to **24 GB**

   ⚠️ **Important:** These are FREE! Don't settle for less.

   **Networking:**
   - Use default VCN or create new
   - Subnet: Public subnet
   - ✅ Assign public IPv4 address

   **SSH Keys:**
   - Select **"Generate a key pair"**
   - **Download both keys** (private and public)
   - Or paste your own public key

5. **Click "Create"**

6. Wait 2-5 minutes for instance to be running

---

### Step 3: Note Your Instance Details

After creation, note:

```bash
# Your details (example)
PUBLIC_IP="129.xxx.xxx.xxx"
PRIVATE_KEY="~/Downloads/ssh-key-2024-01-08.key"
USERNAME="ubuntu"  # or "opc" for Oracle Linux
```

---

### Step 4: Connect via SSH

```bash
# Set permissions on private key
chmod 400 ~/Downloads/ssh-key-2024-01-08.key

# Connect (Ubuntu)
ssh -i ~/Downloads/ssh-key-2024-01-08.key ubuntu@YOUR_PUBLIC_IP

# Or for Oracle Linux:
ssh -i ~/Downloads/ssh-key-2024-01-08.key opc@YOUR_PUBLIC_IP
```

---

### Step 5: Initial Server Setup

Once connected, run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y   # Ubuntu
# OR
sudo dnf update -y   # Oracle Linux

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group
exit
```

Reconnect via SSH, then verify:

```bash
docker --version
docker-compose --version
```

---

### Step 6: Open Firewall Ports

**In Oracle Cloud Console:**

1. Go to: Networking → Virtual Cloud Networks → Your VCN
2. Click on your **Public Subnet**
3. Click on the **Security List**
4. Click **"Add Ingress Rules"**

Add these rules:

| Source CIDR | Protocol | Destination Port | Description |
|-------------|----------|------------------|-------------|
| 0.0.0.0/0 | TCP | 8000 | API Gateway |
| 0.0.0.0/0 | TCP | 8003 | AI/ML Service |
| 0.0.0.0/0 | TCP | 8004 | Fraud Service |
| 0.0.0.0/0 | TCP | 8005 | Workflow Service |
| 0.0.0.0/0 | TCP | 80 | HTTP (optional) |
| 0.0.0.0/0 | TCP | 443 | HTTPS (optional) |

**On the VM (iptables):**

```bash
# Ubuntu
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8003 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8004 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8005 -j ACCEPT

# Save rules
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

---

### Step 7: Deploy Zenith Containers

Create the project directory:

```bash
mkdir ~/zenith
cd ~/zenith
```

Create `docker-compose.yml`:

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  api-gateway:
    image: ghcr.io/YOUR_USERNAME/zenith-api-gateway:latest
    container_name: zenith-api-gateway
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '1'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ai-ml-service:
    image: ghcr.io/YOUR_USERNAME/zenith-ai-ml:latest
    container_name: zenith-ai-ml
    ports:
      - "8003:8003"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MODEL_PATH=/models
    volumes:
      - ./models:/models
    deploy:
      resources:
        limits:
          memory: 12G
          cpus: '2'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  fraud-intel-service:
    image: ghcr.io/YOUR_USERNAME/zenith-fraud-intel:latest
    container_name: zenith-fraud-intel
    ports:
      - "8004:8004"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '0.5'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8004/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  workflow-regulatory-service:
    image: ghcr.io/YOUR_USERNAME/zenith-workflow-regulatory:latest
    container_name: zenith-workflow-regulatory
    ports:
      - "8005:8005"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '0.5'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8005/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  default:
    name: zenith-network
EOF
```

Create `.env` file:

```bash
cat > .env << 'EOF'
# Database (Supabase - Free Forever)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Redis (Upstash - Free Forever)
REDIS_URL=redis://default:YOUR_TOKEN@YOUR_REGION.upstash.io:6379

# Secrets
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET=your-jwt-secret-change-this
EOF
```

---

### Step 8: Build and Push Docker Images

**On your local machine** (not Oracle), build ARM images:

```bash
# Enable Docker buildx for multi-arch
docker buildx create --use

# Build and push each service
cd services/api-gateway
docker buildx build --platform linux/arm64 \
  -t ghcr.io/YOUR_USERNAME/zenith-api-gateway:latest \
  --push .

cd ../ai-ml-service
docker buildx build --platform linux/arm64 \
  -t ghcr.io/YOUR_USERNAME/zenith-ai-ml:latest \
  --push .

cd ../fraud-intel-service
docker buildx build --platform linux/arm64 \
  -t ghcr.io/YOUR_USERNAME/zenith-fraud-intel:latest \
  --push .

cd ../workflow-regulatory-service
docker buildx build --platform linux/arm64 \
  -t ghcr.io/YOUR_USERNAME/zenith-workflow-regulatory:latest \
  --push .
```

---

### Step 9: Start Services on Oracle

Back on the Oracle VM:

```bash
cd ~/zenith

# Login to GitHub Container Registry (if using GHCR)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull and start all containers
docker-compose pull
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

---

### Step 10: Verify Deployment

```bash
# Check all services are running
curl http://localhost:8000/health
curl http://localhost:8003/health
curl http://localhost:8004/health
curl http://localhost:8005/health

# From outside (replace with your IP)
curl http://YOUR_PUBLIC_IP:8000/health
```

---

## 🔗 Connect to Cloudflare Workers

Update your Cloudflare Workers `wrangler.toml`:

```toml
[vars]
ORACLE_BACKEND_URL = "http://YOUR_ORACLE_PUBLIC_IP"
```

Redeploy:

```bash
cd cloudflare-workers
npm run deploy
```

---

## 📊 Resource Allocation Summary

| Service | Memory | CPUs | Port |
|---------|--------|------|------|
| API Gateway | 4GB | 1.0 | 8000 |
| AI/ML Service | 12GB | 2.0 | 8003 |
| Fraud+Intel | 4GB | 0.5 | 8004 |
| Workflow+Reg | 4GB | 0.5 | 8005 |
| **Total** | **24GB** | **4.0** | - |

**Fits perfectly in the free tier!**

---

## 🛡️ Security Recommendations

1. **Use Cloudflare as proxy** - Don't expose Oracle IP directly
2. **Firewall rules** - Only allow Cloudflare IPs to backend ports
3. **SSH key only** - Disable password authentication
4. **Fail2ban** - Install to prevent brute force

```bash
# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

---

## 🔄 Auto-Restart on Boot

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Containers will restart automatically (restart: unless-stopped)
```

---

## 📈 Monitoring

```bash
# View resource usage
docker stats

# View logs
docker-compose logs -f api-gateway
docker-compose logs -f ai-ml-service

# Check disk space
df -h
```

---

## 🆘 Troubleshooting

### "Out of capacity" error when creating VM

Oracle's free ARM is in high demand. Try:

1. Different home region
2. Try at off-peak hours (early morning)
3. Reduce OCPU/memory slightly (minimum 1 OCPU + 6GB)
4. Use the "Always Free Micro" x86 instances instead (1GB each)

### Can't connect to ports

1. Check Security List in Oracle Console
2. Check iptables on VM
3. Verify containers are running: `docker-compose ps`

### Containers keep restarting

```bash
docker-compose logs SERVICE_NAME
```

---

## 💰 Total Cost: $0/month Forever

| Component | Provider | Cost |
|-----------|----------|------|
| 4 Containers | Oracle Cloud | $0 |
| 24GB RAM | Oracle Cloud | $0 |
| 200GB Storage | Oracle Cloud | $0 |
| 10TB Bandwidth | Oracle Cloud | $0 |
| **Total** | | **$0** |

---

## ✅ Checklist

```
□ Created Oracle Cloud account
□ Created ARM VM (4 OCPU, 24GB RAM)
□ Downloaded SSH keys
□ Connected via SSH
□ Installed Docker and Docker Compose
□ Opened firewall ports
□ Built ARM Docker images
□ Deployed containers
□ Verified health endpoints
□ Connected Cloudflare Workers
□ Tested end-to-end
```

---

**Your Zenith Platform is now running on Oracle Cloud FREE FOREVER! 🎉**
