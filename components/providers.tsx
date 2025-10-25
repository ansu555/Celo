// components/providers.tsx
'use client'

import React, { ReactNode } from 'react'
import { Web3Providers } from './web3/Web3Providers'
import { CeloProviders } from './web3/CeloProviders'
import { ThemeProvider } from './theme-provider'
import BackgroundPaths from './animated-background'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3Providers>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <BackgroundPaths />
        {children}
      </ThemeProvider>
    </Web3Providers>
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
