import { ethers } from 'ethers';

const SIMPLE_SWAP_ABI = [
  'function swapExactTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to) external returns (uint256 amountOut)',
  'function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256 amountOut)',
  'function pairExists(address tokenA, address tokenB) external view returns (bool)',
  'function getPair(address tokenA, address tokenB) external view returns (address)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string; // In ether units (e.g., "1.5")
  slippageTolerance?: number; // Percentage (e.g., 0.5 for 0.5%)
}

export interface SwapQuote {
  amountOut: string; // In ether units
  minimumReceived: string;
  priceImpact: number;
  route: string[];
}

export class SimpleSwapService {
  private provider: ethers.BrowserProvider;
  private swapAddress: string;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
    const swapAddress = process.env.NEXT_PUBLIC_SIMPLE_SWAP;
    if (!swapAddress) {
      throw new Error('NEXT_PUBLIC_SIMPLE_SWAP not configured');
    }
    this.swapAddress = swapAddress;
  }

  /**
   * Get a quote for a swap
   */
  async getQuote(params: SwapParams): Promise<SwapQuote | null> {
    try {
      const swap = new ethers.Contract(this.swapAddress, SIMPLE_SWAP_ABI, this.provider);
      
      // Check if pair exists
      const pairExists = await swap.pairExists(params.tokenIn, params.tokenOut);
      if (!pairExists) {
        console.warn('No liquidity pool exists for this pair');
        return null;
      }

      // Get token decimals
      const tokenIn = new ethers.Contract(params.tokenIn, ERC20_ABI, this.provider);
      const decimals = await tokenIn.decimals();

      // Convert amount to wei
      const amountInWei = ethers.parseUnits(params.amountIn, decimals);

      // Get output amount
      const amountOutWei = await swap.getAmountOut(params.tokenIn, params.tokenOut, amountInWei);
      
      const tokenOut = new ethers.Contract(params.tokenOut, ERC20_ABI, this.provider);
      const decimalsOut = await tokenOut.decimals();
      const amountOut = ethers.formatUnits(amountOutWei, decimalsOut);

      // Calculate minimum received with slippage
      const slippage = params.slippageTolerance || 0.5;
      const minAmountOutWei = (amountOutWei * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
      const minimumReceived = ethers.formatUnits(minAmountOutWei, decimalsOut);

      // Calculate price impact (simplified)
      const priceImpact = 0.3; // 0.3% fee for Uniswap V2 style

      return {
        amountOut,
        minimumReceived,
        priceImpact,
        route: [params.tokenIn, params.tokenOut]
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  /**
   * Execute a swap
   */
  async executeSwap(params: SwapParams): Promise<string | null> {
    try {
      const signer = await this.provider.getSigner();
      const swap = new ethers.Contract(this.swapAddress, SIMPLE_SWAP_ABI, signer);
      const tokenIn = new ethers.Contract(params.tokenIn, ERC20_ABI, signer);

      // Get decimals
      const decimals = await tokenIn.decimals();
      const amountInWei = ethers.parseUnits(params.amountIn, decimals);

      // Check and set approval if needed
      const signerAddress = await signer.getAddress();
      const currentAllowance = await tokenIn.allowance(signerAddress, this.swapAddress);

      if (currentAllowance < amountInWei) {
        console.log('Approving tokens...');
        const approveTx = await tokenIn.approve(this.swapAddress, ethers.MaxUint256);
        await approveTx.wait();
        console.log('Tokens approved');
      }

      // Get quote to calculate minimum output
      const quote = await this.getQuote(params);
      if (!quote) {
        throw new Error('Unable to get quote');
      }

      const tokenOut = new ethers.Contract(params.tokenOut, ERC20_ABI, this.provider);
      const decimalsOut = await tokenOut.decimals();
      const minAmountOutWei = ethers.parseUnits(quote.minimumReceived, decimalsOut);

      // Execute swap
      console.log('Executing swap...');
      const swapTx = await swap.swapExactTokensForTokens(
        params.tokenIn,
        params.tokenOut,
        amountInWei,
        minAmountOutWei,
        signerAddress
      );

      const receipt = await swapTx.wait();
      console.log('Swap successful:', receipt.hash);
      return receipt.hash;
    } catch (error: any) {
      console.error('Error executing swap:', error);
      throw new Error(error.message || 'Swap failed');
    }
  }

  /**
   * Check if a trading pair exists
   */
  async checkPairExists(tokenA: string, tokenB: string): Promise<boolean> {
    const swap = new ethers.Contract(this.swapAddress, SIMPLE_SWAP_ABI, this.provider);
    return await swap.pairExists(tokenA, tokenB);
  }

  /**
   * Get pair address
   */
  async getPairAddress(tokenA: string, tokenB: string): Promise<string> {
    const swap = new ethers.Contract(this.swapAddress, SIMPLE_SWAP_ABI, this.provider);
    return await swap.getPair(tokenA, tokenB);
  }
}
