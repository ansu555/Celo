import type { Address } from 'viem'

// Token registry now targets Celo (mainnet 42220, Alfajores 44787, Sepolia 11142220)

export type TokenInfo = {
  symbol: string
  address: Address | 'CELO'
  decimals: number
  coingeckoId?: string
}

const CELO_NATIVE: TokenInfo = { symbol: 'CELO', address: 'CELO', decimals: 18, coingeckoId: 'celo' }

const runtimeTokenRegistry = new Map<number, Record<string, TokenInfo>>()

// Celo Mainnet tokens (Chain ID 42220)
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
  },
  USDC: {
    symbol: 'USDC',
    address: (process.env.CELO_USDC_ADDRESS_MAINNET || '0xcebA9300f2b948710d2653dD7B07f33A8B32118C') as Address,
    decimals: 6,
    coingeckoId: 'usd-coin'
  },
  USDT: {
    symbol: 'USDT',
    address: (process.env.CELO_USDT_ADDRESS_MAINNET || '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e') as Address,
    decimals: 6,
    coingeckoId: 'tether'
  }
}

// Celo Alfajores testnet tokens (Chain ID 44787)
const DEFAULT_ALFAJORES_TOKENS: Record<string, TokenInfo> = {
  CELO: CELO_NATIVE,
  CUSD: {
    symbol: 'cUSD',
    address: (process.env.CELO_CUSD_ADDRESS_ALFAJORES || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1') as Address,
    decimals: 18,
    coingeckoId: 'celo-dollar'
  },
  CEUR: {
    symbol: 'cEUR',
    address: (process.env.CELO_CEUR_ADDRESS_ALFAJORES || '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F') as Address,
    decimals: 18,
    coingeckoId: 'celo-euro'
  },
  CREAL: {
    symbol: 'cREAL',
    address: (process.env.CELO_CREAL_ADDRESS_ALFAJORES || '0xE4D517785D091D3c54818832dB6094bcc2744545') as Address,
    decimals: 18,
    coingeckoId: 'celo-brazilian-real'
  }
}

// Celo Sepolia testnet tokens (Chain ID 11142220 - default testnet)
const DEFAULT_SEPOLIA_TOKENS: Record<string, TokenInfo> = {
  CELO: CELO_NATIVE,
  CUSD: {
    symbol: 'cUSD',
    address: (process.env.CELO_CUSD_ADDRESS_SEPOLIA || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1') as Address,
    decimals: 18,
    coingeckoId: 'celo-dollar'
  },
  CEUR: {
    symbol: 'cEUR',
    address: (process.env.CELO_CEUR_ADDRESS_SEPOLIA || '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F') as Address,
    decimals: 18,
    coingeckoId: 'celo-euro'
  },
  TKA: {
    symbol: 'TKA',
    address: (process.env.NEXT_PUBLIC_TEST_TOKEN_A || '0x12846d5C14622d085B0bbD9033e87d08C59a67d1') as Address,
    decimals: 18
  },
  TKB: {
    symbol: 'TKB',
    address: (process.env.NEXT_PUBLIC_TEST_TOKEN_B || '0x...') as Address,
    decimals: 18
  },
  CREAL: {
    symbol: 'cREAL',
    address: (process.env.CELO_CREAL_ADDRESS_SEPOLIA || '0xE4D517785D091D3c54818832dB6094bcc2744545') as Address,
    decimals: 18,
    coingeckoId: 'celo-brazilian-real'
  },
  // Celo Sepolia USDC (FiatTokenCeloV2_2 - verified from working transaction)
  USDC: {
    symbol: 'USDC',
    address: (process.env.CELO_USDC_ADDRESS_SEPOLIA || '0x98Cc94F9271e36EB1c30d77c39dCb9929D9310C4') as Address,
    decimals: 6,
    coingeckoId: 'usd-coin'
  },
  USDT: {
    symbol: 'USDT',
    address: (process.env.CELO_USDT_ADDRESS_SEPOLIA || '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e') as Address,
    decimals: 6,
    coingeckoId: 'tether'
  }
}

// Dynamic environment token loader (supports up to 5 custom tokens per chain)// Funded test pair for frontend
export const FUNDED_TEST_PAIR = process.env.NEXT_PUBLIC_TEST_PAIR || '0x...';

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

const DEFAULT_CHAIN_ID = Number(process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 11142220)

// Get the appropriate token registry based on chain ID
function getTokenRegistry(chainId?: number): Record<string, TokenInfo> {
  const target = chainId ?? Number(process.env.CHAIN_ID || DEFAULT_CHAIN_ID)
  const runtimeEntries = runtimeTokenRegistry.get(target) ?? {}

  if (target === 42220) {
    // Celo Mainnet
    return {
      ...DEFAULT_MAINNET_TOKENS,
      ...getEnvTokens('CELO_MAINNET'),
      ...runtimeEntries
    }
  } else if (target === 44787) {
    // Celo Alfajores
    return {
      ...DEFAULT_ALFAJORES_TOKENS,
      ...getEnvTokens('CELO_ALFAJORES'),
      ...runtimeEntries
    }
  }

  // Default to Sepolia for all other testnets (including 11142220)
  return {
    ...DEFAULT_SEPOLIA_TOKENS,
    ...getEnvTokens('CELO_SEPOLIA'),
    ...getEnvTokens('CELO_CUSTOM'),
    ...runtimeEntries
  }
}

// Resolve token by symbol (e.g., "CELO", "cUSD", "USDC")
export function resolveTokenBySymbol(symbol?: string, chainId?: number): TokenInfo | null {
  if (!symbol) return null
  const registry = getTokenRegistry(chainId)
  return registry[symbol.toUpperCase()] ?? null
}

// Resolve token by contract address
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

// Register a token at runtime (useful for dynamically added tokens)
export function registerRuntimeToken(token: TokenInfo, chainId?: number): void {
  const target = chainId ?? Number(process.env.CHAIN_ID || DEFAULT_CHAIN_ID)
  const next = { ...(runtimeTokenRegistry.get(target) ?? {}) }
  next[token.symbol.toUpperCase()] = token
  runtimeTokenRegistry.set(target, next)
}

// Placeholder for Coinranking ID resolution (not implemented)
export function resolveTokenByCoinrankingId(): TokenInfo | null {
  return null
}

// Get all tokens for a specific chain
export function listTokenRegistry(chainId?: number): Record<string, TokenInfo> {
  return getTokenRegistry(chainId)
}

// Legacy export for default chain
export const CELO_SYMBOL_TO_TOKEN = getTokenRegistry(DEFAULT_CHAIN_ID)
