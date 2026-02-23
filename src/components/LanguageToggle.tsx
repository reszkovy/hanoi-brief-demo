'use client'

import React from 'react'
import { Lang } from '@/lib/types'
import { t } from '@/lib/i18n'
import clsx from 'clsx'

interface LanguageToggleProps {
  currentLang: Lang
  onLangChange: (lang: Lang) => void
  variant?: 'compact' | 'full'
  theme?: 'dark' | 'light'
}

export default function LanguageToggle({
  currentLang,
  onLangChange,
  variant = 'full',
  theme = 'dark',
}: LanguageToggleProps) {
  const langs: Lang[] = ['pl', 'en']
  const d = theme === 'dark'

  if (variant === 'compact') {
    return (
      <div className={clsx(
        'flex gap-1 border p-1 rounded-lg',
        d ? 'bg-r-bg-input border-r-border' : 'bg-gray-100 border-gray-200'
      )}>
        {langs.map((lang) => (
          <button
            key={lang}
            onClick={() => onLangChange(lang)}
            className={clsx(
              'px-3 py-1.5 rounded font-medium text-sm transition-colors',
              currentLang === lang
                ? 'bg-r-lime text-r-bg'
                : d
                  ? 'text-r-white-dim hover:text-white'
                  : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={clsx('text-sm', d ? 'text-r-white-dim' : 'text-gray-500')}>
        {t('common.language', currentLang)}
      </span>
      <div className={clsx(
        'flex gap-1 border p-1 rounded-lg',
        d ? 'bg-r-bg-input border-r-border' : 'bg-gray-100 border-gray-200'
      )}>
        {langs.map((lang) => (
          <button
            key={lang}
            onClick={() => onLangChange(lang)}
            className={clsx(
              'px-4 py-2 rounded font-medium transition-colors text-sm',
              currentLang === lang
                ? 'bg-r-lime text-r-bg'
                : d
                  ? 'text-r-white-dim hover:text-white'
                  : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {lang === 'pl' ? t('common.polish', currentLang) : t('common.english', currentLang)}
          </button>
        ))}
      </div>
    </div>
  )
}
