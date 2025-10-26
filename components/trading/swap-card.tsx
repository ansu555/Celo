"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import type { Address } from 'viem'
import { erc20Abi, parseUnits, formatUnits } from 'viem'
import { Settings, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SettingsModal } from "./settings-modal"
import { LimitPanel } from "./limit-panel"
import { BuyPanel } from "./buy-panel"
import { SellPanel } from "./sellpanel"
import { AssetSelector } from "./asset-selector"
import { useTradeableAssets, AssetInfo } from "../../hooks/use-tradeable-assets"
import { useToast } from "@/hooks/use-toast"
import RouterAbi from '@/lib/abi/Router.json'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_SWAP_MODE === 'true'

type RouteQuote = {
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

type SwapExecutionDetails = {
  expectedOut: string
  minOut: string
  priceImpactBps: number | null
  route: {
    hops: string[]
    kind: string
    pools?: string[]
  }
  slippageBps: number
  deadline: number
}

type SwapExecutionResponse = {
  success: boolean
  tx: {
    address: string
    functionName: string
    args: {
      amountIn: string
      minAmountOut: string
      path: string[]
      recipient: string
      deadline: string
    }
  }
  preview: {
    to: string
    data?: `0x${string}`
    value: string
    gas: string | null
  }
  details: SwapExecutionDetails
  timestamp: number
}

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11142220)
const EXPLORER_MAP: Record<number, string> = {
  42220: 'https://celoscan.io',
  44787: 'https://alfajores.celoscan.io',
  11142220: 'https://celo-sepolia.celoscan.io'
}
const DEFAULT_EXPLORER = EXPLORER_MAP[11142220]
const ROUTER_ADDRESS = (process.env.NEXT_PUBLIC_AMM_ROUTER || '').toLowerCase()
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type SwapCardProps = {
  onPairChange?: (from: AssetInfo | null, to: AssetInfo | null) => void
}

export function SwapCard({ onPairChange }: SwapCardProps) {
  const { address: walletAddress, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { assets, loading: assetsLoading } = useTradeableAssets()
  const { toast } = useToast()
  
  const [fromToken, setFromToken] = useState<AssetInfo | null>(null)
  const [toToken, setToToken] = useState<AssetInfo | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'buy' | 'sell'>('swap')
  const [isSwapping, setIsSwapping] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [routeData, setRouteData] = useState<RouteQuote | null>(null)
  const [availableRoutes, setAvailableRoutes] = useState<RouteQuote[]>([])

  useEffect(() => {
    onPairChange?.(fromToken, toToken)
  }, [fromToken, toToken, onPairChange])

  // Set default assets once loaded
  useEffect(() => {
    if (assets.length > 0 && !fromToken) {
      // Default to CELO if available
      const celoAsset = assets.find((a: AssetInfo) => a.symbol === 'CELO')
      if (celoAsset) {
        setFromToken(celoAsset)
      }
      // Set default to token as cUSD
      const cusdAsset = assets.find((a: AssetInfo) => a.symbol === 'cUSD')
      if (cusdAsset) {
        setToToken(cusdAsset)
      }
    }
  }, [assets, fromToken])

  // Fetch quote when amount or assets change
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote()
    } else {
      setToAmount('')
      setRouteData(null)
    }
  }, [fromToken, toToken, fromAmount])

  // Fetch quote from routing API
  const fetchQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return

    setQuoteLoading(true)
    setRouteData(null)

    try {
      const slippagePercent = parseFloat(slippage)
      const slippageBps = Number.isFinite(slippagePercent) ? Math.max(0, Math.round(slippagePercent * 100)) : 50

      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: fromToken.symbol,
          tokenOut: toToken.symbol,
          amount: fromAmount,
          slippage: slippageBps,
          maxRoutes: 3
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quote')
      }

      const data = await response.json()

      if (data.bestRoute) {
        const bestRoute: RouteQuote = data.bestRoute
        const decimalOutput = parseFloat(bestRoute.amountOutFormatted)
        const precision = Math.min(toToken.decimals, 6)
        const displayAmount = Number.isFinite(decimalOutput)
          ? decimalOutput.toFixed(precision)
          : bestRoute.amountOutFormatted

        setToAmount(displayAmount)
        setRouteData(bestRoute)
        setAvailableRoutes(Array.isArray(data.routes) ? data.routes : [bestRoute])
      } else {
        setToAmount('0')
        setRouteData(null)
        setAvailableRoutes([])
        toast({
          title: "No Route Found",
          description: "Could not find a swap route for this pair",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Quote error:', error)
      setToAmount('0')
      setRouteData(null)
      setAvailableRoutes([])
      toast({
        title: "Quote Failed",
        description: error instanceof Error ? error.message : "Failed to get quote",
        variant: "destructive"
      })
    } finally {
      setQuoteLoading(false)
    }
  }

  // Execute the swap
  const executeSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !walletAddress) {
      toast({
        title: "Cannot Swap",
        description: "Please ensure all fields are filled and you're connected",
        variant: "destructive"
      })
      return
    }

    if (!routeData) {
      toast({
        title: "No Route Available",
        description: "Unable to find a swap route for this pair",
        variant: "destructive"
      })
      return
    }

    setIsSwapping(true)

    try {
      if (!walletAddress || !walletClient || !publicClient) {
        throw new Error('Wallet client not available. Please reconnect and try again.')
      }

      const accountAddress = walletClient.account?.address as Address | undefined
      if (!accountAddress) {
        throw new Error('Active account not detected. Please reconnect your wallet.')
      }

      if (walletClient.chain?.id && walletClient.chain.id !== CHAIN_ID) {
        throw new Error('Please switch your wallet to the configured Celo network to swap.')
      }

      if (!ROUTER_ADDRESS || ROUTER_ADDRESS === ZERO_ADDRESS) {
        throw new Error('Router address not configured. Set NEXT_PUBLIC_AMM_ROUTER in the environment.')
      }

      if (fromToken.address === 'CELO') {
        throw new Error('Native CELO swaps are not supported yet. Please wrap CELO to cCELO first.')
      }

      toast({
        title: "🔄 Preparing Swap...",
        description: "Building transaction for your wallet"
      })

      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: fromToken.symbol,
          tokenOut: toToken.symbol,
          amount: fromAmount,
          slippage: Math.max(0, Math.round(parseFloat(slippage) * 100)),
          routeId: routeData?.routeId,
          recipient: walletAddress,
          userAddress: walletAddress
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to prepare swap')
      }

      const payload: SwapExecutionResponse = await response.json()
      if (!payload.success) {
        throw new Error('Swap preparation failed')
      }

      // Handle demo mode swaps (simple transfer)
      if ((payload as any).mode === 'DEMO') {
        const demoTx = (payload as any).tx
        const tokenInAddress = demoTx.tokenInAddress as Address
        const tokenOutAddress = demoTx.tokenOutAddress as Address
        const amountIn = BigInt(demoTx.amountIn)

        // Check and approve if needed
        const allowance: bigint = await publicClient.readContract({
          address: tokenInAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [accountAddress, accountAddress] // Self-allowance for demo
        })

        // For demo, we just do a mock transfer to show transaction flow
        // In reality, you'd have a demo contract that handles the swap
        toast({
          title: "🎭 Demo Swap",
          description: "Creating demo transaction..."
        })

        // Create a simple transfer as demo (this proves wallet connectivity works)
        const demoHash = await walletClient.writeContract({
          account: accountAddress,
          address: tokenInAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [accountAddress, BigInt(1)] // Transfer 1 wei to self as demo
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash: demoHash })
        if (receipt.status !== 'success') {
          throw new Error('Demo transaction reverted')
        }

        const expectedOutFormatted = payload.details.expectedOut
        const minOutFormatted = payload.details.minOut

        toast({
          title: "✅ Demo Swap Successful!",
          description: (
            <div className="mt-2 space-y-2 text-sm">
              <div className="font-semibold text-green-600 dark:text-green-400">
                Transaction Confirmed!
              </div>
              <div className="text-amber-600 dark:text-amber-400">
                🎭 Demo Mode - Real transaction with simulated swap
              </div>
              <div>Input: {fromAmount} {fromToken.unitName}</div>
              <div>Output: ~{expectedOutFormatted} {toToken.unitName}</div>
              <div className="text-xs text-muted-foreground">
                Min received (after slippage): {minOutFormatted} {toToken.unitName}
              </div>
              <a
                href={`${EXPLORER_MAP[CHAIN_ID] || DEFAULT_EXPLORER}/tx/${demoHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-xs block"
              >
                View on Celo Explorer →
              </a>
            </div>
          ),
          duration: 12000,
        })

        setFromAmount('')
        setToAmount(expectedOutFormatted)
        setRouteData(null)
        setIsSwapping(false)
        return
      }

      // Standard router-based swap
      const routerAddress = payload.tx.address as Address
      const amountInUnits = BigInt(payload.tx.args.amountIn)
      const minAmountOutUnits = BigInt(payload.tx.args.minAmountOut)
      const path = payload.tx.args.path.map((addr) => addr as Address)
      const recipientAddress = payload.tx.args.recipient as Address
      const deadline = BigInt(payload.tx.args.deadline)

      const tokenInAddress = fromToken.address as Address
      const allowance: bigint = await publicClient.readContract({
        address: tokenInAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [accountAddress, routerAddress]
      })

      if (allowance < amountInUnits) {
        const approveHash = await walletClient.writeContract({
          account: accountAddress,
          address: tokenInAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [routerAddress, amountInUnits]
        })

        toast({
          title: "✅ Approval Sent",
          description: "Waiting for approval confirmation..."
        })

        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      const swapHash = await walletClient.writeContract({
        account: accountAddress,
        address: routerAddress,
        abi: RouterAbi as any,
        functionName: payload.tx.functionName as 'swapExactTokensForTokens',
        args: [
          amountInUnits,
          minAmountOutUnits,
          path,
          recipientAddress,
          deadline
        ]
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash })
      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted')
      }

      const expectedOutFormatted = formatUnits(BigInt(payload.details.expectedOut), toToken.decimals)
      const minOutFormatted = formatUnits(BigInt(payload.details.minOut), toToken.decimals)

      toast({
        title: "✅ Swap Successful!",
        description: (
          <div className="mt-2 space-y-2 text-sm">
            <div className="font-semibold text-green-600 dark:text-green-400">
              Transaction Confirmed!
            </div>
            <div>Swapped: {fromAmount} {fromToken.unitName}</div>
            <div>Received: ~{expectedOutFormatted} {toToken.unitName}</div>
            <div className="text-xs text-muted-foreground">
              Min received (after slippage): {minOutFormatted} {toToken.unitName}
            </div>
            <a
              href={`${EXPLORER_MAP[CHAIN_ID] || DEFAULT_EXPLORER}/tx/${swapHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-xs block"
            >
              View on Celo Explorer →
            </a>
          </div>
        ),
        duration: 12000,
      })

      // Refresh state after successful swap
  setFromAmount('')
  setToAmount(expectedOutFormatted)
  setRouteData(null)

    } catch (error: unknown) {
      console.error('Swap error:', error)
      toast({
        title: "❌ Swap Failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setIsSwapping(false)
    }
  }

  // Swap token positions
  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  // Check if swap button should be disabled
  const isSwapDisabled = !fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken

  return (
    <>
      <Card className="w-full rounded-xl border border-border shadow-lg bg-card">
        <CardContent className="p-3 space-y-3.5">
          {/* Tab Buttons */}
          <div className="flex items-center p-1 bg-muted/30 rounded-md h-[42px] relative">
            {/* Background slider */}
            <div 
              className={cn(
                "absolute h-8 rounded-md bg-background shadow-sm transition-all duration-300 ease-in-out",
                activeTab === 'swap' && "w-[72px] left-1",
                activeTab === 'limit' && "w-[72px] left-[76px]",
                activeTab === 'buy' && "w-[72px] left-[148px]",
                activeTab === 'sell' && "w-[72px] left-[220px]"
              )}
            />
            
            {/* Tab Buttons */}
            <button
              onClick={() => setActiveTab('swap')}
              className={cn(
                "relative z-10 px-0 py-2 text-sm font-medium rounded-full transition-colors duration-200 min-w-[72px] justify-center",
                activeTab === 'swap' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab('limit')}
              className={cn(
                "relative z-10 px-0 py-2 text-sm font-medium rounded-full transition-colors duration-200 min-w-[72px] justify-center",
                activeTab === 'limit' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Limit
            </button>
            <button
              onClick={() => setActiveTab('buy')}
              className={cn(
                "relative z-10 px-0 py-2 text-sm font-medium rounded-full transition-colors duration-200 min-w-[72px] justify-center",
                activeTab === 'buy' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={cn(
                "relative z-10 px-0 py-2 text-sm font-medium rounded-full transition-colors duration-200 min-w-[72px] justify-center",
                activeTab === 'sell' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sell
            </button>

            {/* Settings Button moved inside tab bar */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-auto relative z-10"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {activeTab === 'swap' && (
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-col items-center -space-y-3">
              {/* Pay Token Input */}
              <div className="flex w-full gap-2 px-3 py-3 min-h-24 items-center justify-between group transition-all duration-300 bg-muted/50 rounded-lg border border-border focus-within:border-primary focus-within:bg-background h-[7.5rem]">
                <div className="space-y-2 flex flex-col grow text-muted-foreground">
                  <span className="text-sm font-medium">Pay</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="h-9 w-full bg-transparent px-0 py-0 border-0 focus-visible:outline-none focus-visible:ring-0 text-3xl placeholder:text-muted-foreground/50"
                  />
                  <span className="h-5 inline-flex items-center whitespace-nowrap text-sm">
                    ${fromAmount && fromToken ? (parseFloat(fromAmount) * 0.18).toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div className="w-[180px]">
                  <AssetSelector
                    assets={assets}
                    selected={fromToken}
                    onSelect={setFromToken}
                    label="Select token"
                    disabled={assetsLoading}
                  />
                </div>
              </div>

              {/* Swap Button */}
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 shrink-0 flex z-10 rounded-md active:scale-[0.99] transition-all duration-300"
                onClick={handleSwapTokens}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="h-5">
                  <path d="M14.502 16.884a.757.757 0 0 0 .776-.764V6.415l2.4 2.36a.7.7 0 0 0 .525.212q.315 0 .556-.22A.75.75 0 0 0 19 8.221a.74.74 0 0 0-.241-.544l-3.592-3.533a.9.9 0 0 0-.308-.202 1.05 1.05 0 0 0-.702 0 .84.84 0 0 0-.31.202l-3.619 3.558a.7.7 0 0 0-.228.527q.003.3.244.538.24.22.546.227a.73.73 0 0 0 .545-.229l2.39-2.35v9.715q0 .32.223.537a.76.76 0 0 0 .554.217m-9.012 0q.185 0 .353-.06a.84.84 0 0 0 .31-.2l3.619-3.559A.7.7 0 0 0 10 12.54.75.75 0 0 0 9.756 12a.82.82 0 0 0-.546-.227.73.73 0 0 0-.545.23l-2.39 2.349V4.638a.72.72 0 0 0-.223-.538.76.76 0 0 0-.554-.216.757.757 0 0 0-.776.763v9.705l-2.4-2.36a.7.7 0 0 0-.525-.211.8.8 0 0 0-.556.219.75.75 0 0 0-.241.546q0 .308.24.545l3.593 3.532q.146.143.308.202.163.06.349.059"></path>
                </svg>
              </Button>

              {/* Receive Token Input */}
              <div className="flex w-full gap-2 px-3 py-3 min-h-24 items-center justify-between group transition-all duration-300 bg-muted/50 rounded-lg border border-border focus-within:border-primary focus-within:bg-background h-[7.5rem]">
                <div className="space-y-2 flex flex-col grow text-muted-foreground">
                  <span className="text-sm font-medium">Receive</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={toAmount}
                    readOnly
                    className="h-9 w-full bg-transparent px-0 py-0 border-0 focus-visible:outline-none focus-visible:ring-0 text-3xl placeholder:text-muted-foreground/50 cursor-not-allowed"
                  />
                  <span className="h-5 inline-flex items-center whitespace-nowrap text-sm">
                    ${toAmount && toToken ? (parseFloat(toAmount) * 1.0).toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div className="w-[180px]">
                  <AssetSelector
                    assets={assets}
                    selected={toToken}
                    onSelect={setToToken}
                    label="Select token"
                    disabled={assetsLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'limit' && (
            <LimitPanel />
          )}
          {activeTab === 'buy' && (
            <BuyPanel />
          )}
          {activeTab === 'sell' && (
            <SellPanel />
          )}

          {activeTab === 'swap' && (
            <div className="flex flex-col items-center space-y-3.5">
              {/* Demo Mode Banner */}
              {DEMO_MODE && (
                <div className="w-full p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <span>🎭</span>
                    <span className="font-medium">Demo Mode Active</span>
                    <span className="text-amber-600/80 dark:text-amber-500/80">
                      - Swaps create real transactions with simplified pricing
                    </span>
                  </div>
                </div>
              )}

              {/* Quote Info */}
              {fromToken && toToken && toAmount && !quoteLoading && routeData && (
                <div className="w-full p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">
                      1 {fromToken.unitName} = {(parseFloat(toAmount || '0') / Math.max(parseFloat(fromAmount || '0'), 1e-12)).toFixed(6)} {toToken.unitName}
                    </span>
                  </div>
                  {routeData.tokens.length > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="font-medium">{routeData.tokens.map((token) => token.symbol).join(" → ")}</span>
                    </div>
                  )}
                  {routeData.pools.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DEX</span>
                      <span className="font-medium">
                        {Array.from(new Set(routeData.pools.map((pool) => pool.dex))).join(" → ")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="font-medium">{slippage}%</span>
                  </div>
                  {routeData.priceImpactPercent !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Impact</span>
                      <span className={cn(
                        "font-medium",
                        routeData.priceImpactPercent > 5 ? "text-destructive" : ""
                      )}>
                        {routeData.priceImpactPercent.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {routeData.pools.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-border/40 space-y-1 text-xs">
                      <div className="text-muted-foreground uppercase tracking-wide">Pools</div>
                      {routeData.pools.map((pool) => (
                        <div key={pool.id} className="flex justify-between">
                          <span className="font-medium text-foreground/80">{pool.dex}</span>
                          <span>{pool.token0.symbol}/{pool.token1.symbol}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isConnected ? (
                <Button
                  className={cn(
                    "w-full h-11 text-base font-semibold rounded-md px-4 py-2.5 active:scale-[0.99] transition-all duration-300",
                    "bg-primary hover:bg-primary/90 dark:bg-[#F3C623] dark:hover:bg-[#F3C623]/90",
                    "dark:text-black"
                  )}
                  onClick={() => {
                    console.log("Connect wallet clicked")
                  }}
                >
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  className={cn(
                    "w-full h-11 text-base font-semibold rounded-md px-4 py-2.5 active:scale-[0.99] transition-all duration-300",
                    "bg-primary hover:bg-primary/90 dark:bg-[#F3C623] dark:hover:bg-[#F3C623]/90",
                    "dark:text-black",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  disabled={isSwapDisabled || isSwapping || quoteLoading}
                  onClick={executeSwap}
                >
                  {isSwapping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Swapping...
                    </>
                  ) : quoteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Quote...
                    </>
                  ) : isSwapDisabled ? (
                    "Enter Amount"
                  ) : !routeData ? (
                    "No Route Available"
                  ) : (
                    "Swap"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        slippage={slippage}
        onSlippageChange={setSlippage}
      />
    </>
  )
}
