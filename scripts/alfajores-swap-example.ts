import { parseUnits, formatUnits } from 'viem'
import { refreshRuntimePools, setRuntimePools } from '@/lib/routing/pools'
import { DEXAggregator } from '@/lib/routing/aggregator'
import { resolveTokenBySymbol } from '@/lib/tokens'

async function main() {
  // Provide sane defaults if env vars are not set
  if (!process.env.NEXT_PUBLIC_AMM_FACTORY) {
    process.env.NEXT_PUBLIC_AMM_FACTORY = '0x62d5b84bE28a183aBB507E125B384122D2C25fAE'
  }
  if (!process.env.NEXT_PUBLIC_AMM_ROUTER) {
    process.env.NEXT_PUBLIC_AMM_ROUTER = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121'
  }
  if (!process.env.CHAIN_ID && !process.env.NEXT_PUBLIC_CHAIN_ID) {
    process.env.NEXT_PUBLIC_CHAIN_ID = '44787'
  }

  const amountIn = '10'
  const tokenInSymbol = 'cUSD'
  const tokenOutSymbol = 'cEUR'

  console.log('Fetching live Ubeswap pools from Alfajores...')
  const pools = await refreshRuntimePools({ maxPairs: 200 })
  console.log(`Loaded ${pools.length} pools`)

  const tokenIn = resolveTokenBySymbol(tokenInSymbol)
  const tokenOut = resolveTokenBySymbol(tokenOutSymbol)
  if (!tokenIn || !tokenOut) {
    throw new Error('Unsupported token symbol')
  }

  const aggregator = new DEXAggregator(pools)
  const quoteAmount = parseUnits(amountIn, tokenIn.decimals)

  const bestRoute = aggregator.findBestRoute(tokenIn.address as string, tokenOut.address as string, quoteAmount, 3)
  if (!bestRoute) {
    console.log('No route found')
    return
  }

  const outputHuman = formatUnits(bestRoute.output, tokenOut.decimals)
  console.log('Best route output:', outputHuman)
  console.log('Pools in route:')
  let current = tokenIn.address as string
  bestRoute.path.forEach((edge, idx) => {
    const inputSymbol = edge.pool.token0.address === current ? edge.pool.token0.symbol : edge.pool.token1.symbol
    const outputSymbol = edge.pool.token0.address === current ? edge.pool.token1.symbol : edge.pool.token0.symbol
    console.log(`${idx + 1}. ${inputSymbol} -> ${outputSymbol} via ${edge.pool.id}`)
    current = edge.to
  })

  // Reset runtime pools so other modules can defer to defaults if needed
  setRuntimePools(null)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
