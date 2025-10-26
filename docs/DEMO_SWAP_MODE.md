# Demo Swap Mode 🎭

The swap interface now supports **Demo Mode** - a way to showcase working swap functionality while building out full DEX infrastructure.

## What is Demo Mode?

Demo mode creates **real, verifiable transactions** on the blockchain using a simplified pricing model. This lets you:
- ✅ Demonstrate working swap mechanics
- ✅ Test wallet connectivity
- ✅ Show transaction confirmation flows
- ✅ Generate real transaction hashes for verification
- ✅ Practice with UI/UX without needing liquidity pools

## How It Works

1. **Quote Generation**: Uses a simplified 1:1 pricing model with:
   - 0.3% trading fee
   - Small price impact simulation
   - Real slippage protection

2. **Transaction Execution**: 
   - Creates actual on-chain transactions
   - Uses ERC-20 token transfers
   - Generates verifiable transaction hashes
   - Can be viewed on block explorers

3. **User Experience**:
   - Same UI as production swaps
   - Real wallet approvals
   - Transaction confirmations
   - Explorer links for verification

## Enabling Demo Mode

Add to your `.env.local`:
```bash
NEXT_PUBLIC_DEMO_SWAP_MODE=true
```

## Demo vs Production

| Feature | Demo Mode | Production Mode |
|---------|-----------|----------------|
| Transaction Hash | ✅ Real | ✅ Real |
| Wallet Approval | ✅ Required | ✅ Required |
| Gas Fees | ✅ Real | ✅ Real |
| Pricing | Simulated | Live DEX Pools |
| Liquidity | Not needed | Required |
| Token Transfer | Minimal demo | Full swap |

## Use Cases

### Perfect For:
- 🎬 Demo presentations
- 🧪 Testing wallet integrations
- 📱 UI/UX development
- 🎓 Educational purposes
- 🚀 Early-stage showcases

### Not Suitable For:
- 💰 Real trading
- 📊 Accurate price discovery
- 💧 Liquidity provision
- 🏦 Production use

## Switching to Production

When ready for production:

1. Deploy DEX contracts (Uniswap V2 style router)
2. Set up liquidity pools
3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_DEMO_SWAP_MODE=false
   NEXT_PUBLIC_AMM_ROUTER=0xYourRouterAddress
   ```
4. Restart your dev server

## Technical Details

### Demo Transaction Flow

```
1. User inputs swap parameters
2. API calculates simulated output
3. User approves token (if needed)
4. Creates minimal transfer transaction
5. Returns real tx hash
6. Shows success with simulated amounts
```

### Pricing Formula

```javascript
amountOut = (amountIn * 99.7%) - priceImpact
priceImpact = amountIn * 0.01%
minOut = amountOut * (1 - slippageBps/10000)
```

## Safety Notes

⚠️ **Important**:
- Demo mode uses real gas
- Requires actual token balances
- Creates real blockchain transactions
- Should NOT be used for actual trading
- Always clearly indicate demo mode to users

## Verification

All demo swaps:
- Generate real transaction hashes
- Can be viewed on block explorers
- Show actual gas consumption
- Prove wallet connectivity works

Example verification:
```
Transaction Hash: 0xabc123...
View on Explorer: https://celo-sepolia.celoscan.io/tx/0xabc123...
Status: Success ✅
```

---

**Status**: Demo mode is now active and ready to showcase swap functionality!
