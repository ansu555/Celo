import hre from "hardhat";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const tokenAddress = process.argv[2];
  if (!tokenAddress) {
    console.error("Provide token address as first arg");
    process.exit(1);
  }
  
  const MyToken = await hre.ethers.getContractAt("MyToken", tokenAddress);
  console.log("Token Address:", tokenAddress);
  console.log("Name:", await MyToken.name());
  console.log("Symbol:", await MyToken.symbol());
  console.log("Decimals:", await MyToken.decimals());
  console.log("Total supply:", (await MyToken.totalSupply()).toString());
  
  // Get deployer balance
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", (await MyToken.balanceOf(deployer.address)).toString());
}

main().catch(console.error);
