import type { Address } from 'viem'

// Token registry supporting Avalanche (mainnet/testnet) and Celo

export type TokenInfo = {
  symbol: string
  address: Address | 'AVAX' | 'CELO'
  decimals: number
  coingeckoId?: string
}

const CELO_NATIVE: TokenInfo = { symbol: 'CELO', address: 'CELO', decimals: 18, coingeckoId: 'celo' }

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

const DEFAULT_ALFAJORES_TOKENS: Record<string, TokenInfo> = {
  CELO: CELO_NATIVE,
  CUSD: {
    symbol: 'cUSD',
    address: (process.env.CELO_CUSD_ADDRESS_ALFAJORES || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1') as Address,
    decimals: 18,
    coingeckoId: 'celo-dollar'
  }
}

// Celo testnet tokens (Chain ID 11142220 - Alfajores)
const CELO_TOKENS: Record<string, TokenInfo> = {
  CELO: { symbol: 'CELO', address: 'CELO', decimals: 18, coingeckoId: 'celo' },
  CUSD: { symbol: 'cUSD', address: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', decimals: 18, coingeckoId: 'celo-dollar' },
  CEUR: { symbol: 'cEUR', address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F', decimals: 18, coingeckoId: 'celo-euro' },
  CREAL: { symbol: 'cREAL', address: '0xE4D517785D091D3c54818832dB6094bcc2744545', decimals: 18, coingeckoId: 'celo-brazilian-real' },
  USDC: { symbol: 'USDC', address: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B', decimals: 6, coingeckoId: 'usd-coin' },
  USDT: { symbol: 'USDT', address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', decimals: 6, coingeckoId: 'tether' }, // May not exist on testnet
}

// Dynamic custom/test tokens from env (for custom deployed tokens)
function getCustomEnvTokens(): Record<string, TokenInfo> {
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
  const id = chainId ?? Number(process.env.CHAIN_ID || 43113)
  
  if (id === 43114) {
    // Avalanche mainnet
    return {
      ...DEFAULT_MAINNET_TOKENS,
      ...getEnvTokens('CELO_MAINNET')
    }
  } else if (id === 11142220) {
    // Celo Alfajores testnet
    return {
      ...CELO_TOKENS,
      ...getCustomEnvTokens()
    }
  } else {
    // Fuji testnet or unspecified
    return {
      ...FUJI_TOKENS,
      ...getCustomEnvTokens()
    }
  }
}

export function resolveTokenBySymbol(symbol?: string, chainId?: number): TokenInfo | null {
  if (!symbol) return null
  const registry = getTokenRegistry(chainId)
  return registry[symbol.toUpperCase()] ?? null
}

export function resolveTokenByCoinrankingId(): TokenInfo | null {
  return null
}

export function listTokenRegistry(chainId?: number): Record<string, TokenInfo> {
  return getTokenRegistry(chainId)
}

export const CELO_SYMBOL_TO_TOKEN = getTokenRegistry(DEFAULT_CHAIN_ID)
