const TokenClaimedEvent = require("../models/tokenClaimedEvent");
const mongoose = require('mongoose')


class TokenClaimedEventProcessor {
    async process(claimerAddress, wrappedTokenAddress, amount, sourceChainId, transactionHash) {
        console.log('Started proccessing TokenClaimed event for transaction:', transactionHash, ' on chain:', sourceChainId);

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

        console.log('TokenClaimed event was processed successfully for transaction:', transactionHash, ' on chain:', sourceChainId);
    }
}

module.exports = TokenClaimedEventProcessor;