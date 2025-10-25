// components/providers.tsx
'use client'

import React, { ReactNode } from 'react'
import { CeloProviders } from './web3/CeloProviders'
import { ThemeProvider } from './theme-provider'
import BackgroundPaths from './animated-background'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CeloProviders>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <BackgroundPaths />
        {children}
      </ThemeProvider>
    </CeloProviders>
  )
}

// Celo-only providers for Celo-specific pages
export function CeloOnlyProviders({ children }: { children: ReactNode }) {
  return (
    <CeloProviders>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <BackgroundPaths />
        {children}
      </ThemeProvider>
    </CeloProviders>
  )
}
