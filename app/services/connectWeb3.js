// connectWeb3.ts
import { createConfig, http } from 'wagmi';
import { avalanche, avalancheFuji } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';

// Celo chain definitions
const celo = {
  id: 42220,
  name: 'Celo',
  network: 'celo',
  nativeCurrency: {
    decimals: 18,
    name: 'Celo',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
    public: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://explorer.celo.org' },
  },
  testnet: false,
};

const celoAlfajores = {
  id: 44787,
  name: 'Celo Alfajores',
  network: 'celo-alfajores',
  nativeCurrency: {
    decimals: 18,
    name: 'Celo',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://alfajores-forno.celo-testnet.org'] },
    public: { http: ['https://alfajores-forno.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Alfajores Explorer', url: 'https://alfajores-blockscout.celo-testnet.org' },
  },
  testnet: true,
};

export const wagmiConfig = createConfig(
  getDefaultConfig({
  appName: 'Accorto',
  // Enable Avalanche mainnet and Avalanche Fuji (testnet) only
  chains: [avalanche, avalancheFuji],
    transports: {
      [avalanche.id]: http(),
      [avalancheFuji.id]: http(),
      [celo.id]: http(),
      [celoAlfajores.id]: http(),
    },
    autoConnect: false,
    // walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  })
);
