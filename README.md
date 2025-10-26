Accorto
=======

Accorto is a modern web application that allows users to explore cryptocurrency markets and manage assets on **Celo**. It features an **AI-powered agent** capable of interpreting natural language to p[...]

System Architecture

For a comprehensive overview including multi-chain infrastructure & design:

**SYSTEM_ARCHITECTURE.md**

Backend Architecture

Detailed implementation including gasless execution, agent pipelines & optimization:

**BACKEND_ARCHITECTURE.md**

How It Works: Project Architecture

The application is built using **Next.js App Router** with:

- Server-rendered UI
- Serverless backend APIs
- Multi-chain support with focus on Celo Mainnet + Alfajores
- Gasless smart accounts via 0xGasless Agentkit

Key Folders

Getting Started

Prerequisites

*   Node.js ≥ 18
*   Bun (preferred package/runtime manager)

1. Installation

2. Environment Setup

Configure API keys (see next section)

3. Running the App

Visit: http://localhost:3000

API Keys & Configuration

Required

**CELO Network RPC**

**Environment variable format:**

API Endpoints

**POST /api/agent/chat**

**Purpose:** Handles all AI interaction & executes tools

**Request:**

**Response:**

AI Agent Features

**Gasless Smart Account (ERC-4337)**

*   CELO or ERC-20 transactions
*   Sponsored by 0xGasless Paymaster

**Natural Language Commands**

Supported Tokens

- **Celo Mainnet (42220)**
- **Alfajores Testnet (44787)**

MCP Analytics Server

Provides:

*   Technical indicators (RSI, MACD, SMA/EMA)
*   Forecasting
*   Market trend classification
*   SVG chart generation

MCP Setup

Add these to .env.local:

Documentation

Security Notes

*   Never use wallets with real funds in dev
*   .env.local is private — never commit it
*   Use different wallets for prod/test

Status

- CELO Mainnet Ready
- Fully Gasless UX
- AI Agent Execution
- Technical Analytics Engine
- Swap + Transfer Enabled

Support

For help:

1. Check architecture docs
2. Validate your .env.local
3. Ensure MCP server running if using analytics
