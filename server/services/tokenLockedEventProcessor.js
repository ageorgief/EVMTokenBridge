const TokenLockedEvent = require("../models/tokenLockedEvent");
const mongoose = require('mongoose')


class TokenLockedEventProcessor {
    async process(lockerAddress, originTokenAddress, amount, targetChainId, claimerAddress, sourceChainId, targetBridgeContract, transactionHash) {
        const existingEvent = await TokenLockedEvent.findOne({ transactionHash });
        if (existingEvent) {
            return;
        }

        try {
            const addReleasableTransaction = await targetBridgeContract.addClaimableToken(claimerAddress, sourceChainId, originTokenAddress, amount);
            await addReleasableTransaction.wait();
            console.log('Transaction successful:', addReleasableTransaction.hash);
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
    }
}

module.exports = TokenLockedEventProcessor;