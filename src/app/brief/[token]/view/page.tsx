'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Lang } from '@/lib/types'
import { t } from '@/lib/i18n'
import {
  getStepsForScope,
  scopeOptions,
  type ProjectScope,
} from '@/lib/wizard-steps'
import type { WizardStepDef, WizardField } from '@/lib/types'
import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle, { type Theme } from '@/components/ThemeToggle'

interface BriefData {
  id: string
  title: string
  status: string
  lang: Lang
  scope: string | null
  client_name: string | null
  client_email: string | null
  client_company: string | null
  public_token: string
  wizard_data: Record<string, any>
  completed_at: string | null
  started_at: string | null
  created_at: string
}

function getScopeLabel(scope: string, lang: Lang): string {
  const found = scopeOptions.find((s) => s.value === scope)
  return found ? found.label[lang] : scope
}

function formatDate(dateStr: string | null, lang: Lang): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolveFieldValue(
  field: WizardField,
  value: any,
  lang: Lang
): string | null {
  if (value === undefined || value === null || value === '') return null

  switch (field.type) {
    case 'section_header':
      return null
    case 'select':
    case 'radio': {
      if (!field.options) return String(value)
      const opt = field.options.find((o) => o.value === value)
      return opt ? opt.label[lang] : String(value)
    }
    case 'checkbox':
    case 'multiselect': {
      if (!field.options) return String(value)
      const vals = Array.isArray(value) ? value : [value]
      return vals
        .map((v) => {
          const opt = field.options!.find((o) => o.value === v)
          return opt ? opt.label[lang] : String(v)
        })
        .filter(Boolean)
        .join(', ')
    }
    case 'slider':
      return String(value)
    default:
      return String(value)
  }
}

function SliderBar({ value, label, dark }: { value: number; label: string; dark: boolean }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100))
  return (
    <div className="flex items-center gap-4">
      <span className={`text-sm w-40 shrink-0 ${dark ? 'text-r-white-dim' : 'text-gray-600'}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div
          className={`h-full rounded-full transition-all ${dark ? 'bg-r-lime' : 'bg-lime-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-medium w-8 text-right ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

function FieldDisplay({
  field,
  value,
  lang,
  dark,
}: {
  field: WizardField
  value: any
  lang: Lang
  dark: boolean
}) {
  if (field.type === 'section_header') return null
  const resolved = resolveFieldValue(field, value, lang)
  if (!resolved) return null

  if (field.type === 'slider') return null

  if (field.type === 'url' && resolved !== '—') {
    return (
      <div>
        <dt className={`text-xs font-medium uppercase tracking-wide mb-1 ${dark ? 'text-r-white-muted' : 'text-gray-400'}`}>
          {field.label[lang]}
        </dt>
        <dd className="text-sm break-all">
          <a
            href={resolved.startsWith('http') ? resolved : `https://${resolved}`}
            target="_blank"
            rel="noopener noreferrer"
            className={dark ? 'text-r-lime hover:underline' : 'text-lime-600 hover:underline'}
          >
            {resolved}
          </a>
        </dd>
      </div>
    )
  }

  return (
    <div>
      <dt className={`text-xs font-medium uppercase tracking-wide mb-1 ${dark ? 'text-r-white-muted' : 'text-gray-400'}`}>
        {field.label[lang]}
      </dt>
      <dd className={`text-sm whitespace-pre-wrap ${dark ? 'text-white' : 'text-gray-800'}`}>{resolved}</dd>
    </div>
  )
}

function StepSection({
  step,
  wizardData,
  lang,
  dark,
}: {
  step: WizardStepDef
  wizardData: Record<string, any>
  lang: Lang
  dark: boolean
}) {
  const stepData = wizardData[step.key]
  const hasDirectData = stepData && typeof stepData === 'object' && Object.keys(stepData).length > 0
  const hasRootData = step.fields.some((field) => {
    if (field.type === 'section_header') return false
    const val = wizardData[field.key]
    return val !== undefined && val !== null && val !== ''
  })

  if (!hasDirectData && !hasRootData) return null

  const sliderFields: { field: WizardField; value: any }[] = []
  const regularFields: { field: WizardField; value: any }[] = []

  step.fields.forEach((field) => {
    if (field.type === 'section_header') return
    const value = stepData?.[field.key] ?? wizardData[field.key]
    if (value === undefined || value === null || value === '') return

    if (field.type === 'slider') {
      sliderFields.push({ field, value })
    } else {
      regularFields.push({ field, value })
    }
  })

  if (regularFields.length === 0 && sliderFields.length === 0) return null

  return (
    <section className="print:break-inside-avoid">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-1 h-6 rounded-full ${dark ? 'bg-r-lime' : 'bg-lime-500'}`} />
        <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{step.title[lang]}</h2>
      </div>

      {regularFields.length > 0 && (
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
          {regularFields.map(({ field, value }) => (
            <FieldDisplay key={field.key} field={field} value={value} lang={lang} dark={dark} />
          ))}
        </dl>
      )}

      {sliderFields.length > 0 && (
        <div className="space-y-3 mt-4">
          {sliderFields.map(({ field, value }) => (
            <SliderBar key={field.key} value={Number(value) || 0} label={field.label[lang]} dark={dark} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function BriefViewPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [lang, setLang] = useState<Lang>('pl')
  const [theme, setTheme] = useState<Theme>('dark')
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/public/brief/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'not_found' : 'error')
        return res.json()
      })
      .then((data) => {
        setBrief(data)
        if (data.lang) setLang(data.lang)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  const d = theme === 'dark'

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-r-bg' : 'bg-gray-50'}`}>
        <p className={d ? 'text-r-white-dim' : 'text-gray-400'}>{t('common.loading', lang)}</p>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-r-bg' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-xl font-semibold mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>
            {t('wizard.notFound', lang)}
          </p>
          <p className={`mb-6 ${d ? 'text-r-white-dim' : 'text-gray-500'}`}>
            {t('wizard.notFoundMessage', lang)}
          </p>
          <button
            onClick={() => router.push('/k3253r')}
            className={`px-4 py-2 font-semibold rounded-lg transition-opacity hover:opacity-90 ${
              d ? 'bg-r-lime text-r-bg' : 'bg-lime-500 text-white'
            }`}
          >
            {t('viewer.backToList', lang)}
          </button>
        </div>
      </div>
    )
  }

  const scope = (brief.scope || brief.wizard_data?._scope) as ProjectScope | undefined
  const steps = scope ? getStepsForScope(scope) : []

  return (
    <div className={`min-h-screen transition-colors duration-300 ${d ? 'bg-r-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors duration-300 print:static print:bg-white print:border-gray-200 ${
        d ? 'bg-r-bg/95 border-r-border' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/k3253r')}
              className={`transition-colors print:hidden ${d ? 'text-r-white-dim hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-bold print:text-black ${d ? 'text-white' : 'text-gray-900'}`}>
              {t('viewer.onePager', lang)}
            </h1>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
            <LanguageToggle currentLang={lang} onLangChange={setLang} variant="compact" />
            <button
              onClick={() => window.print()}
              className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${
                d
                  ? 'text-r-white-dim border-r-border hover:text-white hover:border-r-border-strong'
                  : 'text-gray-500 border-gray-300 hover:text-gray-700 hover:border-gray-400'
              }`}
            >
              {t('viewer.print', lang)}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 print:py-4 print:px-0">
        {/* Brief meta header */}
        <div className={`border rounded-xl p-6 mb-8 transition-colors duration-300 print:bg-white print:border-gray-200 ${
          d ? 'bg-r-bg-card border-r-border' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <h2 className={`text-2xl font-bold mb-4 print:text-black ${d ? 'text-white' : 'text-gray-900'}`}>
            {brief.title || 'Untitled Brief'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {brief.client_name && (
              <div>
                <span className={`block text-xs uppercase tracking-wide mb-0.5 ${d ? 'text-r-white-muted' : 'text-gray-400'}`}>
                  {t('viewer.client', lang)}
                </span>
                <span className={`font-medium print:text-black ${d ? 'text-white' : 'text-gray-900'}`}>
                  {brief.client_name}
                </span>
              </div>
            )}
            {brief.client_company && (
              <div>
                <span className={`block text-xs uppercase tracking-wide mb-0.5 ${d ? 'text-r-white-muted' : 'text-gray-400'}`}>
                  {t('viewer.company', lang)}
                </span>
                <span className={`font-medium print:text-black ${d ? 'text-white' : 'text-gray-900'}`}>
                  {brief.client_company}
                </span>
              </div>
            )}
            {scope && (
              <div>
                <span className={`block text-xs uppercase tracking-wide mb-0.5 ${d ? 'text-r-white-muted' : 'text-gray-400'}`}>
                  {t('viewer.scope', lang)}
                </span>
                <span className={`font-medium ${d ? 'text-r-lime' : 'text-lime-600'}`}>
                  {getScopeLabel(scope, lang)}
                </span>
              </div>
            )}
            <div>
              <span className={`block text-xs uppercase tracking-wide mb-0.5 ${d ? 'text-r-white-muted' : 'text-gray-400'}`}>
                {brief.completed_at ? t('viewer.completedOn', lang) : t('viewer.createdOn', lang)}
              </span>
              <span className={`font-medium print:text-black ${d ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(brief.completed_at || brief.created_at, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Brief sections */}
        {steps.length > 0 ? (
          <div className="space-y-6">
            {steps.map((step) => {
              const wd = brief.wizard_data || {}
              const sd = wd[step.key]
              const hasDirectData = sd && typeof sd === 'object' && Object.keys(sd).length > 0
              const hasRootData = step.fields.some((f) => {
                if (f.type === 'section_header') return false
                const v = wd[f.key]
                return v !== undefined && v !== null && v !== ''
              })
              if (!hasDirectData && !hasRootData) return null

              return (
                <div
                  key={step.key}
                  className={`border rounded-xl p-6 transition-colors duration-300 print:bg-white print:border-gray-200 ${
                    d ? 'bg-r-bg-card border-r-border' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <StepSection step={step} wizardData={wd} lang={lang} dark={d} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={d ? 'text-r-white-dim' : 'text-gray-400'}>{t('viewer.noData', lang)}</p>
          </div>
        )}
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .bg-r-bg, .bg-r-bg-card, .bg-r-bg-elevated, .bg-r-bg-input,
          .bg-gray-50 { background: white !important; }
          .text-white, .text-r-white-dim, .text-r-white-muted,
          .text-gray-900, .text-gray-800, .text-gray-600, .text-gray-500, .text-gray-400 { color: black !important; }
          .text-r-lime, .text-lime-600, .text-lime-500 { color: #4a7a00 !important; }
          .border-r-border, .border-r-border-strong, .border-gray-200 { border-color: #ddd !important; }
          .bg-r-lime, .bg-lime-500 { background: #4a7a00 !important; }
        }
      `}</style>
    </div>
  )
}
