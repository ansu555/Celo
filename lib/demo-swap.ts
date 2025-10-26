/**
 * Demo Swap Implementation
 * 
 * Creates real, verifiable transactions for demonstration purposes.
 * Uses a simple transfer approach that doesn't require liquidity pools.
 */

import { Address, createPublicClient, http, parseUnits, formatUnits, erc20Abi } from 'viem'
import { resolveTokenBySymbol } from './tokens'
import { getViemChainFromEnv } from './chain'

export interface DemoSwapParams {
  tokenInSymbol: string
  tokenOutSymbol: string
  amount: string
  slippageBps?: number
  recipient: Address
}

export interface DemoSwapResult {
  success: boolean
  txHash: string
  details: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    amountOut: string
    recipient: Address
    type: 'DEMO_SWAP'
  }
}

/**
 * Simulates a swap by calculating expected output with price impact
 */
export async function simulateDemoSwap(params: DemoSwapParams) {
  const chain = getViemChainFromEnv()
  const tokenIn = resolveTokenBySymbol(params.tokenInSymbol, chain.id)
  const tokenOut = resolveTokenBySymbol(params.tokenOutSymbol, chain.id)

  if (!tokenIn || !tokenOut) {
    throw new Error('Unsupported token symbols')
  }

  const amountInUnits = parseUnits(params.amount, tokenIn.decimals)
  
  // Simulate a realistic exchange rate with slight price impact
  // For demo: assume 1:1 base rate with 0.3% fee and small price impact
  const feeMultiplier = BigInt(9970) // 99.7% (0.3% fee)
  const priceImpact = (amountInUnits * BigInt(10)) / BigInt(100000) // 0.01% price impact per unit
  
  let amountOutUnits = (amountInUnits * feeMultiplier) / BigInt(10000)
  amountOutUnits = amountOutUnits - priceImpact

  const slippageBps = params.slippageBps ?? 50
  const minOutUnits = (amountOutUnits * BigInt(10000 - slippageBps)) / BigInt(10000)

  return {
    expectedOut: formatUnits(amountOutUnits, tokenOut.decimals),
    minOut: formatUnits(minOutUnits, tokenOut.decimals),
    priceImpactBps: 30, // 0.3%
    tokenIn: tokenIn.symbol,
    tokenOut: tokenOut.symbol,
    path: [tokenIn.symbol, tokenOut.symbol]
  }
}

/**
 * Prepares demo swap transaction data
 */
export async function prepareDemoSwap(
  publicClient: any,
  walletAddress: Address,
  params: DemoSwapParams
) {
  const chain = getViemChainFromEnv()
  const tokenIn = resolveTokenBySymbol(params.tokenInSymbol, chain.id)
  const tokenOut = resolveTokenBySymbol(params.tokenOutSymbol, chain.id)

  if (!tokenIn || !tokenOut) {
    throw new Error('Unsupported token symbols')
  }

  if (tokenIn.address === 'CELO' || tokenOut.address === 'CELO') {
    throw new Error('Native CELO not supported in demo mode. Use wrapped tokens.')
  }

  const amountInUnits = parseUnits(params.amount, tokenIn.decimals)
  const simulation = await simulateDemoSwap(params)
  const minOutUnits = parseUnits(simulation.minOut, tokenOut.decimals)

  // Check balances
  const balanceIn: bigint = await publicClient.readContract({
    address: tokenIn.address as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress]
  })

  if (balanceIn < amountInUnits) {
    throw new Error(`Insufficient ${tokenIn.symbol} balance. Have: ${formatUnits(balanceIn, tokenIn.decimals)}, Need: ${params.amount}`)
  }

  return {
    tokenInAddress: tokenIn.address as Address,
    tokenOutAddress: tokenOut.address as Address,
    amountInUnits,
    minOutUnits,
    simulation,
    tokenIn,
    tokenOut
  }
}

/**
 * Checks if demo swap mode is enabled
 */
export function isDemoSwapEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_SWAP_MODE === 'true' || 
         process.env.DEMO_SWAP_MODE === 'true'
}

/**
 * Get demo swap status message
 */
export function getDemoSwapMessage(): string {
  if (isDemoSwapEnabled()) {
    return '🎭 Demo Mode: Swaps create real transactions but use simplified pricing. Perfect for testing!'
  }
  return ''
}
