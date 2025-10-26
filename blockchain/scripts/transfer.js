import hre from "hardhat";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Get command line arguments
  const tokenAddress = process.argv[2];
  const recipientAddress = process.argv[3];
  const amount = process.argv[4];

  if (!tokenAddress || !recipientAddress || !amount) {
    console.error("Usage: npx hardhat run --network celoSepolia scripts/transfer.js <TOKEN_ADDRESS> <RECIPIENT_ADDRESS> <AMOUNT>");
    console.error("Example: npx hardhat run --network celoSepolia scripts/transfer.js 0x123... 0x456... 100");
    process.exit(1);
  }

  const [sender] = await hre.ethers.getSigners();
  console.log("Transferring from:", sender.address);
  console.log("To:", recipientAddress);
  console.log("Amount:", amount, "tokens");

  const MyToken = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Get token info
  const name = await MyToken.name();
  const symbol = await MyToken.symbol();
  const decimals = await MyToken.decimals();
  
  console.log(`Token: ${name} (${symbol})`);
  
  // Parse amount with decimals
  const amountWithDecimals = hre.ethers.parseUnits(amount, decimals);
  
  // Check sender balance
  const senderBalance = await MyToken.balanceOf(sender.address);
  console.log("Sender balance:", hre.ethers.formatUnits(senderBalance, decimals), symbol);
  
  if (senderBalance < amountWithDecimals) {
    console.error("Error: Insufficient balance");
    process.exit(1);
  }
  
  // Execute transfer
  console.log("Sending transaction...");
  const tx = await MyToken.transfer(recipientAddress, amountWithDecimals);
  console.log("Transaction hash:", tx.hash);
  
  console.log("Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // Display new balances
  const newSenderBalance = await MyToken.balanceOf(sender.address);
  const recipientBalance = await MyToken.balanceOf(recipientAddress);
  
  console.log("\n✅ Transfer successful!");
  console.log("Sender new balance:", hre.ethers.formatUnits(newSenderBalance, decimals), symbol);
  console.log("Recipient balance:", hre.ethers.formatUnits(recipientBalance, decimals), symbol);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
