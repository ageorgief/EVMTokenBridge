const TokenLockedEvent = require("../models/tokenLockedEvent");
const mongoose = require('mongoose');
const { ethers } = require("ethers");

class TokenLockedEventProcessor {
    async process(lockerAddress, originTokenAddress, amount, targetChainId, claimerAddress, sourceChainId, targetBridgeContract, erc20Abi, ownerWallet, transactionHash) {
        console.log('Started proccessing TokenLocked event for transaction:', transactionHash, ' on chain:', sourceChainId);
        
        const existingEvent = await TokenLockedEvent.findOne({ transactionHash });
        if (existingEvent) {
            return;
        }
        
        try {
            const erc20Contract = new ethers.Contract(originTokenAddress, erc20Abi, ownerWallet);
            
            const tokenName = await erc20Contract.name();
            const tokenSymbol = await erc20Contract.symbol();

            const addTokenNameTransaction = await targetBridgeContract.addTokenName(sourceChainId, originTokenAddress, tokenName);
            await addTokenNameTransaction.wait();
            console.log('addTokenNameTransaction transaction successful:', addTokenNameTransaction.hash);

            const addTokemSymbolTransaction = await targetBridgeContract.addTokenSymbol(sourceChainId, originTokenAddress, tokenSymbol);
            await addTokemSymbolTransaction.wait();
            console.log('addTokenNameTransaction transaction successful:', addTokemSymbolTransaction.hash);

            const addClaimableTransaction = await targetBridgeContract.addClaimableToken(claimerAddress, sourceChainId, originTokenAddress, amount);
            await addClaimableTransaction.wait();
            console.log('AddClaimableToken transaction successful:', addClaimableTransaction.hash);


        } catch (error) {
            console.error('Error adding claimable token:', error);
            return;
        }

        const newEvent = new TokenLockedEvent({
            _id: new mongoose.Types.ObjectId,
            lockerAddress: lockerAddress,
            originTokenAddress: originTokenAddress,
            amount: amount,
            sourceChainId: sourceChainId,
            targetChainId: targetChainId,
            claimerAddress: claimerAddress,
            transactionHash: transactionHash
        });

        await newEvent.save();

        console.log('TokenLocked event was processed successfully for transaction:', transactionHash, ' on chain:', sourceChainId);
    }
}

module.exports = TokenLockedEventProcessor;