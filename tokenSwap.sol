// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenSwap is ERC20, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // State variables
    address public treasury;
    uint256 public immutable swapFees = 1; // 1% swapFees on buy and sell
    IERC20 public immutable USDT = IERC20(0x337610d27c682E347C9cD60BD4b3b107C9d34dDd);

    // Events
    event TokensBought(address indexed _buyer, uint256 _amount, uint256 _receivedAmount);
    event TokensSold(address indexed _buyer, uint256 _amount, uint256 _receivedAmount);
    event SwapFeesUpdated(uint256 _fees);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    // Custom errors for gas optimization
    error InsufficientBalance(uint256 required, uint256 available);
    error InvalidAmount();
    error InsufficientLiquidity();
    error TransferFailed();
    error InvalidToken();

    constructor() ERC20 ("Arrnaya", unicode"ɑׁׅ֮ꭈׁׅꭈׁׅꪀׁׅɑׁׅ֮ᨮ꫶ׁׅ֮ɑׁׅ֮") Ownable(msg.sender) {
        treasury = msg.sender;
    }

    /**
     * @dev Calculates the amount to be received after fees
     * @param amount Input amount
     * @return Output amount after fees
     */
    function calculateOutputAmount(uint256 amount) public pure returns (uint256) {
        return amount - ((amount * swapFees) / 100);
    }

    /**
     * @dev Buy token
     * @param amount Amount of USDT to swap
     * @return Amount of Tokens received
     */
    function buyTokens(uint256 amount) external nonReentrant returns (uint256) {
        if (amount == 0) revert InvalidAmount();

        // Cache balances
        uint256 userBalance = USDT.balanceOf(msg.sender);
        if (userBalance < amount) {
            revert InsufficientBalance(amount, userBalance);
        }

        uint256 TokensToSend = calculateOutputAmount(amount);
        uint256 TreasuryAmount = (amount * swapFees) / 100;

        // Transfer tokens using SafeERC20
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        USDT.safeTransfer(treasury, TreasuryAmount);

        _mint(msg.sender, TokensToSend);

        emit TokensBought(msg.sender, amount, TokensToSend);
        return TokensToSend;
    }

    /**
     * @dev Sell tokens
     * @param amount Amount of TOKENS to swap
     * @return Amount of USDT received
     */
    function sellTokens(uint256 amount) external nonReentrant returns (uint256) {
        if (amount == 0) revert InvalidAmount();

        // Cache balances
        uint256 userTokenBalance = this.balanceOf(msg.sender);
        if (userTokenBalance < amount) {
            revert InsufficientBalance(amount, userTokenBalance);
        }

        uint256 UsdtAmount = calculateOutputAmount(amount);
        uint256 contractUsdtBalance = USDT.balanceOf(address(this));

        uint256 TreasuryAmount = (amount * swapFees) / 100;
        
        if (contractUsdtBalance < UsdtAmount) {
            revert InsufficientLiquidity();
        }

        _burn(msg.sender, amount);

        // Transfer tokens using SafeERC20
        USDT.safeTransfer(msg.sender, UsdtAmount);
        USDT.safeTransfer(treasury, TreasuryAmount);

        emit TokensSold(msg.sender, amount, UsdtAmount);
        return UsdtAmount;
    }

    /**
     * @dev Emergency withdraw function for any ERC20 token
     * @param _token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawERC20Tokens(address _token, uint256 amount) external onlyOwner {
        if(IERC20(_token) == USDT) {
            revert InvalidToken(); // Can't allow owner to drain Liquidity
        }
        IERC20(_token).safeTransfer(treasury, amount);
        emit EmergencyWithdraw(_token, amount);
    }

    /**
     * @dev View function to get contract token balances
     * @return usdtBalance USDT balance
     */
    function getContractBalances() external view returns (uint256 usdtBalance) {
        return USDT.balanceOf(address(this));
    }
}