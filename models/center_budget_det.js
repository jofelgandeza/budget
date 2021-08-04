const mongoose = require('mongoose')

  const centerBudgDetSchema = new mongoose.Schema({
    region: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    po: {
        type: String,
        required: true
    },
    po_code: {
        type: String,
        required: true
    },
    center: {
        type: String,
        required: true
    },
    view_type: {
        type: String,
        required: true
    },
    loan_type: {
        type: String,
    },
    beg_bal: {
        type: Number,
        required: false
    },
    beg_bal_amt: {
        type: Number,
        required: false
    },
    beg_bal_int: {
        type: Number,
        required: false
    },
    client_count_included: {
        type: Boolean,
    },
    view_code: {
        type: String,
        required: true
    },
    jan_budg: {
        type: Number,
        required: false
    },
    feb_budg: {
        type: Number,
        required: false
    },
    mar_budg: {
        type: Number,
        required: false
    },
    apr_budg: {
        type: Number,
        required: false
    },
    may_budg: {
        type: Number,
        required: false
    },
    jun_budg: {
        type: Number,
        required: false
    },
    jul_budg: {
        type: Number,
        required: false
    },
    aug_budg: {
        type: Number,
        required: false
    },
    sep_budg: {
        type: Number,
        required: false
    },
    oct_budg: {  
        type: Number,
        required: false
    },
    nov_budg: {
        type: Number,
        required: false
    },
    dec_budg: {
        type: Number,
        required: false
    },
    active_clients: {
        type: Number,
    },
  });
  
module.exports = mongoose.model('center_budget_det', centerBudgDetSchema)
