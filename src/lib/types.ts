// ============================================
// BRIEFING APP — Type Definitions
// ============================================

export type UserRole = 'master' | 'agent'
export type BriefStatus = 'draft' | 'sent' | 'in_progress' | 'completed' | 'archived'
export type Lang = 'pl' | 'en'
export type ToneVariant = 'neutral' | 'friendly' | 'formal'
export type TypographyVariant = 'system' | 'serif' | 'mono'

// ============================================
// Database Row Types
// ============================================

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  lang: Lang
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BrandProfile {
  id: string
  owner_id: string
  name_pl: string
  name_en: string | null
  logo_url: string | null
  accent_color: string
  typography_variant: TypographyVariant
  tone_variant: ToneVariant
  cover_image_url: string | null
  footer_signature_pl: string | null
  footer_signature_en: string | null
  domain_slug: string | null
  email_template_id: string | null
  disclaimer_pl: string | null
  disclaimer_en: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Brief {
  id: string
  agent_id: string | null
  brand_profile_id: string | null
  client_name: string | null
  client_email: string | null
  client_company: string | null
  title: string
  status: BriefStatus
  lang: Lang
  scope: string | null
  public_token: string
  token_expires_at: string | null
  wizard_data: Record<string, any>
  sent_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface BriefStep {
  id: string
  brief_id: string
  step_number: number
  step_key: string
  step_data: Record<string, any>
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  brief_id: string | null
  actor_type: 'master' | 'agent' | 'client' | 'system'
  actor_id: string | null
  action: string
  details: Record<string, any>
  created_at: string
}

// ============================================
// Extended / Joined Types
// ============================================

export interface BriefWithAgent extends Brief {
  agent: Pick<Profile, 'id' | 'full_name' | 'email'> | null
  brand_profile: Pick<BrandProfile, 'id' | 'name_pl' | 'name_en' | 'accent_color' | 'logo_url'> | null
}

export interface AgentWithStats extends Profile {
  briefs_count: number
  briefs_completed: number
  briefs_in_progress: number
  brand_profiles_count: number
}

// ============================================
// Wizard Step Definitions
// ============================================

export interface WizardStepDef {
  key: string
  number: number
  title: { pl: string; en: string }
  description: { pl: string; en: string }
  fields: WizardField[]
}

export interface WizardField {
  key: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'number' | 'date' | 'file' | 'url' | 'slider' | 'section_header'
  label: { pl: string; en: string }
  placeholder?: { pl: string; en: string }
  required: boolean
  options?: { value: string; label: { pl: string; en: string } }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: { pl: string; en: string }
  }
  helpText?: { pl: string; en: string }
}

// ============================================
// API Types
// ============================================

export interface CreateBriefPayload {
  title: string
  brand_profile_id?: string
  client_name?: string
  client_email?: string
  client_company?: string
  lang: Lang
}

export interface CreateAgentPayload {
  email: string
  full_name: string
  password: string
  lang?: Lang
}

export interface CreateBrandProfilePayload {
  name_pl: string
  name_en?: string
  logo_url?: string
  accent_color?: string
  typography_variant?: TypographyVariant
  tone_variant?: ToneVariant
  cover_image_url?: string
  footer_signature_pl?: string
  footer_signature_en?: string
  disclaimer_pl?: string
  disclaimer_en?: string
}

export interface ClientBriefSubmission {
  token: string
  step_number: number
  step_key: string
  step_data: Record<string, any>
}
