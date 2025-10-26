import { NextRequest, NextResponse } from 'next/server'
import { parseUnits, formatUnits, createPublicClient, http } from 'viem'
import { resolveTokenBySymbol } from '../../../../lib/tokens'
import { discoverRoutes, quoteRoute } from '../../../../lib/routing/paths'
import { ensureRuntimePools } from '@/lib/routing/pools'
import RouterAbi from '@/lib/abi/Router.json'
import { getViemChainFromEnv } from '@/lib/chain'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const ROUTE_CHAIN_ID = Number(process.env.ROUTING_CHAIN_ID || process.env.CHAIN_ID || 11142220)
const routeChain = getViemChainFromEnv()
const defaultRpc = routeChain.id === 42220
  ? 'https://forno.celo.org'
  : routeChain.id === 44787
    ? 'https://alfajores-forno.celo-testnet.org'
    : 'https://forno.celo-sepolia.celo-testnet.org'

const DEFAULT_MAX_HOPS = Number(process.env.ROUTING_MAX_HOPS || 3)
const DEFAULT_MAX_ROUTES = Number(process.env.ROUTING_MAX_ROUTES || 3)

interface SerializedRoute {
  routeId: string
  tokens: { symbol: string; address: string; decimals: number }[]
  pools: {
    id: string
    address: string
    dex: string
    feeBps: number
    token0: { symbol: string; address: string }
    token1: { symbol: string; address: string }
  }[]
  amountOut: string
  amountOutFormatted: string
  minOut: string
  minOutFormatted: string
  priceImpactBps: number | null
  priceImpactPercent: number | null
  estimatedGas: number
  kind: 'DIRECT' | 'MULTI_HOP'
}

async function computeRoutes(params: {
  tokenInSymbol: string
  tokenOutSymbol: string
  amount: string
  slippageBps: number
  maxRoutes: number
  maxHops?: number
}): Promise<{ routes: SerializedRoute[]; bestRoute: SerializedRoute | null }> {
  const { tokenInSymbol, tokenOutSymbol, amount, slippageBps, maxRoutes, maxHops = DEFAULT_MAX_HOPS } = params

  const tokenIn = resolveTokenBySymbol(tokenInSymbol, ROUTE_CHAIN_ID)
  const tokenOut = resolveTokenBySymbol(tokenOutSymbol, ROUTE_CHAIN_ID)

  if (!tokenIn || !tokenOut) {
    throw new Error('Unsupported token symbols')
  }

  await ensureRuntimePools()

  const amountInUnits = parseUnits(amount, tokenIn.decimals)
  const allRoutes = await discoverRoutes(tokenIn, tokenOut, maxHops)
  const quotedRoutes: SerializedRoute[] = []

  const rpcUrl = process.env.RPC_URL_CELO || process.env.RPC_URL || defaultRpc
  const routerAddressRaw = (process.env.CUSTOM_SWAP_ROUTER || process.env.NEXT_PUBLIC_AMM_ROUTER || '').trim()
  const routerAddress = routerAddressRaw && routerAddressRaw !== ZERO_ADDRESS ? routerAddressRaw : ''
  const publicClient = routerAddress
    ? createPublicClient({ chain: routeChain, transport: http(rpcUrl) })
    : null

  for (const route of allRoutes) {
    let amountOut: bigint | null = null
    let priceImpactBps: number | null = null

    if (route.pools.length === 1 && routerAddress && publicClient) {
      const tokens = route.tokens.map(t => t.address as `0x${string}`)
      const hasNative = route.tokens.some(t => t.address === 'CELO')
      if (!hasNative) {
        try {
          const amounts = await publicClient.readContract({
            address: routerAddress as `0x${string}`,
            abi: RouterAbi as any,
            functionName: 'getAmountsOut',
            args: [amountInUnits, tokens]
          }) as bigint[]
          amountOut = amounts[amounts.length - 1]
        } catch (error) {
          console.warn('[routing] router getAmountsOut fallback triggered', error)
        }
      }
    }

    if (!amountOut) {
      const quote = await quoteRoute(route, amountInUnits)
      if (!quote) continue
      amountOut = quote.amountOut
      priceImpactBps = quote.cumulativePriceImpactBps
    }

    const minOut = (amountOut * BigInt(10000 - slippageBps)) / BigInt(10000)
    const estimatedGas = 100000 + (route.pools.length * 150000)
    const poolIds = route.pools.map((p) => p.id)
    const routeId = Buffer.from(JSON.stringify(poolIds)).toString('base64')

    quotedRoutes.push({
      routeId,
      tokens: route.tokens.map((t) => ({ symbol: t.symbol, address: t.address, decimals: t.decimals })),
      pools: route.pools.map((p) => ({
        id: p.id,
        address: (p.address || p.id).toLowerCase(),
        dex: p.dex || 'ubeswap',
        feeBps: p.feeBps,
        token0: { symbol: p.token0.symbol, address: p.token0.address },
        token1: { symbol: p.token1.symbol, address: p.token1.address }
      })),
      amountOut: amountOut.toString(),
      amountOutFormatted: formatUnits(amountOut, tokenOut.decimals),
      minOut: minOut.toString(),
      minOutFormatted: formatUnits(minOut, tokenOut.decimals),
      priceImpactBps,
      priceImpactPercent: priceImpactBps != null ? priceImpactBps / 100 : null,
      estimatedGas,
      kind: route.pools.length === 1 ? 'DIRECT' : 'MULTI_HOP'
    })
  }

  quotedRoutes.sort((a, b) => {
    const aOut = BigInt(a.amountOut)
    const bOut = BigInt(b.amountOut)
    if (aOut !== bOut) return bOut > aOut ? 1 : -1
    if (a.pools.length !== b.pools.length) return a.pools.length - b.pools.length
    const aImpact = a.priceImpactBps || 0
    const bImpact = b.priceImpactBps || 0
    return aImpact - bImpact
  })

  const bestRoutes = quotedRoutes.slice(0, Math.max(1, maxRoutes))
  return {
    routes: bestRoutes,
    bestRoute: bestRoutes[0] || null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
  const tokenInSymbol = searchParams.get('tokenIn')
  const tokenOutSymbol = searchParams.get('tokenOut')
  const amount = searchParams.get('amount')
  const slippageBps = parseInt(searchParams.get('slippage') || '100')
  const maxRoutes = parseInt(searchParams.get('maxRoutes') || String(DEFAULT_MAX_ROUTES))

    if (!tokenInSymbol || !tokenOutSymbol || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: tokenIn, tokenOut, amount' },
        { status: 400 }
      )
    }

    const { routes, bestRoute } = await computeRoutes({
      tokenInSymbol,
      tokenOutSymbol,
      amount,
      slippageBps,
      maxRoutes
    })

    return NextResponse.json({
      tokenIn: tokenInSymbol,
      tokenOut: tokenOutSymbol,
      amountIn: amount,
      slippageBps,
      routes,
      bestRoute,
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Quote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenIn, tokenOut, amount, slippage = 100, maxRoutes = DEFAULT_MAX_ROUTES, maxHops = DEFAULT_MAX_HOPS } = body

    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenIn, tokenOut, amount' },
        { status: 400 }
      )
    }

    const { routes, bestRoute } = await computeRoutes({
      tokenInSymbol: tokenIn,
      tokenOutSymbol: tokenOut,
      amount,
      slippageBps: slippage,
      maxRoutes,
      maxHops
    })

    return NextResponse.json({
      tokenIn,
      tokenOut,
      amountIn: amount,
      slippageBps: slippage,
      routes,
      bestRoute,
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Quote API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}