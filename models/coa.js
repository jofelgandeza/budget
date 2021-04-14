const mongoose = require('mongoose')

const coaSchema = new mongoose.Schema({
    code: { 
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    budget_total: {
        type: Number,
        required: false
    },
    actual_total: {
        type: Number,
        required: false
    },
    budget_jan: {
        type: Number,
        required: false
    },
    budget_feb: {
        type: Number,
        required: false
    },
    budget_mar: {
        type: Number,
        required: false
    },
    budget_apr: {
        type: Number,
        required: false
    },
    budget_may: {
        type: Number,
        required: false
    },
    budget_jun: {
        type: Number,
        required: false
    },
    budget_jul: {
        type: Number,
        required: false
    },
    budget_aug: {
        type: Number,
        required: false
    },
    budget_sep: {
        type: Number,
        required: false
    },
    budget_oct: {
        type: Number,
        required: false
    },
    budget_nov: {
        type: Number,
        required: false
    },
    budget_dec: {
        type: Number,
        required: false
    },
    actual_jan: {
        type: Number,
        required: false
    },
    actual_feb: {
        type: Number,
        required: false
    },
    actual_mar: {
        type: Number,
        required: false
    },
    actual_apr: {
        type: Number,
        required: false
    },
    actual_may: {
        type: Number,
        required: false
    },
    actual_jun: {
        type: Number,
        required: false
    },
    actual_jul: {
        type: Number,
        required: false
    },
    actual_aug: {
        type: Number,
        required: false
    },
    actual_sep: {
        type: Number,
        required: false
    },
    actual_oct: {
        type: Number,
        required: false
    },
    actual_nov: {
        type: Number,
        required: false
    },
    actual_dec: {
        type: Number,
        required: false
    }
})

module.exports = mongoose.model('Coa', coaSchema)