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
        type: Number
    },
    targetChainId: {
        required: true,
        type: Number
    },
    claimerAddress: {
        required: true,
        type: String
    }
})

module.exports = mongoose.model('TokenLockedEvent', tokenLockedEventScheme)