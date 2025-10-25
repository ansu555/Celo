// components/web3/CeloProviders.tsx - Celo-only Web3 providers
'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { celoWagmiConfig } from '../../app/services/celoWeb3'

const queryClient = new QueryClient()

export function CeloProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={celoWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          mode="light"
          customTheme={{
            '--ck-font-family': 'Inter, sans-serif',
            '--ck-border-radius': '8px',
            '--ck-background': '#f5f5f5',
            '--ck-primary-button-background': '#35D07F', // Celo green
            '--ck-primary-button-hover-background': '#2BB56B',
          }}
          options={{ 
            embedGoogleFonts: false,
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
