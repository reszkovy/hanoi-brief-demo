'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, BrandProfile, Lang } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import BrandCard from '@/components/BrandCard'
import Modal from '@/components/ui/Modal'
import ProgressBar from '@/components/ui/ProgressBar'
import { nanoid } from 'nanoid'
import { ArrowLeft, Copy, Loader2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Step = 1 | 2 | 3

export default function NewBriefPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [brands, setBrands] = useState<BrandProfile[]>([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')

  // Form state
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [language, setLanguage] = useState<Lang>('en')

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
        setLanguage(profileData?.lang || 'en')

        // Load user's brands
        const { data: brandsData } = await supabase
          .from('brand_profiles')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        setBrands((brandsData as BrandProfile[]) || [])
      } catch (err) {
        console.error('Error loading data:', err)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCreateBrief = async () => {
    if (!profile || !title) {
      alert(t('wizard.required', language))
      return
    }

    setIsSubmitting(true)

    try {
      const token = nanoid(12)

      const { data, error } = await supabase
        .from('briefs')
        .insert({
          agent_id: profile.id,
          brand_profile_id: selectedBrandId || null,
          title,
          client_name: clientName || null,
          client_email: clientEmail || null,
          client_company: clientCompany || null,
          status: 'draft',
          lang: language,
          public_token: token,
          wizard_data: {},
        })
        .select()
        .single()

      if (error) throw error

      setGeneratedToken(token)
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Error creating brief:', err)
      alert(t('common.error', language))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/brief/${generatedToken}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
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

  const progressValue = step

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/briefs">
          <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('brief.create', lang)}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('wizard.step', lang)} {step} {t('wizard.of', lang)} 3
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <ProgressBar value={progressValue} max={3} showLabel color="blue" />
        </CardContent>
      </Card>

      {/* Step 1: Brand Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('brand.selectTitle', lang)}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <BrandCard
                brand={null}
                isSelected={selectedBrandId === null}
                isNeutral
                onClick={() => setSelectedBrandId(null)}
                lang={lang}
              />
              {brands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  isSelected={selectedBrandId === brand.id}
                  onClick={() => setSelectedBrandId(brand.id)}
                  lang={lang}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                {t('wizard.next', lang)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Brief Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('brief.title', lang)}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t('brief.title', lang)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('hub.searchPlaceholder', lang)}
              required
            />
            <Input
              label={t('brief.clientName', lang)}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="John Doe"
            />
            <Input
              label={t('brief.clientEmail', lang)}
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="john@example.com"
            />
            <Input
              label={t('brief.clientCompany', lang)}
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="Acme Inc."
            />
            <Select
              label={t('brief.language', lang)}
              options={[
                { value: 'pl', label: t('common.polish', lang) },
                { value: 'en', label: t('common.english', lang) },
              ]}
              value={language}
              onChange={(e) => setLanguage(e.target.value as Lang)}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                {t('wizard.previous', lang)}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                className="flex-1"
              >
                {t('wizard.next', lang)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('common.confirm', lang)}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">{t('brief.title', lang)}</p>
                <p className="font-medium text-gray-900">{title}</p>
              </div>
              {clientName && (
                <div>
                  <p className="text-sm text-gray-600">{t('brief.clientName', lang)}</p>
                  <p className="font-medium text-gray-900">{clientName}</p>
                </div>
              )}
              {clientEmail && (
                <div>
                  <p className="text-sm text-gray-600">{t('brief.clientEmail', lang)}</p>
                  <p className="font-medium text-gray-900">{clientEmail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">{t('brief.language', lang)}</p>
                <p className="font-medium text-gray-900">
                  {language === 'pl'
                    ? t('common.polish', lang)
                    : t('common.english', lang)}
                </p>
              </div>
              {selectedBrandId && brands.find((b) => b.id === selectedBrandId) && (
                <div>
                  <p className="text-sm text-gray-600">{t('brand.currentBrand', lang)}</p>
                  <p className="font-medium text-gray-900">
                    {brands.find((b) => b.id === selectedBrandId)?.name_pl}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                {t('wizard.previous', lang)}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateBrief}
                isLoading={isSubmitting}
                className="flex-1"
              >
                {t('brief.create', lang)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push('/dashboard/briefs')
        }}
        title={t('common.success', lang)}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {t('brief.generateLink', lang)}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-3">
            <code className="text-sm text-gray-900 break-all">
              {`${window.location.origin}/brief/${generatedToken}`}
            </code>
            <button
              onClick={handleCopyLink}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            >
              <Copy
                size={18}
                className={copiedLink ? 'text-green-600' : 'text-gray-600'}
              />
            </button>
          </div>

          <p className="text-sm text-gray-600">
            {t('brief.sendToClient', lang)}
          </p>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              setShowSuccessModal(false)
              router.push('/dashboard/briefs')
            }}
          >
            {t('common.close', lang)}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
