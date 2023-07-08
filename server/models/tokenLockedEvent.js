const mongoose = require('mongoose');

const tokenLockedEventScheme = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    lockerAddress: {
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
    claimerAddress: {
        required: true,
        type: String
    },
    transactionHash: {
        required: true,
        type: String,
        unique: true
    }
})

module.exports = mongoose.model('TokenLockedEvent', tokenLockedEventScheme)