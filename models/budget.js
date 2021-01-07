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
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Cost_center'
    },
    type: {
        type: String,
        required: true
    },
    January: {
        type: Number,
        required: false
    },
    February: {
        type: Number,
        required: false
    },
    March: {
        type: Number,
        required: false
    },
    April: {
        type: Number,
        required: false
    },
    May: {
        type: Number,
        required: false
    },
    June: {
        type: Number,
        required: false
    },
    July: {
        type: Number,
        required: false
    },
    August: {
        type: Number,
        required: false
    },
    September: {
        type: Number,
        required: false
    },
    October: {
        type: Number,
        required: false
    },
    November: {
        type: Number,
        required: false
    },
    December: {
        type: Number,
        required: false
    },
    createAt: {
        type: Date,
        required: true,
        default: Date.now
    },
})

module.exports = mongoose.model('Budget', budgetSchema)