import type { Address } from "viem";

// Token registry supporting Avalanche (mainnet/testnet) and Celo

export type TokenInfo = {
  symbol: string;
  address: Address | "AVAX" | "CELO";
  decimals: number;
  coingeckoId?: string;
};

// Mainnet token addresses (Avalanche C-Chain 43114)
const MAINNET_TOKENS: Record<string, TokenInfo> = {
  AVAX: {
    symbol: "AVAX",
    address: "AVAX",
    decimals: 18,
    coingeckoId: "avalanche-2",
  },
  WAVAX: {
    symbol: "WAVAX",
    address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    decimals: 18,
    coingeckoId: "wrapped-avax",
  },
  USDC: {
    symbol: "USDC",
    address: "0xB97EF9Ef8734C71901E3d8E6B9B81C7cD1cFAe25",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  "USDC.E": {
    symbol: "USDC.e",
    address: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
    decimals: 6,
    coingeckoId: "usd-coin-avalanche-bridged-usdc-e",
  },
  USDT: {
    symbol: "USDT",
    address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    decimals: 6,
    coingeckoId: "tether",
  },
  "USDT.E": {
    symbol: "USDT.e",
    address: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
    decimals: 6,
    coingeckoId: "tether-avalanche-bridged-usdt-e",
  },
  WETH: {
    symbol: "WETH",
    address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    decimals: 18,
    coingeckoId: "weth",
  },
  "WETH.E": {
    symbol: "WETH.e",
    address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    decimals: 18,
    coingeckoId: "weth",
  },
};

// Fuji testnet tokens (for reference/backward compatibility)
const FUJI_TOKENS: Record<string, TokenInfo> = {
  AVAX: {
    symbol: "AVAX",
    address: "AVAX",
    decimals: 18,
    coingeckoId: "avalanche-2",
  },
  WAVAX: {
    symbol: "WAVAX",
    address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
    decimals: 18,
    coingeckoId: "wrapped-avax",
  }, // Fuji WAVAX
  USDC: {
    symbol: "USDC",
    address: "0x5425890298aed601595a70AB815c96711a31Bc65",
    decimals: 6,
    coingeckoId: "usd-coin",
  }, // Fuji test USDC
  WETH: {
    symbol: "WETH.e",
    address: "0x12162c3E810393dEC01362aBf156D7ecf6159528",
    decimals: 18,
    coingeckoId: "weth",
  },
  "WETH.E": {
    symbol: "WETH.e",
    address: "0x12162c3E810393dEC01362aBf156D7ecf6159528",
    decimals: 18,
    coingeckoId: "weth",
  },
  USDT: {
    symbol: "USDT.e",
    address: "0xA27f39E9C21b3376e1DA169e90e2DbA0C2e88d7b",
    decimals: 6,
    coingeckoId: "tether",
  },
  "USDT.E": {
    symbol: "USDT.e",
    address: "0xA27f39E9C21b3376e1DA169e90e2DbA0C2e88d7b",
    decimals: 6,
    coingeckoId: "tether",
  },
};

// Celo testnet tokens (Chain ID 11142220 - Alfajores)
const CELO_TOKENS: Record<string, TokenInfo> = {
  CELO: { symbol: "CELO", address: "CELO", decimals: 18, coingeckoId: "celo" },
  CUSD: {
    symbol: "cUSD",
    address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    decimals: 18,
    coingeckoId: "celo-dollar",
  },
  CEUR: {
    symbol: "cEUR",
    address: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
    decimals: 18,
    coingeckoId: "celo-euro",
  },
  CREAL: {
    symbol: "cREAL",
    address: "0xE4D517785D091D3c54818832dB6094bcc2744545",
    decimals: 18,
    coingeckoId: "celo-brazilian-real",
  },
  USDC: {
    symbol: "USDC",
    address: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
    decimals: 6,
    coingeckoId: "usd-coin",
  },
  USDT: {
    symbol: "USDT",
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    decimals: 6,
    coingeckoId: "tether",
  }, // May not exist on testnet
};

// Dynamic custom/test tokens from env (for custom deployed tokens)
function getCustomEnvTokens(): Record<string, TokenInfo> {
  const out: Record<string, TokenInfo> = {};
  if (
    process.env.NEXT_PUBLIC_TOKEN_A &&
    process.env.NEXT_PUBLIC_TOKEN_A.match(/^0x[a-fA-F0-9]{40}$/)
  ) {
    out.TOKEN_A = {
      symbol: "TOKEN_A",
      address: process.env.NEXT_PUBLIC_TOKEN_A as Address,
      decimals: 18,
    };
  }
  if (
    process.env.NEXT_PUBLIC_TOKEN_B &&
    process.env.NEXT_PUBLIC_TOKEN_B.match(/^0x[a-fA-F0-9]{40}$/)
  ) {
    out.TOKEN_B = {
      symbol: "TOKEN_B",
      address: process.env.NEXT_PUBLIC_TOKEN_B as Address,
      decimals: 18,
    };
  }
  if (
    process.env.NEXT_PUBLIC_TOKEN_C &&
    process.env.NEXT_PUBLIC_TOKEN_C.match(/^0x[a-fA-F0-9]{40}$/)
  ) {
    out.TOKEN_C = {
      symbol: "TOKEN_C",
      address: process.env.NEXT_PUBLIC_TOKEN_C as Address,
      decimals: 18,
    };
  }
  return out;
}

// Get the appropriate token registry based on chain ID
function getTokenRegistry(chainId?: number): Record<string, TokenInfo> {
  const id = chainId ?? Number(process.env.CHAIN_ID || 43113);

  if (id === 43114) {
    // Avalanche mainnet
    return {
      ...MAINNET_TOKENS,
      ...getCustomEnvTokens(),
    };
  } else if (id === 11142220) {
    // Celo Alfajores testnet
    return {
      ...CELO_TOKENS,
      ...getCustomEnvTokens(),
    };
  } else {
    // Fuji testnet or unspecified
    return {
      ...FUJI_TOKENS,
      ...getCustomEnvTokens(),
    };
  }
}

// Legacy export for backward compatibility
export const FUJI_SYMBOL_TO_TOKEN: Record<string, TokenInfo> =
  getTokenRegistry(43113);

export function resolveTokenBySymbol(
  symbol?: string,
  chainId?: number
): TokenInfo | null {
  if (!symbol) return null;
  const key = symbol.toUpperCase();
  const registry = getTokenRegistry(chainId);
  return registry[key] ?? null;
}

export function resolveTokenByCoinrankingId(): TokenInfo | null {
  return null;
}
