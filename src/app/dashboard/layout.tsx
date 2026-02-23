'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile, Lang } from '@/lib/types'
import { t } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import Button from '@/components/ui/Button'
import {
  LayoutDashboard,
  FileText,
  Users,
  Palette,
  LogOut,
  Menu,
  X,
  Loader2,
} from 'lucide-react'
import clsx from 'clsx'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error || !data) {
          router.push('/login')
          return
        }

        setProfile(data as Profile)
        setLang(data.lang)
      } catch (err) {
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLangChange = async (newLang: Lang) => {
    setLang(newLang)
    if (profile) {
      await supabase
        .from('profiles')
        .update({ lang: newLang })
        .eq('id', profile.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const isMaster = profile.role === 'master'

  const navItems = [
    {
      label: t('hub.title', lang),
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: t('brief.title', lang),
      href: '/dashboard/briefs',
      icon: FileText,
      show: true,
    },
    {
      label: t('agent.title', lang),
      href: '/dashboard/agents',
      icon: Users,
      show: isMaster,
    },
    {
      label: 'Brands',
      href: '/dashboard/brands',
      icon: Palette,
      show: true,
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:static w-64 h-screen bg-white border-r border-gray-200 flex flex-col transition-transform z-50',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Briefer</h1>
          <p className="text-xs text-gray-600 mt-1">{profile.role.toUpperCase()}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              )
            })}
        </nav>

        <div className="border-t border-gray-200 p-4 space-y-4">
          <LanguageToggle
            currentLang={lang}
            onLangChange={handleLangChange}
            variant="compact"
          />

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-1">
              {t('common.profile', lang)}
            </p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.full_name}
            </p>
            <p className="text-xs text-gray-600 truncate">{profile.email}</p>
          </div>

          <Button
            variant="secondary"
            size="md"
            className="w-full justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            {t('auth.logout', lang)}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">Briefer</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
