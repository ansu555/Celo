"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { parseUnits, encodeFunctionData, type Address as ViemAddress } from 'viem'
import { Settings, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SettingsModal } from "./settings-modal"
import { LimitPanel } from "./limit-panel"
import { BuyPanel } from "./buy-panel"
import { SellPanel } from "./sellpanel"
import { AssetSelector } from "./asset-selector"
import { useTradeableAssets, AssetInfo } from "../../hooks/use-tradeable-assets"
import { useToast } from "@/hooks/use-toast"

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const

type SwapCardProps = {
  onPairChange?: (from: AssetInfo | null, to: AssetInfo | null) => void
}

export function SwapCard({ onPairChange }: SwapCardProps) {
  const { address: walletAddress, isConnected } = useAccount()
  const { assets, loading: assetsLoading } = useTradeableAssets()
  const { toast } = useToast()
  
  // Wagmi hooks for transactions
  const { data: hash, isPending: isSending, sendTransaction } = useSendTransaction()
  const { data: approveHash, isPending: isApproving, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  const { isLoading: isApprovingConfirm, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })
  
  const [fromToken, setFromToken] = useState<AssetInfo | null>(null)
  const [toToken, setToToken] = useState<AssetInfo | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'swap' | 'limit' | 'buy' | 'sell'>('swap')
  const [isSwapping, setIsSwapping] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [routeData, setRouteData] = useState<any>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [swapStep, setSwapStep] = useState<'idle' | 'approving' | 'swapping'>('idle')

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: "✅ Swap Successful!",
        description: (
          <div className="mt-2 space-y-2 text-sm">
            <div className="font-semibold text-green-600 dark:text-green-400">
              Transaction Confirmed!
            </div>
            <div>Swapped: {fromAmount} {fromToken?.unitName}</div>
            <div>Received: ~{toAmount} {toToken?.unitName}</div>
            <a 
              href={`https://explorer.celo.org/sepolia/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-xs block"
            >
              View on Explorer →
            </a>
          </div>
        ),
        duration: 10000,
      })
      
      // Clear form
      setFromAmount('')
      setToAmount('')
      setRouteData(null)
      setIsSwapping(false)
      setSwapStep('idle')
    }
  }, [isConfirmed, hash])

  // Handle approval confirmation
  useEffect(() => {
    if (isApproveConfirmed && approveHash) {
      toast({
        title: "✅ Approval Confirmed",
        description: "You can now proceed with the swap",
      })
      setNeedsApproval(false)
      setSwapStep('idle')
    }
  }, [isApproveConfirmed, approveHash])

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
      const amountInBaseUnits = parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)

      const response = await fetch('/api/router/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAssetId: fromToken.id,
          toAssetId: toToken.id,
          amount: amountInBaseUnits,
          slippage: parseFloat(slippage),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quote')
      }

      const data = await response.json()
      
      if (data.route && data.outputAmount) {
        const outputAmount = data.outputAmount / Math.pow(10, toToken.decimals)
        setToAmount(outputAmount.toFixed(toToken.decimals))
        setRouteData(data)
      } else {
        setToAmount('0')
        toast({
          title: "No Route Found",
          description: "Could not find a swap route for this pair",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Quote error:', error)
      setToAmount('0')
      toast({
        title: "Quote Failed",
        description: error instanceof Error ? error.message : "Failed to get quote",
        variant: "destructive"
      })
    } finally {
      setQuoteLoading(false)
    }
  }

  // Check allowance for ERC20 tokens
  const checkAllowance = async () => {
    if (!fromToken || !walletAddress || fromToken.address === 'CELO') {
      setNeedsApproval(false)
      return
    }

    try {
      const response = await fetch('/api/swap/check-allowance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: fromToken.address,
          owner: walletAddress,
          amount: parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
        })
      })

      const { needsApproval: needs } = await response.json()
      setNeedsApproval(needs)
    } catch (error) {
      console.error('Error checking allowance:', error)
      setNeedsApproval(true)
    }
  }

  // Approve token spending
  const approveToken = async () => {
    if (!fromToken || !walletAddress || fromToken.address === 'CELO') return

    setSwapStep('approving')
    
    try {
      // Get router address
      const routerResponse = await fetch('/api/swap/router-address')
      const { routerAddress } = await routerResponse.json()

      const amountToApprove = parseUnits(fromAmount, fromToken.decimals)

      // This will open MetaMask/Core wallet
      writeContract({
        address: fromToken.address as ViemAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [routerAddress as ViemAddress, amountToApprove]
      })

      toast({
        title: "🔐 Approval Required",
        description: "Please approve the token spending in your wallet"
      })

    } catch (error) {
      console.error('Approval error:', error)
      toast({
        title: "❌ Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve",
        variant: "destructive"
      })
      setSwapStep('idle')
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

    // Check if approval is needed first
    await checkAllowance()
    
    if (needsApproval && fromToken.address !== 'CELO') {
      await approveToken()
      return
    }

    setIsSwapping(true)
    setSwapStep('swapping')

    try {
      toast({
        title: "🔄 Preparing Swap...",
        description: "Building swap transaction"
      })

      const amountInBaseUnits = parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)

      // Get swap transaction data from API
      const response = await fetch('/api/swap/build-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: fromToken.address,
          toToken: toToken.address,
          amount: amountInBaseUnits.toString(),
          slippage: parseFloat(slippage),
          userAddress: walletAddress,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to build swap transaction')
      }

      const { tx } = await response.json()

      toast({
        title: "💳 Confirm in Wallet",
        description: "Please confirm the transaction in MetaMask/Core"
      })

      // This will open MetaMask/Core wallet for transaction signing
      if (fromToken.address === 'CELO') {
        // For native CELO, use sendTransaction
        sendTransaction({
          to: tx.to as ViemAddress,
          data: tx.data as `0x${string}`,
          value: BigInt(tx.value || '0'),
          gas: tx.gas ? BigInt(tx.gas) : undefined
        })
      } else {
        // For ERC20 tokens, use writeContract
        sendTransaction({
          to: tx.to as ViemAddress,
          data: tx.data as `0x${string}`,
          gas: tx.gas ? BigInt(tx.gas) : undefined
        })
      }

    } catch (error: unknown) {
      console.error('Swap error:', error)
      toast({
        title: "❌ Swap Failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive",
        duration: 7000,
      })
      setIsSwapping(false)
      setSwapStep('idle')
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
              {/* Quote Info */}
              {fromToken && toToken && toAmount && !quoteLoading && routeData && (
                <div className="w-full p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">
                      1 {fromToken.unitName} = {(parseFloat(toAmount) / parseFloat(fromAmount || '1')).toFixed(6)} {toToken.unitName}
                    </span>
                  </div>
                  {routeData.route?.dex && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span className="font-medium">{routeData.route.dex}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="font-medium">{slippage}%</span>
                  </div>
                  {routeData.priceImpact && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Impact</span>
                      <span className={cn(
                        "font-medium",
                        parseFloat(routeData.priceImpact) > 5 ? "text-destructive" : ""
                      )}>
                        {routeData.priceImpact}%
                      </span>
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
                  disabled={isSwapDisabled || isSwapping || quoteLoading || isApproving || isConfirming}
                  onClick={executeSwap}
                >
                  {isApproving || isApprovingConfirm ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isApprovingConfirm ? 'Confirming Approval...' : 'Approving...'}
                    </>
                  ) : isSending || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isConfirming ? 'Confirming Swap...' : 'Confirm in Wallet...'}
                    </>
                  ) : quoteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Quote...
                    </>
                  ) : isSwapDisabled ? (
                    "Enter Amount"
                  ) : needsApproval && fromToken?.address !== 'CELO' ? (
                    `Approve ${fromToken?.unitName}`
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
