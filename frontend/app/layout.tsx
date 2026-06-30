import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Spectral } from 'next/font/google'
import './globals.css'
import { IndexRail } from '@/components/layout/IndexRail'
import { ConsoleTopBar } from '@/components/layout/ConsoleTopBar'

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-spectral',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PRAHARI — Digital Public Safety Intelligence Platform',
  description: 'Point-of-contact threat detection — stopping fraud at the point of contact, not the point of complaint.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${spectral.variable}`}>
      <body className="h-screen flex flex-col overflow-hidden bg-ink-base">
        <ConsoleTopBar />
        <div className="flex flex-1 overflow-hidden min-h-0">
          <IndexRail />
          <main className="flex-1 overflow-y-auto bg-ink-base">
            {children}
          </main>
        </div>
        <footer className="flex-shrink-0 border-t border-ink-border bg-ink-panel px-8 py-2">
          <p className="label-caps text-ink-muted text-center tracking-caps">
            DEMO DATA — synthetic, for evaluation only · PRAHARI v1.0.0 · HallucinationFix Team · ET AI Hackathon 2026
          </p>
        </footer>
      </body>
    </html>
  )
}
