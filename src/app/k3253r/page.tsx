'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lang } from '@/lib/types'
import { t } from '@/lib/i18n'
import { scopeOptions } from '@/lib/wizard-steps'
import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle, { type Theme } from '@/components/ThemeToggle'

interface BriefItem {
  id: string
  title: string
  status: string
  lang: string
  scope: string | null
  client_name: string | null
  client_company: string | null
  public_token: string
  completed_at: string | null
  started_at: string | null
  created_at: string
  updated_at: string
  wizard_data: Record<string, any> | null
}

const statusColorsDark: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400 border-green-500/20',
  in_progress: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  draft: 'bg-white/10 text-r-white-dim border-white/10',
}

const statusColorsLight: Record<string, string> = {
  completed: 'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-gray-100 text-gray-500 border-gray-200',
}

function getScopeLabel(scope: string | null, lang: Lang): string {
  if (!scope) return '—'
  const found = scopeOptions.find((s) => s.value === scope)
  return found ? found.label[lang] : scope
}

function getStatusLabel(status: string, lang: Lang): string {
  const key = `brief.status${status.charAt(0).toUpperCase() + status.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`
  const label = t(key, lang)
  return label !== key ? label : status
}

function formatDate(dateStr: string | null, lang: Lang): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getFilledFieldsCount(wizardData: Record<string, any> | null): number {
  if (!wizardData) return 0
  return Object.entries(wizardData).filter(
    ([key, val]) => key !== '_scope' && val !== undefined && val !== null && val !== ''
  ).length
}

export default function BriefsListPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('pl')
  const [theme, setTheme] = useState<Theme>('dark')
  const [briefs, setBriefs] = useState<BriefItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/public/briefs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBriefs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = briefs.filter((b) => {
    const matchesSearch =
      !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.client_company?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const d = theme === 'dark'
  const statusColors = d ? statusColorsDark : statusColorsLight

  return (
    <div className={`min-h-screen transition-colors duration-300 ${d ? 'bg-r-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors duration-300 ${
        d ? 'bg-r-bg/95 border-r-border' : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
              {t('viewer.title', lang)}
            </h1>
            <p className={`text-sm mt-0.5 ${d ? 'text-r-white-dim' : 'text-gray-500'}`}>
              {t('viewer.subtitle', lang)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
            <LanguageToggle currentLang={lang} onLangChange={setLang} variant="compact" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('viewer.search', lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-300 focus:outline-none focus:ring-2 ${
                d
                  ? 'border-r-border bg-r-bg-input text-white placeholder-r-white-muted focus:ring-r-lime/30 focus:border-r-lime'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-lime-500/30 focus:border-lime-600'
              }`}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'completed', 'in_progress', 'sent', 'draft'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? d ? 'bg-r-lime text-r-bg' : 'bg-lime-500 text-white'
                    : d
                      ? 'bg-r-bg-input text-r-white-dim border border-r-border hover:text-white'
                      : 'bg-white text-gray-500 border border-gray-300 hover:text-gray-700'
                }`}
              >
                {s === 'all' ? t('viewer.allStatuses', lang) : getStatusLabel(s, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className={`text-center py-20 ${d ? 'text-r-white-dim' : 'text-gray-400'}`}>
            {t('common.loading', lang)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className={`text-lg ${d ? 'text-r-white-dim' : 'text-gray-400'}`}>
              {t('viewer.empty', lang)}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4">
            {filtered.map((brief) => (
              <button
                key={brief.id}
                onClick={() => router.push(`/brief/${brief.public_token}/view`)}
                className={`w-full text-left rounded-xl p-5 border transition-all group ${
                  d
                    ? 'bg-r-bg-card border-r-border hover:border-r-lime/30 hover:bg-r-bg-elevated'
                    : 'bg-white border-gray-200 hover:border-lime-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold truncate transition-colors ${
                        d ? 'text-white group-hover:text-r-lime' : 'text-gray-900 group-hover:text-lime-600'
                      }`}>
                        {brief.title || 'Untitled'}
                      </h3>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        statusColors[brief.status] || statusColors.draft
                      }`}>
                        {getStatusLabel(brief.status, lang)}
                      </span>
                    </div>

                    <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-sm ${
                      d ? 'text-r-white-dim' : 'text-gray-500'
                    }`}>
                      {brief.client_name && (
                        <span>
                          {t('viewer.client', lang)}:{' '}
                          <span className={d ? 'text-white' : 'text-gray-800'}>{brief.client_name}</span>
                        </span>
                      )}
                      {brief.client_company && (
                        <span>
                          {t('viewer.company', lang)}:{' '}
                          <span className={d ? 'text-white' : 'text-gray-800'}>{brief.client_company}</span>
                        </span>
                      )}
                      <span>
                        {t('viewer.scope', lang)}:{' '}
                        <span className={d ? 'text-white' : 'text-gray-800'}>
                          {getScopeLabel(brief.scope || brief.wizard_data?._scope, lang)}
                        </span>
                      </span>
                      <span>
                        {brief.completed_at
                          ? `${t('viewer.completedOn', lang)}: ${formatDate(brief.completed_at, lang)}`
                          : `${t('viewer.createdOn', lang)}: ${formatDate(brief.created_at, lang)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs ${d ? 'text-r-white-muted' : 'text-gray-400'}`}>
                        {getFilledFieldsCount(brief.wizard_data)} {lang === 'pl' ? 'pol' : 'fields'}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-colors ${
                        d ? 'text-r-white-muted group-hover:text-r-lime' : 'text-gray-300 group-hover:text-lime-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
