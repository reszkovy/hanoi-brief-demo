import React from 'react'
import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
  color?: 'blue' | 'green' | 'amber'
}

const colorClasses = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  amber: 'bg-amber-500',
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, showLabel = false, className, color = 'blue' }, ref) => {
    const percentage = Math.min((value / max) * 100, 100)

    return (
      <div
        ref={ref}
        className={clsx('w-full', className)}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-300 ease-out rounded-full',
                colorClasses[color]
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {showLabel && (
            <span className="text-xs font-medium text-gray-600 min-w-10">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar
