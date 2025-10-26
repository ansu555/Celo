import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import contract artifacts
const UniswapV2FactoryArtifact = require('../artifacts/contracts/uniswap-v2-core/UniswapV2Factory.sol/UniswapV2Factory.json');
const WETH9Artifact = require('../artifacts/contracts/uniswap-v2-periphery/WETH9.sol/WETH9.json');
const UniswapV2Router02Artifact = require('../artifacts/contracts/uniswap-v2-periphery/UniswapV2Router02.sol/UniswapV2Router02.json');

const RPC_URL = process.env.CELO_SEPOLIA_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org';
const PRIVATE_KEY = process.env.CELO_SEPOLIA_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('CELO_SEPOLIA_PRIVATE_KEY not found in .env file');
}

async function main() {
  console.log('🚀 Deploying Uniswap V2 to Celo Sepolia...\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
  
  console.log('Deployer address:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'CELO\n');

  // 1. Deploy WETH9
  console.log('📝 Deploying WETH9...');
  const wethFactory = new ethers.ContractFactory(
    WETH9Artifact.abi,
    WETH9Artifact.bytecode,
    wallet
  );
  const weth = await wethFactory.deploy({ gasLimit: 2000000 });
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log('✅ WETH9 deployed to:', wethAddress, '\n');

  // 2. Deploy UniswapV2Factory
  console.log('📝 Deploying UniswapV2Factory...');
  const factoryFactory = new ethers.ContractFactory(
    UniswapV2FactoryArtifact.abi,
    UniswapV2FactoryArtifact.bytecode,
    wallet
  );
  const factory = await factoryFactory.deploy(wallet.address, { gasLimit: 4000000 });
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log('✅ UniswapV2Factory deployed to:', factoryAddress, '\n');

  // 3. Deploy UniswapV2Router02
  console.log('📝 Deploying UniswapV2Router02...');
  const routerFactory = new ethers.ContractFactory(
    UniswapV2Router02Artifact.abi,
    UniswapV2Router02Artifact.bytecode,
    wallet
  );
  const router = await routerFactory.deploy(factoryAddress, wethAddress, { gasLimit: 6000000 });
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log('✅ UniswapV2Router02 deployed to:', routerAddress, '\n');

  // Print summary
  console.log('========================================');
  console.log('DEPLOYMENT SUMMARY');
  console.log('========================================');
  console.log('WETH9:              ', wethAddress);
  console.log('UniswapV2Factory:   ', factoryAddress);
  console.log('UniswapV2Router02:  ', routerAddress);
  console.log('========================================\n');

  // Save addresses to .env.local
  const envPath = path.join(__dirname, '..', '..', '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add the addresses
  const updates: Record<string, string> = {
    'NEXT_PUBLIC_WETH_ADDRESS': wethAddress,
    'NEXT_PUBLIC_AMM_FACTORY': factoryAddress,
    'NEXT_PUBLIC_AMM_ROUTER': routerAddress,
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('✅ Addresses saved to .env.local\n');

  console.log('🎉 Deployment complete!');
  console.log('Next steps:');
  console.log('1. Deploy or use existing test tokens (cUSD, cEUR, CELO)');
  console.log('2. Run the liquidity seeding script');
  console.log('3. Test pool fetching with the updated addresses');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
