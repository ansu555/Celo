# Accorto

Accorto is a modern web application that allows users to explore cryptocurrency markets and manage assets on **Celo**. It features an **AI-powered agent** capable of interpreting natural language to provide trading, analytics, and gasless transaction execution.

## System Architecture

For a comprehensive overview including multi-chain infrastructure & design, see:
- SYSTEM_ARCHITECTURE.md

## Backend Architecture

Detailed implementation including gasless execution, agent pipelines & optimization:
- BACKEND_ARCHITECTURE.md

## How It Works: Project Architecture

The application is built using the Next.js App Router with:
- Server-rendered UI
- Serverless backend APIs
- Multi-chain support with focus on Celo Mainnet + Alfajores
- Gasless smart accounts via 0xGasless Agentkit

## Key Folders

(Include project-specific folder descriptions here)

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Bun (preferred package/runtime manager)

### Installation
1. Install dependencies (use your preferred package manager)
2. Build the app

### Environment Setup
Configure API keys (see API Keys & Configuration below)

### Running the App
Visit: http://localhost:3000

## API Keys & Configuration

Required:
- CELO Network RPC

Environment variable format:
- Add RPC and other secrets to `.env.local` (never commit this file)

## API Endpoints

- POST /api/agent/chat
  - Purpose: Handles all AI interaction & executes tools
  - Request: (JSON payload with agent prompt/commands)
  - Response: (agent responses / execution results)

## AI Agent Features

### Gasless Smart Account (ERC-4337)
- CELO or ERC-20 transactions
- Sponsored by 0xGasless Paymaster

### Natural Language Commands
- The agent accepts natural language instructions for swaps, transfers, queries, and analytics.

## Supported Networks / Tokens

- Celo Mainnet (Chain ID: 42220)
- Alfajores Testnet (Chain ID: 44787)

## MCP Analytics Server

Provides:
- Technical indicators (RSI, MACD, SMA/EMA)
- Forecasting
- Market trend classification
- SVG chart generation

### MCP Setup
Add MCP server configuration to `.env.local` if using analytics features.

## Deployed Contracts (Sepolia)

- SimpleSwap — https://celo-sepolia.blockscout.com/address/0x43D0e4E5b4781d96D0d482377B3fE5D2ddEfE930
- Multipleswap — https://celo-sepolia.blockscout.com/address/0x6D13968b1Fe787ed0237D3645D094161CC165E4c
- UniswapV2Router02 — https://celo-sepolia.blockscout.com/address/0x4296e3e1d3efbb5bac66a66f1E463BAc25Ec6189
- UniswapV2Factory — https://celo-sepolia.blockscout.com/address/0xa6bAeA5811Bd070AeF343537b03A909597002526
- WETH9 — https://celo-sepolia.blockscout.com/address/0x6b1F4e0Eea462745750dddaEB11FB85B968a87F6

## Security Notes

- Never use wallets with real funds in dev
- `.env.local` is private — never commit it
- Use different wallets for prod/test

## Status

- CELO Mainnet Ready
- Fully Gasless UX
- AI Agent Execution
- Technical Analytics Engine
- Swap + Transfer Enabled

## Support

For help:
1. Check architecture docs
2. Validate your `.env.local`
3. Ensure MCP server running if using analytics

---
