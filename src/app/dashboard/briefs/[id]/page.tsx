'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brief, Profile } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import StatusBadge from '@/components/StatusBadge'
import {
  ArrowLeft,
  Copy,
  Archive,
  Trash2,
  Mail,
  Clock,
  User,
  Loader2,
  FileText,
  Globe,
} from 'lucide-react'
import Link from 'next/link'

export default function BriefDetailPage() {
  const router = useRouter()
  const params = useParams()
  const briefId = params.id as string
  const supabase = createClient()

  const [brief, setBrief] = useState<Brief | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

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

        const { data: briefData } = await supabase
          .from('briefs')
          .select('*')
          .eq('id', briefId)
          .single()

        if (!briefData) {
          router.push('/dashboard/briefs')
          return
        }

        // Check access — master can see all, agents only own
        if (
          profileData?.role !== 'master' &&
          briefData.agent_id !== user.id
        ) {
          router.push('/dashboard/briefs')
          return
        }

        setBrief(briefData as Brief)
      } catch (err) {
        console.error('Error loading brief:', err)
        router.push('/dashboard/briefs')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCopyLink = () => {
    if (!brief) return
    const link = `${window.location.origin}/brief/${brief.public_token}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleArchive = async () => {
    if (!brief) return
    const { error } = await supabase
      .from('briefs')
      .update({ status: 'archived' })
      .eq('id', brief.id)

    if (!error) {
      setBrief({ ...brief, status: 'archived' })
    }
  }

  const handleDelete = async () => {
    if (!brief) return
    if (!confirm(t('common.confirm', profile?.lang || 'en'))) return

    const { error } = await supabase
      .from('briefs')
      .delete()
      .eq('id', brief.id)

    if (!error) {
      router.push('/dashboard/briefs')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!brief || !profile) return null

  const lang = profile.lang

  // Parse wizard data for display
  const wizardData = brief.wizard_data || {}
  const hasWizardData = Object.keys(wizardData).length > 0
  const internalKeys = ['_scope', 'brief_type']

  // Format field value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  // Make field key human-readable
  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/briefs">
          <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{brief.title}</h1>
          <p className="text-gray-600 mt-1">{brief.client_name || t('brief.client', lang)}</p>
        </div>
        <StatusBadge status={brief.status} lang={lang} />
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('brief.title', lang)}
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('brief.client', lang)}</p>
              <p className="font-medium text-gray-900 mt-1">
                {brief.client_name || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('brief.status', lang)}</p>
              <div className="mt-1">
                <StatusBadge status={brief.status} lang={lang} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('brief.language', lang)}</p>
              <p className="font-medium text-gray-900 mt-1">
                {brief.lang === 'pl'
                  ? t('common.polish', lang)
                  : t('common.english', lang)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Scope</p>
              <p className="font-medium text-gray-900 mt-1">
                {brief.scope || '-'}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          {brief.client_email && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail size={16} />
                <a
                  href={`mailto:${brief.client_email}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {brief.client_email}
                </a>
              </div>
            </div>
          )}

          {brief.client_company && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={16} />
                {brief.client_company}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            {brief.created_at && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">{t('brief.createdAt', lang)}</p>
                  <p className="text-sm text-gray-900">
                    {new Date(brief.created_at).toLocaleDateString(
                      lang === 'pl' ? 'pl-PL' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                </div>
              </div>
            )}
            {brief.started_at && (
              <div className="flex items-start gap-3">
                <Globe size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">
                    {lang === 'pl' ? 'Rozpoczęto wypełnianie' : 'Started filling'}
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(brief.started_at).toLocaleDateString(
                      lang === 'pl' ? 'pl-PL' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                </div>
              </div>
            )}
            {brief.completed_at && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">{t('brief.completedAt', lang)}</p>
                  <p className="text-sm text-gray-900">
                    {new Date(brief.completed_at).toLocaleDateString(
                      lang === 'pl' ? 'pl-PL' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shareable Link */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('brief.generateLink', lang)}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-3">
            <code className="text-sm text-gray-900 break-all font-mono">
              {typeof window !== 'undefined' ? `${window.location.origin}/brief/${brief.public_token}` : `/brief/${brief.public_token}`}
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
        </CardContent>
      </Card>

      {/* Wizard Responses */}
      {hasWizardData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {lang === 'pl' ? 'Odpowiedzi z briefu' : 'Brief Responses'}
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(wizardData)
                .filter(([key]) => !internalKeys.includes(key))
                .map(([key, value]) => {
                  const displayValue = formatValue(value)
                  if (displayValue === '-') return null

                  return (
                    <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                      <p className="text-sm font-medium text-gray-600">
                        {formatKey(key)}
                      </p>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                        {displayValue}
                      </p>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6 flex gap-3 justify-end">
          {brief.status !== 'archived' && (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={handleArchive}
                className="gap-2"
              >
                <Archive size={16} />
                {t('brief.archive', lang)}
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 size={16} />
                {t('brief.delete', lang)}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
