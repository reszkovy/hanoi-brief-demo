import React from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive'
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = 'default', hover = false, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={clsx(
          'rounded-md-lg',
          variant === 'default' && 'bg-r-bg-card border border-r-border',
          variant === 'elevated' && 'bg-r-bg-card shadow-md-1 border border-r-border',
          variant === 'outlined' && 'bg-r-bg-card border border-r-border-strong',
          variant === 'interactive' && 'bg-r-bg-card border border-r-border hover:bg-r-bg-elevated hover:shadow-md-1',
          hover && 'hover:shadow-md-2 transition-shadow duration-200 cursor-pointer',
          onClick && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-5', className)}>{children}</div>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-4 border-t border-r-border bg-r-bg-elevated rounded-b-md-lg flex gap-3 justify-end', className)}>{children}</div>
}
