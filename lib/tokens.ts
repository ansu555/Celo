import type { Address } from 'viem'

// Token registry now targets Celo (mainnet 42220, Alfajores 44787)

export type TokenInfo = {
  symbol: string
  address: Address | 'CELO'
  decimals: number
  coingeckoId?: string
}

const CELO_NATIVE: TokenInfo = { symbol: 'CELO', address: 'CELO', decimals: 18, coingeckoId: 'celo' }

const runtimeTokenRegistry = new Map<number, Record<string, TokenInfo>>()

const DEFAULT_MAINNET_TOKENS: Record<string, TokenInfo> = {
  CELO: CELO_NATIVE,
  CUSD: {
    symbol: 'cUSD',
    address: (process.env.CELO_CUSD_ADDRESS_MAINNET || '0x765DE816845861e75A25fCA122bb6898B8B1282a') as Address,
    decimals: 18,
    coingeckoId: 'celo-dollar'
  },
  CEUR: {
    symbol: 'cEUR',
    address: (process.env.CELO_CEUR_ADDRESS_MAINNET || '0xd8763cBa276a3738E6De85B4B3BF5FDed6d6cA73') as Address,
    decimals: 18,
    coingeckoId: 'celo-euro'
  },
  CREAL: {
    symbol: 'cREAL',
    address: (process.env.CELO_CREAL_ADDRESS_MAINNET || '0xe4d517785D091D3c54818832dB6094bcc0EFc7A0') as Address,
    decimals: 18,
    coingeckoId: 'celo-real'
  }
}

const DEFAULT_ALFAJORES_TOKENS: Record<string, TokenInfo> = {
  CELO: CELO_NATIVE,
  CUSD: {
    symbol: 'cUSD',
    address: (process.env.CELO_CUSD_ADDRESS_ALFAJORES || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1') as Address,
    decimals: 18,
    coingeckoId: 'celo-dollar'
  }
}

function getEnvTokens(prefix: string): Record<string, TokenInfo> {
  const out: Record<string, TokenInfo> = {}
  for (let i = 1; i <= 5; i++) {
    const symbol = process.env[`${prefix}_SYMBOL_${i}`]
    const address = process.env[`${prefix}_ADDRESS_${i}`]
    const decimals = process.env[`${prefix}_DECIMALS_${i}`]
    if (!symbol || !address || !decimals) continue
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) continue
    const key = symbol.toUpperCase()
    out[key] = {
      symbol,
      address: address as Address,
      decimals: Number(decimals) || 18,
      coingeckoId: process.env[`${prefix}_COINGECKO_${i}`] || undefined
    }
  }
  return out
}

const DEFAULT_CHAIN_ID = Number(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 44787)

function getTokenRegistry(chainId?: number): Record<string, TokenInfo> {
  const target = chainId ?? Number(process.env.CHAIN_ID || DEFAULT_CHAIN_ID)
  const isMainnet = target === 42220
  const runtimeEntries = runtimeTokenRegistry.get(target) ?? {}

  if (isMainnet) {
    return {
      ...DEFAULT_MAINNET_TOKENS,
      ...getEnvTokens('CELO_MAINNET'),
      ...runtimeEntries
    }
  }

  return {
    ...DEFAULT_ALFAJORES_TOKENS,
    // Allow overriding/adding tokens for testnets via env
    ...getEnvTokens('CELO_ALFAJORES'),
    ...getEnvTokens('CELO_SEPOLIA'),
    ...getEnvTokens('CELO_CUSTOM'),
    ...runtimeEntries
  }
}

export function resolveTokenBySymbol(symbol?: string, chainId?: number): TokenInfo | null {
  if (!symbol) return null
  const registry = getTokenRegistry(chainId)
  return registry[symbol.toUpperCase()] ?? null
}

export function resolveTokenByAddress(address?: Address | string, chainId?: number): TokenInfo | null {
  if (!address || address === 'CELO') return null
  const target = chainId ?? Number(process.env.CHAIN_ID || DEFAULT_CHAIN_ID)
  const registry = getTokenRegistry(target)
  const normalized = (address as string).toLowerCase()

  for (const token of Object.values(registry)) {
    if (token.address === 'CELO') continue
    if ((token.address as string).toLowerCase() === normalized) {
      return token
    }
  }

  return null
}

export function registerRuntimeToken(token: TokenInfo, chainId?: number): void {
  const target = chainId ?? Number(process.env.CHAIN_ID || DEFAULT_CHAIN_ID)
  const next = { ...(runtimeTokenRegistry.get(target) ?? {}) }
  next[token.symbol.toUpperCase()] = token
  runtimeTokenRegistry.set(target, next)
}

export function resolveTokenByCoinrankingId(): TokenInfo | null {
  return null
}

export function listTokenRegistry(chainId?: number): Record<string, TokenInfo> {
  return getTokenRegistry(chainId)
}

export const CELO_SYMBOL_TO_TOKEN = getTokenRegistry(DEFAULT_CHAIN_ID)
