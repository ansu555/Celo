// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/**
 * @title SimpleSwap
 * @notice Minimal swap contract for Uniswap V2-style pairs on Celo Sepolia
 * @dev Performs direct swaps using existing liquidity pools
 */
contract SimpleSwap {
    address public immutable factory;
    address public immutable WETH;
    
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _factory, address _weth) {
        require(_factory != address(0), "Invalid factory");
        require(_weth != address(0), "Invalid WETH");
        factory = _factory;
        WETH = _weth;
    }

    /**
     * @notice Swap exact tokens for tokens
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum amount of output tokens (slippage protection)
     * @param to Recipient address
     * @return amountOut Actual amount of output tokens received
     */
    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "Same token");
        require(amountIn > 0, "Zero amount");
        require(to != address(0), "Invalid recipient");

        // Get pair
        address pair = IUniswapV2Factory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "Pair not found");

        // Transfer input tokens from sender to pair
        require(
            IERC20(tokenIn).transferFrom(msg.sender, pair, amountIn),
            "Transfer failed"
        );

        // Calculate output amount
        amountOut = _getAmountOut(amountIn, tokenIn, tokenOut, pair);
        require(amountOut >= minAmountOut, "Slippage too high");

        // Perform swap
        _swap(tokenIn, tokenOut, amountOut, pair, to);

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice Calculate output amount for a given input using x*y=k formula
     */
    function _getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address /* tokenOut */,
        address pair
    ) internal view returns (uint256 amountOut) {
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pair).getReserves();
        
        address token0 = IUniswapV2Pair(pair).token0();
        
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == token0 
            ? (uint256(reserve0), uint256(reserve1))
            : (uint256(reserve1), uint256(reserve0));

        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        // Apply 0.3% fee (997/1000)
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        amountOut = numerator / denominator;
    }

    /**
     * @notice Execute the swap on the pair
     */
    function _swap(
        address tokenIn,
        address /* tokenOut */,
        uint256 amountOut,
        address pair,
        address to
    ) internal {
        address token0 = IUniswapV2Pair(pair).token0();
        
        (uint256 amount0Out, uint256 amount1Out) = tokenIn == token0
            ? (uint256(0), amountOut)
            : (amountOut, uint256(0));

        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
    }

    /**
     * @notice Get quote for a swap (preview)
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Amount of input tokens
     * @return amountOut Expected output amount
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address pair = IUniswapV2Factory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "Pair not found");
        
        return _getAmountOut(amountIn, tokenIn, tokenOut, pair);
    }

    /**
     * @notice Check if a pair exists
     */
    function pairExists(address tokenA, address tokenB) external view returns (bool) {
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        return pair != address(0);
    }

    /**
     * @notice Get pair address
     */
    function getPair(address tokenA, address tokenB) external view returns (address) {
        return IUniswapV2Factory(factory).getPair(tokenA, tokenB);
    }
}
