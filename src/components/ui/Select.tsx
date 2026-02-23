import React from 'react'
import clsx from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: Array<{ value: string; label: string }>
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-white mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'w-full px-4 py-3 rounded-md-sm border bg-r-bg-input text-white',
              'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'appearance-none pr-10',
              error
                ? 'border-r-error focus:ring-r-error/30'
                : 'border-r-border-strong focus:ring-r-lime/30 focus:border-r-lime',
              className
            )}
            {...props}
          >
            <option value="">--</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-r-white-muted" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && <p className="text-r-error text-xs mt-1.5">{error}</p>}
        {helperText && !error && <p className="text-r-white-dim text-xs mt-1.5">{helperText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
