import { useState, useEffect, useMemo } from 'react'
import { listTokenRegistry } from '@/lib/tokens'
import type { Address } from 'viem'

export interface AssetInfo {
  id: string
  symbol: string
  name: string
  unitName: string
  decimals: number
  address: Address | 'CELO'
  logoUrl?: string
  verified?: boolean
  coingeckoId?: string
}

const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 44787)

// Convert token registry to AssetInfo format
function tokensToAssets(chainId?: number): AssetInfo[] {
  const tokensRecord = listTokenRegistry(chainId)
  
  return Object.values(tokensRecord).map((token) => ({
    id: token.address === 'CELO' ? 'celo' : token.address.toLowerCase(),
    symbol: token.symbol,
    name: token.symbol,
    unitName: token.symbol,
    decimals: token.decimals,
    address: token.address,
    logoUrl: getTokenLogoUrl(token.symbol, token.coingeckoId),
    verified: true,
    coingeckoId: token.coingeckoId,
  }))
}

function getTokenLogoUrl(symbol: string, coingeckoId?: string): string {
  if (coingeckoId) {
    return `https://assets.coingecko.com/coins/images/${getCoingeckoImageId(coingeckoId)}/small/${coingeckoId}.png`
  }
  
  // Fallback to common CDN
  const symbolLower = symbol.toLowerCase()
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/assets/${symbolLower}/logo.png`
}

// Map coingecko IDs to their image IDs (this is a simplified version)
function getCoingeckoImageId(coingeckoId: string): string {
  const imageMap: Record<string, string> = {
    'celo': '11090',
    'celo-dollar': '11091',
    'celo-euro': '11092',
    'celo-real': '28180',
  }
  return imageMap[coingeckoId] || '1'
}

export function useTradeableAssets(chainId?: number) {
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const targetChainId = chainId || DEFAULT_CHAIN_ID
      const assetList = tokensToAssets(targetChainId)
      setAssets(assetList)
    } catch (error) {
      console.error('Failed to load tradeable assets:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [chainId])

  return { assets, loading }
}

export function useAssetSearch(query: string) {
  const { assets, loading: assetsLoading } = useTradeableAssets()
  const [loading, setLoading] = useState(false)
  
  const results = useMemo(() => {
    if (!query || query.length < 2) return []
    
    const searchTerm = query.toLowerCase()
    return assets.filter((asset) => 
      asset.symbol.toLowerCase().includes(searchTerm) ||
      asset.name.toLowerCase().includes(searchTerm) ||
      asset.unitName.toLowerCase().includes(searchTerm)
    )
  }, [query, assets])

  return { results, loading: assetsLoading || loading }
}
