'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandProfile, Profile } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface BrandFormData {
  name_pl: string
  name_en: string
  accent_color: string
  logo_url: string
  tone_variant: 'neutral' | 'friendly' | 'formal'
  typography_variant: 'system' | 'serif' | 'mono'
}

export default function BrandsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [brands, setBrands] = useState<BrandProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BrandFormData>({
    name_pl: '',
    name_en: '',
    accent_color: '#0071e3',
    logo_url: '',
    tone_variant: 'neutral',
    typography_variant: 'system',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData as Profile)

        // Load brands
        let query = supabase
          .from('brand_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profileData?.role === 'agent') {
          query = query.eq('owner_id', user.id)
        }

        const { data: brandsData } = await query
        setBrands((brandsData as BrandProfile[]) || [])
      } catch (err) {
        console.error('Error loading brands:', err)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleOpenAddModal = () => {
    setEditingBrandId(null)
    setFormData({
      name_pl: '',
      name_en: '',
      accent_color: '#0071e3',
      logo_url: '',
      tone_variant: 'neutral',
      typography_variant: 'system',
    })
    setShowAddModal(true)
  }

  const handleOpenEditModal = (brand: BrandProfile) => {
    setEditingBrandId(brand.id)
    setFormData({
      name_pl: brand.name_pl,
      name_en: brand.name_en || '',
      accent_color: brand.accent_color,
      logo_url: brand.logo_url || '',
      tone_variant: brand.tone_variant,
      typography_variant: brand.typography_variant,
    })
    setShowAddModal(true)
  }

  const handleSaveBrand = async () => {
    if (!formData.name_pl) {
      alert(t('wizard.required', profile?.lang || 'en'))
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingBrandId) {
        // Update
        const { error } = await supabase
          .from('brand_profiles')
          .update(formData)
          .eq('id', editingBrandId)

        if (error) throw error

        setBrands(
          brands.map((b) =>
            b.id === editingBrandId
              ? { ...b, ...formData }
              : b
          )
        )
      } else {
        // Create
        const { data, error } = await supabase
          .from('brand_profiles')
          .insert({
            owner_id: user.id,
            ...formData,
          })
          .select()
          .single()

        if (error) throw error

        setBrands([data as BrandProfile, ...brands])
      }

      setShowAddModal(false)
    } catch (err) {
      console.error('Error saving brand:', err)
      alert(t('common.error', profile?.lang || 'en'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm(t('common.confirm', profile?.lang || 'en'))) return

    const { error } = await supabase
      .from('brand_profiles')
      .delete()
      .eq('id', brandId)

    if (!error) {
      setBrands(brands.filter((b) => b.id !== brandId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!profile) return null

  const lang = profile.lang

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">
            {brands.length} {t('agent.brands', lang)}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAddModal}
          className="gap-2"
        >
          <Plus size={18} />
          {t('brand.createNew', lang)}
        </Button>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">{t('common.noResults', lang)}</p>
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenAddModal}
              >
                {t('brand.createNew', lang)}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card key={brand.id} className="overflow-hidden">
              <div
                className="h-24 w-full"
                style={{ backgroundColor: brand.accent_color }}
              />
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {brand.name_pl}
                    </h3>
                    {brand.name_en && (
                      <p className="text-sm text-gray-600">{brand.name_en}</p>
                    )}
                  </div>
                </div>

                {brand.logo_url && (
                  <img
                    src={brand.logo_url}
                    alt={brand.name_pl}
                    className="w-12 h-12 object-contain mb-3 rounded"
                  />
                )}

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Tone:</span>{' '}
                    {brand.tone_variant}
                  </p>
                  <p>
                    <span className="font-medium">Typography:</span>{' '}
                    {brand.typography_variant}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(brand)}
                    className="flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {t('common.edit', lang)}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(brand.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Brand Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          editingBrandId
            ? t('brand.editProfile', lang)
            : t('brand.createNew', lang)
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowAddModal(false)}
            >
              {t('common.cancel', lang)}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveBrand}
              isLoading={isSubmitting}
            >
              {editingBrandId ? t('common.edit', lang) : t('common.create', lang)}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={`${t('brand.neutral', lang)} (PL)`}
            value={formData.name_pl}
            onChange={(e) =>
              setFormData({ ...formData, name_pl: e.target.value })
            }
            placeholder="Brand name"
            required
          />
          <Input
            label={`${t('brand.neutral', lang)} (EN)`}
            value={formData.name_en}
            onChange={(e) =>
              setFormData({ ...formData, name_en: e.target.value })
            }
            placeholder="Brand name (English)"
          />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('brand.accentColor', lang)}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.accent_color}
                onChange={(e) =>
                  setFormData({ ...formData, accent_color: e.target.value })
                }
                className="w-16 h-10 rounded-lg cursor-pointer border border-gray-300"
              />
              <code className="text-sm text-gray-600">
                {formData.accent_color}
              </code>
            </div>
          </div>
          <Input
            label={t('brand.logoUrl', lang)}
            value={formData.logo_url}
            onChange={(e) =>
              setFormData({ ...formData, logo_url: e.target.value })
            }
            placeholder="https://example.com/logo.png"
          />
          <Select
            label={t('brand.tone', lang)}
            options={[
              { value: 'neutral', label: t('brand.toneNeutral', lang) },
              { value: 'friendly', label: t('brand.toneFriendly', lang) },
              { value: 'formal', label: t('brand.toneFormal', lang) },
            ]}
            value={formData.tone_variant}
            onChange={(e) =>
              setFormData({
                ...formData,
                tone_variant: e.target.value as any,
              })
            }
          />
          <Select
            label="Typography"
            options={[
              { value: 'system', label: 'System' },
              { value: 'serif', label: 'Serif' },
              { value: 'mono', label: 'Monospace' },
            ]}
            value={formData.typography_variant}
            onChange={(e) =>
              setFormData({
                ...formData,
                typography_variant: e.target.value as any,
              })
            }
          />
        </div>
      </Modal>
    </div>
  )
}
