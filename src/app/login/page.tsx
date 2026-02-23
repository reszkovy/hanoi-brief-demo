'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t, type Lang } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LanguageToggle from '@/components/LanguageToggle'
import Card from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(t('auth.loginError', lang))
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError(t('common.error', lang))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <LanguageToggle
          currentLang={lang}
          onLangChange={setLang}
          variant="compact"
        />
      </div>

      <Card className="w-full max-w-sm">
        <div className="px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Briefer</h1>
            <p className="text-gray-600">{t('app.tagline', lang)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email', lang)}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label={t('auth.password', lang)}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? t('auth.loading', lang) : t('auth.login', lang)}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>{t('common.contactAdmin', lang)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
