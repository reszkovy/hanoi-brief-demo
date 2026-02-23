'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AgentWithStats, Profile } from '@/lib/types'
import { t } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Loader2, Copy, ToggleLeft, ToggleRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AgentsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [agents, setAgents] = useState<AgentWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAddingAgent, setIsAddingAgent] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
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

        // Check if master
        if (profileData?.role !== 'master') {
          router.push('/dashboard')
          return
        }

        // Load agents with stats
        const { data: agentsData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'agent')
          .order('created_at', { ascending: false })

        if (agentsData) {
          // Get stats for each agent
          const agentsWithStats = await Promise.all(
            (agentsData as Profile[]).map(async (agent) => {
              const { count: briefsCount } = await supabase
                .from('briefs')
                .select('id', { count: 'exact' })
                .eq('agent_id', agent.id)

              const { count: completedCount } = await supabase
                .from('briefs')
                .select('id', { count: 'exact' })
                .eq('agent_id', agent.id)
                .eq('status', 'completed')

              const { count: inProgressCount } = await supabase
                .from('briefs')
                .select('id', { count: 'exact' })
                .eq('agent_id', agent.id)
                .in('status', ['sent', 'in_progress'])

              const { count: brandCount } = await supabase
                .from('brand_profiles')
                .select('id', { count: 'exact' })
                .eq('owner_id', agent.id)

              return {
                ...agent,
                briefs_count: briefsCount || 0,
                briefs_completed: completedCount || 0,
                briefs_in_progress: inProgressCount || 0,
                brand_profiles_count: brandCount || 0,
              }
            })
          )
          setAgents(agentsWithStats)
        }
      } catch (err) {
        console.error('Error loading agents:', err)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddAgent = async () => {
    if (!formData.full_name || !formData.email) {
      alert(t('wizard.required', profile?.lang || 'en'))
      return
    }

    setIsAddingAgent(true)

    try {
      // Generate temporary password
      const tempPass = Math.random().toString(36).slice(2, 10).toUpperCase()

      // Call API to create agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          password: tempPass,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create agent')
      }

      const newAgent = await response.json()
      setTempPassword(tempPass)
      setFormData({ full_name: '', email: '' })

      // Reload agents list
      const { data: agentsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false })

      if (agentsData) {
        const agentsWithStats = await Promise.all(
          (agentsData as Profile[]).map(async (agent) => {
            const { count: briefsCount } = await supabase
              .from('briefs')
              .select('id', { count: 'exact' })
              .eq('agent_id', agent.id)

            const { count: completedCount } = await supabase
              .from('briefs')
              .select('id', { count: 'exact' })
              .eq('agent_id', agent.id)
              .eq('status', 'completed')

            const { count: inProgressCount } = await supabase
              .from('briefs')
              .select('id', { count: 'exact' })
              .eq('agent_id', agent.id)
              .in('status', ['sent', 'in_progress'])

            const { count: brandCount } = await supabase
              .from('brand_profiles')
              .select('id', { count: 'exact' })
              .eq('owner_id', agent.id)

            return {
              ...agent,
              briefs_count: briefsCount || 0,
              briefs_completed: completedCount || 0,
              briefs_in_progress: inProgressCount || 0,
              brand_profiles_count: brandCount || 0,
            }
          })
        )
        setAgents(agentsWithStats)
      }
    } catch (err) {
      console.error('Error creating agent:', err)
      alert(t('common.error', profile?.lang || 'en'))
    } finally {
      setIsAddingAgent(false)
    }
  }

  const handleToggleActive = async (agentId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive })
      .eq('id', agentId)

    if (!error) {
      setAgents(
        agents.map((a) =>
          a.id === agentId ? { ...a, is_active: !currentActive } : a
        )
      )
    }
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!profile || profile.role !== 'master') return null

  const lang = profile.lang

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('agent.title', lang)}
          </h1>
          <p className="text-gray-600 mt-1">
            {agents.length} {t('agent.title', lang)}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowAddModal(true)}
          className="gap-2"
        >
          <Plus size={18} />
          {t('agent.addAgent', lang)}
        </Button>
      </div>

      {/* Agents List */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">{t('common.noResults', lang)}</p>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAddModal(true)}
              >
                {t('agent.addAgent', lang)}
              </Button>
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
                      {t('agent.name', lang)}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('auth.email', lang)}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('agent.briefs', lang)}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('agent.brands', lang)}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      {t('agent.active', lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {agent.full_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {agent.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {agent.briefs_count}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({agent.briefs_in_progress} {t('hub.activeBriefs', lang)})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {agent.brand_profiles_count}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleToggleActive(agent.id, agent.is_active)
                          }
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {agent.is_active ? (
                            <ToggleRight size={18} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={18} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Agent Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setFormData({ full_name: '', email: '' })
          setTempPassword('')
        }}
        title={t('agent.createAgent', lang)}
        size="md"
        footer={
          tempPassword ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setShowAddModal(false)
                setFormData({ full_name: '', email: '' })
                setTempPassword('')
              }}
            >
              {t('common.close', lang)}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowAddModal(false)
                  setFormData({ full_name: '', email: '' })
                }}
              >
                {t('common.cancel', lang)}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAddAgent}
                isLoading={isAddingAgent}
              >
                {t('common.create', lang)}
              </Button>
            </>
          )
        }
      >
        {tempPassword ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium mb-2">
                {t('common.success', lang)}
              </p>
              <p className="text-sm text-green-600">
                {t('agent.password', lang)}:
              </p>
              <div className="bg-white border border-green-300 rounded mt-2 p-3 flex items-center justify-between gap-3 font-mono">
                <code className="text-green-900">{tempPassword}</code>
                <button
                  onClick={handleCopyPassword}
                  className="p-1 hover:bg-green-100 rounded transition-colors flex-shrink-0"
                >
                  <Copy
                    size={16}
                    className={copiedPassword ? 'text-green-600' : 'text-green-400'}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label={t('agent.name', lang)}
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="John Doe"
              required
            />
            <Input
              label={t('auth.email', lang)}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              required
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
