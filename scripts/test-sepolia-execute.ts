import { createPublicClient, http } from 'viem'
import { getViemChainFromEnv } from '../lib/chain'
import { listPools, ensureRuntimePools } from '../lib/routing/pools'
import { simulateCustomSwap } from '../lib/customSwap'

async function main() {
  const [, , tokenInSymbol = 'cUSD', tokenOutSymbol = 'WETH', amountHuman = '1'] = process.argv

  const chain = getViemChainFromEnv()
  const rpcUrl = process.env.RPC_URL_CELO || process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) })

  await ensureRuntimePools({ maxPairs: 10 })
  const pools = listPools()
  const directPool = pools.find((p) =>
    (p.token0.symbol === tokenInSymbol && p.token1.symbol === tokenOutSymbol) ||
    (p.token0.symbol === tokenOutSymbol && p.token1.symbol === tokenInSymbol)
  )

  if (!directPool) {
    console.log(`No direct pool found for ${tokenInSymbol}/${tokenOutSymbol}`)
    return
  }

  const routeId = Buffer.from(JSON.stringify([directPool.id])).toString('base64')

  const result = await simulateCustomSwap(
    { chainId: chain.id, publicClient, accountAddress: '0x0000000000000000000000000000000000000001' },
    {
      tokenInSymbol,
      tokenOutSymbol,
      amount: amountHuman,
      slippageBps: 50,
      routeId
    }
  )

  console.log('simulateCustomSwap result', result)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
