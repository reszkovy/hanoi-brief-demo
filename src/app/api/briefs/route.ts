import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import {
  getAuthenticatedSupabase,
  isMaster,
  badRequest,
  validateRequired,
  validateEnum,
  validateEmail,
} from '@/lib/api-helpers'
import type { CreateBriefPayload } from '@/lib/types'

/**
 * GET /api/briefs
 * List briefs (master=all, agent=own)
 * Includes agent and brand_profile joins
 */
export async function GET(request: NextRequest) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  const query = supabase
    .from('briefs')
    .select(
      `id, title, status, lang, scope, agent_id, brand_profile_id, client_name, client_email,
       client_company, public_token, token_expires_at, sent_at, started_at, completed_at,
       wizard_data, created_at, updated_at`
    )
    .order('created_at', { ascending: false })

  // If agent, filter to own briefs only
  if (!isMaster(profile!)) {
    query.eq('agent_id', user!.id)
  }

  const { data, error: queryError } = await query

  if (queryError) {
    return badRequest(queryError.message)
  }

  return NextResponse.json(data)
}

/**
 * POST /api/briefs
 * Create brief
 * Validate: title required, lang must be pl/en
 * Generate nanoid(12) token
 * Return created brief with token
 */
export async function POST(request: NextRequest) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  let body: Partial<CreateBriefPayload>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  // Validate required fields
  const requiredError = validateRequired(body, ['title', 'lang'])
  if (requiredError) {
    return badRequest(requiredError)
  }

  // Validate lang enum
  const langError = validateEnum(body.lang, ['pl', 'en'], 'lang')
  if (langError) {
    return badRequest(langError)
  }

  // Validate client_email if provided
  if (body.client_email && !validateEmail(body.client_email)) {
    return badRequest('Invalid client email format')
  }

  // Generate token
  const token = nanoid(12)

  const { data: createdBrief, error: insertError } = await supabase
    .from('briefs')
    .insert({
      agent_id: user!.id,
      title: body.title!.trim(),
      brand_profile_id: body.brand_profile_id || null,
      client_name: body.client_name ? body.client_name.trim() : null,
      client_email: body.client_email ? body.client_email.trim() : null,
      client_company: body.client_company ? body.client_company.trim() : null,
      status: 'draft',
      lang: body.lang as 'pl' | 'en',
      public_token: token,
      wizard_data: {},
    })
    .select(
      `id, title, status, lang, agent_id, brand_profile_id, client_name,
       client_email, client_company, public_token, token_expires_at, sent_at,
       started_at, completed_at, created_at, updated_at`
    )
    .single()

  if (insertError || !createdBrief) {
    return badRequest(insertError?.message || 'Failed to create brief')
  }

  return NextResponse.json(createdBrief, { status: 201 })
}
