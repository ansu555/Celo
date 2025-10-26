# SimpleSwap - Minimal DEX Implementation on Celo Sepolia

## Overview

SimpleSwap is a minimal, production-ready swap contract that integrates with Uniswap V2-style liquidity pools on Celo Sepolia testnet. It provides a clean, gas-efficient interface for token swaps without the complexity of the full Uniswap router.

## 🎯 Features

- ✅ **Simple & Secure**: Minimal attack surface with straightforward swap logic
- ✅ **Gas Efficient**: Direct pair interactions without unnecessary routing
- ✅ **Slippage Protection**: Built-in minimum output amount checks
- ✅ **Uniswap V2 Compatible**: Works with any Uniswap V2 fork on Celo
- ✅ **View Functions**: Get quotes before executing swaps
- ✅ **Event Emission**: Track all swaps on-chain

## 📝 Contract Details

### Deployed Addresses

```
SimpleSwap: 0x43D0e4E5b4781d96D0d482377B3fE5D2ddEfE930
Factory:     0xa6bAeA5811Bd070AeF343537b03A909597002526
WETH:        0x6b1F4e0Eea462745750dddaEB11FB85B968a87F6
cUSD:        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
cEUR:        0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F
```

### Core Functions

#### `swapExactTokensForTokens`
```solidity
function swapExactTokensForTokens(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,
    address to
) external returns (uint256 amountOut)
```

Swaps an exact amount of input tokens for output tokens.

**Parameters:**
- `tokenIn`: Address of input token
- `tokenOut`: Address of output token
- `amountIn`: Exact amount of input tokens to swap
- `minAmountOut`: Minimum amount of output tokens (slippage protection)
- `to`: Recipient address

**Returns:** Actual amount of output tokens received

#### `getAmountOut`
```solidity
function getAmountOut(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external view returns (uint256 amountOut)
```

Preview the output amount for a given swap (no transaction).

#### `pairExists`
```solidity
function pairExists(
    address tokenA,
    address tokenB
) external view returns (bool)
```

Check if a liquidity pool exists for the token pair.

#### `getPair`
```solidity
function getPair(
    address tokenA,
    address tokenB
) external view returns (address)
```

Get the address of the liquidity pool for a token pair.

## 🚀 Usage

### From Command Line (Scripts)

#### 1. Deploy SimpleSwap
```bash
cd blockchain
npx tsx scripts/deploy-simple-swap.ts
```

#### 2. Create Liquidity Pool (if needed)
```bash
npx tsx scripts/create-liquidity.ts
```

#### 3. Execute Test Swap
```bash
npx tsx scripts/test-simple-swap.ts
```

### From Frontend (TypeScript/React)

```typescript
import { ethers } from 'ethers';
import { SimpleSwapService } from '@/lib/simple-swap';

// Initialize
const provider = new ethers.BrowserProvider(window.ethereum);
const swapService = new SimpleSwapService(provider);

// Get quote
const quote = await swapService.getQuote({
  tokenIn: '0x6b1F4e0Eea462745750dddaEB11FB85B968a87F6', // WETH
  tokenOut: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // cUSD
  amountIn: '0.01', // 0.01 WETH
  slippageTolerance: 0.5 // 0.5%
});

console.log(`Expected output: ${quote.amountOut} cUSD`);
console.log(`Minimum received: ${quote.minimumReceived} cUSD`);

// Execute swap
const txHash = await swapService.executeSwap({
  tokenIn: '0x6b1F4e0Eea462745750dddaEB11FB85B968a87F6',
  tokenOut: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  amountIn: '0.01',
  slippageTolerance: 0.5
});

console.log(`Swap completed: ${txHash}`);
```

### Direct Contract Interaction (ethers.js)

```typescript
import { ethers } from 'ethers';

const SIMPLE_SWAP_ADDRESS = '0x43D0e4E5b4781d96D0d482377B3fE5D2ddEfE930';
const SIMPLE_SWAP_ABI = [
  'function swapExactTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to) external returns (uint256 amountOut)',
  'function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256 amountOut)'
];

const provider = new ethers.JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const swap = new ethers.Contract(SIMPLE_SWAP_ADDRESS, SIMPLE_SWAP_ABI, wallet);

// Get quote
const amountOut = await swap.getAmountOut(
  tokenInAddress,
  tokenOutAddress,
  ethers.parseEther('1.0')
);

// Execute swap (requires prior approval)
const tx = await swap.swapExactTokensForTokens(
  tokenInAddress,
  tokenOutAddress,
  ethers.parseEther('1.0'),
  amountOut * 95n / 100n, // 5% slippage
  wallet.address
);

await tx.wait();
```

## 🔧 Development

### Prerequisites
```bash
# Install dependencies
cd blockchain
pnpm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Celo Sepolia
```bash
# Make sure PRIVATE_KEY is set in .env.local
npx tsx scripts/deploy-simple-swap.ts
```

## 🌊 Creating Liquidity Pools

Before using SimpleSwap, you need liquidity pools. Here's how to create one:

```bash
# Creates a cUSD/WETH pair with initial liquidity
npx tsx scripts/create-liquidity.ts
```

**Manual Process:**
1. Create pair using factory
2. Transfer both tokens to pair address
3. Call `mint()` on the pair contract

See `scripts/create-liquidity.ts` for full implementation.

## 📊 Swap Pricing Formula

SimpleSwap uses the Uniswap V2 constant product formula (x*y=k):

```
amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
```

- **Fee**: 0.3% (3/1000) deducted from input amount
- **Slippage**: Set via `minAmountOut` parameter
- **Price Impact**: Determined by reserves and swap size

## ⚠️ Important Notes

1. **Approvals Required**: Users must approve SimpleSwap to spend their tokens before swapping
2. **Pair Must Exist**: Liquidity pool must exist before swapping
3. **Slippage**: Always set a reasonable `minAmountOut` to protect against frontrunning
4. **Testnet Only**: Currently deployed on Celo Sepolia testnet
5. **Gas Costs**: Typical swap costs ~100k-150k gas

## 🛡️ Security Considerations

- ✅ No ownership or admin functions
- ✅ No token storage in contract
- ✅ Direct pair interactions only
- ✅ Immutable factory and WETH addresses
- ✅ Slippage protection via `minAmountOut`
- ⚠️ Always verify pair addresses before swapping
- ⚠️ Beware of price manipulation in low-liquidity pools

## 📂 File Structure

```
blockchain/
├── contracts/
│   └── SimpleSwap.sol           # Main swap contract
├── scripts/
│   ├── deploy-simple-swap.ts    # Deploy script
│   ├── create-liquidity.ts      # Create pools
│   ├── test-simple-swap.ts      # Test swaps
│   └── quick-swap-setup.ts      # All-in-one setup
lib/
└── simple-swap.ts               # Frontend service
```

## 🎨 Frontend Integration

The `SimpleSwapService` class (in `lib/simple-swap.ts`) provides a clean interface for React/Next.js applications:

```typescript
// In your swap component
const [quote, setQuote] = useState<SwapQuote | null>(null);

const handleGetQuote = async () => {
  const quote = await swapService.getQuote({
    tokenIn: selectedTokenIn,
    tokenOut: selectedTokenOut,
    amountIn: inputAmount,
    slippageTolerance: 0.5
  });
  setQuote(quote);
};

const handleSwap = async () => {
  try {
    const txHash = await swapService.executeSwap({
      tokenIn: selectedTokenIn,
      tokenOut: selectedTokenOut,
      amountIn: inputAmount,
      slippageTolerance: 0.5
    });
    console.log('Swap successful:', txHash);
  } catch (error) {
    console.error('Swap failed:', error);
  }
};
```

## 🔗 Resources

- [Uniswap V2 Documentation](https://docs.uniswap.org/contracts/v2/overview)
- [Celo Testnet Faucet](https://faucet.celo.org/)
- [Celo Explorer](https://explorer.celo.org/alfajores)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Note**: This is a simplified implementation for educational and testnet use. For production mainnet deployment, consider additional security audits and features like multi-hop routing, flash loan protection, and emergency pause functionality.
