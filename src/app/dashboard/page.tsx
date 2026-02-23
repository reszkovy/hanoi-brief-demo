'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Brief, BriefWithAgent } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import StatusBadge from '@/components/StatusBadge'
import { Plus, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    totalBriefs: 0,
    activeBriefs: 0,
    completedBriefs: 0,
    agentCount: 0,
  })
  const [recentBriefs, setRecentBriefs] = useState<BriefWithAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
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

        // Get briefs query
        let briefsQuery = supabase
          .from('briefs')
          .select(
            `*,
            agent:agent_id (id, full_name, email),
            brand_profile:brand_profile_id (id, name_pl, name_en, accent_color, logo_url)`
          )
          .order('created_at', { ascending: false })
          .limit(10)

        if (!isMaster) {
          briefsQuery = briefsQuery.eq('agent_id', user.id)
        }

        const { data: briefsData } = await briefsQuery

        // Count stats
        let countQuery = supabase
          .from('briefs')
          .select('status', { count: 'exact' })

        if (!isMaster) {
          countQuery = countQuery.eq('agent_id', user.id)
        }

        const { count: total } = await countQuery

        // Count by status
        let activeQuery = supabase
          .from('briefs')
          .select('status', { count: 'exact' })
          .in('status', ['sent', 'in_progress'])

        if (!isMaster) {
          activeQuery = activeQuery.eq('agent_id', user.id)
        }

        const { count: active } = await activeQuery

        let completedQuery = supabase
          .from('briefs')
          .select('status', { count: 'exact' })
          .eq('status', 'completed')

        if (!isMaster) {
          completedQuery = completedQuery.eq('agent_id', user.id)
        }

        const { count: completed } = await completedQuery

        // Count agents (master only)
        let agentCount = 0
        if (isMaster) {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('role', 'agent')
          agentCount = count || 0
        }

        setStats({
          totalBriefs: total || 0,
          activeBriefs: active || 0,
          completedBriefs: completed || 0,
          agentCount,
        })

        setRecentBriefs((briefsData as any[]) || [])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  const isMaster = profile?.role === 'master'
  const lang = profile?.lang || 'en'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('hub.greeting', lang)}, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 mt-1">{t('hub.title', lang)}</p>
        </div>
        {!isMaster && (
          <Link href="/dashboard/briefs/new">
            <Button variant="primary" size="md" className="gap-2">
              <Plus size={18} />
              {t('hub.newBrief', lang)}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalBriefs}
              </div>
              <p className="text-sm text-gray-600">
                {t('hub.totalBriefs', lang)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {stats.activeBriefs}
              </div>
              <p className="text-sm text-gray-600">
                {t('hub.activeBriefs', lang)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.completedBriefs}
              </div>
              <p className="text-sm text-gray-600">
                {t('hub.completedBriefs', lang)}
              </p>
            </div>
          </CardContent>
        </Card>

        {isMaster && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.agentCount}
                </div>
                <p className="text-sm text-gray-600">
                  {t('hub.agents', lang)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Briefs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('hub.recentActivity', lang)}
            </h2>
            <Link href="/dashboard/briefs">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('common.search', lang)}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentBriefs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('wizard.notFound', lang)}</p>
              {!isMaster && (
                <Link href="/dashboard/briefs/new">
                  <Button variant="primary" size="sm" className="mt-4">
                    {t('hub.newBrief', lang)}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentBriefs.map((brief) => (
                <Link
                  key={brief.id}
                  href={`/dashboard/briefs/${brief.id}`}
                  className="block p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {brief.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {brief.client_name || t('brief.client', lang)} •{' '}
                        {isMaster && brief.agent ? brief.agent.full_name : ''}
                      </p>
                    </div>
                    <StatusBadge status={brief.status} lang={lang} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
