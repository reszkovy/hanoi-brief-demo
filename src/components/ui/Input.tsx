import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-3 rounded-md-sm border bg-r-bg-input text-white placeholder-r-white-muted',
            'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-r-error focus:ring-r-error/30'
              : 'border-r-border-strong focus:ring-r-lime/30 focus:border-r-lime',
            className
          )}
          {...props}
        />
        {error && <p className="text-r-error text-xs mt-1.5">{error}</p>}
        {helperText && !error && <p className="text-r-white-dim text-xs mt-1.5">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
