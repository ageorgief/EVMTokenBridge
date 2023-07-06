const mongoose = require('mongoose');

const settingScheme = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    key: {
        required: true,
        type: String
    },
    value: {
        type: mongoose.Schema.Types.Mixed
    }
})

module.exports = mongoose.model('Setting', settingScheme)