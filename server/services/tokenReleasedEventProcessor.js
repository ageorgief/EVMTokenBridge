const TokenReleasedEvent = require("../models/tokenReleasedEvent");
const mongoose = require('mongoose')


class TokenReleasedEventProcessor {
    async process(releaserAddress, originTokenAddress, amount, sourceChainId, transactionHash) {
        console.log('Started proccessing TokenReleased event for transaction:', transactionHash, ' on chain:', sourceChainId);

        const existingEvent = await TokenReleasedEvent.findOne({ transactionHash });
        if (existingEvent) {
            return;
        }

        const newEvent = new TokenReleasedEvent({
            _id: new mongoose.Types.ObjectId,
            releaserAddress: releaserAddress,
            originTokenAddress: originTokenAddress,
            amount: amount,
            sourceChainId: sourceChainId,
            transactionHash: transactionHash
        });

        await newEvent.save();
        
        console.log('TokenReleased event was processed successfully for transaction:', transactionHash, ' on chain:', sourceChainId);
    }
}

module.exports = TokenReleasedEventProcessor;