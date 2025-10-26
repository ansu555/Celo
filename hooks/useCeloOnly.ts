// hooks/useCeloOnly.ts - Celo-only wallet hook with strict network validation
import { useAccount, useSwitchChain, useDisconnect } from 'wagmi'
import { celo, celoAlfajores, celoSepolia } from '../app/services/celoWeb3'
import { useEffect, useState } from 'react'

export function useCeloOnly() {
  const { address, isConnected, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { disconnect } = useDisconnect()
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [networkWarning, setNetworkWarning] = useState(false)

  const isCeloMainnet = chain?.id === celo.id
  const isCeloAlfajores = chain?.id === celoAlfajores.id
  const isCeloSepolia = chain?.id === celoSepolia.id
  const isCeloChain = isCeloMainnet || isCeloAlfajores || isCeloSepolia

  // Detect MiniPay wallet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMiniPayWallet = window.ethereum?.isMiniPay || 
                             window.ethereum?.isValora ||
                             (window.ethereum?.providerMap && window.ethereum.providerMap.MiniPay)
      setIsMiniPay(!!isMiniPayWallet)
    }
  }, [address])

  // Enforce Celo-only network
  useEffect(() => {
    if (isConnected && chain && !isCeloChain) {
      setNetworkWarning(true)
      console.warn('Non-Celo network detected. This app only supports Celo networks.')
    } else {
      setNetworkWarning(false)
    }
  }, [isConnected, chain, isCeloChain])

  // Auto-switch to Celo Mainnet if user is on unsupported network
  const enforceCeloNetwork = async () => {
    if (isConnected && !isCeloChain) {
      try {
        await switchChain({ chainId: celo.id })
      } catch (error) {
        console.error('Failed to switch to Celo network:', error)
        // If switch fails, disconnect the wallet
        disconnect()
      }
    }
  }

  // Get Celo network info
  const getCeloNetworkInfo = () => {
    if (isCeloMainnet) {
      return {
        name: 'Celo Mainnet',
        chainId: celo.id,
        isTestnet: false,
        rpcUrl: 'https://forno.celo.org',
        explorer: 'https://explorer.celo.org'
      }
    }
    if (isCeloAlfajores) {
      return {
        name: 'Celo Alfajores',
        chainId: celoAlfajores.id,
        isTestnet: true,
        rpcUrl: 'https://alfajores-forno.celo-testnet.org',
        explorer: 'https://alfajores-blockscout.celo-testnet.org'
      }
    }
    if (isCeloSepolia) {
      return {
        name: 'Celo Sepolia',
        chainId: celoSepolia.id,
        isTestnet: true,
        rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
        explorer: 'https://celo-sepolia.celoscan.io'
      }
    }
    return null
  }

  // Check if wallet is Celo-compatible
  const isCeloCompatible = () => {
    if (typeof window === 'undefined') return false
    
    // Check for Celo-specific wallets
    const hasValora = window.ethereum?.isValora || window.ethereum?.isMiniPay
    const hasMetaMask = window.ethereum?.isMetaMask
    const hasWalletConnect = window.ethereum?.isWalletConnect
    
    return hasValora || hasMetaMask || hasWalletConnect
  }

  return {
    // Account info
    address,
    isConnected,
    chain,
    
    // Celo-specific info
    isCeloChain,
    isCeloMainnet,
  isCeloTestnet: isCeloAlfajores || isCeloSepolia,
    isMiniPay,
    networkWarning,
    
    // Network info
    celoNetworkInfo: getCeloNetworkInfo(),
    
    // Actions
    switchToCeloMainnet: () => switchChain({ chainId: celo.id }),
  switchToCeloTestnet: () => switchChain({ chainId: celoAlfajores.id }),
  switchToCeloSepolia: () => switchChain({ chainId: celoSepolia.id }),
    enforceCeloNetwork,
    disconnect,
    
    // Validation
    isCeloCompatible: isCeloCompatible(),
    
    // Constants
    CELO_MAINNET_ID: celo.id,
    CELO_TESTNET_ID: celoAlfajores.id,
    CELO_SEPOLIA_ID: celoSepolia.id,
  }
}
