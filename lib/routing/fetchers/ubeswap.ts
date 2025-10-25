import { createPublicClient, erc20Abi, http, type Address, type PublicClient, type Transport, type Chain as ViemChain } from 'viem'
import { getViemChainFromEnv } from '@/lib/chain'
import PairAbi from '@/lib/abi/Pair.json'
import FactoryAbi from '@/lib/abi/Factory.json'
import type { Pool } from '../pools'
import { registerRuntimeToken, resolveTokenByAddress, type TokenInfo } from '@/lib/tokens'

const pairAbi = PairAbi as any
const factoryAbi = FactoryAbi as any

export interface FetchUbeswapPoolsOptions {
  rpcUrl?: string
  chainId?: number
  factoryAddress?: Address
  maxPairs?: number
  refreshKnownTokens?: boolean
}

interface TokenMetadata {
  symbol: string
  decimals: number
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type RoutingClient = PublicClient<Transport, ViemChain>

async function fetchTokenMetadata(publicClient: RoutingClient, address: Address): Promise<TokenMetadata | null> {
  try {
    const [symbolRaw, decimalsRaw] = await publicClient.multicall({
      contracts: [
        { address, abi: erc20Abi, functionName: 'symbol' },
        { address, abi: erc20Abi, functionName: 'decimals' }
      ],
      allowFailure: true
    })

    const symbolResult = symbolRaw?.result
    const decimalsResult = decimalsRaw?.result

    if (!symbolResult || typeof symbolResult !== 'string') return null
    if (decimalsResult == null) return null

    return { symbol: symbolResult, decimals: Number(decimalsResult) }
  } catch (error) {
    console.error('Failed to fetch token metadata', { address, error })
    return null
  }
}

async function ensureTokenInfo(client: RoutingClient, address: Address, chainId: number): Promise<TokenInfo | null> {
  const existing = resolveTokenByAddress(address, chainId)
  if (existing) {
    return existing
  }

  const metadata = await fetchTokenMetadata(client, address)
  if (!metadata) return null

  const token: TokenInfo = {
    symbol: metadata.symbol,
    address,
    decimals: metadata.decimals || 18
  }

  registerRuntimeToken(token, chainId)
  return token
}

async function fetchPairAsPool(
  client: RoutingClient,
  pairAddress: Address,
  chainId: number
): Promise<Pool | null> {
  try {
    const [reservesResult, token0Result, token1Result] = await client.multicall({
      contracts: [
        { address: pairAddress, abi: pairAbi, functionName: 'getReserves', args: [] },
        { address: pairAddress, abi: pairAbi, functionName: 'token0', args: [] },
        { address: pairAddress, abi: pairAbi, functionName: 'token1', args: [] }
      ],
      allowFailure: true
    })

    if (!reservesResult?.result || !token0Result?.result || !token1Result?.result) {
      return null
    }

    const token0Address = token0Result.result as Address
    const token1Address = token1Result.result as Address

    if (token0Address === ZERO_ADDRESS || token1Address === ZERO_ADDRESS) {
      return null
    }

    const token0 = await ensureTokenInfo(client, token0Address, chainId)
    const token1 = await ensureTokenInfo(client, token1Address, chainId)
    if (!token0 || !token1) {
      return null
    }

    const [reserve0, reserve1] = reservesResult.result as [bigint, bigint, number]

    return {
      id: `${token0.address}-${token1.address}`.toLowerCase(),
      token0,
      token1,
      reserve0,
      reserve1,
      feeBps: 30,
      type: 'V2'
    }
  } catch (error) {
    console.error('Failed to fetch pair data', { pairAddress, error })
    return null
  }
}

export async function fetchUbeswapPools(options: FetchUbeswapPoolsOptions = {}): Promise<Pool[]> {
  const chain = getViemChainFromEnv()
  const defaultRpc = 'https://forno.celo-sepolia.celo-testnet.org'
  const rpcUrl = options.rpcUrl || process.env.RPC_URL_CELO || process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || defaultRpc
  const factoryAddress = options.factoryAddress || (process.env.NEXT_PUBLIC_AMM_FACTORY as Address)

  if (!factoryAddress) {
    throw new Error('NEXT_PUBLIC_AMM_FACTORY not configured')
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl)
  }) as RoutingClient

  const pairLength = await client.readContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: 'allPairsLength',
    args: []
  }) as bigint

  const totalPairs = Number(pairLength)
  const limit = options.maxPairs ? Math.min(totalPairs, options.maxPairs) : totalPairs
  const indices = Array.from({ length: limit }, (_, idx) => BigInt(idx))

  const pairAddressesResults = await client.multicall({
    contracts: indices.map((i) => ({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: 'allPairs',
      args: [i]
    })),
    allowFailure: true
  })

  const poolPromises = pairAddressesResults
    .map((res) => res?.result as Address | undefined)
    .filter((addr): addr is Address => !!addr && addr !== ZERO_ADDRESS)
    .map((addr) => fetchPairAsPool(client, addr, chain.id))

  const pools = (await Promise.all(poolPromises))
    .filter((pool): pool is Pool => !!pool && pool.reserve0 > BigInt(0) && pool.reserve1 > BigInt(0))

  return pools
}
