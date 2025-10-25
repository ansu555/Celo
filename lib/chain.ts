import { defineChain } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'

export function getViemChainFromEnv() {
  const chainId = Number(process.env.ROUTING_CHAIN_ID || process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 44787)
  const rpcUrl = process.env.RPC_URL_CELO || process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL

  if (chainId === 42220) return celo
  if (chainId === 44787) return celoAlfajores

  // Allow custom chain (e.g., Celo Sepolia) via env vars
  return defineChain({
    id: chainId,
    name: 'celo-custom',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    rpcUrls: {
      default: { http: rpcUrl ? [rpcUrl] : ['https://alfajores-forno.celo-testnet.org'] },
      public: { http: rpcUrl ? [rpcUrl] : ['https://alfajores-forno.celo-testnet.org'] }
    }
  })
}
