import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

/**
 * GET /api/public/briefs
 * List all briefs (no auth, admin client)
 * Returns briefs ordered by most recent
 */
export async function GET() {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('briefs')
    .select(
      `id, title, status, lang, scope, client_name, client_company, client_email,
       public_token, completed_at, started_at, created_at, updated_at, wizard_data`
    )
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * POST /api/public/briefs
 * Create a new empty brief (no auth)
 * Returns { public_token } for redirect
 */
export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  let body: Record<string, any> = {}
  try {
    body = await request.json()
  } catch {
    // no body is fine — defaults will be used
  }

  const token = nanoid(12)

  const { data, error } = await adminClient
    .from('briefs')
    .insert({
      title: body.title || 'Nowy brief',
      status: 'draft',
      lang: body.lang || 'pl',
      public_token: token,
      wizard_data: {},
    })
    .select('public_token')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ public_token: data.public_token })
}
