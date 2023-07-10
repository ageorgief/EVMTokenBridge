const mongoose = require('mongoose');

const tokenBurnedEventScheme = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    burnerAddress: {
        required: true,
        type: String
    },
    originTokenAddress: {
        required: true,
        type: String
    },
    amount: {
        required: true,
        type: BigInt
    },
    sourceChainId: {
        required: true,
        type: BigInt
    },
    targetChainId: {
        required: true,
        type: BigInt
    },
    releaserAddress: {
        required: true,
        type: String
    },
    transactionHash: {
        required: true,
        type: String,
        unique: true
    }
})

module.exports = mongoose.model('TokenBurnedEvent', tokenBurnedEventScheme)