# 🔧 QUICK FIX FOR REGISTRATION

## Issue: Backend not loading .env file

### Quick Solution:

**Stop the current backend (Ctrl+C) and run this:**

```powershell
cd c:\Users\himan\Documents\GitHub\vibe-crm\backend

# Set environment variables directly in PowerShell
$env:SUPABASE_URL="https://rmgrcximujutuadovfpq.supabase.co"
$env:SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZ3JjeGltdWp1dHVhZG92ZnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTc3MTMsImV4cCI6MjA4MjU3MzcxM30.5sHJS5l4YGe2YFpf5WG2l-kkEDJNknr_-8NrZp2FDuQ"
$env:ENVIRONMENT="development"

# Now start backend
python -m uvicorn app.main_simple:app --reload --host 0.0.0.0 --port 8000
```

**Then try registering again!**

---

## Or Alternative: Restart Terminal

1. **Close PowerShell**
2. **Open new PowerShell**
3. **cd to backend folder**
4. **Run:** `python -m uvicorn app.main_simple:app --reload --host 0.0.0.0 --port 8000`

The .env file should load automatically in a fresh terminal.

---

**After restart, registration should work!** ✅
