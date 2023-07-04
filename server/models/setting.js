const mongoose = require('mongoose');

const tokenLockedEventScheme = new mongoose.Schema({
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