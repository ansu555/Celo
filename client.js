// client.js
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// --- Connect to CELO testnet RPC ---
const CELO_RPC_URL =
  process.env.CELO_RPC_URL || "https://forno.celo-testnet.org";
export const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);

// --- Create wallet signer ---
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("❌ Missing PRIVATE_KEY in .env");

export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// --- Export helper functions ---
export async function getAddress() {
  return wallet.address;
}

export const publicClient = provider; // alias for ethers provider

console.log(`✅ Connected to CELO Testnet as: ${wallet.address}`);
