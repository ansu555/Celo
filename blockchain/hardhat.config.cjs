require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox-mocha-ethers");

const CELO_SEPOLIA_RPC = process.env.CELO_SEPOLIA_RPC || 'https://forno.celo-sepolia.celo-testnet.org/';
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    celoSepolia: {
      url: CELO_SEPOLIA_RPC,
      chainId: 11142220,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : []
    },
    hardhat: {
      chainId: 1337
    }
  },
  // Uncomment and configure etherscan plugin if you have an explorer verification key for Celoscan (if supported)
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY
  // }
};
