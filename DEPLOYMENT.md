# 🚀 Deployment Guide - SmartCRM Builder

Complete deployment guide for production environments.

---

## 📋 Pre-Deployment Checklist

### **Required Services**

- [ ] Supabase account (database & auth)
- [ ] OpenAI API key (for AI generation)
- [ ] Domain name (optional but recommended)
- [ ] SendGrid account (optional, for email automations)

### **Environment Variables**

- [ ] All backend environment variables set
- [ ] All frontend environment variables set
- [ ] Production URLs configured
- [ ] API keys secured

---

## 🎯 Deployment Options

### **Option 1: Vercel + Railway (Recommended)**

**Best for:** Quick deployment, automatic scaling, serverless

- **Frontend:** Vercel (Next.js optimized)
- **Backend:** Railway (container-based)
- **Database:** Supabase Cloud

**Cost:** ~$0-20/month for small projects

---

### **Option 2: Vercel + Render**

**Best for:** Generous free tier, simple setup

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Supabase Cloud

**Cost:** Free tier available, ~$7-20/month for production

---

### **Option 3: AWS/GCP/Azure**

**Best for:** Enterprise, full control, custom requirements

- **Frontend:** AWS Amplify / GCP App Engine / Azure Static Web Apps
- **Backend:** AWS ECS / GCP Cloud Run / Azure Container Instances
- **Database:** Supabase or managed PostgreSQL

**Cost:** Variable, ~$50+/month

---

## 🔧 Deployment Steps

### **Step 1: Supabase Setup**

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com
   # Click "New Project"
   # Choose region closest to users
   ```

2. **Run Database Migrations**
   ```sql
   -- In Supabase SQL Editor, run:
   -- Copy content from backend/supabase/schema.sql
   ```

3. **Enable Row Level Security**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
   ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
   ALTER TABLE records ENABLE ROW LEVEL SECURITY;
   -- ... etc for all tables
   ```

4. **Get API Keys**
   - Navigate to Settings > API
   - Copy `URL`, `anon key`, and `service_role key`

---

### **Step 2: Backend Deployment (Railway)**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd backend
   railway init
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set SUPABASE_URL="https://xxx.supabase.co"
   railway variables set SUPABASE_ANON_KEY="your-anon-key"
   railway variables set SUPABASE_SERVICE_KEY="your-service-key"
   railway variables set OPENAI_API_KEY="sk-xxx"
   railway variables set ENVIRONMENT="production"
   railway variables set DEBUG="False"
   railway variables set BACKEND_CORS_ORIGINS='["https://yourapp.vercel.app"]'
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get Backend URL**
   ```bash
   railway domain
   # Example: https://smartcrm-backend.up.railway.app
   ```

---

### **Step 3: Frontend Deployment (Vercel)**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Add Environment Variables**
   
   In Vercel Dashboard:
   - Go to Settings > Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     NEXT_PUBLIC_API_URL=https://smartcrm-backend.up.railway.app/api/v1
     ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

---

### **Step 4: Backend Deployment (Render)**

1. **Create Account**
   - Go to https://render.com
   - Sign up / Login

2. **Create New Web Service**
   - Click "New +" > "Web Service"
   - Connect GitHub repository
   - Select `backend` directory

3. **Configure Service**
   ```
   Name: smartcrm-backend
   Environment: Docker
   Region: Choose closest to users
   Branch: main
   Root Directory: backend
   
   Build Command: (automatic with Dockerfile)
   Start Command: (automatic with Dockerfile)
   ```

4. **Add Environment Variables**
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   OPENAI_API_KEY=sk-xxx
   ENVIRONMENT=production
   DEBUG=False
   BACKEND_CORS_ORIGINS=["https://yourapp.vercel.app"]
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (~5 minutes)

---

### **Step 5: Custom Domain (Optional)**

#### **For Frontend (Vercel)**

1. Go to Vercel Dashboard > Settings > Domains
2. Add your domain (e.g., `app.yourcompany.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

#### **For Backend (Railway)**

1. Go to Railway Dashboard > Settings
2. Generate domain or add custom domain
3. Update DNS records

---

## 🔒 Security Configuration

### **1. CORS Setup**

In backend `.env`:
```env
BACKEND_CORS_ORIGINS=["https://yourapp.vercel.app","https://app.yourcompany.com"]
```

### **2. Supabase RLS Policies**

```sql
-- Example RLS policy for workspaces
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

### **3. API Rate Limiting**

Consider adding rate limiting middleware in production:
```python
# In backend/app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

---

## 📊 Monitoring & Logging

### **Backend Monitoring**

**Railway:**
- Built-in logs in dashboard
- Metrics tab for CPU/Memory usage

**Render:**
- Logs tab in dashboard
- Metrics available

**Additional Tools:**
- Sentry (error tracking)
- LogRocket (session replay)
- DataDog (APM)

### **Frontend Monitoring**

**Vercel:**
- Analytics built-in
- Web Vitals tracking

**Additional Tools:**
- Vercel Analytics (built-in)
- Google Analytics
- Plausible Analytics (privacy-friendly)

---

## 🔄 CI/CD Setup

### **GitHub Actions (Recommended)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🧪 Testing Before Production

### **1. Staging Environment**

Create staging deployments:
```bash
# Backend staging
railway environment create staging

# Frontend staging
vercel --env=staging
```

### **2. Smoke Tests**

Test critical flows:
- [ ] User registration
- [ ] Login
- [ ] Workspace creation
- [ ] AI generation
- [ ] Entity CRUD
- [ ] Record CRUD
- [ ] Team invitations
- [ ] Automations

### **3. Load Testing**

```bash
# Install k6
brew install k6  # macOS
# or
choco install k6  # Windows

# Run load test
k6 run load-test.js
```

---

## 📈 Scaling Considerations

### **Database**

- **Supabase:** Scales automatically, upgrade plan as needed
- **Connection pooling:** Configure in Supabase dashboard
- **Indexes:** Add indexes for frequently queried fields

### **Backend**

- **Railway:** Auto-scales with usage
- **Render:** Upgrade to higher-tier plans
- **Horizontal scaling:** Add more instances

### **Frontend**

- **Vercel:** Edge network, automatic global CDN
- **ISR:** Use Incremental Static Regeneration for better performance

---

## 🐛 Troubleshooting

### **Common Issues**

**CORS Errors:**
```env
# Add frontend URL to CORS origins
BACKEND_CORS_ORIGINS=["https://yourapp.vercel.app"]
```

**Database Connection:**
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/
```

**Build Failures:**
```bash
# Clear caches
rm -rf node_modules .next
npm install
npm run build
```

---

## 📞 Support

- **Documentation:** See main README.md
- **Issues:** GitHub Issues
- **Community:** Discord/Slack

---

## ✅ Post-Deployment Checklist

- [ ] All services running
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Error tracking active
- [ ] Team notified
- [ ] Documentation updated

---

**Deployment Complete! 🎉**

Your SmartCRM Builder is now live and ready for users!
