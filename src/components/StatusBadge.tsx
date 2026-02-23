import React from 'react'
import { BriefStatus } from '@/lib/types'
import { t } from '@/lib/i18n'
import { Lang } from '@/lib/types'
import Badge from './ui/Badge'

interface StatusBadgeProps {
  status: BriefStatus
  lang: Lang
}

export default function StatusBadge({ status, lang }: StatusBadgeProps) {
  const statusMap: Record<BriefStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    draft: 'default',
    sent: 'info',
    in_progress: 'warning',
    completed: 'success',
    archived: 'default',
  }

  const translationKey: Record<BriefStatus, string> = {
    draft: 'brief.statusDraft',
    sent: 'brief.statusSent',
    in_progress: 'brief.statusInProgress',
    completed: 'brief.statusCompleted',
    archived: 'brief.statusArchived',
  }

  return (
    <Badge variant={statusMap[status]}>
      {t(translationKey[status], lang)}
    </Badge>
  )
}
