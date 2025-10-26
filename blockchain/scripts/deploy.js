import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  const rpcUrl = "https://forno.celo-sepolia.celo-testnet.org/";
  const deployerKey =
    "0xbafb4c23c56816d3d16b49347e9891b88081b10a43aaebc8ca3d682a90476d5f";
  const name = "MySepoliaToken";
  const symbol = "MST";
  const initialSupply = "1000000";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(deployerKey, provider);
  console.log("Deploying with:", wallet.address);

  // Load compiled contract ABI & bytecode
  const artifactPath = path.resolve(
    "./artifacts/contracts/MyToken.sol/MyToken.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const token = await factory.deploy(name, symbol, initialSupply);
  console.log("⏳ Deploying contract...");

  (await token.waitForDeployment)
    ? await token.waitForDeployment()
    : await token.deployed();

  console.log("✅ Token deployed at:", token.target || token.address);
  console.log(
    `Name: ${name} | Symbol: ${symbol} | Initial supply: ${initialSupply}`
  );
  const balance = await token.balanceOf(wallet.address);
  console.log("Deployer token balance:", balance.toString());
  console.log("Tx hash:", token.deployTransaction.hash);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
