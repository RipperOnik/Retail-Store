const mongoose = require('mongoose');

const { Schema } = mongoose

const resetTokenSchema = Schema({
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: 60 * 60,
        default: Date.now()
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

module.exports = mongoose.model('ResetToken', resetTokenSchema);