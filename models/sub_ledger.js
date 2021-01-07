const mongoose = require('mongoose')

const sub_ledgerSchema = new mongoose.Schema({
    code: { 
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    coa: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Coa'
    }
})

module.exports = mongoose.model('Sub_ledger', sub_ledgerSchema)