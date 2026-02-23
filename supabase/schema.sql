-- ============================================
-- BRIEFING APP — Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TYPE user_role AS ENUM ('master', 'agent');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  avatar_url TEXT,
  lang TEXT NOT NULL DEFAULT 'pl' CHECK (lang IN ('pl', 'en')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- BRAND PROFILES (white-label per agent)
-- ============================================
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name_pl TEXT NOT NULL,
  name_en TEXT,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#0071e3',
  typography_variant TEXT DEFAULT 'system' CHECK (typography_variant IN ('system', 'serif', 'mono')),
  tone_variant TEXT DEFAULT 'neutral' CHECK (tone_variant IN ('neutral', 'friendly', 'formal')),
  cover_image_url TEXT,
  footer_signature_pl TEXT,
  footer_signature_en TEXT,
  domain_slug TEXT UNIQUE,
  email_template_id TEXT,
  disclaimer_pl TEXT,
  disclaimer_en TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- BRIEFS
-- ============================================
CREATE TYPE brief_status AS ENUM ('draft', 'sent', 'in_progress', 'completed', 'archived');

CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,

  -- Client info
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,

  -- Brief metadata
  title TEXT NOT NULL,
  status brief_status NOT NULL DEFAULT 'draft',
  lang TEXT NOT NULL DEFAULT 'pl' CHECK (lang IN ('pl', 'en')),

  -- Public access token (for client link)
  public_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ,

  -- Brief data (JSONB — flexible wizard data)
  wizard_data JSONB DEFAULT '{}',

  -- Timestamps
  sent_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,  -- when client first opens
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for token lookups (client access)
CREATE UNIQUE INDEX idx_briefs_public_token ON briefs(public_token);
CREATE INDEX idx_briefs_agent_id ON briefs(agent_id);
CREATE INDEX idx_briefs_status ON briefs(status);

-- ============================================
-- BRIEF STEPS (wizard step responses)
-- ============================================
CREATE TABLE brief_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  step_data JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(brief_id, step_number)
);

CREATE INDEX idx_brief_steps_brief_id ON brief_steps(brief_id);

-- ============================================
-- ACTIVITY LOG
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('master', 'agent', 'client', 'system')),
  actor_id UUID,  -- NULL for client/system actions
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_brief_id ON activity_log(brief_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
-- Master can see all profiles
CREATE POLICY "master_read_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

-- Agent can see only own profile
CREATE POLICY "agent_read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- BRAND PROFILES policies
-- Master can see all brand profiles
CREATE POLICY "master_read_all_brands" ON brand_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

-- Agent can see only own brand profiles
CREATE POLICY "agent_read_own_brands" ON brand_profiles
  FOR SELECT USING (owner_id = auth.uid());

-- Agent can create own brand profiles
CREATE POLICY "agent_create_own_brands" ON brand_profiles
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Agent can update own brand profiles
CREATE POLICY "agent_update_own_brands" ON brand_profiles
  FOR UPDATE USING (owner_id = auth.uid());

-- Agent can delete own brand profiles
CREATE POLICY "agent_delete_own_brands" ON brand_profiles
  FOR DELETE USING (owner_id = auth.uid());

-- Master can manage all brand profiles
CREATE POLICY "master_manage_all_brands" ON brand_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

-- BRIEFS policies
-- Master can see all briefs
CREATE POLICY "master_read_all_briefs" ON briefs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

-- Agent can see only own briefs
CREATE POLICY "agent_read_own_briefs" ON briefs
  FOR SELECT USING (agent_id = auth.uid());

-- Agent can create briefs (assigned to self)
CREATE POLICY "agent_create_own_briefs" ON briefs
  FOR INSERT WITH CHECK (agent_id = auth.uid());

-- Agent can update own briefs
CREATE POLICY "agent_update_own_briefs" ON briefs
  FOR UPDATE USING (agent_id = auth.uid());

-- Master can manage all briefs
CREATE POLICY "master_manage_all_briefs" ON briefs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

-- Public access for clients (via service role in API, not RLS)
-- Client access will be handled through API routes using service role key

-- BRIEF STEPS policies
-- Master can see all steps
CREATE POLICY "master_read_all_steps" ON brief_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

-- Agent can see steps of own briefs
CREATE POLICY "agent_read_own_brief_steps" ON brief_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM briefs b WHERE b.id = brief_id AND b.agent_id = auth.uid())
  );

-- ACTIVITY LOG policies
CREATE POLICY "master_read_all_activity" ON activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'master')
  );

CREATE POLICY "agent_read_own_activity" ON activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM briefs b WHERE b.id = brief_id AND b.agent_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brief_steps_updated_at
  BEFORE UPDATE ON brief_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
