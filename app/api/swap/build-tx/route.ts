import { NextRequest, NextResponse } from 'next/server'
import { encodeFunctionData, type Address, createPublicClient, http } from 'viem'
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

// Ubeswap Router ABI
const UBESWAP_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  }
] as const

// Router address for Celo Sepolia
const UBESWAP_ROUTER = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121'
const WCELO_ADDRESS = '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9' // Wrapped CELO

// Token address mappings for Celo Sepolia
const TOKEN_ADDRESSES: Record<string, string> = {
  'CELO': 'CELO',
  'cUSD': '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  'cEUR': '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  'cREAL': '0xE4D517785D091D3c54818832dB6094bcc2744545',
  'USDC': '0x98Cc94F9271e36EB1c30d77c39dCb9929D9310C4',
  'USDT': '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
}

export async function POST(req: NextRequest) {
  try {
    const { fromToken, toToken, amount, slippage, userAddress } = await req.json()

    if (!fromToken || !toToken || !amount || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('⚠️  WARNING: Celo Sepolia may not have Ubeswap deployed or liquidity available')
    console.log('📝 Swap Request:', { fromToken, toToken, amount, userAddress })

    // Determine if CELO is involved (check for both 'CELO' string and 'CELO' symbol)
    const isCELOInput = fromToken === 'CELO' || fromToken.toLowerCase() === 'celo' || fromToken.toUpperCase() === 'CELO'
    const isCELOOutput = toToken === 'CELO' || toToken.toLowerCase() === 'celo' || toToken.toUpperCase() === 'CELO'

    // Resolve token addresses - convert CELO to WCELO for path
    const fromTokenAddress = isCELOInput ? WCELO_ADDRESS : (TOKEN_ADDRESSES[fromToken] || fromToken)
    const toTokenAddress = isCELOOutput ? WCELO_ADDRESS : (TOKEN_ADDRESSES[toToken] || toToken)

    const slippagePercent = parseFloat(slippage || '0.5')
    const amountBigInt = BigInt(amount)
    
    // Calculate minimum amount out with slippage
    // For simplicity, using a 1:1 ratio - in production, get this from a price oracle
    const estimatedOut = amountBigInt // Replace with actual quote
    const minAmountOut = estimatedOut * BigInt(Math.floor((100 - slippagePercent) * 100)) / BigInt(10000)

    // Deadline: 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20

    let txData: `0x${string}`
    let value = '0'
    let path: Address[]

    if (isCELOInput) {
      // CELO -> Token (swapExactETHForTokens)
      path = [WCELO_ADDRESS as Address, toTokenAddress as Address]
      txData = encodeFunctionData({
        abi: UBESWAP_ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [minAmountOut, path, userAddress as Address, BigInt(deadline)]
      })
      value = amount
    } else if (isCELOOutput) {
      // Token -> CELO (swapExactTokensForETH)
      path = [fromTokenAddress as Address, WCELO_ADDRESS as Address]
      txData = encodeFunctionData({
        abi: UBESWAP_ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [amountBigInt, minAmountOut, path, userAddress as Address, BigInt(deadline)]
      })
    } else {
      // Token -> Token (swapExactTokensForTokens)
      path = [fromTokenAddress as Address, toTokenAddress as Address]
      txData = encodeFunctionData({
        abi: UBESWAP_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountBigInt, minAmountOut, path, userAddress as Address, BigInt(deadline)]
      })
    }

    // Estimate gas (rough estimate)
    const gasEstimate = '300000'

    const tx = {
      to: UBESWAP_ROUTER,
      data: txData,
      value: value,
      gas: gasEstimate,
      from: userAddress
    }

    return NextResponse.json({
      success: true,
      tx,
      path,
      minAmountOut: minAmountOut.toString()
    })

  } catch (error) {
    console.error('Error building swap transaction:', error)
    return NextResponse.json(
      { 
        error: 'Failed to build swap transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
