import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Briefer — Project Briefing System',
  description: 'Clean, efficient project briefing system with bilingual support',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-r-bg text-white font-sans">
        {children}
      </body>
    </html>
  )
}
