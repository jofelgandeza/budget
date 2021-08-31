const mongoose = require('mongoose')

const loan_typeSchema = new mongoose.Schema({
    loan_type: { 
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    glp_topUp: {
        type: Boolean,
        required: true
    },
    display_order: {
        type: Number,
        required: true
    },
    process_fee: {
        type: Number,
        required: true
    },
    payment_option: {
        type: String,
        required: true
    },
    payment_freq: {
        type: String,
        required: true
    },
    no_payment: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
})

module.exports = mongoose.model('Loan_type', loan_typeSchema)