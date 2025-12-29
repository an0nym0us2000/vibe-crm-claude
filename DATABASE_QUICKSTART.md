# 🚀 Database Quick Start

## 1. Start Supabase (2 minutes)

```bash
# From project root
docker-compose up -d

# Verify running
docker-compose ps
```

**Access Supabase Studio**: http://localhost:3050

## 2. Apply Schema Migration (1 minute)

1. Open Supabase Studio → **SQL Editor**
2. Copy all contents of `backend/migrations/001_initial_schema.sql`
3. Paste into editor
4. Click **RUN** button
5. ✅ Should see "Schema Migration Complete!" message

## 3. Verify Tables (30 seconds)

In Supabase Studio:
- Go to **Table Editor**
- You should see 9 tables:
  - ✅ user_profiles
  - ✅ workspaces
  - ✅ workspace_members
  - ✅ crm_entities
  - ✅ crm_records
  - ✅ crm_relationships
  - ✅ automation_rules
  - ✅ activities
  - ✅ ai_generations

## 4. Create Test User (1 minute)

In Supabase Studio:
1. Go to **Authentication**
2. Click **Add User**
3. Email: `test@example.com`
4. Password: `TestPassword123!`
5. Click **Create**
6. **Copy the User ID** (you'll need this)

## 5. Load Sample Data (2 minutes)

1. Open `backend/migrations/sample_data.sql`
2. Find line: `\set user_id 'YOUR_USER_ID_HERE'`
3. Replace with your copied User ID
4. Copy entire file
5. Paste in **SQL Editor**
6. Click **RUN**
7. ✅ Should see "Sample Data Loaded Successfully!"

## 6. Test Database (30 seconds)

In **SQL Editor**, run:

```sql
-- View workspace
SELECT name, slug FROM workspaces;

-- View entities
SELECT display_name, entity_name FROM crm_entities;

-- View contacts
SELECT data->>'name' as name, data->>'email' as email 
FROM crm_records 
WHERE entity_id = (SELECT id FROM crm_entities WHERE entity_name = 'contacts');
```

## ✅ Done!

You now have:
- ✅ 9 tables with RLS security
- ✅ 1 sample workspace (Acme Corporation)
- ✅ 3 CRM entities (Contacts, Deals, Projects)
- ✅ 6 sample records
- ✅ Test user ready to authenticate

## Next: Use the API

```python
from backend.supabase import get_database

db = get_database()
workspaces = await db.get_user_workspaces(user_id='YOUR_USER_ID')
print(workspaces)
```

## Troubleshooting

**Can't connect to Supabase?**
```bash
docker-compose logs
# Check if postgres is running on port 54322
```

**Migration errors?**
- Make sure no tables exist from previous runs
- Drop all tables and retry

**RLS permission denied?**
- This is normal! RLS is working
- Use authenticated requests with JWT tokens

---

**Total time: ~7 minutes**  
**Ready to build! 🎉**
