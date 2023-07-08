const mongoose = require('mongoose');

const tokenClaimedEventScheme = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    claimerAddress: {
        required: true,
        type: String
    },
    wrappedTokenAddress: {
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

module.exports = mongoose.model('TokenClaimedEvent', tokenClaimedEventScheme)