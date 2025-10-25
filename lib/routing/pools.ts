// Static (virtual) pool registry for Celo (default Alfajores testnet).
// These reserves are NOT on-chain fetched yet; they are placeholder values to enable
// price impact & routing math scaffolding. Replace with real on-chain queries later.
//
// Model: Constant product pools (Uniswap V2 style): price = R_out / R_in; dy = (amountIn * R_out * (1 - fee)) / (R_in + amountIn * (1 - fee))
// All fees expressed in basis points (e.g., 30 = 0.30%).

import { resolveTokenBySymbol, type TokenInfo } from '../tokens'
import { fetchUbeswapPools, type FetchUbeswapPoolsOptions } from './fetchers/ubeswap'

export interface Pool {
  id: string
  token0: TokenInfo
  token1: TokenInfo
  reserve0: bigint
  reserve1: bigint
  feeBps: number // e.g. 30 = 0.30%
  type: 'V2'
}

// Helper to create BigInt from decimal-like string for reserves
function toUnits(amount: string, decimals: number): bigint {
  const [int, frac = ''] = amount.split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(int + fracPadded)
}

const DEFAULT_POOL_CHAIN_ID = Number(process.env.ROUTING_CHAIN_ID || process.env.CHAIN_ID || 11142220)

const defaultPools: Pool[] = (() => {
  const chainId = DEFAULT_POOL_CHAIN_ID
  const CELO = resolveTokenBySymbol('CELO', chainId)
  const CUSD = resolveTokenBySymbol('cUSD', chainId) || resolveTokenBySymbol('CUSD', chainId)
  const CEUR = resolveTokenBySymbol('cEUR', chainId) || resolveTokenBySymbol('CEUR', chainId)

  if (!CELO || !CUSD || !CEUR) {
    console.warn('Some tokens not found during pool initialization:', { CELO, CUSD, CEUR })
    return []
  }

  // Virtual liquidity assumption (adjust once real data available)
  // Aim: make small trades show tiny price impact while large trades move price.
  return [
    {
      id: 'CELO-cUSD',
      token0: CELO,
      token1: CUSD,
      reserve0: toUnits('5000', CELO.decimals),     // 5,000 CELO
      reserve1: toUnits('250000', CUSD.decimals),   // 250,000 cUSD
      feeBps: 30,
      type: 'V2'
    },
    {
      id: 'cUSD-cEUR',
      token0: CUSD,
      token1: CEUR,
      reserve0: toUnits('200000', CUSD.decimals),
      reserve1: toUnits('180000', CEUR.decimals),
      feeBps: 5,
      type: 'V2'
    }
  ]
})()

let runtimePools: Pool[] | null = null

function activePools(): Pool[] {
  if (runtimePools && runtimePools.length) {
    return runtimePools
  }
  return defaultPools
}

export function listPools(): Pool[] { return activePools() }

export function getPoolById(id: string): Pool | null {
  return activePools().find(p => p.id === id) || null
}

export interface QuoteResult {
  amountOut: bigint
  priceImpactBps: number
  route: { pools: string[]; hops: string[] }
}

// Compute output for single-hop constant product pool
export function quoteSingleHop(tokenIn: TokenInfo, tokenOut: TokenInfo, amountIn: bigint): QuoteResult | null {
  const pool = activePools().find(p => (p.token0.address === tokenIn.address && p.token1.address === tokenOut.address) || (p.token1.address === tokenIn.address && p.token0.address === tokenOut.address))
  if (!pool) return null
  const zeroForOne = pool.token0.address === tokenIn.address
  const reserveIn = zeroForOne ? pool.reserve0 : pool.reserve1
  const reserveOut = zeroForOne ? pool.reserve1 : pool.reserve0
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return null
  const feeFactor = BigInt(10000 - pool.feeBps)
  const amountInAfterFee = amountIn * feeFactor / BigInt(10000)
  const numerator = amountInAfterFee * reserveOut
  const denominator = reserveIn + amountInAfterFee
  const amountOut = numerator / denominator

  // Mid price (pre-trade) = reserveOut / reserveIn
  // Execution price = amountIn / amountOut
  // price impact = (execution - mid)/mid
  // In bps = ((executionPrice - midPrice)/midPrice)*10000
  const midPriceNum = Number(reserveOut) / Number(reserveIn)
  const executionPriceNum = Number(amountIn) / Number(amountOut)
  const priceImpact = ((executionPriceNum - midPriceNum) / midPriceNum) * 10000
  return {
    amountOut,
    priceImpactBps: Math.max(0, Math.round(priceImpact)),
    route: { pools: [pool.id], hops: [tokenIn.symbol, tokenOut.symbol] }
  }
}

// Future: multi-hop quoting (CELO -> cUSD -> cEUR, etc.)
export function quoteBest(tokenIn: TokenInfo, tokenOut: TokenInfo, amountIn: bigint): QuoteResult | null {
  // 1. Direct pool
  const direct = quoteSingleHop(tokenIn, tokenOut, amountIn)
  // 2. (Placeholder) Could attempt two-hop via CELO or cUSD as common bases
  // Return best by amountOut
  return direct // for now
}

export function setRuntimePools(pools: Pool[] | null): void {
  runtimePools = pools && pools.length ? pools : null
}

export async function refreshRuntimePools(options: FetchUbeswapPoolsOptions = {}): Promise<Pool[]> {
  const pools = await fetchUbeswapPools(options)
  setRuntimePools(pools)
  return pools
}
