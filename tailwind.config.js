/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // r352 dark theme
        r: {
          bg: '#151515',
          'bg-elevated': '#1a1a1a',
          'bg-card': '#1e1e1e',
          'bg-input': '#252525',
          lime: '#D4FF00',
          'lime-dim': '#a8cc00',
          white: '#ffffff',
          'white-dim': '#999999',
          'white-muted': '#666666',
          border: 'rgba(255,255,255,0.08)',
          'border-strong': 'rgba(255,255,255,0.15)',
          error: '#ff4444',
          success: '#4ade80',
          warning: '#fbbf24',
        },
        // Keep md colors for backward compat
        md: {
          primary: '#D4FF00',
          'on-primary': '#151515',
          'primary-container': '#2a2d00',
          surface: '#151515',
          'surface-dim': '#111111',
          'surface-container': '#1a1a1a',
          'surface-container-high': '#252525',
          'on-surface': '#ffffff',
          'on-surface-variant': '#999999',
          outline: 'rgba(255,255,255,0.15)',
          'outline-variant': 'rgba(255,255,255,0.08)',
          error: '#ff4444',
          success: '#4ade80',
          warning: '#fbbf24',
        },
        // Keep apple colors for backward compat in dashboard
        apple: {
          bg: '#151515',
          card: '#1e1e1e',
          text: '#ffffff',
          secondary: '#999999',
          accent: '#D4FF00',
          accentHover: '#e0ff33',
          border: 'rgba(255,255,255,0.08)',
          success: '#4ade80',
          warning: '#fbbf24',
          danger: '#ff4444',
        }
      },
      fontFamily: {
        sans: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Satoshi', 'sans-serif'],
      },
      borderRadius: {
        'md-sm': '8px',
        'md-md': '12px',
        'md-lg': '16px',
        'md-xl': '28px',
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      boxShadow: {
        'md-1': '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.3)',
        'md-2': '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
        'md-3': '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)',
        'apple': '0 2px 8px rgba(0,0,0,0.3)',
        'apple-md': '0 4px 16px rgba(0,0,0,0.3)',
        'apple-lg': '0 8px 32px rgba(0,0,0,0.4)',
        'apple-hover': '0 8px 24px rgba(0,0,0,0.5)',
        'glow-lime': '0 0 20px rgba(212,255,0,0.15)',
      }
    }
  },
  plugins: []
}
