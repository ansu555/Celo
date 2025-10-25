// On-chain pool data fetcher for Celo networks (default Alfajores)
// Fetches real reserve data from deployed AMM contracts

import { createPublicClient, http, type Address } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'
import { resolveTokenBySymbol, type TokenInfo } from '../tokens'
import FactoryAbi from '@/lib/abi/Factory.json'
import PairAbi from '@/lib/abi/Pair.json'

// Type the ABI imports
const factoryAbi = FactoryAbi as any
const pairAbi = PairAbi as any

const TARGET_CHAIN_ID = Number(process.env.ROUTING_CHAIN_ID || process.env.CHAIN_ID || 44787)
const targetChain = TARGET_CHAIN_ID === 42220 ? celo : celoAlfajores
const defaultRpc = TARGET_CHAIN_ID === 42220
  ? 'https://forno.celo.org'
  : 'https://alfajores-forno.celo-testnet.org'
const rpcUrl = process.env.RPC_URL_CELO || process.env.RPC_URL || defaultRpc

const publicClient = createPublicClient({
  chain: targetChain,
  transport: http(rpcUrl)
})

// Contract addresses from env
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_AMM_FACTORY as Address
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_AMM_ROUTER as Address

export interface OnChainPool {
  id: string
  pairAddress: Address
  token0: TokenInfo
  token1: TokenInfo
  reserve0: bigint
  reserve1: bigint
  feeBps: number
  type: 'V2'
  lastUpdated: number
}

// Cache for pool data to avoid excessive RPC calls
const poolCache = new Map<string, OnChainPool>()
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Get pair address from factory contract
 */
async function getPairAddress(token0: Address, token1: Address): Promise<Address | null> {
  try {
    const pairAddress = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: 'getPair',
      args: [token0, token1]
    }) as Address

    // Check if pair exists (not zero address)
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      return null
    }
    
    return pairAddress
  } catch (error) {
    console.error(`Error getting pair address for ${token0}/${token1}:`, error)
    return null
  }
}

/**
 * Fetch real reserves from pair contract
 */
async function fetchPairReserves(pairAddress: Address): Promise<{
  reserve0: bigint
  reserve1: bigint
  token0: Address
  token1: Address
} | null> {
  try {
    // Get reserves
    const reserves = await publicClient.readContract({
      address: pairAddress,
      abi: pairAbi,
      functionName: 'getReserves',
      args: []
    }) as [bigint, bigint, number]

    // Get token addresses
    const [token0Address, token1Address] = await Promise.all([
      publicClient.readContract({
        address: pairAddress,
        abi: pairAbi,
        functionName: 'token0',
        args: []
      }) as Promise<Address>,
      publicClient.readContract({
        address: pairAddress,
        abi: pairAbi,
        functionName: 'token1',
        args: []
      }) as Promise<Address>
    ])

    return {
      reserve0: reserves[0],
      reserve1: reserves[1],
      token0: token0Address,
      token1: token1Address
    }
  } catch (error) {
    console.error(`Error fetching reserves for pair ${pairAddress}:`, error)
    return null
  }
}

/**
 * Fetch on-chain pool data for token pair
 */
export async function fetchOnChainPool(
  tokenA: TokenInfo,
  tokenB: TokenInfo,
  useCache: boolean = true
): Promise<OnChainPool | null> {
  if (tokenA.address === 'CELO' || tokenB.address === 'CELO') {
    console.warn('Skipping native CELO pair for on-chain pool fetch until wrapper support is added', {
      tokenA: tokenA.symbol,
      tokenB: tokenB.symbol
    })
    return null
  }
  // Sort tokens to create consistent pool ID
  const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() 
    ? [tokenA, tokenB] 
    : [tokenB, tokenA]
  
  const poolId = `${token0.symbol}-${token1.symbol}`
  
  // Check cache first
  if (useCache) {
    const cached = poolCache.get(poolId)
    if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION) {
      return cached
    }
  }

  try {
    // Get pair address from factory
    const pairAddress = await getPairAddress(token0.address as Address, token1.address as Address)
    if (!pairAddress) {
      console.log(`No pair found for ${token0.symbol}/${token1.symbol}`)
      return null
    }

    // Fetch reserves
    const pairData = await fetchPairReserves(pairAddress)
    if (!pairData) {
      return null
    }

    // Create pool object
    const pool: OnChainPool = {
      id: poolId,
      pairAddress,
      token0,
      token1,
      reserve0: pairData.reserve0,
      reserve1: pairData.reserve1,
      feeBps: 30, // Standard 0.3% fee (could be fetched from contract if configurable)
      type: 'V2',
      lastUpdated: Date.now()
    }

    // Cache the result
    poolCache.set(poolId, pool)
    
    console.log(`Fetched on-chain pool ${poolId}:`, {
      pair: pairAddress,
      reserve0: pool.reserve0.toString(),
      reserve1: pool.reserve1.toString()
    })

    return pool
  } catch (error) {
    console.error(`Error fetching on-chain pool for ${poolId}:`, error)
    return null
  }
}

/**
 * Fetch all available pools for given tokens
 */
export async function discoverOnChainPools(tokens: TokenInfo[]): Promise<OnChainPool[]> {
  const pools: OnChainPool[] = []
  
  // Try all token pair combinations
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const pool = await fetchOnChainPool(tokens[i], tokens[j])
      if (pool && pool.reserve0 > BigInt(0) && pool.reserve1 > BigInt(0)) {
        pools.push(pool)
      }
    }
  }
  
  return pools
}

/**
 * Get standard token list for pool discovery
 */
export function getStandardTokens(): TokenInfo[] {
  const tokens = [
    resolveTokenBySymbol('cUSD'),
    resolveTokenBySymbol('cEUR'),
    resolveTokenBySymbol('cREAL')
  ].filter(Boolean) as TokenInfo[]
  
  return tokens
}

/**
 * Refresh all pool caches
 */
export async function refreshAllPools(): Promise<OnChainPool[]> {
  const tokens = getStandardTokens()
  return discoverOnChainPools(tokens)
}

/**
 * Clear pool cache (useful for testing)
 */
export function clearPoolCache(): void {
  poolCache.clear()
}