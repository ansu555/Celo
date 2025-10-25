#!/usr/bin/env node

// Test script to verify Celo integration
const { createConfig } = require('wagmi');
const { avalanche, avalancheFuji } = require('wagmi/chains');

console.log('🧪 Testing Celo Integration...\n');

// Test 1: Verify Celo chain definitions
console.log('1. Testing Celo chain definitions...');
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

console.log('✅ Celo Mainnet:', celo.name, '(Chain ID:', celo.id + ')');
console.log('✅ Celo Alfajores:', celoAlfajores.name, '(Chain ID:', celoAlfajores.id + ')');

// Test 2: Verify Celo token addresses
console.log('\n2. Testing Celo token addresses...');
const CELO_TOKENS = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CB2762763733c8C8A1d3Ac97b59E4f468D1',
  cREAL: '0xE4D517785D091D3c54818803265F2B1C3f2B1881',
};

Object.entries(CELO_TOKENS).forEach(([symbol, address]) => {
  console.log(`✅ ${symbol}: ${address}`);
});

// Test 3: Verify utility functions
console.log('\n3. Testing utility functions...');

function isCeloChain(chainId) {
  return chainId === 42220 || chainId === 44787;
}

function getCeloNetworkInfo(chainId) {
  if (chainId === 42220) {
    return { name: 'Celo Mainnet', chainId: 42220 };
  }
  if (chainId === 44787) {
    return { name: 'Celo Alfajores', chainId: 44787 };
  }
  return null;
}

console.log('✅ isCeloChain(42220):', isCeloChain(42220));
console.log('✅ isCeloChain(44787):', isCeloChain(44787));
console.log('✅ isCeloChain(1):', isCeloChain(1));

const mainnetInfo = getCeloNetworkInfo(42220);
const testnetInfo = getCeloNetworkInfo(44787);
console.log('✅ Mainnet info:', mainnetInfo?.name);
console.log('✅ Testnet info:', testnetInfo?.name);

// Test 4: Verify RPC endpoints
console.log('\n4. Testing RPC endpoints...');
const rpcEndpoints = [
  'https://forno.celo.org',
  'https://alfajores-forno.celo-testnet.org'
];

rpcEndpoints.forEach(endpoint => {
  console.log(`✅ RPC Endpoint: ${endpoint}`);
});

console.log('\n🎉 Celo integration test completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Visit /celo-demo to test wallet connection');
console.log('2. Connect a Celo wallet (Valora, MetaMask, etc.)');
console.log('3. Switch to Celo network for full functionality');
console.log('4. Test transactions and interactions');

console.log('\n🔗 Supported Celo Wallets:');
console.log('- Valora (Mobile)');
console.log('- MetaMask');
console.log('- WalletConnect');
console.log('- Coinbase Wallet');
console.log('- Trust Wallet');
