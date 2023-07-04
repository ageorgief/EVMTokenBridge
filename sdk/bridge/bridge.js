const { ethers } = require("ethers");
const BridgeAbi = require('../abi/bridge/Bridge.json')


const INFURA_API_KEY = '9f30ad62c0434218964bb38f1d2def95';
const OWNER_PRIVATE_KEY = '33fafaaa480220d833d95a04564e9a68d3c39df10091697c9e82a7361145bead';

class Bridge {
    // constructor(contractAddress, providerUrl) {
    // const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    // const userWallet = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
    // const contractAddress = "0x...";
    // const bridgeOwnerContract = new ethers.Contract(contractAddress, Bridge.abi, wallet)
    constructor() {

        const provider = new ethers.InfuraProvider(
            "sepolia",
            INFURA_API_KEY
        );
        const wallet = new ethers.Wallet(
            OWNER_PRIVATE_KEY,
            provider
        );

        const contractAddress = "0x5733BC30e18ADa36B23E000D044c94D5c2d3c989";
        //this.providerUrl = providerUrl;
        //this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
        this.contract = new ethers.Contract(contractAddress, BridgeAbi.abi, wallet);
    }

    async lockToken(token, amount, targetChainId, targetUser) {
        //To do: check address with ethers.utils
    

        // Call the lock function in the bridge contract
        try {
            const tx = await this.contract.lockToken(token, amount, targetChainId, targetUser);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error locking token:', error);
        }
    }

    async claimToken(token, sourceChainId) {
        // Convert the token address to a checksummed version
        tokenAddress = ethers.utils.getAddress(token);

        try {
            const tx = await this.contract.claimToken(tokenAddress, sourceChainId);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error claiming token:', error);
        }
    }

    async burnToken(wrappedToken, amount, targetChainId, targetUser) {
        // Convert the token address to a checksummed version
        tokenAddress = ethers.utils.getAddress(wrappedToken);
        targetAddress = ethers.utils.getAddress(targetUser);

        try {
            const tx = await this.contract.burnToken(tokenAddress, amount, targetChainId, targetAddress);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error burning token:', error);
        }
    }

    async releaseToken(token) {
        // Convert the token address to a checksummed version
        tokenAddress = ethers.utils.getAddress(token);

        try {
            const tx = await this.contract.releaseToken(tokenAddress);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error releasing token:', error);
        }
    }

    //Owner functions
    async addClaimableToken(claimer, sourceChainId, token, amount) {
        // Convert the token address to a checksummed version
        tokenAddress = ethers.utils.getAddress(token);
        claimerAddress = ethers.utils.getAddress(claimer);

        try {
            const tx = await this.contract.addClaimableToken(claimerAddress, sourceChainId, tokenAddress, amount);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error adding claimable token:', error);
        }
    }

    async addReleasableToken(releaser, token, amount) {
        // Convert the token address to a checksummed version
        tokenAddress = ethers.utils.getAddress(token);
        releaserAddress = ethers.utils.getAddress(releaser);

        try {
            const tx = await this.contract.addReleasableToken(releaserAddress, tokenAddress, amount);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error adding releasable token:', error);
        }
    }

    async setFeePercentage(feePercentage) {
        try {
            const tx = await this.contract.setFeePercentage(feePercentage);
            await tx.wait();
            console.log('Transaction successful:', tx.hash);
        } catch (error) {
            console.error('Error setting fee percentage:', error);
        }
    }
}

module.exports = Bridge;