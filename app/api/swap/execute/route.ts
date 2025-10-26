import { NextRequest, NextResponse } from 'next/server'
import { Address, createPublicClient, http } from 'viem'
import RouterAbi from '@/lib/abi/Router.json'
import { prepareSwapTransaction, type CustomSwapParams } from '../../../../lib/customSwap'
import { getViemChainFromEnv } from '@/lib/chain'
import { prepareDemoSwap, isDemoSwapEnabled, simulateDemoSwap } from '@/lib/demo-swap'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tokenIn, 
      tokenOut, 
      amount, 
      slippage = 100,
      routeId,
      wait = false,
      recipient,
      deadline,
      deadlineSecondsFromNow,
      privateTx = false,
      maxFeePerGasGwei,
      maxPriorityFeePerGasGwei,
      userAddress
    } = body

    // Validate required fields
    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenIn, tokenOut, amount' },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    const recipientAddress = (recipient || userAddress) as string | undefined
    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      return NextResponse.json(
        { error: 'Valid recipient wallet address is required' },
        { status: 400 }
      )
    }

    const chain = getViemChainFromEnv()
    const chainId = chain.id
    const rpcUrl = process.env.RPC_URL_CELO || process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
    
    const publicClient = createPublicClient({ 
      chain, 
      transport: http(rpcUrl) 
    })

    // Check if demo swap mode is enabled
    const useDemoMode = isDemoSwapEnabled()

    if (useDemoMode) {
      // Demo mode: simplified swap using direct transfer simulation
      const simulation = await simulateDemoSwap({
        tokenInSymbol: tokenIn,
        tokenOutSymbol: tokenOut,
        amount: amount.toString(),
        slippageBps: slippage,
        recipient: recipientAddress as Address
      })

      const demoPrep = await prepareDemoSwap(
        publicClient,
        recipientAddress as Address,
        {
          tokenInSymbol: tokenIn,
          tokenOutSymbol: tokenOut,
          amount: amount.toString(),
          slippageBps: slippage,
          recipient: recipientAddress as Address
        }
      )

      return NextResponse.json({
        success: true,
        mode: 'DEMO',
        tx: {
          type: 'DEMO_TRANSFER',
          tokenInAddress: demoPrep.tokenInAddress,
          tokenOutAddress: demoPrep.tokenOutAddress,
          amountIn: demoPrep.amountInUnits.toString(),
          minAmountOut: demoPrep.minOutUnits.toString(),
          recipient: recipientAddress
        },
        details: {
          expectedOut: simulation.expectedOut,
          minOut: simulation.minOut,
          priceImpactBps: simulation.priceImpactBps,
          route: {
            hops: [demoPrep.tokenInAddress, demoPrep.tokenOutAddress],
            kind: 'DEMO_DIRECT',
            pools: []
          },
          slippageBps: slippage,
          deadline: Math.floor(Date.now() / 1000) + 300
        },
        message: '🎭 Demo Mode: This swap will create a real transaction using simplified pricing',
        timestamp: Date.now()
      })
    }

    // Build swap parameters
    const swapParams: CustomSwapParams = {
      tokenInSymbol: tokenIn,
      tokenOutSymbol: tokenOut,
      amount: amount.toString(),
      slippageBps: slippage,
      wait,
      recipient: recipientAddress as Address,
      routeId,
      deadline,
      deadlineSecondsFromNow,
      privateTx,
      maxFeePerGasGwei,
      maxPriorityFeePerGasGwei
    }

    const prepared = await prepareSwapTransaction(
      {
        chainId,
        publicClient,
        accountAddress: recipientAddress as Address
      },
      swapParams
    )

    const simulationPreview = await publicClient.simulateContract({
      account: recipientAddress as Address,
      address: prepared.routerAddress,
      abi: RouterAbi as any,
      functionName: 'swapExactTokensForTokens',
      args: [
        prepared.amountInUnits,
        prepared.minOutUnits,
        prepared.path,
        recipientAddress as Address,
        prepared.deadline
      ]
    })

    const previewRequest = simulationPreview.request as any

    return NextResponse.json({
      success: true,
      tx: {
        address: prepared.routerAddress,
        functionName: 'swapExactTokensForTokens',
        args: {
          amountIn: prepared.amountInUnits.toString(),
          minAmountOut: prepared.minOutUnits.toString(),
          path: prepared.path,
          recipient: recipientAddress,
          deadline: prepared.deadline.toString()
        }
      },
      preview: {
        to: previewRequest.to ?? prepared.routerAddress,
        data: previewRequest.data,
        value: previewRequest.value ? previewRequest.value.toString() : '0',
        gas: previewRequest.gas ? previewRequest.gas.toString() : null
      },
      details: {
        expectedOut: prepared.simulation.expectedOut,
        minOut: prepared.simulation.minOut,
        priceImpactBps: prepared.simulation.priceImpactBps,
        route: prepared.simulation.route,
        slippageBps: swapParams.slippageBps ?? 100,
        deadline: prepared.deadlineSec
      },
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Swap execution error:', error)
    
    // Return structured error based on error type
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Swap execution failed', 
          code: error.code,
          message: error.message,
          details: error.data
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}