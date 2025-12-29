# Database Migrations

## Quick Start

### Apply Migration to Local Supabase

1. Start Supabase: `docker-compose up -d`
2. Open Supabase Studio: http://localhost:3050
3. Go to **SQL Editor**
4. Copy contents of `001_initial_schema.sql`
5. Paste and click **Run**

### Verify Migration

Check that these tables exist:
- user_profiles
- workspaces
- workspace_members
- crm_entities
- crm_records
- crm_relationships
- automation_rules
- activities
- ai_generations

## Schema Overview

### Multi-Tenant Architecture
- **workspaces** - Isolated CRM instances
- **workspace_members** - Role-based access (owner/admin/member)

### Dynamic CRM
- **crm_entities** - Define custom entities (Contacts, Deals, etc.)
- **crm_records** - JSONB storage for flexible data

### Features
- **automation_rules** - Workflow automation
- **activities** - Timeline (calls, emails, meetings)
- **ai_generations** - Track AI usage

## Security

✅ Row Level Security (RLS) enabled on all tables
✅ Role-based access control
✅ Workspace isolation

## Next Steps

1. Create test user via Supabase Auth
2. Create workspace via API
3. Define CRM entities
4. Start creating records!
