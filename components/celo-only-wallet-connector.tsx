'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { celo, celoAlfajores } from '../app/services/celoWeb3'
import { useEffect, useState } from 'react'

export function CeloOnlyWalletConnector() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { data: balance } = useBalance({
    address: address,
  })
  const [isMiniPay, setIsMiniPay] = useState(false)

  const isCeloMainnet = chain?.id === celo.id
  const isCeloTestnet = chain?.id === celoAlfajores.id
  const isCeloChain = isCeloMainnet || isCeloTestnet

  // Detect MiniPay wallet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMiniPayWallet = window.ethereum?.isMiniPay || 
                             window.ethereum?.isValora ||
                             (window.ethereum?.providerMap && window.ethereum.providerMap.MiniPay)
      setIsMiniPay(!!isMiniPayWallet)
    }
  }, [address])

  // Auto-disconnect if user switches to non-Celo network
  useEffect(() => {
    if (isConnected && chain && !isCeloChain) {
      // Show warning but don't auto-disconnect to let user switch
      console.warn('Non-Celo network detected. Please switch to Celo network.')
    }
  }, [isConnected, chain, isCeloChain])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌾 Celo Wallet Only
          {isCeloChain && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {isCeloMainnet ? 'Celo Mainnet' : 'Celo Alfajores'}
            </Badge>
          )}
          {isMiniPay && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              MiniPay
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect exclusively to Celo network wallets. Other networks are not supported.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
              return (
                <Button onClick={show} className="w-full bg-green-600 hover:bg-green-700">
                  {isConnecting ? 'Connecting...' : 'Connect Celo Wallet'}
                </Button>
              )
            }}
          </ConnectKitButton.Custom>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Connected Address:</p>
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
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p className="font-medium">❌ Unsupported Network Detected</p>
                    <p className="text-sm">
                      This application only supports Celo networks. Please switch to Celo Mainnet or Alfajores testnet.
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchChain({ chainId: celo.id })}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        Switch to Celo Mainnet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchChain({ chainId: celoAlfajores.id })}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        Switch to Alfajores
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isCeloChain && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Connected to Celo network! You can now use Celo features.
                </p>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={() => disconnect()}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
