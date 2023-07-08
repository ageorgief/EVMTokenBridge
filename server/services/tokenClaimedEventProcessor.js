const TokenClaimedEvent = require("../models/tokenClaimedEvent");
const mongoose = require('mongoose')


class TokenClaimedEventProcessor {
    async process(claimerAddress, wrappedTokenAddress, amount, sourceChainId, transactionHash) {
        const existingEvent = await TokenClaimedEvent.findOne({ transactionHash });
        if (existingEvent) {
            return;
        }

        const newEvent = new TokenClaimedEvent({
            _id: new mongoose.Types.ObjectId,
            claimerAddress: claimerAddress,
            wrappedTokenAddress: wrappedTokenAddress,
            amount: amount,
            sourceChainId: sourceChainId,
            transactionHash: transactionHash
        });

        await newEvent.save();
    }
}

module.exports = TokenClaimedEventProcessor;