import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedSupabase,
  isMaster,
  badRequest,
  validateRequired,
  validateEnum,
  validateHexColor,
} from '@/lib/api-helpers'
import type { CreateBrandProfilePayload } from '@/lib/types'

/**
 * GET /api/brands
 * List brands (master=all, agent=own)
 */
export async function GET(request: NextRequest) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  let query = supabase
    .from('brand_profiles')
    .select(
      `id, owner_id, name_pl, name_en, logo_url, accent_color,
       typography_variant, tone_variant, cover_image_url, footer_signature_pl,
       footer_signature_en, domain_slug, email_template_id, disclaimer_pl,
       disclaimer_en, is_default, created_at, updated_at`
    )
    .order('created_at', { ascending: false })

  // If agent, filter to own brands only
  if (!isMaster(profile!)) {
    query = query.eq('owner_id', user!.id)
  }

  const { data, error: queryError } = await query

  if (queryError) {
    return badRequest(queryError.message)
  }

  return NextResponse.json(data)
}

/**
 * POST /api/brands
 * Create brand
 * Validate: name_pl required, accent_color format, tone/typography enum values
 * Return created brand
 */
export async function POST(request: NextRequest) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  let body: Partial<CreateBrandProfilePayload>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  // Validate required fields
  const requiredError = validateRequired(body, ['name_pl'])
  if (requiredError) {
    return badRequest(requiredError)
  }

  // Validate accent_color format if provided
  if (body.accent_color && !validateHexColor(body.accent_color)) {
    return badRequest('accent_color must be a valid hex color (e.g., #FF5733)')
  }

  // Validate tone_variant enum if provided
  const toneError = validateEnum(
    body.tone_variant,
    ['neutral', 'friendly', 'formal'],
    'tone_variant'
  )
  if (toneError) {
    return badRequest(toneError)
  }

  // Validate typography_variant enum if provided
  const typographyError = validateEnum(
    body.typography_variant,
    ['system', 'serif', 'mono'],
    'typography_variant'
  )
  if (typographyError) {
    return badRequest(typographyError)
  }

  const { data: createdBrand, error: insertError } = await supabase
    .from('brand_profiles')
    .insert({
      owner_id: user!.id,
      name_pl: body.name_pl!.trim(),
      name_en: body.name_en ? body.name_en.trim() : null,
      logo_url: body.logo_url || null,
      accent_color: body.accent_color || '#000000',
      typography_variant: body.typography_variant || 'system',
      tone_variant: body.tone_variant || 'neutral',
      cover_image_url: body.cover_image_url || null,
      footer_signature_pl: body.footer_signature_pl
        ? body.footer_signature_pl.trim()
        : null,
      footer_signature_en: body.footer_signature_en
        ? body.footer_signature_en.trim()
        : null,
      disclaimer_pl: body.disclaimer_pl ? body.disclaimer_pl.trim() : null,
      disclaimer_en: body.disclaimer_en ? body.disclaimer_en.trim() : null,
      is_default: false,
    })
    .select(
      `id, owner_id, name_pl, name_en, logo_url, accent_color,
       typography_variant, tone_variant, cover_image_url, footer_signature_pl,
       footer_signature_en, domain_slug, email_template_id, disclaimer_pl,
       disclaimer_en, is_default, created_at, updated_at`
    )
    .single()

  if (insertError || !createdBrand) {
    return badRequest(insertError?.message || 'Failed to create brand')
  }

  return NextResponse.json(createdBrand, { status: 201 })
}
