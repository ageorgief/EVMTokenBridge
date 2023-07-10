const TokenLockedEvent = require("../models/tokenLockedEvent");
const mongoose = require('mongoose')


class TokenLockedEventProcessor {
    async process(lockerAddress, originTokenAddress, amount, targetChainId, claimerAddress, sourceChainId, targetBridgeContract, transactionHash) {
        console.log('Started proccessing TokenLocked event for transaction:', transactionHash, ' on chain:', sourceChainId);
        
        const existingEvent = await TokenLockedEvent.findOne({ transactionHash });
        if (existingEvent) {
            return;
        }

        try {
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