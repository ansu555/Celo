// celoWeb3.js - Celo-only wallet configuration
import { createConfig, http } from 'wagmi';
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

const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
    public: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Sepolia Explorer', url: 'https://explorer.celo.org/sepolia' },
  },
  testnet: true,
};

// Celo-only wagmi configuration
export const celoWagmiConfig = createConfig(
  getDefaultConfig({
    appName: '10xSwap - Celo',
    // All Celo chains (Mainnet, Alfajores, Sepolia)
    chains: [celo, celoAlfajores, celoSepolia],
    transports: {
      [celo.id]: http(),
      [celoAlfajores.id]: http(),
      [celoSepolia.id]: http(),
    },
    autoConnect: false,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  })
);

// Export chain definitions for use in components
export { celo, celoAlfajores, celoSepolia };
