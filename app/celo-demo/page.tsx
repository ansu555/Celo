'use client'

import { CeloWalletConnector } from '../../components/celo-wallet-connector'
import { useAccount, useBalance } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { isCeloChain, getCeloNetworkInfo } from '../../lib/celo-utils'

export default function CeloDemoPage() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })

  const isCelo = isCeloChain(chain?.id || 0)
  const networkInfo = getCeloNetworkInfo(chain?.id || 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🌾 Celo Wallet Integration</h1>
        <p className="text-muted-foreground">
          Connect your Celo wallet and explore the Celo ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CeloWalletConnector />
        
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Wallet Information
                {isCelo && <Badge variant="secondary">Celo Network</Badge>}
              </CardTitle>
              <CardDescription>
                Current wallet and network details
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

              {networkInfo && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Celo Network Info:</p>
                  <p className="text-xs">RPC: {networkInfo.rpcUrl}</p>
                  <p className="text-xs">Explorer: {networkInfo.explorer}</p>
                </div>
              )}

              {!isCelo && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ You're not connected to a Celo network. 
                    Switch to Celo Mainnet or Alfajores testnet for full functionality.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isConnected && isCelo && (
        <Card>
          <CardHeader>
            <CardTitle>🌾 Celo Ecosystem Features</CardTitle>
            <CardDescription>
              Available features when connected to Celo network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">💱 Stablecoins</h3>
                <p className="text-sm text-muted-foreground">
                  Access cUSD, cEUR, and other Celo stablecoins
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🌍 Mobile-First</h3>
                <p className="text-sm text-muted-foreground">
                  Optimized for mobile payments and DeFi
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">⚡ Fast & Cheap</h3>
                <p className="text-sm text-muted-foreground">
                  Low-cost transactions with fast finality
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔒 Secure</h3>
                <p className="text-sm text-muted-foreground">
                  Proof-of-stake consensus with validator security
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🌱 Carbon Negative</h3>
                <p className="text-sm text-muted-foreground">
                  Climate-positive blockchain network
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📱 Valora Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Native mobile wallet for Celo ecosystem
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
