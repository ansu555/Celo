import type { Address } from 'viem'

export interface PoolAsset {
  id: string
  symbol: string
  name: string
  decimals: number
  address: Address | 'CELO'
  unitName?: string
}

export interface PoolInfo {
  poolAddress: Address
  poolId?: string
  dexName?: string
  asset1: PoolAsset
  asset2: PoolAsset
  reserve1: bigint
  reserve2: bigint
  totalLiquidity: bigint
  fee?: number
  timestamp?: number
  lastUpdated?: number
}

export interface RouteInfo {
  path: string[]
  pools: string[]
  inputAmount: bigint
  outputAmount: bigint
  priceImpact: number
}
