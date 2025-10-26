import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, type Address } from 'viem'
import { defineChain } from 'viem'

// Celo Sepolia chain definition
const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://explorer.celo.org/sepolia' },
  },
  testnet: true,
})

const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const

const UBESWAP_ROUTER = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121'

export async function POST(req: NextRequest) {
  try {
    const { tokenAddress, owner, amount } = await req.json()

    if (!tokenAddress || !owner || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Create viem client for Celo Sepolia
    const client = createPublicClient({
      chain: celoSepolia,
      transport: http('https://forno.celo-sepolia.celo-testnet.org')
    })

    // Check current allowance
    const allowance = await client.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner as Address, UBESWAP_ROUTER as Address]
    })

    const needsApproval = allowance < BigInt(amount)

    return NextResponse.json({
      success: true,
      allowance: allowance.toString(),
      needsApproval
    })

  } catch (error) {
    console.error('Error checking allowance:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check allowance',
        details: error instanceof Error ? error.message : 'Unknown error',
        needsApproval: true // Default to needing approval on error
      },
      { status: 500 }
    )
  }
}
