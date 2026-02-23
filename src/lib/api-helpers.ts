import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Profile } from '@/lib/types'

/**
 * Get authenticated Supabase client and verify user is authenticated
 * Returns supabase client, user, profile, or error response
 */
export async function getAuthenticatedSupabase() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return {
      supabase: null,
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, lang, is_active, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      supabase: null,
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'profile not found' }, { status: 401 }),
    }
  }

  return { supabase, user, profile: profile as Profile, error: null }
}

/**
 * Check if profile has master role
 */
export function isMaster(profile: Profile): boolean {
  return profile.role === 'master'
}

/**
 * Return 403 Forbidden response
 */
export function forbidden() {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

/**
 * Return 404 Not Found response
 */
export function notFound() {
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}

/**
 * Return 400 Bad Request response
 */
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Validate required fields in request body
 * Returns error message or null if valid
 */
export function validateRequired(
  body: Record<string, any>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (
      !body[field] ||
      (typeof body[field] === 'string' && body[field].trim() === '')
    ) {
      return `${field} is required`
    }
  }
  return null
}

/**
 * Validate enum field value
 * Returns error message or null if valid
 */
export function validateEnum(
  value: string | undefined,
  allowed: string[],
  fieldName: string
): string | null {
  if (value !== undefined && !allowed.includes(value)) {
    return `${fieldName} must be one of: ${allowed.join(', ')}`
  }
  return null
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate hex color format
 */
export function validateHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color)
}

/**
 * Validate password minimum length
 */
export function validatePasswordLength(password: string, minLength: number = 8): boolean {
  return password.length >= minLength
}
