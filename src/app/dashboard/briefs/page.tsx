'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, BriefWithAgent, BriefStatus } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import StatusBadge from '@/components/StatusBadge'
import {
  Plus,
  Copy,
  Archive,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export const dynamic = 'force-dynamic'

export default function BriefsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [briefs, setBriefs] = useState<BriefWithAgent[]>([])
  const [filteredBriefs, setFilteredBriefs] = useState<BriefWithAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BriefStatus | ''>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const loadBriefs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData as Profile)
        const isMaster = profileData?.role === 'master'

        // Get briefs
        let query = supabase
          .from('briefs')
          .select(
            `id, title, status, lang, scope, agent_id, brand_profile_id, client_name, client_email,
             client_company, public_token, token_expires_at, sent_at, started_at, completed_at,
             wizard_data, created_at, updated_at,
            agent:agent_id (id, full_name, email),
            brand_profile:brand_profile_id (id, name_pl, name_en, accent_color, logo_url)`
          )
          .order('created_at', { ascending: false })

        if (!isMaster) {
          query = query.eq('agent_id', user.id)
        }

        const { data } = await query
        setBriefs((data as any[]) || [])
      } catch (err) {
        console.error('Error loading briefs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBriefs()
  }, [])

  // Filter briefs
  useEffect(() => {
    let filtered = briefs

    if (searchTerm) {
      filtered = filtered.filter(
        (brief) =>
          brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brief.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((brief) => brief.status === statusFilter)
    }

    setFilteredBriefs(filtered)
  }, [briefs, searchTerm, statusFilter])

  const handleCopyLink = (token: string, title: string) => {
    const link = `${window.location.origin}/brief/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleArchive = async (briefId: string) => {
    const { error } = await supabase
      .from('briefs')
      .update({ status: 'archived' })
      .eq('id', briefId)

    if (!error) {
      setBriefs(briefs.map(b => b.id === briefId ? { ...b, status: 'archived' } : b))
    }
  }

  const handleDelete = async (briefId: string) => {
    if (!confirm(t('common.confirm', profile?.lang || 'en'))) return

    const { error } = await supabase
      .from('briefs')
      .delete()
      .eq('id', briefId)

    if (!error) {
      setBriefs(briefs.filter(b => b.id !== briefId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  const lang = profile?.lang || 'en'
  const isMaster = profile?.role === 'master'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('brief.title', lang)}
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredBriefs.length} {t('common.noResults', lang)}
          </p>
        </div>
        {!isMaster && (
          <Link href="/dashboard/briefs/new">
            <Button variant="primary" size="md" className="gap-2">
              <Plus size={18} />
              {t('brief.create', lang)}
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t('hub.searchPlaceholder', lang)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: t('brief.status', lang) },
                { value: 'draft', label: t('brief.statusDraft', lang) },
                { value: 'sent', label: t('brief.statusSent', lang) },
                { value: 'in_progress', label: t('brief.statusInProgress', lang) },
                { value: 'completed', label: t('brief.statusCompleted', lang) },
                { value: 'archived', label: t('brief.statusArchived', lang) },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BriefStatus | '')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Briefs Table */}
      {filteredBriefs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">{t('common.noResults', lang)}</p>
              {!isMaster && (
                <Link href="/dashboard/briefs/new">
                  <Button variant="primary" size="md">
                    {t('hub.newBrief', lang)}
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('brief.title', lang)}
                    </th>
                    {isMaster && (
                      <th className="px-6 py-4 text-left font-semibold text-gray-900">
                        {t('agent.name', lang)}
                      </th>
                    )}
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('brief.client', lang)}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('brief.status', lang)}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      Scope
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-900">
                      {t('common.search', lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBriefs.map((brief) => (
                    <tr key={brief.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/briefs/${brief.id}`}>
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            {brief.title}
                          </span>
                        </Link>
                      </td>
                      {isMaster && (
                        <td className="px-6 py-4 text-gray-700">
                          {brief.agent?.full_name || <span className="text-gray-400 italic">Public</span>}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-700">
                        {brief.client_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={brief.status} lang={lang} />
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {brief.scope || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(brief.public_token, brief.title)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title={t('brief.copyLink', lang)}
                          >
                            <Copy
                              size={16}
                              className={copiedId === brief.public_token ? 'text-green-600' : 'text-gray-600'}
                            />
                          </button>
                          <button
                            onClick={() => handleArchive(brief.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title={t('brief.archive', lang)}
                          >
                            <Archive size={16} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(brief.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title={t('brief.delete', lang)}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
