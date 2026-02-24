import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/public/brief/[token]
 * Get brief by public token
 * NO AUTH — uses admin client
 * Check expiration
 * Return brief data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const adminClient = createAdminClient()

  const { data: brief, error: queryError } = await adminClient
    .from('briefs')
    .select(
      `id, title, status, lang, agent_id, brand_profile_id, client_name,
       client_email, client_company, public_token, token_expires_at, sent_at,
       started_at, completed_at, wizard_data, scope, created_at, updated_at`
    )
    .eq('public_token', params.token)
    .single()

  if (queryError || !brief) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // Check expiration
  if (brief.token_expires_at) {
    const expiresAt = new Date(brief.token_expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'token expired' },
        { status: 410 }
      )
    }
  }

  return NextResponse.json(brief)
}

/**
 * PATCH /api/public/brief/[token]
 * Save wizard step
 * NO AUTH — uses admin client
 * Validate: step_number (0-7), step_key (required)
 * Auto-set started_at, mark completed on last step
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const adminClient = createAdminClient()

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  // Validate required fields
  if (body.step_number === undefined || body.step_number === null) {
    return NextResponse.json(
      { error: 'step_number is required' },
      { status: 400 }
    )
  }

  if (!body.step_key || typeof body.step_key !== 'string') {
    return NextResponse.json(
      { error: 'step_key is required' },
      { status: 400 }
    )
  }

  if (!body.step_data || typeof body.step_data !== 'object') {
    return NextResponse.json(
      { error: 'step_data is required' },
      { status: 400 }
    )
  }

  // Validate step_number range
  const stepNumber = parseInt(body.step_number, 10)
  if (isNaN(stepNumber) || stepNumber < 0) {
    return NextResponse.json(
      { error: 'step_number must be a non-negative integer' },
      { status: 400 }
    )
  }

  // Get brief
  const { data: brief, error: briefError } = await adminClient
    .from('briefs')
    .select('id, wizard_data, started_at, status, token_expires_at')
    .eq('public_token', params.token)
    .single()

  if (briefError || !brief) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // Check expiration
  if (brief.token_expires_at) {
    const expiresAt = new Date(brief.token_expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'token expired' },
        { status: 410 }
      )
    }
  }

  // Update wizard data — merge step_data into existing wizard_data
  const wizardData = { ...(brief.wizard_data || {}), ...body.step_data }

  // Prepare update data
  const updateData: Record<string, any> = {
    wizard_data: wizardData,
    status: 'in_progress',
    started_at: brief.started_at || new Date().toISOString(),
  }

  // Also save the scope if present in step_data
  if (body.step_data._scope) {
    updateData.scope = body.step_data._scope
  }

  // Auto-update title from project_name
  if (body.step_data.project_name && typeof body.step_data.project_name === 'string') {
    updateData.title = body.step_data.project_name
  }

  // If frontend says this is the final submission, mark as completed
  if (body.is_final === true) {
    updateData.status = 'completed'
    updateData.completed_at = new Date().toISOString()
  }

  const { error: updateError } = await adminClient
    .from('briefs')
    .update(updateData)
    .eq('public_token', params.token)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true })
}
