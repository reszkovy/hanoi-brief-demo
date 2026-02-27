'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Brief, BriefStatus } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import StatusBadge from '@/components/StatusBadge'
import {
  Plus,
  Copy,
  Archive,
  Trash2,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function BriefsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [filteredBriefs, setFilteredBriefs] = useState<Brief[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BriefStatus | ''>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const loadBriefs = async () => {
      try {
        const res = await fetch('/api/briefs')
        if (res.ok) {
          const data = await res.json()
          setBriefs((data as any[]) || [])
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (profileData) {
            setProfile(profileData as Profile)
            return
          }
        }
        // DEV BYPASS
        setProfile({
          id: 'dev-bypass',
          email: 'dev@briefer.app',
          full_name: 'Dev Admin',
          role: 'master',
          lang: 'pl',
          is_active: true,
        } as Profile)
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

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/brief/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleArchive = async (briefId: string) => {
    const res = await fetch(`/api/briefs/${briefId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    if (res.ok) {
      setBriefs(briefs.map(b => b.id === briefId ? { ...b, status: 'archived' as BriefStatus } : b))
    }
  }

  const handleDelete = async (briefId: string) => {
    if (!confirm(lang === 'pl' ? 'Na pewno usunąć?' : 'Are you sure?')) return

    const res = await fetch(`/api/briefs/${briefId}`, { method: 'DELETE' })
    if (res.ok) {
      setBriefs(briefs.filter(b => b.id !== briefId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-r-lime" size={32} />
      </div>
    )
  }

  const lang = profile?.lang || 'pl'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {lang === 'pl' ? 'Briefy' : 'Briefs'}
          </h1>
          <p className="text-r-white-muted mt-1">
            {filteredBriefs.length} {lang === 'pl' ? 'briefów' : 'briefs'}
          </p>
        </div>
        <Link href="/dashboard/briefs/new">
          <Button variant="primary" size="md" className="gap-2">
            <Plus size={18} />
            {lang === 'pl' ? 'Nowy brief' : 'New brief'}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={lang === 'pl' ? 'Szukaj po tytule lub kliencie...' : 'Search by title or client...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: lang === 'pl' ? 'Wszystkie statusy' : 'All statuses' },
                { value: 'draft', label: lang === 'pl' ? 'Szkic' : 'Draft' },
                { value: 'sent', label: lang === 'pl' ? 'Wysłany' : 'Sent' },
                { value: 'in_progress', label: lang === 'pl' ? 'W trakcie' : 'In progress' },
                { value: 'completed', label: lang === 'pl' ? 'Ukończony' : 'Completed' },
                { value: 'archived', label: lang === 'pl' ? 'Zarchiwizowany' : 'Archived' },
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
              <p className="text-r-white-muted mb-4">
                {lang === 'pl' ? 'Brak briefów' : 'No briefs found'}
              </p>
              <Link href="/dashboard/briefs/new">
                <Button variant="primary" size="md">
                  {lang === 'pl' ? 'Stwórz pierwszy brief' : 'Create your first brief'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-r-border bg-r-bg-elevated">
                    <th className="px-6 py-4 text-left font-semibold text-white">
                      {lang === 'pl' ? 'Tytuł' : 'Title'}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-white">
                      {lang === 'pl' ? 'Klient' : 'Client'}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-white">
                      Scope
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-white">
                      {lang === 'pl' ? 'Akcje' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBriefs.map((brief) => (
                    <tr key={brief.id} className="border-b border-r-border hover:bg-r-bg-elevated transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/briefs/${brief.id}`}>
                          <span className="text-r-lime hover:underline font-medium">
                            {brief.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-r-white-muted">
                        {brief.client_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={brief.status} lang={lang} />
                      </td>
                      <td className="px-6 py-4 text-r-white-muted">
                        {brief.scope || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(brief.public_token)}
                            className="p-2 hover:bg-r-bg-input rounded-lg transition-colors"
                            title={lang === 'pl' ? 'Kopiuj link' : 'Copy link'}
                          >
                            <Copy
                              size={16}
                              className={copiedId === brief.public_token ? 'text-r-success' : 'text-r-white-muted'}
                            />
                          </button>
                          <button
                            onClick={() => handleArchive(brief.id)}
                            className="p-2 hover:bg-r-bg-input rounded-lg transition-colors"
                            title={lang === 'pl' ? 'Archiwizuj' : 'Archive'}
                          >
                            <Archive size={16} className="text-r-white-muted" />
                          </button>
                          <button
                            onClick={() => handleDelete(brief.id)}
                            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                            title={lang === 'pl' ? 'Usuń' : 'Delete'}
                          >
                            <Trash2 size={16} className="text-red-400" />
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
