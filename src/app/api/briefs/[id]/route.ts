import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedSupabase,
  isMaster,
  notFound,
  forbidden,
  badRequest,
} from '@/lib/api-helpers'

// Whitelist of fields that can be updated
const ALLOWED_PATCH_FIELDS = [
  'title',
  'brand_profile_id',
  'client_name',
  'client_email',
  'client_company',
  'status',
  'lang',
  'wizard_data',
  'token_expires_at',
  'sent_at',
]

/**
 * GET /api/briefs/[id]
 * Get brief by ID
 * Authorization: master can see all, agent only own
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  const { data: brief, error: queryError } = await supabase
    .from('briefs')
    .select(
      `id, title, status, lang, agent_id, brand_profile_id, client_name,
       client_email, client_company, public_token, token_expires_at, sent_at,
       started_at, completed_at, wizard_data, created_at, updated_at`
    )
    .eq('id', params.id)
    .single()

  if (queryError || !brief) {
    return notFound()
  }

  // Authorization check: master can see all, agent only own
  if (!isMaster(profile!) && brief.agent_id !== user!.id) {
    return forbidden()
  }

  return NextResponse.json(brief)
}

/**
 * PATCH /api/briefs/[id]
 * Update brief
 * Authorization check first (fetch brief, verify ownership)
 * Whitelist allowed fields
 * Return updated data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Get brief first for authorization check
  const { data: brief, error: fetchError } = await supabase
    .from('briefs')
    .select('id, agent_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !brief) {
    return notFound()
  }

  // Authorization check: master can update all, agent only own
  if (!isMaster(profile!) && brief.agent_id !== user!.id) {
    return forbidden()
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  // Whitelist fields
  const updateData: Record<string, any> = {}
  for (const field of ALLOWED_PATCH_FIELDS) {
    if (field in body) {
      updateData[field] = body[field]
    }
  }

  // Verify at least one field is being updated
  if (Object.keys(updateData).length === 0) {
    return badRequest('No valid fields to update')
  }

  const { data: updatedBrief, error: updateError } = await supabase
    .from('briefs')
    .update(updateData)
    .eq('id', params.id)
    .select(
      `id, title, status, lang, agent_id, brand_profile_id, client_name,
       client_email, client_company, public_token, token_expires_at, sent_at,
       started_at, completed_at, wizard_data, created_at, updated_at`
    )
    .single()

  if (updateError || !updatedBrief) {
    return badRequest(updateError?.message || 'Failed to update brief')
  }

  return NextResponse.json(updatedBrief)
}

/**
 * DELETE /api/briefs/[id]
 * Delete brief
 * Authorization check first
 * Return success
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Get brief first for authorization check
  const { data: brief, error: fetchError } = await supabase
    .from('briefs')
    .select('id, agent_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !brief) {
    return notFound()
  }

  // Authorization check: master can delete all, agent only own
  if (!isMaster(profile!) && brief.agent_id !== user!.id) {
    return forbidden()
  }

  const { error: deleteError } = await supabase
    .from('briefs')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return badRequest(deleteError.message)
  }

  return NextResponse.json({ success: true })
}
