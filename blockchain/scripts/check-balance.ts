import 'dotenv/config'
import { JsonRpcProvider, Wallet, formatEther } from "ethers";

async function main() {
  const rpcUrl = process.env.CELO_SEPOLIA_RPC_URL || process.env.ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
  const pk = process.env.CELO_SEPOLIA_PRIVATE_KEY || process.env.ALFAJORES_PRIVATE_KEY
  if (!pk) {
    throw new Error('Set CELO_SEPOLIA_PRIVATE_KEY (or ALFAJORES_PRIVATE_KEY) in blockchain/.env')
  }
  const provider = new JsonRpcProvider(rpcUrl)
  const wallet = new Wallet(pk, provider)
  const address = await wallet.getAddress()
  const balanceWei = await provider.getBalance(address)
  console.log("Network: Alfajores (testnet)");
  console.log("Address:", address);
  console.log("CELO balance (wei):", balanceWei.toString());
  console.log("CELO balance:", formatEther(balanceWei));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
