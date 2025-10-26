import type { HardhatUserConfig } from "hardhat/config";
import 'dotenv/config'

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    alfajores: {
      type: "http",
      chainType: "l1",
      url: configVariable("ALFAJORES_RPC_URL"),
      accounts: [configVariable("ALFAJORES_PRIVATE_KEY")],
    },
    celosepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("CELO_SEPOLIA_RPC_URL"),
      accounts: [configVariable("CELO_SEPOLIA_PRIVATE_KEY")],
    },
    celoSepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.CELO_SEPOLIA_RPC || 'https://forno.celo-sepolia.celo-testnet.org/',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
};

export default config;
