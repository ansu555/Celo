import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, type Address } from 'viem'
import { defineChain } from 'viem'

// Celo Sepolia chain definition
const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://explorer.celo.org/sepolia' },
  },
  testnet: true,
})

// Ubeswap Router ABI for getAmountsOut
const UBESWAP_ROUTER_ABI = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  }
] as const

// Router addresses - Same on mainnet and Alfajores, check Sepolia availability  
const UBESWAP_ROUTER = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121'
// WCELO on different networks - Sepolia might have different address
const WCELO_ADDRESS = '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9' // Mainnet/Alfajores
// Alternative WCELO for Sepolia (if different): Check Ubeswap interface for actual address

// Disable mock quotes - try real router first
const USE_MOCK_QUOTES = false

// Token address mappings
const TOKEN_ADDRESSES: Record<string, string> = {
  'CELO': 'CELO',
  'cUSD': '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  'cEUR': '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  'cREAL': '0xE4D517785D091D3c54818832dB6094bcc2744545',
  'USDC': '0x98Cc94F9271e36EB1c30d77c39dCb9929D9310C4',
  'USDT': '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
}

// Mock exchange rates for Celo Sepolia (approximate rates)
const MOCK_RATES: Record<string, number> = {
  'CELO_cUSD': 0.45,  // 1 CELO ≈ 0.45 cUSD
  'CELO_cEUR': 0.42,  // 1 CELO ≈ 0.42 cEUR
  'CELO_USDC': 0.45,  // 1 CELO ≈ 0.45 USDC
  'CELO_USDT': 0.45,  // 1 CELO ≈ 0.45 USDT
  'cUSD_CELO': 2.22,  // 1 cUSD ≈ 2.22 CELO
  'cUSD_cEUR': 0.93,  // 1 cUSD ≈ 0.93 cEUR
  'cEUR_cUSD': 1.07,  // 1 cEUR ≈ 1.07 cUSD
}

function getMockQuote(fromSymbol: string, toSymbol: string, amountIn: bigint, fromDecimals: number, toDecimals: number): bigint {
  const key = `${fromSymbol}_${toSymbol}`
  const rate = MOCK_RATES[key]
  
  if (rate) {
    // Convert amount to float, apply rate, convert back to bigint with correct decimals
    const amountInFloat = Number(amountIn) / Math.pow(10, fromDecimals)
    const amountOutFloat = amountInFloat * rate
    const amountOut = BigInt(Math.floor(amountOutFloat * Math.pow(10, toDecimals)))
    return amountOut
  }
  
  // Default 1:1 ratio if no rate found
  return amountIn * BigInt(Math.pow(10, toDecimals)) / BigInt(Math.pow(10, fromDecimals))
}

function getTokenSymbol(address: string): string {
  if (address === WCELO_ADDRESS || address.toLowerCase() === 'celo') return 'CELO'
  for (const [symbol, addr] of Object.entries(TOKEN_ADDRESSES)) {
    if (addr.toLowerCase() === address.toLowerCase()) return symbol
  }
  return 'UNKNOWN'
}

export async function POST(req: NextRequest) {
  try {
    const { fromAssetId, toAssetId, amount, slippage } = await req.json()

    if (!fromAssetId || !toAssetId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Normalize asset IDs (handle case-insensitive CELO)
    const normalizeAssetId = (id: string) => {
      if (id.toLowerCase() === 'celo') return 'CELO'
      return id.toUpperCase() // Try uppercase first for symbol lookup
    }

    const normalizedFrom = normalizeAssetId(fromAssetId)
    const normalizedTo = normalizeAssetId(toAssetId)

    // Resolve token addresses - try symbol lookup first, then use as address
    let fromTokenAddress = TOKEN_ADDRESSES[normalizedFrom] || fromAssetId
    let toTokenAddress = TOKEN_ADDRESSES[normalizedTo] || toAssetId

    if (!fromTokenAddress || !toTokenAddress) {
      return NextResponse.json(
        { error: 'Invalid token addresses' },
        { status: 400 }
      )
    }

    // Check if CELO is involved
    const isCELOInput = fromTokenAddress === 'CELO' || fromAssetId.toLowerCase() === 'celo'
    const isCELOOutput = toTokenAddress === 'CELO' || toAssetId.toLowerCase() === 'celo'

    // For router calls, CELO must be represented as WCELO
    if (isCELOInput) {
      fromTokenAddress = WCELO_ADDRESS
    }
    if (isCELOOutput) {
      toTokenAddress = WCELO_ADDRESS
    }

    console.log('🔍 Quote Request:', {
      fromAssetId,
      toAssetId,
      fromTokenAddress,
      toTokenAddress,
      isCELOInput,
      isCELOOutput,
      amount
    })

    // Create viem client for Celo Sepolia
    const client = createPublicClient({
      chain: celoSepolia,
      transport: http('https://forno.celo-sepolia.celo-testnet.org')
    })

    const amountBigInt = BigInt(Math.floor(amount))

    // Build swap path - all addresses are already resolved to actual contract addresses
    let path: Address[]
    
    // For direct swaps, just use the resolved addresses
    path = [fromTokenAddress as Address, toTokenAddress as Address]

    // If mock quotes are enabled (for Celo Sepolia without DEX), use mock rates
    if (USE_MOCK_QUOTES) {
      console.log('📊 Using mock quote (Ubeswap not available on Celo Sepolia)')
      
      const fromSymbol = getTokenSymbol(fromTokenAddress)
      const toSymbol = getTokenSymbol(toTokenAddress)
      
      // Get decimals - assume 18 for CELO/cUSD/cEUR, 6 for USDC/USDT
      const fromDecimals = fromSymbol.includes('USDC') || fromSymbol.includes('USDT') ? 6 : 18
      const toDecimals = toSymbol.includes('USDC') || toSymbol.includes('USDT') ? 6 : 18
      
      const outputAmount = getMockQuote(fromSymbol, toSymbol, amountBigInt, fromDecimals, toDecimals)
      const slippagePercent = parseFloat(slippage?.toString() || '0.5')
      const minOutputAmount = outputAmount * BigInt(Math.floor((100 - slippagePercent) * 100)) / BigInt(10000)
      
      return NextResponse.json({
        success: true,
        route: {
          path,
          dex: 'Mock Quote (Sepolia)',
          router: UBESWAP_ROUTER
        },
        outputAmount: outputAmount.toString(),
        minOutputAmount: minOutputAmount.toString(),
        priceImpact: '0.1',
        slippage: slippagePercent,
        isMock: true
      })
    }

    try {
      // First check if the router contract exists on this network
      console.log('🔍 Checking if Ubeswap router exists on Celo Sepolia...')
      const code = await client.getBytecode({
        address: UBESWAP_ROUTER as Address
      })
      
      if (!code || code === '0x') {
        console.log('❌ Ubeswap router NOT deployed on Celo Sepolia!')
        throw new Error('Ubeswap router contract does not exist on Celo Sepolia')
      }
      
      console.log('✅ Router contract found, querying for quote...')
      console.log('Path:', path)
      
      // Get quote from Ubeswap router
      const amounts = await client.readContract({
        address: UBESWAP_ROUTER as Address,
        abi: UBESWAP_ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountBigInt, path]
      })

      if (!amounts || amounts.length === 0) {
        throw new Error('No amounts returned from router')
      }

      const outputAmount = amounts[amounts.length - 1]
      const slippagePercent = parseFloat(slippage?.toString() || '0.5')
      const minOutputAmount = outputAmount * BigInt(Math.floor((100 - slippagePercent) * 100)) / BigInt(10000)

      // Calculate price impact (simplified)
      const priceImpact = '0.1' // In production, calculate actual price impact

      return NextResponse.json({
        success: true,
        route: {
          path,
          dex: 'Ubeswap',
          router: UBESWAP_ROUTER
        },
        outputAmount: outputAmount.toString(),
        minOutputAmount: minOutputAmount.toString(),
        priceImpact,
        slippage: slippagePercent
      })

    } catch (routerError) {
      console.error('Router call failed:', routerError)
      console.log('Path attempted:', path)
      
      // If direct path fails, try with WCELO as intermediary (for token-to-token swaps)
      if (!isCELOInput && !isCELOOutput) {
        console.log('🔄 Trying intermediary path through WCELO...')
        try {
          path = [fromTokenAddress as Address, WCELO_ADDRESS as Address, toTokenAddress as Address]
          console.log('Intermediary path:', path)
          
          const amounts = await client.readContract({
            address: UBESWAP_ROUTER as Address,
            abi: UBESWAP_ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [amountBigInt, path]
          })

          const outputAmount = amounts[amounts.length - 1]
          const slippagePercent = parseFloat(slippage?.toString() || '0.5')
          const minOutputAmount = outputAmount * BigInt(Math.floor((100 - slippagePercent) * 100)) / BigInt(10000)

          return NextResponse.json({
            success: true,
            route: {
              path,
              dex: 'Ubeswap',
              router: UBESWAP_ROUTER
            },
            outputAmount: outputAmount.toString(),
            minOutputAmount: minOutputAmount.toString(),
            priceImpact: '0.2',
            slippage: slippagePercent
          })

        } catch (intermediaryError) {
          console.error('Quote error with intermediary:', intermediaryError)
          
          // No liquidity found - use mock quote as last resort
          console.log('⚠️  No liquidity pool found on Ubeswap for this pair')
          console.log('📊 Falling back to estimated quote...')
          
          const fromSymbol = getTokenSymbol(fromTokenAddress)
          const toSymbol = getTokenSymbol(toTokenAddress)
          const fromDecimals = fromSymbol.includes('USDC') || fromSymbol.includes('USDT') ? 6 : 18
          const toDecimals = toSymbol.includes('USDC') || toSymbol.includes('USDT') ? 6 : 18
          
          const outputAmount = getMockQuote(fromSymbol, toSymbol, amountBigInt, fromDecimals, toDecimals)
          const slippagePercent = parseFloat(slippage?.toString() || '0.5')
          const minOutputAmount = outputAmount * BigInt(Math.floor((100 - slippagePercent) * 100)) / BigInt(10000)
          
          return NextResponse.json({
            success: true,
            route: {
              path,
              dex: 'Estimated (No Pool)',
              router: UBESWAP_ROUTER
            },
            outputAmount: outputAmount.toString(),
            minOutputAmount: minOutputAmount.toString(),
            priceImpact: '0.5',
            slippage: slippagePercent,
            isMock: true,
            warning: 'No liquidity pool found. Using estimated rates. Swap may fail.'
          })
        }
      }

      // If not a token-to-token swap, or intermediary also failed, throw the original error
      throw routerError
    }

  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get quote',
        details: error instanceof Error ? error.message : 'Unknown error',
        route: null,
        outputAmount: '0'
      },
      { status: 200 } // Return 200 so frontend can handle gracefully
    )
  }
}
