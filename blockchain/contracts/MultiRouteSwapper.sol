// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Minimal {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract MultiRouteSwapper {
    struct RouteHop {
        address router;
        address[] path;
    }

    uint256 private constant ALLOWANCE_BUFFER = type(uint256).max;
    uint256 private unlocked = 1;

    event MultiRouteSwap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    modifier nonReentrant() {
        require(unlocked == 1, "LOCKED");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    function swapExactTokensForTokens(
        RouteHop[] calldata hops,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(hops.length > 0, "NO_HOPS");
        require(recipient != address(0), "BAD_RECIPIENT");
        require(deadline >= block.timestamp, "DEADLINE_PASSED");

        address inputToken = hops[0].path[0];
        address outputToken = hops[hops.length - 1].path[hops[hops.length - 1].path.length - 1];
        require(inputToken != address(0) && outputToken != address(0), "BAD_PATH");

        _pullToken(inputToken, amountIn);

        uint256 runningAmount = amountIn;

        for (uint256 i = 0; i < hops.length; i++) {
            RouteHop calldata hop = hops[i];
            require(hop.router != address(0), "BAD_ROUTER");
            require(hop.path.length >= 2, "SHORT_PATH");
            require(hop.path[0] != address(0), "BAD_INPUT");

            _approveIfNeeded(hop.path[0], hop.router, runningAmount);

            uint256 amountOutMinStep = i == hops.length - 1 ? minAmountOut : 0;
            uint256[] memory amounts = IUniswapV2Router02(hop.router).swapExactTokensForTokens(
                runningAmount,
                amountOutMinStep,
                hop.path,
                address(this),
                deadline
            );

            runningAmount = amounts[amounts.length - 1];
        }

        require(runningAmount >= minAmountOut, "INSUFFICIENT_OUTPUT");

        _pushToken(outputToken, recipient, runningAmount);

        emit MultiRouteSwap(msg.sender, inputToken, outputToken, amountIn, runningAmount);
        return runningAmount;
    }

    function _pullToken(address token, uint256 amount) private {
        require(IERC20Minimal(token).transferFrom(msg.sender, address(this), amount), "TRANSFER_IN_FAIL");
    }

    function _pushToken(address token, address to, uint256 amount) private {
        require(IERC20Minimal(token).transfer(to, amount), "TRANSFER_OUT_FAIL");
    }

    function _approveIfNeeded(address token, address spender, uint256 amount) private {
        IERC20Minimal erc = IERC20Minimal(token);
        uint256 allowance = erc.allowance(address(this), spender);
        if (allowance < amount) {
            if (allowance > 0) {
                require(erc.approve(spender, 0), "APPROVE_RESET_FAIL");
            }
            require(erc.approve(spender, ALLOWANCE_BUFFER), "APPROVE_FAIL");
        }
    }
}
