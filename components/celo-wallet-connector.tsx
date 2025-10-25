'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

export function CeloWalletConnector() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const isCeloChain = chain?.id === 42220 || chain?.id === 44787

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌾 Celo Wallet
          {isCeloChain && <Badge variant="secondary">Celo Network</Badge>}
        </CardTitle>
        <CardDescription>
          Connect your Celo wallet to interact with the Celo ecosystem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
              return (
                <Button onClick={show} className="w-full">
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
              <p className="text-sm font-medium">Current Network:</p>
              <p className="text-xs">{chain?.name} (Chain ID: {chain?.id})</p>
            </div>

            {!isCeloChain && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Switch to Celo network for full functionality
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => switchChain({ chainId: 42220 })}
                  >
                    Switch to Celo Mainnet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => switchChain({ chainId: 44787 })}
                  >
                    Switch to Alfajores
                  </Button>
                </div>
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
