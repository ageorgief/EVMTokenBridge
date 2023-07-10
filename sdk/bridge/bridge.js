const { ethers } = require("ethers");
const BridgeContract = require('../abi/bridge/Bridge.json');
const ERC20Contract = require('../abi/token/ERC20.json');
const WrappedTokenFactory = require('../abi/tokenfactory/WrappedTokenFactory.json');
const MyToken = require('../abi/token/MyToken.json');

const INFURA_API_KEY = '9f30ad62c0434218964bb38f1d2def95';

class Bridge {
    constructor(chain, contractAddress, privateKey) {
        this.provider = new ethers.InfuraProvider(
            chain,
            INFURA_API_KEY
        );
        this.wallet = new ethers.Wallet(
            privateKey,
            this.provider
        );
        this.contractAddress = contractAddress;
        this.contract = new ethers.Contract(contractAddress, BridgeContract.abi, this.wallet);
    }

    async lockToken(token, amount, targetChainId, targetUser) {
        try {   
            const tokenContract = new ethers.Contract(token, ERC20Contract.abi, this.wallet);
    
            const increaseAllowanceTx = await tokenContract.increaseAllowance(this.contractAddress, amount);
            await increaseAllowanceTx.wait();

            const tx = await this.contract.lockToken(token, amount, targetChainId, targetUser);
            await tx.wait();
            
            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error locking token:', error);
        }
    }

    async claimToken(token, sourceChainId) {
        try {
            const tx = await this.contract.claimToken(sourceChainId, token);
            await tx.wait();
            console.log('Transaction is successful:', tx.hash);
            return tx;
        } catch (error) {
            console.error('Error claiming token:', error);
        }

    }

    async burnToken(wrappedToken, amount, targetChainId, targetAddress) {
        try {
            const tx = await this.contract.burnToken(wrappedToken, amount, targetChainId, targetAddress);
            await tx.wait();
            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error burning token:', error);
        }
    }

    async releaseToken(tokenAddress) {
        try {
            const tx = await this.contract.releaseToken(tokenAddress);
            await tx.wait();
            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error releasing token:', error);
        }
    }

    //Owner functions
    async addClaimableToken(claimerAddress, sourceChainId, tokenAddress, amount) {
        try {
            const tx = await this.contract.addClaimableToken(claimerAddress, sourceChainId, tokenAddress, amount);
            await tx.wait();
            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error adding claimable token:', error);
        }
    }

    async addReleasableToken(releaserAddress, tokenAddress, amount) {
        try {
            const tx = await this.contract.addReleasableToken(releaserAddress, tokenAddress, amount);
            await tx.wait();
            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error adding releasable token:', error);
        }
    }

    async setFeePercentage(feePercentage) {
        try {
            const tx = await this.contract.setFeePercentage(feePercentage);
            await tx.wait();
            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error setting fee percentage:', error);
        }
    }

    async transferWrappedTokenFactoryOwnership(wrappedTokenFactoryAddres) {
        const wrappedTokenFactory = new ethers.Contract(wrappedTokenFactoryAddres, WrappedTokenFactory.abi, this.wallet);
        
        const transferOwnershipTx = await wrappedTokenFactory.transferOwnership(this.contractAddress);
        await transferOwnershipTx.wait();
        console.log('Transfer ownership successfull:', transferOwnershipTx.hash);
        
        const owner = await wrappedTokenFactory.owner();
        console.log('Owner is ',owner);
    }
    
    async mintMyToken(contractAddress, recepient, amount) {
        const myTokenContract = new ethers.Contract(contractAddress, MyToken.abi, this.wallet);
        try {
            const tx = await myTokenContract.mint(recepient, amount);
            await tx.wait();

            console.log('Transaction is successful:', tx.hash);
        } catch (error) {
            console.error('Error while minting MyToken:', error);
        }
    }

    async getBalanceOf(tokenAddress, recepient) {
        try {   
            const tokenContract = new ethers.Contract(tokenAddress, ERC20Contract.abi, this.wallet);
    
            const balance = await tokenContract.balanceOf(recepient);
            
            console.log('Balance =', balance.toString());
        } catch (error) {
            console.error('Error while getting balance of token:', error);
        }
    }

    async getTokenName(tokenAddress,sourceChainId) {
        try {   
            const tokenContract = new ethers.Contract(tokenAddress, ERC20Contract.abi, this.wallet);
    
            const name = await tokenContract.tokenNameByOriginTokenByChain(sourceChainId,tokenAddress);
            
            console.log('name =', name);
        } catch (error) {
            console.error('Error while getting token name:', error);
        }
    }

    async getClaimableTokensAmount(lockerAddress, sourceChainId, originTokenAddress) {
        try {
            const amount = await this.contract.claimableTokens(lockerAddress,sourceChainId, originTokenAddress);
            console.log('Transaction is successful:', amount);
        } catch (error) {
            console.error('Error while getting claimableTokensAmount:', error);
        }
    }

    async getOriginByWrappedByChain(lockerAddress, sourceChainId, originTokenAddress) {
        try {
            const amount = await this.contract.claimableTokens(lockerAddress,sourceChainId, originTokenAddress);
            console.log('Transaction successful:', amount);
        } catch (error) {
            console.error('Error while getting originTokenByWrappedTokenByChain:', error);
        }
    }
    async getWrappedByOriginByChain(sourceChainId, originTokenAddress) {
        try {
            const token = await this.contract.wrappedTokenByOriginTokenByChain(sourceChainId, originTokenAddress);
            console.log('Wrapped token address:', token);
        } catch (error) {
            console.error('Error while getting wrappedTokenByOriginTokenByChain:', error);
        }
    }
}

module.exports = Bridge;