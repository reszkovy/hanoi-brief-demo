import React from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'default', className }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
          {
            'bg-gray-100 text-gray-700': variant === 'default',
            'bg-green-100 text-green-700': variant === 'success',
            'bg-amber-100 text-amber-700': variant === 'warning',
            'bg-red-100 text-red-700': variant === 'error',
            'bg-blue-100 text-blue-700': variant === 'info',
          },
          className
        )}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
