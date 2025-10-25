'use client'

import { CeloOnlyWalletConnector } from '../../components/celo-only-wallet-connector'
import { useCeloOnly } from '../../hooks/useCeloOnly'
import { useCeloTransactions } from '../../hooks/useCeloTransactions'
import { useBalance } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'

export default function CeloOnlyPage() {
  const { 
    address, 
    isConnected, 
    chain,
    isCeloChain,
    isCeloMainnet,
    isCeloTestnet,
    isMiniPay,
    networkWarning,
    celoNetworkInfo,
    isCeloCompatible
  } = useCeloOnly()
  
  const { 
    tokens,
    isTestnet,
    sendCelo,
    sendCUSD,
    sendCEUR,
    isPending,
    isSuccess
  } = useCeloTransactions()
  
  const { data: balance } = useBalance({
    address: address,
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-green-700">🌾 Celo-Only Wallet Connection</h1>
        <p className="text-muted-foreground">
          Connect exclusively to Celo network wallets - No other chains supported
        </p>
        {isMiniPay && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            📱 MiniPay Detected
          </Badge>
        )}
      </div>

      {networkWarning && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">⚠️ Unsupported Network</p>
              <p className="text-sm">
                You are connected to {chain?.name} (Chain ID: {chain?.id}). 
                This application only supports Celo networks. Please switch to Celo Mainnet or Alfajores testnet.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CeloOnlyWalletConnector />
        
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Wallet Information
                {isCeloChain && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {isCeloMainnet ? 'Celo Mainnet' : 'Celo Alfajores'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Current Celo wallet and network details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Address:</p>
                <p className="text-xs font-mono break-all">{address}</p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Network:</p>
                <p className="text-sm">{chain?.name}</p>
                <p className="text-xs text-muted-foreground">Chain ID: {chain?.id}</p>
              </div>

              {balance && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Balance:</p>
                  <p className="text-sm">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </p>
                </div>
              )}

              {!isCeloChain && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ❌ Not connected to Celo network. Please switch to Celo Mainnet or Alfajores.
                  </p>
                </div>
              )}

              {isCeloChain && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Successfully connected to Celo network!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isConnected && isCeloChain && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">🌾 Celo Transaction Demo</CardTitle>
              <CardDescription>
                Test Celo-specific transactions (Demo only - no real transactions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Available Celo Tokens:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">CELO</Badge>
                    <Badge variant="outline">cUSD</Badge>
                    <Badge variant="outline">cEUR</Badge>
                    {!isTestnet && <Badge variant="outline">cREAL</Badge>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    disabled={isPending}
                  >
                    Send CELO
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    disabled={isPending}
                  >
                    Send cUSD
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    disabled={isPending}
                  >
                    Send cEUR
                  </Button>
                </div>
                
                {isPending && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">⏳ Transaction pending...</p>
                  </div>
                )}
                
                {isSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">✅ Transaction successful!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">🌾 Celo Ecosystem Features</CardTitle>
              <CardDescription>
                Available features when connected to Celo network
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2 text-green-800">💱 Celo Stablecoins</h3>
                <p className="text-sm text-green-700">
                  Access cUSD, cEUR, cREAL and other Celo stablecoins
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2 text-green-800">🌍 Mobile-First</h3>
                <p className="text-sm text-green-700">
                  Optimized for mobile payments and DeFi
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2 text-green-800">⚡ Fast & Cheap</h3>
                <p className="text-sm text-green-700">
                  Low-cost transactions with fast finality
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2 text-green-800">🔒 Secure</h3>
                <p className="text-sm text-green-700">
                  Proof-of-stake consensus with validator security
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2 text-green-800">🌱 Carbon Negative</h3>
                <p className="text-sm text-green-700">
                  Climate-positive blockchain network
                </p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-semibold mb-2 text-green-800">📱 Valora Wallet</h3>
                <p className="text-sm text-green-700">
                  Native mobile wallet for Celo ecosystem
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">🔧 Supported Celo Wallets</CardTitle>
          <CardDescription>
            Connect with any of these Celo-compatible wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl mb-2">📱</div>
              <p className="font-medium">Valora</p>
              <p className="text-xs text-muted-foreground">Mobile</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl mb-2">🦊</div>
              <p className="font-medium">MetaMask</p>
              <p className="text-xs text-muted-foreground">Browser</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl mb-2">🔗</div>
              <p className="font-medium">WalletConnect</p>
              <p className="text-xs text-muted-foreground">Mobile</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-2xl mb-2">🛡️</div>
              <p className="font-medium">Trust Wallet</p>
              <p className="text-xs text-muted-foreground">Mobile</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
