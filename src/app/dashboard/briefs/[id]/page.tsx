'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brief, BriefStatus, Profile } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent, CardHeader, CardFooter } from '@/components/ui/Card'
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
  Pencil,
  X,
  Check,
  Send,
  CopyPlus,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

const ALL_STATUSES: BriefStatus[] = ['draft', 'sent', 'in_progress', 'completed', 'archived']

export default function BriefDetailPage() {
  const router = useRouter()
  const params = useParams()
  const briefId = params.id as string
  const supabase = createClient()

  const [brief, setBrief] = useState<Brief | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    client_name: '',
    client_email: '',
    client_company: '',
    lang: 'pl' as 'pl' | 'en',
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

        const { data: briefData } = await supabase
          .from('briefs')
          .select('*')
          .eq('id', briefId)
          .single()

        if (!briefData) {
          router.push('/dashboard/briefs')
          return
        }

        if (
          profileData?.role !== 'master' &&
          briefData.agent_id !== user.id
        ) {
          router.push('/dashboard/briefs')
          return
        }

        setBrief(briefData as Brief)
        setEditForm({
          title: briefData.title || '',
          client_name: briefData.client_name || '',
          client_email: briefData.client_email || '',
          client_company: briefData.client_company || '',
          lang: briefData.lang || 'pl',
        })
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

  const handleStatusChange = async (newStatus: BriefStatus) => {
    if (!brief) return
    setIsSaving(true)

    const updateData: Record<string, any> = { status: newStatus }
    // Auto-set sent_at when marking as sent
    if (newStatus === 'sent' && !brief.sent_at) {
      updateData.sent_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('briefs')
      .update(updateData)
      .eq('id', brief.id)

    if (!error) {
      setBrief({ ...brief, ...updateData })
      showSaveSuccess()
    }
    setIsSaving(false)
  }

  const handleSaveEdit = async () => {
    if (!brief) return
    setIsSaving(true)

    const { error } = await supabase
      .from('briefs')
      .update({
        title: editForm.title.trim(),
        client_name: editForm.client_name.trim() || null,
        client_email: editForm.client_email.trim() || null,
        client_company: editForm.client_company.trim() || null,
        lang: editForm.lang,
      })
      .eq('id', brief.id)

    if (!error) {
      setBrief({
        ...brief,
        title: editForm.title.trim(),
        client_name: editForm.client_name.trim() || null,
        client_email: editForm.client_email.trim() || null,
        client_company: editForm.client_company.trim() || null,
        lang: editForm.lang,
      })
      setIsEditing(false)
      showSaveSuccess()
    }
    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    if (!brief) return
    setEditForm({
      title: brief.title || '',
      client_name: brief.client_name || '',
      client_email: brief.client_email || '',
      client_company: brief.client_company || '',
      lang: brief.lang || 'pl',
    })
    setIsEditing(false)
  }

  const handleDuplicate = async () => {
    if (!brief) return
    setIsDuplicating(true)

    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${brief.title} (kopia)`,
          client_name: brief.client_name,
          client_email: brief.client_email,
          client_company: brief.client_company,
          brand_profile_id: brief.brand_profile_id,
          lang: brief.lang,
        }),
      })

      if (res.ok) {
        const newBrief = await res.json()
        router.push(`/dashboard/briefs/${newBrief.id}`)
      }
    } catch (err) {
      console.error('Error duplicating brief:', err)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleSendEmail = () => {
    if (!brief?.client_email) return
    const link = `${window.location.origin}/brief/${brief.public_token}`
    const lang = profile?.lang || 'pl'
    const subject = lang === 'pl'
      ? `Brief do wypełnienia: ${brief.title}`
      : `Brief to fill out: ${brief.title}`
    const body = lang === 'pl'
      ? `Cześć,\n\nProszę o wypełnienie briefu projektowego:\n${link}\n\nDziękuję!`
      : `Hi,\n\nPlease fill out the project brief:\n${link}\n\nThank you!`

    window.open(`mailto:${brief.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)

    // Auto-mark as sent if still draft
    if (brief.status === 'draft') {
      handleStatusChange('sent')
    }
  }

  const handleArchive = async () => {
    if (!brief) return
    await handleStatusChange('archived')
  }

  const handleUnarchive = async () => {
    if (!brief) return
    await handleStatusChange('draft')
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

  const showSaveSuccess = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-r-lime" size={32} />
      </div>
    )
  }

  if (!brief || !profile) return null

  const lang = profile.lang
  const wizardData = brief.wizard_data || {}
  const hasWizardData = Object.keys(wizardData).length > 0
  const internalKeys = ['_scope', 'brief_type']

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      lang === 'pl' ? 'pl-PL' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/briefs">
          <button className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-r-white-muted" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white truncate">{brief.title}</h1>
          <p className="text-r-white-muted mt-1">{brief.client_name || t('brief.client', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-400 animate-pulse">
              <Check size={14} />
              {t('wizard.saved', lang)}
            </span>
          )}
          <StatusBadge status={brief.status} lang={lang} />
        </div>
      </div>

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status selector */}
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-sm text-r-white-muted">{t('brief.status', lang)}:</span>
              <div className="flex gap-1">
                {ALL_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={brief.status === status || isSaving}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      brief.status === status
                        ? 'bg-r-lime text-r-bg ring-2 ring-r-lime/30'
                        : 'bg-r-bg-input text-r-white-muted hover:bg-r-bg-elevated hover:text-white border border-r-border'
                    } disabled:opacity-50`}
                  >
                    {t(`brief.status${status.charAt(0).toUpperCase() + status.slice(1).replace('_p', 'P').replace('_i', 'I')}` as any, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
              title={t('brief.edit', lang)}
            >
              <Pencil size={16} className={isEditing ? 'text-r-lime' : 'text-r-white-muted'} />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
              title={t('brief.copyLink', lang)}
            >
              <Copy size={16} className={copiedLink ? 'text-green-400' : 'text-r-white-muted'} />
            </button>
            {brief.client_email && (
              <button
                onClick={handleSendEmail}
                className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
                title={t('brief.sendToClient', lang)}
              >
                <Send size={16} className="text-r-white-muted" />
              </button>
            )}
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
              title={lang === 'pl' ? 'Duplikuj brief' : 'Duplicate brief'}
            >
              {isDuplicating ? (
                <Loader2 size={16} className="animate-spin text-r-white-muted" />
              ) : (
                <CopyPlus size={16} className="text-r-white-muted" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form (collapsible) */}
      {isEditing && (
        <Card variant="outlined">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Pencil size={18} className="text-r-lime" />
                {t('brief.edit', lang)}
              </h2>
              <button onClick={handleCancelEdit} className="p-1.5 hover:bg-r-bg-elevated rounded-lg">
                <X size={16} className="text-r-white-muted" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Input
              label={t('brief.title', lang)}
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('brief.clientName', lang)}
                value={editForm.client_name}
                onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
              />
              <Input
                label={t('brief.clientEmail', lang)}
                type="email"
                value={editForm.client_email}
                onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('brief.clientCompany', lang)}
                value={editForm.client_company}
                onChange={(e) => setEditForm({ ...editForm, client_company: e.target.value })}
              />
              <Select
                label={t('brief.language', lang)}
                options={[
                  { value: 'pl', label: t('common.polish', lang) },
                  { value: 'en', label: t('common.english', lang) },
                ]}
                value={editForm.lang}
                onChange={(e) => setEditForm({ ...editForm, lang: e.target.value as 'pl' | 'en' })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
              {t('common.cancel', lang)}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEdit}
              isLoading={isSaving}
              disabled={!editForm.title.trim()}
            >
              <Check size={14} className="mr-1" />
              {t('common.save', lang)}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">
            {lang === 'pl' ? 'Informacje o briefie' : 'Brief information'}
          </h2>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-r-white-muted">{t('brief.client', lang)}</p>
              <p className="font-medium text-white mt-1">
                {brief.client_name || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-r-white-muted">{t('brief.status', lang)}</p>
              <div className="mt-1">
                <StatusBadge status={brief.status} lang={lang} />
              </div>
            </div>
            <div>
              <p className="text-sm text-r-white-muted">{t('brief.language', lang)}</p>
              <p className="font-medium text-white mt-1">
                {brief.lang === 'pl'
                  ? t('common.polish', lang)
                  : t('common.english', lang)}
              </p>
            </div>
            <div>
              <p className="text-sm text-r-white-muted">Scope</p>
              <p className="font-medium text-white mt-1">
                {brief.scope || '-'}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          {(brief.client_email || brief.client_company) && (
            <div className="border-t border-r-border pt-4 space-y-3">
              {brief.client_email && (
                <div className="flex items-center gap-2 text-r-white-dim">
                  <Mail size={16} />
                  <a
                    href={`mailto:${brief.client_email}`}
                    className="text-r-lime hover:underline"
                  >
                    {brief.client_email}
                  </a>
                </div>
              )}
              {brief.client_company && (
                <div className="flex items-center gap-2 text-r-white-dim">
                  <User size={16} />
                  {brief.client_company}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="border-t border-r-border pt-4 space-y-3">
            {brief.created_at && (
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-r-white-muted mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-r-white-muted">{t('brief.createdAt', lang)}</p>
                  <p className="text-sm text-white">{formatDate(brief.created_at)}</p>
                </div>
              </div>
            )}
            {brief.sent_at && (
              <div className="flex items-start gap-3">
                <Send size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-r-white-muted">{t('brief.sentAt', lang)}</p>
                  <p className="text-sm text-white">{formatDate(brief.sent_at)}</p>
                </div>
              </div>
            )}
            {brief.started_at && (
              <div className="flex items-start gap-3">
                <Globe size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-r-white-muted">
                    {lang === 'pl' ? 'Rozpoczęto wypełnianie' : 'Started filling'}
                  </p>
                  <p className="text-sm text-white">{formatDate(brief.started_at)}</p>
                </div>
              </div>
            )}
            {brief.completed_at && (
              <div className="flex items-start gap-3">
                <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-r-white-muted">{t('brief.completedAt', lang)}</p>
                  <p className="text-sm text-white">{formatDate(brief.completed_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shareable Link */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">
            {t('brief.generateLink', lang)}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="bg-r-bg-input rounded-lg p-4 flex items-center justify-between gap-3 border border-r-border">
            <code className="text-sm text-white break-all font-mono">
              {typeof window !== 'undefined' ? `${window.location.origin}/brief/${brief.public_token}` : `/brief/${brief.public_token}`}
            </code>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
                title={t('brief.copyLink', lang)}
              >
                <Copy
                  size={18}
                  className={copiedLink ? 'text-green-400' : 'text-r-white-muted'}
                />
              </button>
              <a
                href={`/brief/${brief.public_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
                title={lang === 'pl' ? 'Otwórz w nowej karcie' : 'Open in new tab'}
              >
                <ExternalLink size={18} className="text-r-white-muted" />
              </a>
            </div>
          </div>

          {/* Send to client button */}
          {brief.client_email ? (
            <div className="flex items-center gap-3">
              <Button variant="tonal" size="sm" onClick={handleSendEmail} className="gap-2">
                <Send size={14} />
                {t('brief.sendToClient', lang)} ({brief.client_email})
              </Button>
            </div>
          ) : (
            <p className="text-sm text-r-white-dim">
              {lang === 'pl'
                ? 'Dodaj email klienta, aby wysłać link bezpośrednio'
                : 'Add client email to send the link directly'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wizard Responses */}
      {hasWizardData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-r-lime" />
              <h2 className="text-lg font-semibold text-white">
                {lang === 'pl' ? 'Odpowiedzi z briefu' : 'Brief Responses'}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {Object.entries(wizardData)
                .filter(([key]) => !internalKeys.includes(key))
                .map(([key, value]) => {
                  const displayValue = formatValue(value)
                  if (displayValue === '-') return null

                  return (
                    <div key={key} className="border-b border-r-border pb-3 last:border-0">
                      <p className="text-sm font-medium text-r-white-muted">
                        {formatKey(key)}
                      </p>
                      <p className="text-white mt-1 whitespace-pre-wrap">
                        {displayValue}
                      </p>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {brief.status === 'archived' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnarchive}
                  className="gap-2"
                >
                  <RotateCcw size={14} />
                  {lang === 'pl' ? 'Przywróć' : 'Restore'}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleArchive}
                  className="gap-2"
                >
                  <Archive size={14} />
                  {t('brief.archive', lang)}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 size={14} />
                {t('brief.delete', lang)}
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="gap-2"
            >
              <CopyPlus size={14} />
              {lang === 'pl' ? 'Duplikuj' : 'Duplicate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
