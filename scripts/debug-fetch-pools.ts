import { fetchUbeswapPools } from '../lib/routing/fetchers/ubeswap'

async function main() {
  const pools = await fetchUbeswapPools({ maxPairs: 10 })
  console.log('poolCount', pools.length)
  console.log(
    pools.slice(0, 5).map((pool) => ({
      id: pool.id,
      dex: pool.dex,
      token0: pool.token0.symbol,
      token1: pool.token1.symbol,
      reserve0: pool.reserve0.toString(),
      reserve1: pool.reserve1.toString()
    }))
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
