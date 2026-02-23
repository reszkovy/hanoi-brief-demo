import React from 'react'
import { BrandProfile } from '@/lib/types'
import Card from './ui/Card'
import { t } from '@/lib/i18n'
import { Lang } from '@/lib/types'
import clsx from 'clsx'

interface BrandCardProps {
  brand: BrandProfile | null
  isSelected: boolean
  isNeutral?: boolean
  onClick: () => void
  lang: Lang
}

export default function BrandCard({
  brand,
  isSelected,
  isNeutral = false,
  onClick,
  lang,
}: BrandCardProps) {
  if (isNeutral) {
    return (
      <Card
        hover
        className={clsx(
          'p-4 cursor-pointer transition-all',
          isSelected && 'ring-2 ring-blue-500'
        )}
        onClick={onClick}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <span className="text-gray-600 text-2xl">○</span>
          </div>
          <h3 className="font-medium text-gray-900">{t('brand.neutral', lang)}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('brand.genericProfile', lang)}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      hover
      className={clsx(
        'p-4 cursor-pointer transition-all',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={onClick}
    >
      <div className="text-center">
        {brand?.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name_pl}
            className="w-16 h-16 object-contain rounded-lg mx-auto mb-3"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-lg mx-auto mb-3"
            style={{ backgroundColor: brand?.accent_color || '#e5e7eb' }}
          />
        )}
        <h3 className="font-medium text-gray-900">
          {lang === 'pl' ? brand?.name_pl : brand?.name_en || brand?.name_pl}
        </h3>
        <p className="text-xs mt-2 text-gray-600">
          {t(`brand.tone${brand?.tone_variant?.charAt(0).toUpperCase()}${brand?.tone_variant?.slice(1)}`, lang)}
        </p>
      </div>
    </Card>
  )
}
