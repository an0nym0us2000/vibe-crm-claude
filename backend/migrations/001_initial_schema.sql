-- =====================================================
-- SmartCRM Builder - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all core tables for multi-tenant CRM with dynamic entities
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: user_profiles
-- Description: Extended user profile information beyond Supabase auth.users
-- Links to: auth.users (Supabase managed)
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  industry TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'Extended user profile information beyond auth.users';
COMMENT ON COLUMN user_profiles.preferences IS 'User preferences as JSON: {theme, notifications, language, etc.}';

-- =====================================================
-- TABLE: workspaces
-- Description: Multi-tenant workspaces (teams/organizations)
-- Each workspace is an isolated CRM instance
-- =====================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workspaces IS 'Multi-tenant workspaces - each workspace is an isolated CRM instance';
COMMENT ON COLUMN workspaces.config IS 'Workspace configuration: {branding, settings, features, limits}';
COMMENT ON COLUMN workspaces.slug IS 'URL-friendly unique identifier for workspace';

-- =====================================================
-- TABLE: workspace_members
-- Description: Maps users to workspaces with roles
-- Roles: owner (full control), admin (manage users), member (standard access)
-- =====================================================
CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

COMMENT ON TABLE workspace_members IS 'Maps users to workspaces with role-based access control';
COMMENT ON COLUMN workspace_members.permissions IS 'Additional granular permissions as JSON array: ["create_contacts", "delete_deals"]';

-- =====================================================
-- TABLE: crm_entities
-- Description: Dynamic entity definitions (e.g., Contacts, Deals, Projects)
-- Each entity has custom fields defined in JSONB
-- =====================================================
CREATE TABLE crm_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL, -- e.g., "contacts", "deals", "projects"
  display_name TEXT NOT NULL, -- e.g., "Contacts", "Deals", "Projects"
  display_name_singular TEXT NOT NULL, -- e.g., "Contact", "Deal", "Project"
  icon TEXT, -- e.g., "person", "attach_money", "work"
  color TEXT, -- e.g., "#667eea"
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  views JSONB DEFAULT '["table", "kanban", "calendar"]'::jsonb,
  default_view TEXT DEFAULT 'table',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, entity_name)
);

COMMENT ON TABLE crm_entities IS 'Dynamic CRM entity definitions with custom fields';
COMMENT ON COLUMN crm_entities.fields IS 'Field definitions as JSON array: [{name, type, label, required, options, validation}]';
COMMENT ON COLUMN crm_entities.views IS 'Available view types: ["table", "kanban", "calendar", "list", "cards"]';
COMMENT ON COLUMN crm_entities.is_system IS 'System entities cannot be deleted (e.g., default Contacts, Deals)';

-- Example fields JSONB structure:
-- [
--   {
--     "name": "name",
--     "type": "text",
--     "label": "Full Name",
--     "required": true,
--     "validation": {"minLength": 2}
--   },
--   {
--     "name": "email",
--     "type": "email",
--     "label": "Email Address",
--     "required": false
--   },
--   {
--     "name": "status",
--     "type": "select",
--     "label": "Status",
--     "options": ["lead", "qualified", "customer"]
--   }
-- ]

-- =====================================================
-- TABLE: crm_records
-- Description: Stores actual CRM data for all entities
-- Data is stored as JSONB for maximum flexibility
-- =====================================================
CREATE TABLE crm_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES crm_entities(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_archived BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE crm_records IS 'Stores actual CRM data as flexible JSONB objects';
COMMENT ON COLUMN crm_records.data IS 'CRM record data matching entity field definitions: {name: "John Doe", email: "john@example.com"}';
COMMENT ON COLUMN crm_records.tags IS 'Array of tags for categorization and filtering';

-- Example data JSONB structure:
-- {
--   "name": "John Doe",
--   "email": "john@example.com",
--   "phone": "+1234567890",
--   "company": "Acme Corp",
--   "status": "qualified",
--   "deal_value": 50000
-- }

-- =====================================================
-- TABLE: crm_relationships
-- Description: Links between CRM records (e.g., Contact -> Deals)
-- =====================================================
CREATE TABLE crm_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  from_record_id UUID NOT NULL REFERENCES crm_records(id) ON DELETE CASCADE,
  to_record_id UUID NOT NULL REFERENCES crm_records(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- e.g., "contact_to_deal", "deal_to_project"
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_record_id, to_record_id, relationship_type)
);

COMMENT ON TABLE crm_relationships IS 'Defines relationships between CRM records';
COMMENT ON COLUMN crm_relationships.metadata IS 'Additional relationship metadata: {role, status, notes}';

-- =====================================================
-- TABLE: automation_rules
-- Description: Workflow automation rules
-- Triggers execute actions when conditions are met
-- =====================================================
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES crm_entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('record_created', 'record_updated', 'record_deleted', 'field_changed', 'scheduled', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'create_task', 'update_field', 'create_record', 'webhook', 'ai_generate')),
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE automation_rules IS 'Workflow automation rules with triggers and actions';
COMMENT ON COLUMN automation_rules.trigger_config IS 'Trigger configuration: {field: "status", from: "lead", to: "qualified"}';
COMMENT ON COLUMN automation_rules.conditions IS 'Conditions to evaluate: [{field, operator, value}]';
COMMENT ON COLUMN automation_rules.action_config IS 'Action configuration: {template_id, send_to, subject, body}';

-- Example trigger_config for field_changed:
-- {
--   "field": "status",
--   "from": "lead",
--   "to": "qualified"
-- }

-- Example conditions:
-- [
--   {"field": "deal_value", "operator": "greater_than", "value": 10000},
--   {"field": "country", "operator": "equals", "value": "USA"}
-- ]

-- Example action_config for send_email:
-- {
--   "template_id": "welcome_email",
--   "to_field": "email",
--   "subject": "Welcome {{name}}!",
--   "body_template": "template_id_or_content"
-- }

-- =====================================================
-- TABLE: activities
-- Description: Activity log for CRM records (calls, emails, meetings, notes)
-- =====================================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES crm_records(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'sms')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE activities IS 'Activity timeline for CRM records (calls, meetings, tasks, etc.)';
COMMENT ON COLUMN activities.metadata IS 'Activity-specific data: {duration, attendees, outcome, call_recording_url}';

-- =====================================================
-- TABLE: ai_generations
-- Description: Tracks AI-generated content for audit and learning
-- =====================================================
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  record_id UUID REFERENCES crm_records(id) ON DELETE SET NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('email', 'note', 'summary', 'insight', 'score')),
  prompt TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  result TEXT,
  model TEXT DEFAULT 'gpt-4',
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_generations IS 'Tracks AI-generated content for audit, billing, and improvement';
COMMENT ON COLUMN ai_generations.context IS 'Context provided to AI: {record_data, user_instructions}';

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- User Profiles
CREATE INDEX idx_user_profiles_company ON user_profiles(company_name);

-- Workspaces
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_active ON workspaces(is_active) WHERE is_active = true;

-- Workspace Members
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(workspace_id, role);

-- CRM Entities
CREATE INDEX idx_crm_entities_workspace ON crm_entities(workspace_id);
CREATE INDEX idx_crm_entities_name ON crm_entities(workspace_id, entity_name);
CREATE INDEX idx_crm_entities_active ON crm_entities(workspace_id, is_active) WHERE is_active = true;

-- CRM Records
CREATE INDEX idx_crm_records_workspace ON crm_records(workspace_id);
CREATE INDEX idx_crm_records_entity ON crm_records(entity_id);
CREATE INDEX idx_crm_records_created_by ON crm_records(created_by);
CREATE INDEX idx_crm_records_created_at ON crm_records(created_at DESC);
CREATE INDEX idx_crm_records_archived ON crm_records(workspace_id, is_archived) WHERE is_archived = false;
CREATE INDEX idx_crm_records_tags ON crm_records USING GIN(tags);
CREATE INDEX idx_crm_records_data ON crm_records USING GIN(data); -- For JSONB queries

-- CRM Relationships
CREATE INDEX idx_crm_relationships_from ON crm_relationships(from_record_id);
CREATE INDEX idx_crm_relationships_to ON crm_relationships(to_record_id);
CREATE INDEX idx_crm_relationships_type ON crm_relationships(relationship_type);

-- Automation Rules
CREATE INDEX idx_automation_rules_workspace ON automation_rules(workspace_id);
CREATE INDEX idx_automation_rules_entity ON automation_rules(entity_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(workspace_id, is_active) WHERE is_active = true;
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type);

-- Activities
CREATE INDEX idx_activities_workspace ON activities(workspace_id);
CREATE INDEX idx_activities_record ON activities(record_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_assigned ON activities(assigned_to);
CREATE INDEX idx_activities_scheduled ON activities(scheduled_at);
CREATE INDEX idx_activities_completed ON activities(is_completed, scheduled_at) WHERE is_completed = false;

-- AI Generations
CREATE INDEX idx_ai_generations_workspace ON ai_generations(workspace_id);
CREATE INDEX idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_record ON ai_generations(record_id);
CREATE INDEX idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX idx_ai_generations_created ON ai_generations(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICY: user_profiles
-- Users can only see and update their own profile
-- =====================================================
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICY: workspaces
-- Users can see workspaces they are members of
-- Only owners can update workspace
-- =====================================================
CREATE POLICY "Users can view workspaces they belong to"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update workspace"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete workspace"
  ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- RLS POLICY: workspace_members
-- Users can see members of workspaces they belong to
-- Owners and admins can manage members
-- =====================================================
CREATE POLICY "Users can view members of their workspaces"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can update members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can remove members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- RLS POLICY: crm_entities
-- Workspace members can view entities
-- Admins and owners can manage entities
-- =====================================================
CREATE POLICY "Workspace members can view entities"
  ON crm_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_entities.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can create entities"
  ON crm_entities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_entities.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can update entities"
  ON crm_entities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_entities.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can delete non-system entities"
  ON crm_entities FOR DELETE
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_entities.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- RLS POLICY: crm_records
-- Workspace members can view and manage records
-- =====================================================
CREATE POLICY "Workspace members can view records"
  ON crm_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_records.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create records"
  ON crm_records FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_records.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update records"
  ON crm_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_records.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete records"
  ON crm_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_records.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICY: crm_relationships
-- Same as crm_records
-- =====================================================
CREATE POLICY "Workspace members can view relationships"
  ON crm_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_relationships.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create relationships"
  ON crm_relationships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_relationships.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete relationships"
  ON crm_relationships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = crm_relationships.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICY: automation_rules
-- Workspace admins can manage automation rules
-- =====================================================
CREATE POLICY "Workspace members can view automation rules"
  ON automation_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = automation_rules.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can create automation rules"
  ON automation_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = automation_rules.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can update automation rules"
  ON automation_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = automation_rules.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can delete automation rules"
  ON automation_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = automation_rules.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- RLS POLICY: activities
-- Workspace members can manage activities
-- =====================================================
CREATE POLICY "Workspace members can view activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activities.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create activities"
  ON activities FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activities.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update activities"
  ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activities.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete activities"
  ON activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activities.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICY: ai_generations
-- Users can view generations in their workspaces
-- =====================================================
CREATE POLICY "Workspace members can view AI generations"
  ON ai_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ai_generations.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create AI generations"
  ON ai_generations FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = ai_generations.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_entities_updated_at BEFORE UPDATE ON crm_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_records_updated_at BEFORE UPDATE ON crm_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add workspace owner as member
CREATE OR REPLACE FUNCTION add_workspace_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_owner_to_workspace_members
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION add_workspace_owner_as_member();

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Note: This assumes you have a test user in auth.users
-- Replace the UUIDs with actual user IDs after creating users
-- You can run this manually with real user IDs

-- COMMENT: Uncomment and modify these after creating your first user

/*
-- Sample workspace (replace user_id with actual auth.users id)
INSERT INTO workspaces (name, slug, owner_id, config) VALUES
  ('Acme Corporation', 'acme-corp', 'YOUR_USER_ID_HERE', '{"industry": "Technology", "size": "50-200"}');

-- Get the workspace ID (or use the returned ID from INSERT)
-- Sample entities
INSERT INTO crm_entities (workspace_id, entity_name, display_name, display_name_singular, icon, color, fields, is_system) VALUES
  (
    'WORKSPACE_ID_HERE',
    'contacts',
    'Contacts',
    'Contact',
    'person',
    '#667eea',
    '[
      {"name": "name", "type": "text", "label": "Full Name", "required": true},
      {"name": "email", "type": "email", "label": "Email", "required": false},
      {"name": "phone", "type": "text", "label": "Phone", "required": false},
      {"name": "company", "type": "text", "label": "Company", "required": false},
      {"name": "position", "type": "text", "label": "Position", "required": false},
      {"name": "status", "type": "select", "label": "Status", "options": ["lead", "qualified", "customer", "inactive"]}
    ]'::jsonb,
    true
  ),
  (
    'WORKSPACE_ID_HERE',
    'deals',
    'Deals',
    'Deal',
    'attach_money',
    '#764ba2',
    '[
      {"name": "title", "type": "text", "label": "Deal Name", "required": true},
      {"name": "amount", "type": "number", "label": "Amount", "required": true},
      {"name": "stage", "type": "select", "label": "Stage", "options": ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]},
      {"name": "close_date", "type": "date", "label": "Expected Close Date", "required": false},
      {"name": "probability", "type": "number", "label": "Win Probability %", "required": false}
    ]'::jsonb,
    true
  );

-- Sample records (replace IDs)
INSERT INTO crm_records (workspace_id, entity_id, data, created_by) VALUES
  (
    'WORKSPACE_ID_HERE',
    'CONTACTS_ENTITY_ID_HERE',
    '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890", "company": "TechCorp", "position": "CTO", "status": "qualified"}'::jsonb,
    'YOUR_USER_ID_HERE'
  ),
  (
    'WORKSPACE_ID_HERE',
    'DEALS_ENTITY_ID_HERE',
    '{"title": "Enterprise Deal", "amount": 50000, "stage": "proposal", "close_date": "2025-03-15", "probability": 75}'::jsonb,
    'YOUR_USER_ID_HERE'
  );
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SmartCRM Schema Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - user_profiles';
  RAISE NOTICE '  - workspaces';
  RAISE NOTICE '  - workspace_members';
  RAISE NOTICE '  - crm_entities';
  RAISE NOTICE '  - crm_records';
  RAISE NOTICE '  - crm_relationships';
  RAISE NOTICE '  - automation_rules';
  RAISE NOTICE '  - activities';
  RAISE NOTICE '  - ai_generations';
  RAISE NOTICE '';
  RAISE NOTICE 'Enabled Row Level Security (RLS) on all tables';
  RAISE NOTICE 'Created performance indexes';
  RAISE NOTICE 'Created triggers for updated_at timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create a user via Supabase Auth';
  RAISE NOTICE '  2. Uncomment and run sample data with real user IDs';
  RAISE NOTICE '  3. Test RLS policies with authenticated requests';
  RAISE NOTICE '========================================';
END $$;
