-- =====================================================
-- SmartCRM Builder - Sample Data
-- Use this to populate your database with test data
-- =====================================================

-- IMPORTANT: Replace these placeholder IDs with actual values
-- after creating your first user via Supabase Auth

-- Step 1: Create a user via Supabase Auth UI or API
-- Step 2: Get the user ID from auth.users table
-- Step 3: Replace YOUR_USER_ID_HERE with the actual UUID
-- Step 4: Run this script

-- =====================================================
-- CONFIGURATION
-- Replace these values with your actual IDs
-- =====================================================

-- Your user ID from auth.users
\set user_id 'YOUR_USER_ID_HERE'

-- =====================================================
-- Sample User Profile
-- =====================================================

INSERT INTO user_profiles (id, full_name, company_name, industry, timezone)
VALUES 
  (:'user_id', 'John Smith', 'Acme Corporation', 'Technology', 'America/New_York')
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      company_name = EXCLUDED.company_name,
      industry = EXCLUDED.industry;

-- =====================================================
-- Sample Workspace
-- =====================================================

INSERT INTO workspaces (name, slug, owner_id, config, subscription_tier)
VALUES 
  ('Acme Corporation', 'acme-corp', :'user_id', 
   '{"industry": "Technology", "company_size": "50-200", "timezone": "America/New_York"}'::jsonb,
   'professional')
RETURNING id;

-- Get the workspace ID (save this for next steps)
-- In psql: \gset workspace_

-- =====================================================
-- Sample CRM Entities
-- =====================================================

-- Contacts Entity
INSERT INTO crm_entities (
  workspace_id, 
  entity_name, 
  display_name, 
  display_name_singular,
  icon,
  color,
  description,
  fields,
  views,
  default_view,
  is_system,
  created_by
)
VALUES (
  (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
  'contacts',
  'Contacts',
  'Contact',
  'person',
  '#667eea',
  'Manage your contacts and customers',
  '[
    {
      "name": "name",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "placeholder": "John Doe"
    },
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": false,
      "placeholder": "john@example.com"
    },
    {
      "name": "phone",
      "type": "text",
      "label": "Phone Number",
      "required": false,
      "placeholder": "+1 (555) 123-4567"
    },
    {
      "name": "company",
      "type": "text",
      "label": "Company",
      "required": false
    },
    {
      "name": "position",
      "type": "text",
      "label": "Job Title",
      "required": false
    },
    {
      "name": "status",
      "type": "select",
      "label": "Status",
      "required": true,
      "options": ["lead", "contacted", "qualified", "customer", "inactive"],
      "default": "lead"
    },
    {
      "name": "source",
      "type": "select",
      "label": "Lead Source",
      "options": ["website", "referral", "cold_call", "social_media", "event", "other"]
    }
  ]'::jsonb,
  '["table", "kanban", "list"]'::jsonb,
  'table',
  true,
  :'user_id'
)
RETURNING id;

-- Deals Entity
INSERT INTO crm_entities (
  workspace_id,
  entity_name,
  display_name,
  display_name_singular,
  icon,
  color,
  description,
  fields,
  views,
  default_view,
  is_system,
  created_by
)
VALUES (
  (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
  'deals',
  'Deals',
  'Deal',
  'attach_money',
  '#764ba2',
  'Track your sales pipeline',
  '[
    {
      "name": "title",
      "type": "text",
      "label": "Deal Name",
      "required": true,
      "placeholder": "Enterprise Contract"
    },
    {
      "name": "amount",
      "type": "number",
      "label": "Deal Value",
      "required": true,
      "prefix": "$",
      "validation": {"min": 0}
    },
    {
      "name": "stage",
      "type": "select",
      "label": "Pipeline Stage",
      "required": true,
      "options": ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"],
      "default": "lead"
    },
    {
      "name": "probability",
      "type": "number",
      "label": "Win Probability %",
      "required": false,
      "suffix": "%",
      "validation": {"min": 0, "max": 100}
    },
    {
      "name": "close_date",
      "type": "date",
      "label": "Expected Close Date",
      "required": false
    },
    {
      "name": "description",
      "type": "textarea",
      "label": "Description",
      "required": false
    }
  ]'::jsonb,
  '["table", "kanban", "calendar"]'::jsonb,
  'kanban',
  true,
  :'user_id'
)
RETURNING id;

-- Projects Entity
INSERT INTO crm_entities (
  workspace_id,
  entity_name,
  display_name,
  display_name_singular,
  icon,
  color,
  description,
  fields,
  views,
  default_view,
  is_system,
  created_by
)
VALUES (
  (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
  'projects',
  'Projects',
  'Project',
  'work',
  '#10b981',
  'Manage customer projects',
  '[
    {
      "name": "name",
      "type": "text",
      "label": "Project Name",
      "required": true
    },
    {
      "name": "status",
      "type": "select",
      "label": "Status",
      "required": true,
      "options": ["planning", "in_progress", "on_hold", "completed", "cancelled"],
      "default": "planning"
    },
    {
      "name": "start_date",
      "type": "date",
      "label": "Start Date"
    },
    {
      "name": "end_date",
      "type": "date",
      "label": "End Date"
    },
    {
      "name": "budget",
      "type": "number",
      "label": "Budget",
      "prefix": "$"
    }
  ]'::jsonb,
  '["table", "kanban", "calendar"]'::jsonb,
  'kanban',
  false,
  :'user_id'
);

-- =====================================================
-- Sample CRM Records
-- =====================================================

-- Sample Contacts
INSERT INTO crm_records (workspace_id, entity_id, data, tags, created_by)
VALUES
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_entities WHERE entity_name = 'contacts' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
    '{
      "name": "Sarah Johnson",
      "email": "sarah.johnson@techcorp.com",
      "phone": "+1 (555) 234-5678",
      "company": "TechCorp Solutions",
      "position": "CTO",
      "status": "qualified",
      "source": "referral"
    }'::jsonb,
    ARRAY['enterprise', 'decision-maker'],
    :'user_id'
  ),
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_entities WHERE entity_name = 'contacts' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
    '{
      "name": "Michael Chen",
      "email": "m.chen@startup.io",
      "phone": "+1 (555) 345-6789",
      "company": "Startup.io",
      "position": "Founder & CEO",
      "status": "customer",
      "source": "website"
    }'::jsonb,
    ARRAY['startup', 'vip'],
    :'user_id'
  ),
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_entities WHERE entity_name = 'contacts' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
    '{
      "name": "Emily Rodriguez",
      "email": "emily.r@enterprise.com",
      "phone": "+1 (555) 456-7890",
      "company": "Enterprise Corp",
      "position": "VP of Sales",
      "status": "contacted",
      "source": "cold_call"
    }'::jsonb,
    ARRAY['enterprise'],
    :'user_id'
  );

-- Sample Deals
INSERT INTO crm_records (workspace_id, entity_id, data, tags, created_by)
VALUES
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_entities WHERE entity_name = 'deals' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
    '{
      "title": "Enterprise CRM Implementation",
      "amount": 125000,
      "stage": "proposal",
      "probability": 75,
      "close_date": "2025-03-15",
      "description": "Full CRM implementation for TechCorp with AI features"
    }'::jsonb,
    ARRAY['high-value', 'enterprise'],
    :'user_id'
  ),
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_entities WHERE entity_name = 'deals' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
    '{
      "title": "Startup Package - Annual",
      "amount": 24000,
      "stage": "closed_won",
      "probability": 100,
      "close_date": "2025-01-10",
      "description": "Annual subscription for Startup.io"
    }'::jsonb,
    ARRAY['recurring', 'closed'],
    :'user_id'
  ),
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_entities WHERE entity_name = 'deals' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
    '{
      "title": "Q1 Consulting Engagement",
      "amount": 45000,
      "stage": "negotiation",
      "probability": 60,
      "close_date": "2025-02-28",
      "description": "3-month consulting engagement"
    }'::jsonb,
    ARRAY['consulting', 'q1'],
    :'user_id'
  );

-- =====================================================
-- Sample Activities
-- =====================================================

INSERT INTO activities (
  workspace_id,
  record_id,
  activity_type,
  title,
  description,
  scheduled_at,
  is_completed,
  created_by
)
VALUES
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_records WHERE data->>'name' = 'Sarah Johnson' LIMIT 1),
    'call',
    'Discovery Call',
    'Initial discovery call to understand requirements',
    NOW() + INTERVAL '2 days',
    false,
    :'user_id'
  ),
  (
    (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
    (SELECT id FROM crm_records WHERE data->>'name' = 'Michael Chen' LIMIT 1),
    'meeting',
    'Quarterly Business Review',
    'Q1 review meeting with Startup.io team',
    NOW() + INTERVAL '1 week',
    false,
    :'user_id'
  );

-- =====================================================
-- Sample Automation Rule
-- =====================================================

INSERT INTO automation_rules (
  workspace_id,
  entity_id,
  name,
  description,
  trigger_type,
  trigger_config,
  conditions,
  action_type,
  action_config,
  is_active,
  created_by
)
VALUES (
  (SELECT id FROM workspaces WHERE slug = 'acme-corp'),
  (SELECT id FROM crm_entities WHERE entity_name = 'deals' AND workspace_id = (SELECT id FROM workspaces WHERE slug = 'acme-corp')),
  'Send Welcome Email on Deal Won',
  'Automatically send welcome email when deal is closed won',
  'field_changed',
  '{
    "field": "stage",
    "to": "closed_won"
  }'::jsonb,
  '[
    {"field": "amount", "operator": "greater_than", "value": 1000}
  ]'::jsonb,
  'send_email',
  '{
    "template": "welcome_email",
    "to_field": "contact_email",
    "subject": "Welcome to SmartCRM!",
    "delay_minutes": 5
  }'::jsonb,
  true,
  :'user_id'
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify workspace created
SELECT id, name, slug FROM workspaces;

-- Verify entities created
SELECT entity_name, display_name, icon FROM crm_entities;

-- Verify records created
SELECT 
  e.display_name as entity,
  COUNT(r.id) as record_count
FROM crm_records r
JOIN crm_entities e ON r.entity_id = e.id
GROUP BY e.display_name;

-- Verify activities created
SELECT activity_type, title, is_completed FROM activities;

-- Verify automation rules
SELECT name, trigger_type, action_type, is_active FROM automation_rules;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sample Data Loaded Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - 1 workspace (Acme Corporation)';
  RAISE NOTICE '  - 3 entities (Contacts, Deals, Projects)';
  RAISE NOTICE '  - 3 contacts';
  RAISE NOTICE '  - 3 deals';
  RAISE NOTICE '  - 2 activities';
  RAISE NOTICE '  - 1 automation rule';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the CRM through the API!';
  RAISE NOTICE '========================================';
END $$;
