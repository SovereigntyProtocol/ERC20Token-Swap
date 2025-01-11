// Contract addresses - Replace with your actual addresses
const contractAddress = "0x96d60ef17f1e8724ac5ef91c0939587D39218878";//"0xc70C6d6f5dFE8761A70921d0754edca4d18BAa12"; // Replace with BSC testnet contract
const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"; // "0x49561Eb00e1E2Ff7a3E2a7c9664cEAa2Ce365a10";   // Replace with BSC testnet token

const BSC_TESTNET_PARAMS = {
    chainId: "0x61", // 97 in decimal
    chainName: "BSC Testnet",
    nativeCurrency: {
        name: "Binance Coin",
        symbol: "BNB",
        decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    blockExplorerUrls: ["https://testnet.bscscan.com/"],
};

const BSC_MAINNET_PARAMS = {
    chainId: "0x38", // 56 in decimal
    chainName: "Binance Smart Chain Mainnet",
    nativeCurrency: {
        name: "Binance Coin",
        symbol: "BNB",
        decimals: 18,
    },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
};


let provider;
let signer;
let swapContract;
let myTokenContract;
let usdtContract;
let walletAddress;

// Initialize Ethers and Contracts
async function initEthers() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            await ensureBSCNetwork(); // Ensure user is on BSC testnet
            return true;
        } catch (error) {
            console.error("Failed to initialize Ethers:", error);
            return false;
        }
    } else {
        showPopup("Please install MetaMask!");
        return false;
    }
}

// Ensure user is connected to BSC Mainnet
async function ensureBSCNetwork() {
    const { chainId } = await provider.getNetwork();
    if (chainId !== 97) { // 97 is the BSC Mainnet chain ID
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x61" }], // 987 in hex
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                // Chain not added to wallet, add it
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [BSC_TESTNET_PARAMS],
                    });
                } catch (addError) {
                    console.error("Failed to add BSC Mainnet:", addError);
                    showPopup("Failed to switch to BSC Mainnet. Please try again.");
                }
            } else {
                console.error("Failed to switch network:", switchError);
                showPopup("Failed to switch to BSC Mainnet. Please try again.");
            }
        }
    }
}

// Initialize Contracts
async function initializeContracts() {
    swapContract = new ethers.Contract(contractAddress, swapAbi, signer);
    myTokenContract = new ethers.Contract(contractAddress, swapAbi, signer);
    usdtContract = new ethers.Contract(USDT_ADDRESS, erc20Abi, signer);
}

// Connect Wallet
async function connectWallet() {
    try {
        const success = await initEthers();
        if (success) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            await initializeContracts();
            await updateWalletInfo();


            if (!ethers.utils.isAddress(walletAddress)) {
                console.error("Invalid wallet address");
            }
            if (!ethers.utils.isAddress(contractAddress)) {
                console.error("Invalid contract address");
            }
            if (!ethers.utils.isAddress(USDT_ADDRESS)) {
                console.error("Invalid USDT address");
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());

            showPopup("Wallet connected successfully!");
        }
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        showPopup("Failed to connect wallet. Please try again.");
    }
}

// Update Wallet Information
async function updateWalletInfo() {
    const walletSection = document.querySelector('.wallet-section');

    try {
        const tokenBalance = await swapContract.balanceOf(walletAddress);
        const usdtBalance = await usdtContract.balanceOf(walletAddress);

        const tokenBalanceFormatted = ethers.utils.formatEther(tokenBalance);
        const usdtBalanceFormatted = ethers.utils.formatEther(usdtBalance);

        walletSection.innerHTML = `
            <div class="wallet-info">
                <div class="wallet-address">
                    <span>Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}</span>
                    <button id="disconnect-wallet" class="disconnect-btn">Disconnect</button>
                </div>
                <div class="token-balances">
                    <div class="balance">Token Balance: ${parseFloat(tokenBalanceFormatted).toFixed(2)}</div>
                    <div class="balance">USDT Balance: ${parseFloat(usdtBalanceFormatted).toFixed(2)}</div>
                </div>
            </div>
        `;

        document.getElementById('disconnect-wallet').addEventListener('click', disconnectWallet);
    } catch (error) {
        console.error("Failed to update wallet info:", error);
        showPopup("Failed to update wallet information");
    }
}

function showQrCodePopup(address) {
    const qrPopup = document.getElementById("qr-popup");
    const qrCodeContainer = document.getElementById("qr-code"); // Ensure this is a <canvas> element
    const reserveAddressText = document.getElementById("reserve-address");

    // Clear any existing QR code
    qrCodeContainer.innerHTML = "";

    // Check if the address is valid
    if (!ethers.utils.isAddress(address)) {
        console.error("Invalid contract address");
        showPopup("Invalid address for QR code generation.");
        return;
    }

    // Generate QR code to the canvas
    QRCode.toCanvas(qrCodeContainer, address, { width: 200, height: 200 }, function (error) {
        if (error) {
            console.error("QR Code generation failed:", error);
            showPopup("QR Code generation failed.");
        } else {
            // Display the contract address as text below the QR code
            reserveAddressText.textContent = `Reserve Address: ${address}`;
        }
    });

    // Show the popup
    qrPopup.classList.remove("hidden");
}

document.getElementById("close-qr-popup").addEventListener("click", () => {
    document.getElementById("qr-popup").classList.add("hidden");
});

document.getElementById("reserve-address-trigger").addEventListener("click", () => {
    showQrCodePopup(contractAddress); // Use your reserve address
});

// Update Reserve Information
async function updateReserveInfo() {
    const reserveSection = document.querySelector('.reserve-section');
    const qrButton = document.getElementById("reserve-address-trigger"); // Select the button element

    try {
        const totalTokenSupply = await myTokenContract.totalSupply();
        const usdtReserveBalance = await usdtContract.balanceOf(swapContract.address);

        const totalTokenSupplyFormatted = ethers.utils.formatEther(totalTokenSupply);
        const usdtReserveBalanceFormatted = ethers.utils.formatEther(usdtReserveBalance);

        reserveSection.innerHTML = `
            <div class="reserve-info">
                <div class="reserve-balances">
                <div class="usdt-reserve-balance">USDT Reserve Balance: ${parseFloat(usdtReserveBalanceFormatted).toFixed(2)}</div>
                    <div class="token-reserve-balance">Token Total Supply: ${parseFloat(totalTokenSupplyFormatted).toFixed(2)}</div>
                </div>
            </div>
        `;
        // Show the QR Code button
        qrButton.classList.remove("hidden");
    } catch (error) {
        console.error("Failed to update reserve info:", error);
        showPopup("Failed to update reserve information");
    }
}

// Handle account changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        await disconnectWallet();
    } else if (accounts[0] !== walletAddress) {
        walletAddress = accounts[0];
        signer = provider.getSigner();
        await initializeContracts();
        await updateWalletInfo();
        await updateReserveInfo();
    }
}

// Perform Swap
async function performSwap() {
    if (!walletAddress) {
        showPopup("Please connect your wallet first.");
        return;
    }

    const sellAmount = document.getElementById("sell-amount").value;
    if (!sellAmount || sellAmount <= 0) {
        showPopup("Please enter a valid amount");
        return;
    }

    const sellTokenImg = document.getElementById("sell-token").querySelector("img");
    const buyTokenImg = document.getElementById("buy-token").querySelector("img");

    const sellToken = sellTokenImg.getAttribute("data-token");
    const buyToken = buyTokenImg.getAttribute("data-token");

    console.log(sellToken, buyToken);

    try {
        const amountInWei = ethers.utils.parseEther(sellAmount.toString());
        const tokenContract = sellToken === "Arrnaya" ? myTokenContract : usdtContract;

        // Verify contract addresses
        console.log("Token Contract Address:", tokenContract.address);
        console.log("Swap Contract Address:", swapContract.address);

        const userBalanceWhileSwapping = await tokenContract.balanceOf(walletAddress);

        if (sellAmount > userBalanceWhileSwapping) {
            showPopup("you don't have enough balance");
            return;
        }

        // Check current allowance
        const allowance = await tokenContract.allowance(walletAddress, swapContract.address);

        // Log the allowance for debugging
        console.log(`Allowance: ${ethers.utils.formatEther(allowance)} tokens`);

        if (allowance.lt(amountInWei)) { // Check if allowance is less than the required amount
            showPopup("Approving token transfer...");
            const approveTx = await tokenContract.approve(swapContract.address, amountInWei);
            await approveTx.wait();
            showPopup("Token transfer approved!");
        } else {
            console.log("Sufficient allowance already available. No need for approval.");
        }

        showPopup("Executing swap...");
        let swapTx;
        if (sellToken === "USDT" && buyToken === "Arrnaya") {
            swapTx = await swapContract.buyTokens(amountInWei);
        } else if (sellToken === "Arrnaya" && buyToken === "USDT") {
            swapTx = await swapContract.sellTokens(amountInWei);
        }

        await swapTx.wait();
        showPopup(`Swap successful! ${sellAmount} ${sellToken} to ${buyToken}`);

        // Clear inputs and update balances
        document.getElementById("sell-amount").value = "";
        document.getElementById("buy-amount").value = "";
        await updateWalletInfo();
        await updateReserveInfo();
    } catch (error) {
        console.error("Swap failed:", error);
        showPopup("Swap failed. Please try again.");
    }
}

// Swap Tokens Position
function swapTokensPosition() {
    const sellToken = document.getElementById("sell-token");
    const buyToken = document.getElementById("buy-token");
    const sellAmount = document.getElementById("sell-amount").value;
    const buyAmount = document.getElementById("buy-amount").value;

    // Store the HTML content
    const sellTokenHTML = sellToken.innerHTML;
    const buyTokenHTML = buyToken.innerHTML;

    // Swap token displays
    sellToken.innerHTML = buyTokenHTML;
    buyToken.innerHTML = sellTokenHTML;

    // Swap amounts
    document.getElementById("sell-amount").value = buyAmount;
    document.getElementById("buy-amount").value = sellAmount;
}

// Disconnect Wallet
async function disconnectWallet() {
    walletAddress = null;
    provider = null;
    signer = null;

    const walletSection = document.querySelector('.wallet-section');
    walletSection.innerHTML = `<button id="connect-wallet">Connect Wallet</button>`;

    document.getElementById('connect-wallet').addEventListener('click', connectWallet);
    showPopup("Wallet disconnected");
}

// Show Popup
function showPopup(message, duration = 5000) {
    const popup = document.getElementById("popup");
    popup.textContent = message;
    popup.classList.remove("hidden");
    setTimeout(() => popup.classList.add("hidden"), 3000);
}

// Handle amount input
document.addEventListener('DOMContentLoaded', () => {
    const sellAmountInput = document.getElementById("sell-amount");
    sellAmountInput.addEventListener("input", (e) => {
        document.getElementById("buy-amount").value = e.target.value;
    });

    // Add other event listeners
    document.getElementById("connect-wallet").addEventListener("click", connectWallet);
    document.getElementById("swap-action").addEventListener("click", performSwap);
    document.getElementById("swap-button").addEventListener("click", swapTokensPosition);
});

// Initialize on page load
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        const success = await initEthers();
        if (success) {
            try {
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    signer = provider.getSigner();
                    walletAddress = accounts[0];
                    await initializeContracts();
                    await updateWalletInfo();
                    await updateReserveInfo();
                }
            } catch (error) {
                console.error("Error checking initial wallet state:", error);
            }
        }
    }
});