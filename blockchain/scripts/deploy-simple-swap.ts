import { ethers } from 'ethers';
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SimpleSwapArtifact = require('../artifacts/contracts/SimpleSwap.sol/SimpleSwap.json');

const RPC_URL = process.env.RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
  console.log("🚀 Deploying SimpleSwap contract to Celo Sepolia...\n");

  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env.local');
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("📝 Deploying with account:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "CELO\n");

  // Get factory and WETH from env
  const factory = process.env.NEXT_PUBLIC_AMM_FACTORY;
  const weth = process.env.NEXT_PUBLIC_WETH_ADDRESS;

  if (!factory || !weth) {
    throw new Error("Missing NEXT_PUBLIC_AMM_FACTORY or NEXT_PUBLIC_WETH_ADDRESS in .env.local");
  }

  console.log("📍 Using Factory:", factory);
  console.log("📍 Using WETH:", weth);

  // Deploy SimpleSwap
  console.log("\n⏳ Deploying SimpleSwap...");
  const SimpleSwapFactory = new ethers.ContractFactory(
    SimpleSwapArtifact.abi,
    SimpleSwapArtifact.bytecode,
    wallet
  );
  
  const simpleSwap = await SimpleSwapFactory.deploy(factory, weth);
  await simpleSwap.waitForDeployment();

  const swapAddress = await simpleSwap.getAddress();
  console.log("✅ SimpleSwap deployed to:", swapAddress);

  // Update .env.local
  const envPath = path.resolve(__dirname, "../../.env.local");
  let envContent = fs.readFileSync(envPath, "utf-8");

  // Add or update SIMPLE_SWAP_ADDRESS
  if (envContent.includes("NEXT_PUBLIC_SIMPLE_SWAP=")) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SIMPLE_SWAP=.*/,
      `NEXT_PUBLIC_SIMPLE_SWAP=${swapAddress}`
    );
  } else {
    envContent += `\n# Simple Swap Contract\nNEXT_PUBLIC_SIMPLE_SWAP=${swapAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Updated .env.local with NEXT_PUBLIC_SIMPLE_SWAP");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("SimpleSwap Address:", swapAddress);
  console.log("Factory:", factory);
  console.log("WETH:", weth);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
