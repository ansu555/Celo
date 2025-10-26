import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

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
  console.log('🌊 Creating Liquidity Pool on Celo Sepolia\n');

  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env.local');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('👤 Wallet:', wallet.address);

  // Get addresses
  const factoryAddress = process.env.NEXT_PUBLIC_AMM_FACTORY;
  const wethAddress = process.env.NEXT_PUBLIC_WETH_ADDRESS;
  const cusdAddress = process.env.NEXT_PUBLIC_CUSD_ADDRESS;

  if (!factoryAddress || !wethAddress || !cusdAddress) {
    throw new Error('Missing contract addresses in .env.local');
  }

  console.log('\n📍 Addresses:');
  console.log('Factory:', factoryAddress);
  console.log('WETH:', wethAddress);
  console.log('cUSD:', cusdAddress);

  // Setup contracts
  const factory = new ethers.Contract(factoryAddress, UniswapV2FactoryABI, wallet);
  const weth = new ethers.Contract(wethAddress, ERC20_ABI, wallet);
  const cusd = new ethers.Contract(cusdAddress, ERC20_ABI, wallet);

  // Check if pair exists
  let pairAddress = await factory.getPair(cusdAddress, wethAddress);
  
  if (pairAddress === ethers.ZeroAddress) {
    console.log('\n🏭 Creating new pair...');
    const createTx = await factory.createPair(cusdAddress, wethAddress);
    await createTx.wait();
    pairAddress = await factory.getPair(cusdAddress, wethAddress);
    console.log('✅ Pair created at:', pairAddress);
  } else {
    console.log('\n✅ Pair already exists at:', pairAddress);
  }

  const pair = new ethers.Contract(pairAddress, UniswapV2PairABI, wallet);

  // Check current reserves
  const [reserve0, reserve1] = await pair.getReserves();
  console.log('\n📊 Current Reserves:');
  console.log(`Reserve0: ${ethers.formatEther(reserve0)}`);
  console.log(`Reserve1: ${ethers.formatEther(reserve1)}`);

  if (reserve0 > 0n && reserve1 > 0n) {
    console.log('\n✅ Pool already has liquidity!');
    return;
  }

  // Mint test tokens if needed
  console.log('\n🪙 Checking token balances...');
  const wethBalance = await weth.balanceOf(wallet.address);
  const cusdBalance = await cusd.balanceOf(wallet.address);
  
  console.log(`WETH: ${ethers.formatEther(wethBalance)}`);
  console.log(`cUSD: ${ethers.formatEther(cusdBalance)}`);

  const wethAmount = ethers.parseEther('100'); // 100 WETH
  const cusdAmount = ethers.parseEther('100'); // 100 cUSD

  // Mint tokens if we don't have enough
  try {
    if (wethBalance < wethAmount) {
      console.log('\n⏳ Minting WETH...');
      const mintWethTx = await weth.mint(wallet.address, wethAmount);
      await mintWethTx.wait();
      console.log('✅ Minted WETH');
    }

    if (cusdBalance < cusdAmount) {
      console.log('⏳ Minting cUSD...');
      const mintCusdTx = await cusd.mint(wallet.address, cusdAmount);
      await mintCusdTx.wait();
      console.log('✅ Minted cUSD');
    }
  } catch (e) {
    console.log('⚠️  Cannot mint tokens (might not have mint function or permissions)');
    console.log('Using existing balances...');
  }

  // Approve tokens
  console.log('\n✅ Approving tokens...');
  const approveWethTx = await weth.approve(pairAddress, ethers.MaxUint256);
  await approveWethTx.wait();
  console.log('✅ WETH approved');

  const approveCusdTx = await cusd.approve(pairAddress, ethers.MaxUint256);
  await approveCusdTx.wait();
  console.log('✅ cUSD approved');

  // Transfer tokens to pair
  console.log('\n💸 Transferring tokens to pair...');
  const finalWethBalance = await weth.balanceOf(wallet.address);
  const finalCusdBalance = await cusd.balanceOf(wallet.address);

  const wethToAdd = finalWethBalance > wethAmount ? wethAmount : finalWethBalance;
  const cusdToAdd = finalCusdBalance > cusdAmount ? cusdAmount : finalCusdBalance;

  if (wethToAdd === 0n || cusdToAdd === 0n) {
    throw new Error('Insufficient token balances!');
  }

  console.log(`Transferring ${ethers.formatEther(wethToAdd)} WETH...`);
  const transferWethTx = await weth.transfer(pairAddress, wethToAdd);
  await transferWethTx.wait();
  console.log('✅ WETH transferred');

  console.log(`Transferring ${ethers.formatEther(cusdToAdd)} cUSD...`);
  const transferCusdTx = await cusd.transfer(pairAddress, cusdToAdd);
  await transferCusdTx.wait();
  console.log('✅ cUSD transferred');

  // Mint liquidity
  console.log('\n⏳ Minting liquidity tokens...');
  const mintTx = await pair.mint(wallet.address);
  const receipt = await mintTx.wait();
  console.log('✅ Liquidity minted!');
  console.log('Transaction hash:', receipt.hash);

  // Check final reserves
  const [finalReserve0, finalReserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();
  
  console.log('\n📊 Final Pool State:');
  console.log('Token0:', token0);
  console.log('Token1:', token1);
  console.log(`Reserve0: ${ethers.formatEther(finalReserve0)}`);
  console.log(`Reserve1: ${ethers.formatEther(finalReserve1)}`);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Liquidity Pool Created Successfully!');
  console.log('='.repeat(60));
  console.log('Pair Address:', pairAddress);
  console.log('You can now use SimpleSwap to trade between these tokens!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
