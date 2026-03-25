-- ═══════════════════════════════════════════════════════════════════════════
-- COLLABORATIVE WORKSPACES & EDITABLE SOURCES SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════

-- Add collaboration fields to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS is_collaborative boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'));

-- Workspace members table for collaboration
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by uuid REFERENCES auth.users,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace invites table
CREATE TABLE IF NOT EXISTS workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE NOT NULL,
  invited_by uuid REFERENCES auth.users NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Update workspace_sources to support CRUD operations
ALTER TABLE workspace_sources
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users;

-- Workspace activity log for real-time sync
CREATE TABLE IF NOT EXISTS workspace_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_workspace ON workspace_activity(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_sources_workspace ON workspace_sources(workspace_id);

-- Row Level Security Policies

-- Workspace members: users can see memberships they're part of
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace memberships they're part of"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage members"
  ON workspace_members FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace invites: users can see invites sent to them
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invites sent to them"
  ON workspace_invites FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    invited_by = auth.uid()
  );

CREATE POLICY "Workspace owners can manage invites"
  ON workspace_invites FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Workspace activity: members can view activity
ALTER TABLE workspace_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view activity"
  ON workspace_activity FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Workspace members can create activity"
  ON workspace_activity FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Update workspaces RLS to include collaborative access
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
CREATE POLICY "Users can view their own and shared workspaces"
  ON workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Update workspace_sources RLS for collaborative editing
DROP POLICY IF EXISTS "Users can manage their workspace sources" ON workspace_sources;
CREATE POLICY "Workspace members can view sources"
  ON workspace_sources FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR
    owner_id = auth.uid()
  );

CREATE POLICY "Workspace editors can manage sources"
  ON workspace_sources FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'editor')
    ) OR
    owner_id = auth.uid()
  );

-- Function to automatically add owner as member
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active', now())
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_add_owner_member
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- Function to update workspace last_opened_at
CREATE OR REPLACE FUNCTION update_workspace_last_opened()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workspaces 
  SET last_opened_at = now() 
  WHERE id = NEW.workspace_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_activity_update_last_opened
  AFTER INSERT ON workspace_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_last_opened();
