# ERC20Token-Swap

This repository contains the code for an ERC20 token swap mechanism using a predefined ratio, implemented in Solidity. The project includes a smart contract that handles the swapping of tokens and a frontend interface built with HTML, CSS, and JavaScript. It leverages **Ethers.js** and **Web3.js** for interacting with the smart contract.

Demo link [https://defi-swap-with-solidity.netlify.app/](https://defi-swap-with-solidity.netlify.app/)

Get test BNBs and USDT here: [https://www.bnbchain.org/en/testnet-faucet](https://www.bnbchain.org/en/testnet-faucet)

---

#### Key Features of the Smart Contract:
1. **Token Swapping**: 
   - Users can swap USDT for the custom token "Arrnaya" and vice versa.
   - A predefined **swap fee** (default: 1%) is applied to each transaction, which can be updated by the contract owner.
2. **Fee Calculation**:
   - Automatically calculates the amount to be received after deducting the swap fee.
3. **Event Logging**:
   - Emits events (`TokensBought`, `TokensSold`) for every token purchase or sale, ensuring transparency.
4. **Emergency Withdraw**:
   - Allows the owner to withdraw tokens from the contract, with safeguards to protect liquidity.
5. **Reentrancy Protection**:
   - Uses OpenZeppelin’s `ReentrancyGuard` to secure against reentrancy attacks.
6. **Customizable Fees**:
   - The owner can update swap fees within a safe limit (up to 9%).

---

#### How the Frontend Interacts with the Smart Contract:
1. **Connecting to the Blockchain**:
   - The frontend connects to the Ethereum blockchain using **Ethers.js** or **Web3.js** to interact with the deployed smart contract.
2. **Reading Data**:
   - The frontend pulls real-time data, such as:
     - Current swap fees.
     - Contract's USDT balance.
     - User's token balances.
3. **Executing Transactions**:
   - Users can call functions such as:
     - `buyToken`: Swaps USDT for the custom token.
     - `sellTokens`: Swaps the custom token for USDT.
   - These transactions are initiated from the frontend, signed by the user's wallet (e.g., MetaMask).
4. **Event Listening**:
   - The frontend listens for emitted events like `TokensBought` and `TokensSold` to update the UI dynamically after successful transactions.

---

#### Frontend Stack:
- **HTML/CSS**: For structuring and styling the user interface.
- **JavaScript**:
   - **Ethers.js** and **Web3.js** are used to:
     - Connect to the Ethereum network.
     - Fetch data from the smart contract.
     - Call contract functions (e.g., buy/sell tokens).
   - Handles wallet integrations and transaction signing.
   
---

#### Getting Started:
1. **Smart Contract Deployment**:
   - Deploy the smart contract to an Ethereum/Binance testnet or mainnet using Remix or Hardhat.
2. **Frontend Setup**:
   - Use the provided HTML, CSS, and JavaScript files to set up the frontend.
   - Update the contract address and ABI in the frontend JavaScript file `script.js` & `abi.js` respectively.
---

#### Example Use Cases:
1. **Buying Tokens**:
   - Call `buyToken` with a specified amount of USDT.
   - The contract calculates the number of tokens to issue (after fees) and mints them to the user's wallet.
2. **Selling Tokens**:
   - Call `sellTokens` with a specified amount of custom tokens.
   - The contract burns the tokens and transfers the equivalent USDT (minus fees) to the user.

---

This repository is ideal for developers looking to understand and implement token swaps, integrating Solidity smart contracts with a modern web frontend. Contributions and enhancements are welcome!
