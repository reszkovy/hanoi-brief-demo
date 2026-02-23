import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedSupabase,
  isMaster,
  forbidden,
  badRequest,
  validateRequired,
  validateEmail,
  validatePasswordLength,
} from '@/lib/api-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CreateAgentPayload } from '@/lib/types'

/**
 * GET /api/agents
 * List agents
 * MASTER ONLY
 */
export async function GET(request: NextRequest) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Master only
  if (!isMaster(profile!)) {
    return forbidden()
  }

  const { data, error: queryError } = await supabase
    .from('profiles')
    .select(
      `id, email, full_name, role, avatar_url, lang, is_active, created_at, updated_at`
    )
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  if (queryError) {
    return badRequest(queryError.message)
  }

  return NextResponse.json(data)
}

/**
 * POST /api/agents
 * Create agent
 * MASTER ONLY
 * Validate: email (format), full_name (required), password (min 8 chars)
 * Use admin client for auth.admin.createUser
 * Pass user_metadata with full_name and role='agent' for trigger to use
 */
export async function POST(request: NextRequest) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Master only
  if (!isMaster(profile!)) {
    return forbidden()
  }

  let body: Partial<CreateAgentPayload>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  // Validate required fields
  const requiredError = validateRequired(body, ['email', 'full_name', 'password'])
  if (requiredError) {
    return badRequest(requiredError)
  }

  // Validate email format
  if (!validateEmail(body.email!)) {
    return badRequest('Invalid email format')
  }

  // Validate password length
  if (!validatePasswordLength(body.password!)) {
    return badRequest('Password must be at least 8 characters')
  }

  const adminClient = createAdminClient()

  // Create auth user with user_metadata for trigger
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: body.email!.trim(),
      password: body.password!,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name!.trim(),
        role: 'agent',
      },
    })

  if (authError || !authData.user) {
    return badRequest(authError?.message || 'Failed to create auth user')
  }

  // Wait a moment for trigger to create profile, then fetch it
  await new Promise((resolve) => setTimeout(resolve, 500))

  const { data: createdProfile, error: profileError } = await supabase
    .from('profiles')
    .select(
      `id, email, full_name, role, avatar_url, lang, is_active, created_at, updated_at`
    )
    .eq('id', authData.user.id)
    .single()

  if (profileError || !createdProfile) {
    // Clean up auth user if profile fetch fails (it might exist but query failed)
    // Don't delete as it may have been created by trigger
    return badRequest('Failed to fetch created profile')
  }

  return NextResponse.json(createdProfile, { status: 201 })
}
