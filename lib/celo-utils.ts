// Celo-specific utility functions
import { formatUnits, parseUnits } from 'viem'

// Celo token addresses (mainnet)
export const CELO_TOKENS = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CB2762763733c8C8A1d3Ac97b59E4f468D1',
  cREAL: '0xE4D517785D091D3c54818803265F2B1C3f2B1881',
} as const

// Celo token addresses (Alfajores testnet)
export const CELO_TESTNET_TOKENS = {
  CELO: '0xF194afDf50B03e69Bd7D3c7e4C4C4C4C4C4C4C4C4',
  cUSD: '0x874069Fa1Eb16D44d82F802021F853a0f33F031d',
  cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
} as const

// Celo network information
export const CELO_NETWORKS = {
  mainnet: {
    chainId: 42220,
    name: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    explorer: 'https://explorer.celo.org',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  alfajores: {
    chainId: 44787,
    name: 'Celo Alfajores',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorer: 'https://alfajores-blockscout.celo-testnet.org',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
  },
} as const

// Format Celo amounts
export function formatCeloAmount(amount: bigint, decimals: number = 18): string {
  return formatUnits(amount, decimals)
}

// Parse Celo amounts
export function parseCeloAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals)
}

// Get token info by address
export function getCeloTokenInfo(address: string, isTestnet: boolean = false) {
  const tokens = isTestnet ? CELO_TESTNET_TOKENS : CELO_TOKENS
  
  for (const [symbol, tokenAddress] of Object.entries(tokens)) {
    if (tokenAddress.toLowerCase() === address.toLowerCase()) {
      return { symbol, address: tokenAddress }
    }
  }
  
  return null
}

// Check if address is a Celo token
export function isCeloToken(address: string, isTestnet: boolean = false): boolean {
  return getCeloTokenInfo(address, isTestnet) !== null
}

// Get Celo network info by chain ID
export function getCeloNetworkInfo(chainId: number) {
  if (chainId === CELO_NETWORKS.mainnet.chainId) {
    return CELO_NETWORKS.mainnet
  }
  if (chainId === CELO_NETWORKS.alfajores.chainId) {
    return CELO_NETWORKS.alfajores
  }
  return null
}

// Check if chain is Celo
export function isCeloChain(chainId: number): boolean {
  return getCeloNetworkInfo(chainId) !== null
}
