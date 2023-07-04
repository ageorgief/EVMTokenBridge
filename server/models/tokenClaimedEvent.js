const mongoose = require('mongoose');

const tokenClaimedEventScheme = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    age: {
        required: true,
        type: Number
    }
})

module.exports = mongoose.model('Data', tokenClaimedEventScheme)