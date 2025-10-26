import './globals.css'
import { Inter as FontSans } from 'next/font/google'
import { Fira_Code as FontMono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers as ExistingProviders } from '@/components/providers'
import { ReduxProvider } from '../components/redux-provider'
import { Header } from '@/components/header'
import FaultyTerminal from '@/components/faulty-terminal'
import { Toaster } from '@/components/ui/toaster'
import ChatBubble from '@/components/chat-bubble'

const fontSans = FontSans({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = FontMono({ subsets: ['latin'], weight: ['400'], variable: '--font-mono' })

export const metadata = {
  title: 'Accorto - Cryptocurrency Market Explorer',
  description: 'Explore cryptocurrencies, exchanges, and market data with our responsive crypto platform',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className={`${fontSans.variable} ${fontMono.variable} font-sans relative scroll-smooth`}>
        <ReduxProvider>
          <ExistingProviders>
            <div className="relative min-h-screen">
              <FaultyTerminal
                scale={1.5}
                gridMul={[2, 1]}
                digitSize={1.2}
                timeScale={1}
                pause={false}
                scanlineIntensity={1}
                glitchAmount={1}
                flickerAmount={1}
                noiseAmp={1}
                chromaticAberration={0}
                dither={0}
                curvature={0}
                tint="#4F714A"
                mouseReact={true}
                mouseStrength={0.5}
                pageLoadAnimation={false}
                brightness={1}
              />
              <Header />
              {children}
              {/* Floating chat bubble on bottom-right */}
              <ChatBubble variant="floating" align="right" />
            </div>
          </ExistingProviders>
        </ReduxProvider>
        <SpeedInsights />
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
