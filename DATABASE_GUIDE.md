# 🗄️ SmartCRM Database Guide

## Overview

SmartCRM uses a **multi-tenant, dynamic CRM architecture** where:
- Each workspace is isolated
- Entities are dynamically defined (no fixed schema)
- Data is stored as flexible JSONB
- Row Level Security ensures data isolation

## Quick Setup

### 1. Start Supabase

```bash
docker-compose up -d
```

Access: http://localhost:3050

### 2. Apply Schema Migration

1. Open Supabase Studio → SQL Editor
2. Copy `backend/migrations/001_initial_schema.sql`
3. Paste and run
4. Verify all 9 tables created

### 3. Add Sample Data (Optional)

1. Create user via Auth UI
2. Copy user ID from `auth.users` table
3. Edit `backend/migrations/sample_data.sql`
4. Replace `YOUR_USER_ID_HERE` with actual ID
5. Run sample data SQL

## Database Schema

### Core Tables

```
user_profiles          # Extended user info
workspaces            # Multi-tenant workspaces
workspace_members     # User-workspace mapping with roles
crm_entities          # Dynamic entity definitions
crm_records           # Actual CRM data (JSONB)
crm_relationships     # Links between records
automation_rules      # Workflow automation
activities            # Timeline (calls, emails, etc.)
ai_generations        # AI usage tracking
```

### Multi-Tenant Design

```
User (auth.users)
  ↓
workspace_members (role: owner/admin/member)
  ↓
Workspace
  ↓
CRM Entities (Contacts, Deals, etc.)
  ↓
CRM Records (actual data)
```

### Dynamic Entity System

Entities are defined with JSONB field definitions:

```json
{
  "name": "email",
  "type": "email",
  "label": "Email Address",
  "required": false,
  "placeholder": "john@example.com"
}
```

Records store data matching these fields:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "status": "qualified"
}
```

## Security (RLS)

**All tables have Row Level Security enabled!**

Rules:
- ✅ Users can only see workspaces they're members of
- ✅ Only owners can delete workspaces
- ✅ Admins can manage entities and automation
- ✅ Members can CRUD records
- ✅ Complete data isolation between workspaces

## Using Supabase Client

### Backend (Python)

```python
from backend.supabase import get_supabase_client, get_database

# Get client
client = get_supabase_client()

# Or use helper
db = get_database()
workspace = await db.create_workspace(
    name="My Workspace",
    slug="my-workspace",
    owner_id=user_id
)
```

### Frontend (TypeScript)

```typescript
import { supabaseClient } from '@/providers/supabase-client';

// Query records
const { data, error } = await supabaseClient
  .from('crm_records')
  .select('*')
  .eq('workspace_id', workspaceId);
```

## Common Queries

### Get User's Workspaces

```sql
SELECT w.*
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = 'USER_ID';
```

### Get All Records for Entity

```sql
SELECT *
FROM crm_records
WHERE workspace_id = 'WORKSPACE_ID'
  AND entity_id = 'ENTITY_ID'
  AND is_archived = false
ORDER BY created_at DESC;
```

### Search Records (JSONB)

```sql
SELECT *
FROM crm_records
WHERE workspace_id = 'WORKSPACE_ID'
  AND data->>'name' ILIKE '%john%';
```

### Get Activities for Record

```sql
SELECT *
FROM activities
WHERE record_id = 'RECORD_ID'
ORDER BY scheduled_at DESC;
```

## Troubleshooting

### Can't see data after creating?
➡️ Check you're a workspace member with correct role

### "permission denied" errors?
➡️ RLS is working! Ensure authenticated with valid JWT

### Foreign key violations?
➡️ Create parent records first (workspace → entity → record)

### JSONB queries slow?
➡️ GIN indexes are already created, but consider specific indexes for frequent queries

## Next Steps

1. ✅ Apply migration
2. ✅ Create test user
3. ✅ Load sample data
4. ✅ Test API endpoints
5. ✅ Build frontend CRUD

See `backend/migrations/README.md` for detailed migration instructions.
