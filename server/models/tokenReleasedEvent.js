const mongoose = require('mongoose');

const tokenReleasedEventScheme = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    releaserAddress: {
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
    transactionHash: {
        required: true,
        type: String,
        unique: true
    }
})

module.exports = mongoose.model('TokenReleasedEvent', tokenReleasedEventScheme)