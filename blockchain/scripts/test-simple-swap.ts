import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SimpleSwapArtifact = require('../artifacts/contracts/SimpleSwap.sol/SimpleSwap.json');
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

const RPC_URL = process.env.RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
  console.log('🔄 Testing SimpleSwap on Celo Sepolia\n');

  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env.local');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('👤 Wallet:', wallet.address);

  // Get addresses from env
  const simpleSwapAddress = process.env.NEXT_PUBLIC_SIMPLE_SWAP;
  const wethAddress = process.env.NEXT_PUBLIC_WETH_ADDRESS;
  
  // Get token addresses from env - check multiple possible env vars
  const cusdAddress = process.env.NEXT_PUBLIC_CUSD_ADDRESS || 
                     process.env.CUSD_ADDRESS ||
                     process.env.CELO_CUSD_ADDRESS_SEPOLIA;
  
  if (!simpleSwapAddress) {
    throw new Error('NEXT_PUBLIC_SIMPLE_SWAP not found. Deploy SimpleSwap first!');
  }
  
  if (!wethAddress || !cusdAddress) {
    throw new Error('Token addresses not found in .env.local');
  }

  console.log('\n📍 Contract Addresses:');
  console.log('SimpleSwap:', simpleSwapAddress);
  console.log('WETH:', wethAddress);
  console.log('cUSD:', cusdAddress);

  // Setup contracts
  const simpleSwap = new ethers.Contract(simpleSwapAddress, SimpleSwapArtifact.abi, wallet);
  const weth = new ethers.Contract(wethAddress, ERC20_ABI, wallet);
  const cusd = new ethers.Contract(cusdAddress, ERC20_ABI, wallet);

  // Check pair exists
  console.log('\n🔍 Checking if cUSD/WETH pair exists...');
  const pairExists = await simpleSwap.pairExists(cusdAddress, wethAddress);
  
  if (!pairExists) {
    console.log('❌ No pair found for cUSD/WETH!');
    console.log('Please create and seed the pair first using create-pair and mint-liquidity scripts.');
    return;
  }

  const pairAddress = await simpleSwap.getPair(cusdAddress, wethAddress);
  console.log('✅ Pair exists at:', pairAddress);

  // Check balances
  console.log('\n💰 Current Balances:');
  const wethBalance = await weth.balanceOf(wallet.address);
  const cusdBalance = await cusd.balanceOf(wallet.address);
  const wethDecimals = await weth.decimals();
  const cusdDecimals = await cusd.decimals();
  
  console.log(`WETH: ${ethers.formatUnits(wethBalance, wethDecimals)}`);
  console.log(`cUSD: ${ethers.formatUnits(cusdBalance, cusdDecimals)}`);

  // Define swap amount (0.01 WETH)
  const amountIn = ethers.parseUnits('0.01', wethDecimals);
  
  if (wethBalance < amountIn) {
    console.log('\n❌ Insufficient WETH balance for swap!');
    console.log(`Need: ${ethers.formatUnits(amountIn, wethDecimals)} WETH`);
    console.log(`Have: ${ethers.formatUnits(wethBalance, wethDecimals)} WETH`);
    return;
  }

  // Get quote
  console.log('\n💱 Getting swap quote...');
  console.log(`Swapping ${ethers.formatUnits(amountIn, wethDecimals)} WETH for cUSD`);
  
  const amountOut = await simpleSwap.getAmountOut(wethAddress, cusdAddress, amountIn);
  console.log(`Expected output: ${ethers.formatUnits(amountOut, cusdDecimals)} cUSD`);

  // Check/set approval
  console.log('\n✅ Checking approval...');
  const currentAllowance = await weth.allowance(wallet.address, simpleSwapAddress);
  
  if (currentAllowance < amountIn) {
    console.log('⏳ Approving WETH...');
    const approveTx = await weth.approve(simpleSwapAddress, ethers.MaxUint256);
    await approveTx.wait();
    console.log('✅ WETH approved');
  } else {
    console.log('✅ Already approved');
  }

  // Execute swap
  console.log('\n🔄 Executing swap...');
  const minAmountOut = (amountOut * 95n) / 100n; // 5% slippage tolerance
  
  const swapTx = await simpleSwap.swapExactTokensForTokens(
    wethAddress,
    cusdAddress,
    amountIn,
    minAmountOut,
    wallet.address
  );

  console.log('⏳ Waiting for confirmation...');
  const receipt = await swapTx.wait();
  console.log('✅ Swap confirmed!');
  console.log('Transaction hash:', receipt.hash);

  // Check new balances
  console.log('\n💰 New Balances:');
  const newWethBalance = await weth.balanceOf(wallet.address);
  const newCusdBalance = await cusd.balanceOf(wallet.address);
  
  console.log(`WETH: ${ethers.formatUnits(newWethBalance, wethDecimals)} (${ethers.formatUnits(newWethBalance - wethBalance, wethDecimals)})`);
  console.log(`cUSD: ${ethers.formatUnits(newCusdBalance, cusdDecimals)} (+${ethers.formatUnits(newCusdBalance - cusdBalance, cusdDecimals)})`);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Swap Successful!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
