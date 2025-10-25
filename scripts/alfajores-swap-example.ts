import { parseUnits, formatUnits } from 'viem'
import { refreshRuntimePools, setRuntimePools } from '@/lib/routing/pools'
import { DEXAggregator } from '@/lib/routing/aggregator'
import { resolveTokenBySymbol } from '@/lib/tokens'

async function main() {
  // Celo Sepolia defaults (update these when you have DEX on Sepolia)
  if (!process.env.NEXT_PUBLIC_AMM_FACTORY) {
    process.env.NEXT_PUBLIC_AMM_FACTORY = '0x0000000000000000000000000000000000000000'
  }
  if (!process.env.NEXT_PUBLIC_AMM_ROUTER) {
    process.env.NEXT_PUBLIC_AMM_ROUTER = '0x0000000000000000000000000000000000000000'
  }
  if (!process.env.CHAIN_ID && !process.env.NEXT_PUBLIC_CHAIN_ID) {
    process.env.NEXT_PUBLIC_CHAIN_ID = '11142220'
  }
  if (!process.env.RPC_URL && !process.env.NEXT_PUBLIC_RPC_URL) {
    process.env.NEXT_PUBLIC_RPC_URL = 'https://forno.celo-sepolia.celo-testnet.org'
  }

  const amountIn = '10'
  const tokenInSymbol = 'cUSD'
  const tokenOutSymbol = 'cEUR'

  console.log('Fetching live pools from Celo Sepolia...')
  console.log('Note: Update NEXT_PUBLIC_AMM_FACTORY/ROUTER if you have a DEX deployed on Sepolia')
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
