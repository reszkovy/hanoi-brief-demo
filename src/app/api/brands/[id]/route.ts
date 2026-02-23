import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedSupabase,
  isMaster,
  notFound,
  forbidden,
  badRequest,
  validateEnum,
  validateHexColor,
} from '@/lib/api-helpers'

// Whitelist of fields that can be updated
const ALLOWED_PATCH_FIELDS = [
  'name_pl',
  'name_en',
  'logo_url',
  'accent_color',
  'typography_variant',
  'tone_variant',
  'cover_image_url',
  'footer_signature_pl',
  'footer_signature_en',
  'domain_slug',
  'email_template_id',
  'disclaimer_pl',
  'disclaimer_en',
  'is_default',
]

/**
 * GET /api/brands/[id]
 * Get brand by ID
 * WITH AUTH CHECK — verify user is authenticated and authorized (master or owner)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  const { data: brand, error: queryError } = await supabase
    .from('brand_profiles')
    .select(
      `id, owner_id, name_pl, name_en, logo_url, accent_color,
       typography_variant, tone_variant, cover_image_url, footer_signature_pl,
       footer_signature_en, domain_slug, email_template_id, disclaimer_pl,
       disclaimer_en, is_default, created_at, updated_at`
    )
    .eq('id', params.id)
    .single()

  if (queryError || !brand) {
    return notFound()
  }

  // Authorization check: master can see all, agent only own
  if (!isMaster(profile!) && brand.owner_id !== user!.id) {
    return forbidden()
  }

  return NextResponse.json(brand)
}

/**
 * PATCH /api/brands/[id]
 * Update brand
 * Auth + authorization (master or owner)
 * Validate enum fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Get brand first for authorization check
  const { data: brand, error: fetchError } = await supabase
    .from('brand_profiles')
    .select('id, owner_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !brand) {
    return notFound()
  }

  // Authorization check: master can update all, agent only own
  if (!isMaster(profile!) && brand.owner_id !== user!.id) {
    return forbidden()
  }

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  // Validate enum fields if provided
  if (body.tone_variant !== undefined) {
    const toneError = validateEnum(
      body.tone_variant,
      ['neutral', 'friendly', 'formal'],
      'tone_variant'
    )
    if (toneError) {
      return badRequest(toneError)
    }
  }

  if (body.typography_variant !== undefined) {
    const typographyError = validateEnum(
      body.typography_variant,
      ['system', 'serif', 'mono'],
      'typography_variant'
    )
    if (typographyError) {
      return badRequest(typographyError)
    }
  }

  // Validate accent_color format if provided
  if (body.accent_color !== undefined && !validateHexColor(body.accent_color)) {
    return badRequest('accent_color must be a valid hex color (e.g., #FF5733)')
  }

  // Whitelist fields
  const updateData: Record<string, any> = {}
  for (const field of ALLOWED_PATCH_FIELDS) {
    if (field in body) {
      // Trim string fields
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

  const { data: updatedBrand, error: updateError } = await supabase
    .from('brand_profiles')
    .update(updateData)
    .eq('id', params.id)
    .select(
      `id, owner_id, name_pl, name_en, logo_url, accent_color,
       typography_variant, tone_variant, cover_image_url, footer_signature_pl,
       footer_signature_en, domain_slug, email_template_id, disclaimer_pl,
       disclaimer_en, is_default, created_at, updated_at`
    )
    .single()

  if (updateError || !updatedBrand) {
    return badRequest(updateError?.message || 'Failed to update brand')
  }

  return NextResponse.json(updatedBrand)
}

/**
 * DELETE /api/brands/[id]
 * Delete brand
 * Auth + authorization (master or owner)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, profile, error } = await getAuthenticatedSupabase()

  if (error) {
    return error
  }

  // Get brand first for authorization check
  const { data: brand, error: fetchError } = await supabase
    .from('brand_profiles')
    .select('id, owner_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !brand) {
    return notFound()
  }

  // Authorization check: master can delete all, agent only own
  if (!isMaster(profile!) && brand.owner_id !== user!.id) {
    return forbidden()
  }

  const { error: deleteError } = await supabase
    .from('brand_profiles')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return badRequest(deleteError.message)
  }

  return NextResponse.json({ success: true })
}
