import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const TestTokenArtifact = require('../artifacts/contracts/TestToken.sol/TestToken.json');

const UniswapV2FactoryABI = [
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const UniswapV2PairABI = [
  'function mint(address to) external returns (uint liquidity)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function mint(address to, uint256 amount) external'
];

const RPC_URL = process.env.RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
  console.log('🚀 Quick Swap Setup - Creating Test Tokens & Pool\n');

  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env.local');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('👤 Wallet:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'CELO\n');

  if (balance < ethers.parseEther('0.05')) {
    throw new Error('Insufficient CELO for gas. Please get testnet CELO from faucet.');
  }

  const factoryAddress = process.env.NEXT_PUBLIC_AMM_FACTORY;
  if (!factoryAddress) {
    throw new Error('NEXT_PUBLIC_AMM_FACTORY not set');
  }

  // Deploy two test tokens
  console.log('🪙 Deploying test tokens...\n');
  
  const TestTokenFactory = new ethers.ContractFactory(
    TestTokenArtifact.abi,
    TestTokenArtifact.bytecode,
    wallet
  );

  console.log('⏳ Deploying TokenA...');
  const tokenA = await TestTokenFactory.deploy(
    'Token A',
    'TKA',
    18,
    ethers.parseEther('1000000') // 1M tokens
  );
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log('✅ TokenA deployed:', tokenAAddress);

  console.log('⏳ Deploying TokenB...');
  const tokenB = await TestTokenFactory.deploy(
    'Token B',
    'TKB',
    18,
    ethers.parseEther('1000000') // 1M tokens
  );
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log('✅ TokenB deployed:', tokenBAddress);

  // Create pair
  console.log('\n🏭 Creating pair...');
  const factory = new ethers.Contract(factoryAddress, UniswapV2FactoryABI, wallet);
  
  const createTx = await factory.createPair(tokenAAddress, tokenBAddress);
  await createTx.wait();
  
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  console.log('✅ Pair created:', pairAddress);

  // Add liquidity
  console.log('\n💧 Adding liquidity...');
  const pair = new ethers.Contract(pairAddress, UniswapV2PairABI, wallet);
  
  // Create contract instances with ERC20 ABI for transfers
  const tokenAERC20 = new ethers.Contract(tokenAAddress, ERC20_ABI, wallet);
  const tokenBERC20 = new ethers.Contract(tokenBAddress, ERC20_ABI, wallet);
  
  const amount0 = ethers.parseEther('1000'); // 1000 TKA
  const amount1 = ethers.parseEther('1000'); // 1000 TKB

  console.log('⏳ Transferring TokenA to pair...');
  const transferATx = await tokenAERC20.transfer(pairAddress, amount0);
  await transferATx.wait();
  console.log('✅ TokenA transferred');

  console.log('⏳ Transferring TokenB to pair...');
  const transferBTx = await tokenBERC20.transfer(pairAddress, amount1);
  await transferBTx.wait();
  console.log('✅ TokenB transferred');

  console.log('⏳ Minting liquidity...');
  const mintTx = await pair.mint(wallet.address);
  await mintTx.wait();
  console.log('✅ Liquidity minted!');

  // Check reserves
  const [reserve0, reserve1] = await pair.getReserves();
  console.log('\n📊 Pool Reserves:');
  console.log(`Reserve0: ${ethers.formatEther(reserve0)}`);
  console.log(`Reserve1: ${ethers.formatEther(reserve1)}`);

  // Update .env.local with test token addresses
  const fs = await import('fs');
  const envPath = path.resolve(__dirname, '../../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Add test token addresses
  if (!envContent.includes('NEXT_PUBLIC_TEST_TOKEN_A=')) {
    envContent += `\n# Test Tokens for SimpleSwap\nNEXT_PUBLIC_TEST_TOKEN_A=${tokenAAddress}\nNEXT_PUBLIC_TEST_TOKEN_B=${tokenBAddress}\nNEXT_PUBLIC_TEST_PAIR=${pairAddress}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Updated .env.local with test token addresses');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Setup Complete!');
  console.log('='.repeat(60));
  console.log('TokenA (TKA):', tokenAAddress);
  console.log('TokenB (TKB):', tokenBAddress);
  console.log('Pair:', pairAddress);
  console.log('='.repeat(60));
  console.log('\n✨ You can now test swaps with these tokens!');
  console.log(`Run: npx tsx scripts/test-swap.ts`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
