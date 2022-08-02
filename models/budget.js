const mongoose = require('mongoose')

const budgetSchema = new mongoose.Schema({
    user: { 
        type: String,
        required: true
    },
    department: { 
        type: String,
        required: true
    },
    coa: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Coa'
    },
    sub_ledger: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Sub_ledger'
    },
    cost_center: {
        type: String,
        required: false
    },
    total: {
        type: Number,
        required: true
    },
    target_year: {
        type: String,
        required: true
    },
    january: {
        type: Number,
        required: false
    },
    february: {
        type: Number,
        required: false
    },
    march: {
        type: Number,
        required: false
    },
    april: {
        type: Number,
        required: false
    },
    may: {
        type: Number,
        required: false
    },
    june: {
        type: Number,
        required: false
    },
    july: {
        type: Number,
        required: false
    },
    august: {
        type: Number,
        required: false
    },
    september: {
        type: Number,
        required: false
    },
    october: {  
        type: Number,
        required: false
    },
    november: {
        type: Number,
        required: false
    },
    december: {
        type: Number,
        required: false
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
})

module.exports = mongoose.model('Budget', budgetSchema)