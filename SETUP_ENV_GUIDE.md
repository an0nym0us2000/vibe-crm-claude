# 🔧 Environment Setup Guide

## Follow these steps to enable full functionality!

---

## **STEP 1: Create Supabase Account (FREE)**

### 1. Go to Supabase:
https://supabase.com

### 2. Sign up (FREE):
- Click "Start your project"
- Sign up with GitHub (recommended) or email
- No credit card required!

### 3. Create New Project:
- Click "New Project"
- **Organization:** Create new or use existing
- **Name:** `smartcrm-builder` (or any name)
- **Database Password:** Choose a strong password (SAVE THIS!)
- **Region:** Choose closest to you
- **Pricing Plan:** FREE tier is fine!
- Click "Create new project"

⏱️ **Wait 2-3 minutes** for project to initialize...

---

## **STEP 2: Get Supabase API Keys**

Once your project is ready:

### 1. Go to Settings:
- Click the **Settings** icon (gear) in left sidebar
- Click **API** in the settings menu

### 2. Copy These Values:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
📋 **Copy this** - you'll need it!

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```
📋 **Copy this** - starts with "eyJ"

**service_role key:** (scroll down)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```
📋 **Copy this** - also starts with "eyJ" (longer than anon key)

⚠️ **IMPORTANT:** 
- The service_role key is SECRET - never expose to frontend!
- Keep these keys safe - they're like passwords

---

## **STEP 3: Set Up Database Schema**

### 1. Go to SQL Editor:
- Click **SQL Editor** in left sidebar
- Click **+ New query**

### 2. Run This SQL:
Copy the entire contents of:
```
backend/migrations/001_initial_schema.sql
```

Paste it into the SQL editor and click **RUN**

✅ This creates all the tables you need!

---

## **STEP 4: Get OpenAI API Key (OPTIONAL for now)**

### If you want AI features:

1. Go to: https://platform.openai.com
2. Sign up or login
3. Click Profile → **View API Keys**
4. Click **+ Create new secret key**
5. Copy the key (starts with `sk-proj-...`)
6. Add $5-10 credits in **Billing**

💡 **TIP:** You can skip this for now and test without AI features first!

---

## **STEP 5: Create Backend .env File**

I'll create this file for you once you have the keys!

**You'll need:**
- ✅ Supabase URL
- ✅ Supabase anon key
- ✅ Supabase service_role key
- ⏸️ OpenAI API key (optional for now)

---

## **STEP 6: Create Frontend .env.local File**

I'll create this too once you have the Supabase keys!

**You'll need:**
- ✅ Supabase URL
- ✅ Supabase anon key

---

## **🎯 WHAT YOU NEED TO DO NOW:**

### **1. Create Supabase Project:**
👉 Go to: https://supabase.com
- Sign up (free)
- Create new project
- Wait for it to initialize (2-3 minutes)

### **2. Get Your Keys:**
- Go to Settings → API
- Copy:
  - Project URL
  - anon/public key
  - service_role key

### **3. Share Keys with Me:**
Once you have them, paste them here and I'll:
- Create the .env files for you
- Set up the database schema
- Restart the servers
- Test everything works!

---

## **📋 READY TO SHARE:**

When you have your keys, paste them like this:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
```

(Optional):
```
OPENAI_API_KEY=sk-proj-...
```

---

## **⏱️ TIME ESTIMATE:**

- Supabase signup: 2 minutes
- Project creation: 3 minutes
- Get keys: 1 minute
- Setup .env files: 1 minute (I'll do this)
- **Total: ~7 minutes to full features!**

---

**🚀 Ready? Go to https://supabase.com and create your free project!**

Let me know when you have the keys and I'll set everything up! 🎉
