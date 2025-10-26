# Celo DEX Multi-Route Swapper – Deployment Guide

## Overview
This project implements:
- **Multi-route swap aggregation** for Celo testnets (Alfajores, Sepolia)
- **Live pool discovery** from Ubeswap V2 (or any UniswapV2-compatible DEX)
- **On-chain MultiRouteSwapper contract** for executing multi-hop swaps through multiple DEX routers
- **Real-time quoting** with price impact calculation

## Network Support
- **Celo Sepolia (testnet)** – Chain ID: 11142220
- **Celo Alfajores (testnet)** – Chain ID: 44787
- Extensible to Celo Mainnet (42220)

## Deployed Contracts

### Celo Sepolia
- **MultiRouteSwapper**: [`0x6D13968b1Fe787ed0237D3645D094161CC165E4c`](https://celo-sepolia.celoscan.io/address/0x6D13968b1Fe787ed0237D3645D094161CC165E4c)

### Celo Alfajores
- Pending deployment (set up `.env` and run deploy command below)

---

## Setup

### Prerequisites
- Node.js v18+
- pnpm (or npm/yarn)
- A test wallet with CELO on the target testnet

### 1. Install Dependencies
```bash
# From repo root
pnpm install

# From blockchain folder
cd blockchain
pnpm install
```

### 2. Configure Environment

#### For Celo Sepolia
Create `blockchain/.env`:
```dotenv
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_SEPOLIA_PRIVATE_KEY=0xYOUR_TEST_PRIVATE_KEY
```

#### For Celo Alfajores
```dotenv
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
ALFAJORES_PRIVATE_KEY=0xYOUR_TEST_PRIVATE_KEY
```

**Security**: Never use a mainnet-funded private key. Generate a test-only wallet:
```bash
cd blockchain
pnpm exec tsx -e "import { Wallet } from 'ethers'; const w=Wallet.createRandom(); console.log('PRIVATE_KEY='+w.privateKey); console.log('ADDRESS='+w.address);"
```

### 3. Fund Your Wallet
- **Celo Sepolia**: https://faucet.celo.org/celo-sepolia
- **Celo Alfajores**: https://faucet.celo.org/alfajores

Request test CELO for gas.

### 4. Check Balance
```bash
cd blockchain
# For Sepolia
pnpm hardhat run scripts/check-balance.ts --network celosepolia

# For Alfajores
pnpm hardhat run scripts/check-balance.ts --network alfajores
```

---

## Deployment

### Deploy MultiRouteSwapper

#### To Celo Sepolia
```bash
cd blockchain
pnpm hardhat ignition deploy ./ignition/modules/MultiRouteSwapper.ts --network celosepolia
```

#### To Celo Alfajores
```bash
pnpm hardhat ignition deploy ./ignition/modules/MultiRouteSwapper.ts --network alfajores
```

The deployed address will be shown in the output and saved to:
- `blockchain/ignition/deployments/chain-<chainId>/deployed_addresses.json`

---

## Live Quoting & Route Discovery

### Configure App Environment
In the repo root, create `.env.local`:

#### For Celo Sepolia
```dotenv
NEXT_PUBLIC_CHAIN_ID=11142220
NEXT_PUBLIC_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
NEXT_PUBLIC_AMM_FACTORY=<ubeswap-factory-address-on-sepolia>
NEXT_PUBLIC_AMM_ROUTER=<ubeswap-router-address-on-sepolia>
```

#### For Celo Alfajores (default)
```dotenv
NEXT_PUBLIC_CHAIN_ID=44787
NEXT_PUBLIC_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_AMM_FACTORY=0x62d5b84bE28a183aBB507E125B384122D2C25fAE
NEXT_PUBLIC_AMM_ROUTER=0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121
```

### Run Live Quote Example
From repo root:
```bash
pnpm exec tsx scripts/alfajores-swap-example.ts
```

**Output**:
- Fetches all available pools from the configured DEX
- Finds the best multi-hop route for a sample swap (e.g., cUSD → CELO → cEUR)
- Prints expected output, route hops, and pool IDs

**Note**: If no DEX is deployed on Celo Sepolia, you'll need to deploy Ubeswap V2 or use static pool data.

---

## On-Chain Swap Execution

### Using the Deployed MultiRouteSwapper

The `MultiRouteSwapper` contract accepts an array of hops, where each hop can call a different DEX router.

**Example Flow**:
1. Approve the `MultiRouteSwapper` to spend your input token (e.g., cUSD).
2. Call `swapExactTokensForTokens` with:
   - `hops`: Array of `RouteHop` structs (router address + path for each hop)
   - `amountIn`: Input token amount
   - `minAmountOut`: Minimum output after slippage
   - `recipient`: Your address
   - `deadline`: Unix timestamp (e.g., now + 300s)

**Sample call** (pseudo-code):
```solidity
struct RouteHop {
  address router;
  address[] path;
}

RouteHop[] memory hops = new RouteHop[](1);
hops[0] = RouteHop({
  router: 0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121, // Ubeswap router
  path: [cUSD, CELO, cEUR]
});

multiRouteSwapper.swapExactTokensForTokens(
  hops,
  10e18,       // 10 cUSD in
  9.5e18,      // min 9.5 cEUR out (5% slippage)
  msg.sender,
  block.timestamp + 300
);
```

We can generate a complete TypeScript runner script with approval + swap if you'd like.

---

## Testing

### Compile Contracts
```bash
cd blockchain
pnpm hardhat compile
```

### Run Unit Tests (if added)
```bash
pnpm hardhat test
```

---

## Architecture

### Key Components

1. **`lib/routing/pools.ts`**
   - Static pool registry (fallback)
   - Runtime pool override for live data

2. **`lib/routing/fetchers/ubeswap.ts`**
   - Fetches all Ubeswap V2 pairs on-chain
   - Auto-registers unknown tokens

3. **`lib/routing/aggregator.ts`**
   - DFS-based route discovery (up to N hops)
   - Constant-product AMM math with fee handling

4. **`lib/chain.ts`**
   - Dynamic chain selection from env
   - Supports custom testnets

5. **`blockchain/contracts/MultiRouteSwapper.sol`**
   - Multi-hop swapper with re-entrancy guard
   - Allowance management
   - Final slippage check

### Contracts

- **MultiRouteSwapper.sol**: Executes multi-DEX routes on-chain. Each hop can target a different router (e.g., Ubeswap, Curve, Mento).

---

## Troubleshooting

### "insufficient funds" on deploy
- Check wallet balance: `pnpm hardhat run scripts/check-balance.ts --network <network>`
- Fund at the faucet (link above)

### "self-signed certificate" error
- Ensure you're using the correct RPC URL:
  - Celo Sepolia: `https://forno.celo-sepolia.celo-testnet.org`
  - Celo Alfajores: `https://alfajores-forno.celo-testnet.org`

### "No pools found" in live quote
- Verify `NEXT_PUBLIC_AMM_FACTORY` and `NEXT_PUBLIC_AMM_ROUTER` are set and valid.
- If using Sepolia and Ubeswap isn't deployed there, deploy your own V2 factory/router or use static pools.

### Gas estimation too high
- Use a lower `maxPairs` limit in `fetchUbeswapPools({ maxPairs: 50 })` to reduce RPC calls.

---

## Next Steps

- [ ] Deploy Ubeswap V2 to Celo Sepolia (if not already available)
- [ ] Add a TypeScript swap execution script with approvals
- [ ] Integrate with UI for user-facing swaps
- [ ] Add support for Curve/Mento pool types
- [ ] Implement split-route aggregation (parallel paths)

---

## License
MIT

## Resources
- [Celo Docs](https://docs.celo.org/)
- [Celo Faucet (Sepolia)](https://faucet.celo.org/celo-sepolia)
- [Celo Faucet (Alfajores)](https://faucet.celo.org/alfajores)
- [Ubeswap Docs](https://docs.ubeswap.org/)
