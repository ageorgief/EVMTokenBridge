const TokenBurnedEvent = require("../models/tokenBurnedEvent");
const mongoose = require('mongoose')


class TokenBurnedEventProcessor {
    async process(burnerAddress, originTokenAddress, amount, sourceChainId, targetChainId, releaserAddress, targetBridgeContract, transactionHash) {
        console.log('Started proccessing TokenBurned event for transaction:', transactionHash, ' on chain:', sourceChainId);

        const existingEvent = await TokenBurnedEvent.findOne({ transactionHash });
        if (existingEvent) {
            return;
        }

        try {
            const addReleasableTransaction = await targetBridgeContract.addReleasableToken(releaserAddress, originTokenAddress, amount);
            await addReleasableTransaction.wait();
            console.log('AddReleasableToken transaction successful:', addReleasableTransaction.hash);
        } catch (error) {
            console.error('Error adding releasable token:', error);
            return;
        }

        const newEvent = new TokenBurnedEvent({
            _id: new mongoose.Types.ObjectId,
            burnerAddress: burnerAddress,
            originTokenAddress: originTokenAddress,
            amount: amount,
            sourceChainId: sourceChainId,
            targetChainId: targetChainId,
            releaserAddress: releaserAddress,
            transactionHash: transactionHash
        });

        await newEvent.save();

        console.log('TokenBurned event was processed successfully for transaction:', transactionHash, ' on chain:', sourceChainId);
    }
}

module.exports = TokenBurnedEventProcessor;