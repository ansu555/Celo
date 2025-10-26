// hooks/useCeloTransactions.ts - Celo-specific transaction handling
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { celo, celoAlfajores, celoSepolia } from '../app/services/celoWeb3'

// Celo token addresses
const CELO_TOKENS = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CB2762763733c8C8A1d3Ac97b59E4f468D1',
  cREAL: '0xE4D517785D091D3c54818803265F2B1C3f2B1881',
} as const

const CELO_TESTNET_TOKENS = {
  CELO: '0xF194afDf50B03e69Bd7D3c7e4C4C4C4C4C4C4C4C4',
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
} as const

export function useCeloTransactions() {
  const { address, chain } = useAccount()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const isTestnet = chain?.id === celoAlfajores.id || chain?.id === celoSepolia.id
  const tokens = isTestnet ? CELO_TESTNET_TOKENS : CELO_TOKENS

  // Send CELO
  const sendCelo = async (to: string, amount: string) => {
    if (!address) throw new Error('No wallet connected')
    
    const value = parseUnits(amount, 18)
    
    return writeContract({
      address: to as `0x${string}`,
      abi: [], // Native transfer doesn't need ABI
      functionName: 'transfer',
      value,
    })
  }

  // Send cUSD
  const sendCUSD = async (to: string, amount: string) => {
    if (!address) throw new Error('No wallet connected')
    
    const value = parseUnits(amount, 18)
    
    return writeContract({
      address: tokens.cUSD as `0x${string}`,
      abi: [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        }
      ],
      functionName: 'transfer',
      args: [to as `0x${string}`, value],
    })
  }

  // Send cEUR
  const sendCEUR = async (to: string, amount: string) => {
    if (!address) throw new Error('No wallet connected')
    
    const value = parseUnits(amount, 18)
    
    return writeContract({
      address: tokens.cEUR as `0x${string}`,
      abi: [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        }
      ],
      functionName: 'transfer',
      args: [to as `0x${string}`, value],
    })
  }

  // Get token balance
  const getTokenBalance = async (tokenAddress: string) => {
    if (!address) return '0'
    
    // This would typically use a readContract hook
    // For now, return a placeholder
    return '0'
  }

  // Format Celo amounts
  const formatCeloAmount = (amount: bigint, decimals: number = 18) => {
    return formatUnits(amount, decimals)
  }

  // Parse Celo amounts
  const parseCeloAmount = (amount: string, decimals: number = 18) => {
    return parseUnits(amount, decimals)
  }

  return {
    // Transaction functions
    sendCelo,
    sendCUSD,
    sendCEUR,
    
    // Utility functions
    getTokenBalance,
    formatCeloAmount,
    parseCeloAmount,
    
    // Transaction state
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
    
    // Token addresses
    tokens,
    isTestnet,
    
    // Network info
    chainId: chain?.id,
    isCeloMainnet: chain?.id === celo.id,
    isCeloTestnet: chain?.id === celoAlfajores.id || chain?.id === celoSepolia.id,
  }
}
