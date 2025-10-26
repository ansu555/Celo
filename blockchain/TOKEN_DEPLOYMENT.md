# ERC-20 Token Deployment on Celo Sepolia

This directory contains scripts and contracts for deploying custom ERC-20 tokens on Celo Sepolia testnet.

## Setup

### 1. Install Dependencies

Dependencies have already been installed:
- `hardhat` - Development environment
- `ethers` - Ethereum library
- `dotenv` - Environment variable management
- `@openzeppelin/contracts` - Secure smart contract library

### 2. Configure Environment

Create a `.env` file in the `blockchain` directory:

```bash
cp .env.example .env
```

Then edit `.env` and add:

```env
CELO_SEPOLIA_RPC=https://forno.celo-sepolia.celo-testnet.org/
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
TOKEN_NAME=MySepoliaToken
TOKEN_SYMBOL=MST
INITIAL_SUPPLY=1000000
```

**Important**: Your deployer account must have CELO on Sepolia to pay for gas fees.

### 3. Getting Test CELO

To get CELO on Sepolia testnet:
- Use a Celo Sepolia faucet (if available)
- Ask in Celo developer communities
- For local testing, you can fork Celo mainnet using Hardhat

## Usage

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy Token

```bash
npx hardhat run --network celoSepolia scripts/deploy.js
```

This will:
- Deploy the token with parameters from `.env`
- Mint initial supply to deployer address
- Output the contract address and transaction hash

Example output:
```
Deploying with: 0x1234...5678
Token deployed to: 0xabcd...ef01
Name: MySepoliaToken | Symbol: MST | Initial supply: 1000000
Deployer balance (tokens): 1000000000000000000000000
Transaction hash: 0x...
```

### Read Token Information

After deployment, verify the token:

```bash
npx hardhat run --network celoSepolia scripts/read.js <TOKEN_ADDRESS>
```

Example:
```bash
npx hardhat run --network celoSepolia scripts/read.js 0xabcd...ef01
```

This will display:
- Token name, symbol, and decimals
- Total supply
- Deployer balance

## Contract Details

### MyToken.sol

The contract includes:
- **ERC-20 Standard**: Full implementation from OpenZeppelin
- **Ownable**: Owner can mint additional tokens
- **Initial Supply**: Minted to deployer at deployment
- **Mint Function**: Owner can mint more tokens to any address

```solidity
function mint(address to, uint256 amount) external onlyOwner
```

## Configuration

### hardhat.config.js

The configuration includes:
- **Solidity Version**: 0.8.20 with optimizer enabled
- **Networks**:
  - `celoSepolia`: Celo Sepolia testnet (Chain ID: 11142220)
  - `hardhat`: Local development network

## Security Notes

⚠️ **Important Security Practices**:

1. Never commit `.env` file to git
2. Keep your private key secure
3. Use a separate wallet for testing
4. Verify contract addresses before interacting
5. Test on testnets before mainnet deployment

## Troubleshooting

### "Insufficient funds for gas"
Your deployer account needs CELO on Sepolia. Get test CELO from a faucet.

### "ERESOLVE unable to resolve dependency tree"
The project uses ethers v6. The scripts are adapted for v6 compatibility.

### "Cannot find module 'dotenv'"
Run `npm install` in the blockchain directory.

## Additional Scripts

You can create additional scripts for:
- Token transfers
- Approval and allowance management
- Burning tokens
- Ownership transfer

Example token transfer script:
```javascript
const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x...";
  const recipientAddress = "0x...";
  const amount = hre.ethers.parseEther("100"); // 100 tokens
  
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  const tx = await token.transfer(recipientAddress, amount);
  await tx.wait();
  
  console.log("Transfer complete:", tx.hash);
}

main().catch(console.error);
```

## Resources

- [Celo Documentation](https://docs.celo.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
