import { defineChain } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'

// Celo Sepolia chain definition
const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
    public: { http: ['https://forno.celo-sepolia.celo-testnet.org'] }
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celo-sepolia.celoscan.io' }
  },
  testnet: true
})

export function getViemChainFromEnv() {
  const chainId = Number(process.env.ROUTING_CHAIN_ID || process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 11142220)
  const rpcUrl = process.env.RPC_URL_CELO || process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL

  if (chainId === 42220) return celo
  if (chainId === 44787) return celoAlfajores
  if (chainId === 11142220) return celoSepolia

  // Allow custom chain via env vars
  return defineChain({
    id: chainId,
    name: 'celo-custom',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    rpcUrls: {
      default: { http: rpcUrl ? [rpcUrl] : ['https://forno.celo-sepolia.celo-testnet.org'] },
      public: { http: rpcUrl ? [rpcUrl] : ['https://forno.celo-sepolia.celo-testnet.org'] }
    }
  })
}
