import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedSupabase,
  isMaster,
  notFound,
  forbidden,
  badRequest,
  validateEnum,
} from '@/lib/api-helpers'

// Whitelist of fields that can be updated
const ALLOWED_PATCH_FIELDS = ['full_name', 'is_active', 'lang']

/**
 * GET /api/agents/[id]
 * Get agent by ID
 * MASTER ONLY
 * Include brief count stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Master only
  if (!isMaster(profile!)) {
    return forbidden()
  }

  const { data: agent, error: queryError } = await supabase
    .from('profiles')
    .select(
      `id, email, full_name, role, avatar_url, lang, is_active, created_at, updated_at`
    )
    .eq('id', params.id)
    .eq('role', 'agent')
    .single()

  if (queryError || !agent) {
    return notFound()
  }

  // Get brief stats
  const { data: briefStats, error: statsError } = await supabase
    .from('briefs')
    .select('id, status')
    .eq('agent_id', params.id)

  if (statsError) {
    return badRequest(statsError.message)
  }

  const briefs_count = briefStats?.length || 0
  const briefs_completed =
    briefStats?.filter((b) => b.status === 'completed').length || 0
  const briefs_in_progress =
    briefStats?.filter((b) => b.status === 'in_progress').length || 0

  // Get brand count
  const { count: brand_profiles_count, error: brandError } = await supabase
    .from('brand_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', params.id)

  if (brandError) {
    return badRequest(brandError.message)
  }

  return NextResponse.json({
    ...agent,
    briefs_count,
    briefs_completed,
    briefs_in_progress,
    brand_profiles_count: brand_profiles_count || 0,
  })
}

/**
 * PATCH /api/agents/[id]
 * Update agent
 * MASTER ONLY
 * Whitelist fields: full_name, is_active, lang
 * Validate enum values
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Master only
  if (!isMaster(profile!)) {
    return forbidden()
  }

  // Get agent first for existence check
  const { data: agent, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', params.id)
    .single()

  if (fetchError || !agent || agent.role !== 'agent') {
    return notFound()
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  // Validate lang enum if provided
  if (body.lang !== undefined) {
    const langError = validateEnum(body.lang, ['pl', 'en'], 'lang')
    if (langError) {
      return badRequest(langError)
    }
  }

  // Whitelist fields
  const updateData: Record<string, any> = {}
  for (const field of ALLOWED_PATCH_FIELDS) {
    if (field in body) {
      if (typeof body[field] === 'string') {
        updateData[field] = body[field].trim()
      } else {
        updateData[field] = body[field]
      }
    }
  }

  // Verify at least one field is being updated
  if (Object.keys(updateData).length === 0) {
    return badRequest('No valid fields to update')
  }

  const { data: updatedAgent, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', params.id)
    .select(
      `id, email, full_name, role, avatar_url, lang, is_active, created_at, updated_at`
    )
    .single()

  if (updateError || !updatedAgent) {
    return badRequest(updateError?.message || 'Failed to update agent')
  }

  // Get brief stats for response
  const { data: briefStats, error: statsError } = await supabase
    .from('briefs')
    .select('id, status')
    .eq('agent_id', params.id)

  if (statsError) {
    return badRequest(statsError.message)
  }

  const briefs_count = briefStats?.length || 0
  const briefs_completed =
    briefStats?.filter((b) => b.status === 'completed').length || 0
  const briefs_in_progress =
    briefStats?.filter((b) => b.status === 'in_progress').length || 0

  // Get brand count
  const { count: brand_profiles_count, error: brandError } = await supabase
    .from('brand_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', params.id)

  if (brandError) {
    return badRequest(brandError.message)
  }

  return NextResponse.json({
    ...updatedAgent,
    briefs_count,
    briefs_completed,
    briefs_in_progress,
    brand_profiles_count: brand_profiles_count || 0,
  })
}
