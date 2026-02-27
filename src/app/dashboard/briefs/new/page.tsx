'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Lang } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { ArrowLeft, Copy, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NewBriefPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')

  // Form state — simple, just what's needed
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [language, setLanguage] = useState<Lang>('pl')

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (profileData) {
            setProfile(profileData as Profile)
            setLanguage(profileData?.lang || 'pl')
          }
        }
        // DEV BYPASS
        if (!user) {
          setProfile({
            id: 'dev-bypass',
            email: 'dev@briefer.app',
            full_name: 'Dev Admin',
            role: 'master',
            lang: 'pl',
            is_active: true,
          } as Profile)
          setLanguage('pl')
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setProfile({
          id: 'dev-bypass',
          email: 'dev@briefer.app',
          full_name: 'Dev Admin',
          role: 'master',
          lang: 'pl',
          is_active: true,
        } as Profile)
        setLanguage('pl')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCreateBrief = async () => {
    if (!title) {
      alert(language === 'pl' ? 'Podaj tytuł briefu' : 'Enter brief title')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          client_name: clientName || null,
          client_email: clientEmail || null,
          client_company: clientCompany || null,
          lang: language,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to create brief')
      }

      const data = await res.json()
      console.log('[New Brief] Created:', data.id, 'token:', data.public_token)
      setGeneratedToken(data.public_token)
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Error creating brief:', err)
      alert(language === 'pl' ? 'Wystąpił błąd przy tworzeniu briefu' : 'Error creating brief')
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
        <Loader2 className="animate-spin text-r-lime" size={32} />
      </div>
    )
  }

  if (!profile) return null
  const lang = profile.lang

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/briefs">
          <button className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-r-white-muted" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {lang === 'pl' ? 'Nowy brief' : 'New Brief'}
          </h1>
          <p className="text-r-white-muted mt-1">
            {lang === 'pl'
              ? 'Stwórz brief i wyślij link do klienta'
              : 'Create a brief and send the link to your client'}
          </p>
        </div>
      </div>

      {/* Single-step form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">
            {lang === 'pl' ? 'Szczegóły briefu' : 'Brief Details'}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={lang === 'pl' ? 'Tytuł briefu *' : 'Brief title *'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={lang === 'pl' ? 'np. Rebranding 2026, Nowa strona' : 'e.g., Rebranding 2026, New website'}
            required
          />
          <Input
            label={lang === 'pl' ? 'Imię klienta' : 'Client name'}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Jan Kowalski"
          />
          <Input
            label={lang === 'pl' ? 'Email klienta' : 'Client email'}
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="jan@firma.pl"
          />
          <Input
            label={lang === 'pl' ? 'Firma klienta' : 'Client company'}
            value={clientCompany}
            onChange={(e) => setClientCompany(e.target.value)}
            placeholder="Firma Sp. z o.o."
          />
          <Select
            label={lang === 'pl' ? 'Język formularza' : 'Form language'}
            options={[
              { value: 'pl', label: 'Polski' },
              { value: 'en', label: 'English' },
            ]}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Lang)}
          />

          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateBrief}
              isLoading={isSubmitting}
              className="w-full"
            >
              {lang === 'pl' ? 'Utwórz brief i wygeneruj link' : 'Create brief & generate link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push('/dashboard/briefs')
        }}
        title={lang === 'pl' ? 'Brief utworzony!' : 'Brief created!'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-r-white-muted">
            {lang === 'pl'
              ? 'Wyślij ten link do klienta — po wypełnieniu formularza zobaczysz odpowiedzi w panelu.'
              : 'Send this link to your client — after they fill the form, you\'ll see answers in the dashboard.'}
          </p>

          <div className="bg-r-bg-input rounded-lg p-4 flex items-center justify-between gap-3 border border-r-border">
            <code className="text-sm text-white break-all">
              {typeof window !== 'undefined' && `${window.location.origin}/brief/${generatedToken}`}
            </code>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
                title={lang === 'pl' ? 'Kopiuj link' : 'Copy link'}
              >
                <Copy size={18} className={copiedLink ? 'text-r-success' : 'text-r-white-muted'} />
              </button>
              <a
                href={`/brief/${generatedToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-r-bg-elevated rounded-lg transition-colors"
                title={lang === 'pl' ? 'Otwórz formularz' : 'Open form'}
              >
                <ExternalLink size={18} className="text-r-white-muted" />
              </a>
            </div>
          </div>

          {copiedLink && (
            <p className="text-sm text-r-success">
              {lang === 'pl' ? 'Link skopiowany!' : 'Link copied!'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => {
                window.open(`/brief/${generatedToken}`, '_blank')
              }}
            >
              {lang === 'pl' ? 'Otwórz formularz' : 'Open form'}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/dashboard/briefs')
              }}
            >
              {lang === 'pl' ? 'Do panelu' : 'Go to dashboard'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
