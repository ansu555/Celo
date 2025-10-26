import { parseUnits, formatUnits } from 'viem'
import { ensureRuntimePools } from '../lib/routing/pools'
import { resolveTokenBySymbol } from '../lib/tokens'
import { discoverRoutes, quoteRoute } from '../lib/routing/paths'
import { getViemChainFromEnv } from '../lib/chain'

async function main() {
  const chain = getViemChainFromEnv()
  await ensureRuntimePools({ maxPairs: 10 })

  const [, , tokenInArg, tokenOutArg, amountArg] = process.argv
  const tokenInSymbol = tokenInArg || 'cUSD'
  const tokenOutSymbol = tokenOutArg || 'WETH'
  const amountHuman = amountArg || '1'

  const tokenIn = resolveTokenBySymbol(tokenInSymbol, chain.id)
  const tokenOut = resolveTokenBySymbol(tokenOutSymbol, chain.id)
  if (!tokenIn || !tokenOut) {
    throw new Error(`Token registry missing required symbols: ${tokenInSymbol} or ${tokenOutSymbol}`)
  }

  const amountIn = parseUnits(amountHuman, tokenIn.decimals)
  const routes = discoverRoutes(tokenIn, tokenOut, 3)
  console.log('routesFound', routes.length)

  routes.forEach((route, idx) => {
    const quote = quoteRoute(route, amountIn)
    if (!quote) return
    console.log(`route #${idx + 1}`, {
      kind: route.pools.length === 1 ? 'DIRECT' : 'MULTI_HOP',
      path: route.tokens.map((t) => t.symbol).join(' -> '),
      pools: route.pools.map((p) => p.id),
      amountOut: formatUnits(quote.amountOut, tokenOut.decimals),
      priceImpactBps: quote.cumulativePriceImpactBps
    })
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
