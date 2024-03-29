const mongoose = require('mongoose')
  const centerBudgDetSchema = new mongoose.Schema({
    target_year: {
        type: String,
        required: true
    },
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
    view_code: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
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
    sort_key: {
        type: Number,
        required: false
    },
    display_group: {
        type: Number,
        required: false
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
    tot_budg: {
        type: Number,
        required: false
    },
    active_clients: {
        type: Number,
    },
  });
  
module.exports = mongoose.model('Budg_exec_sum', centerBudgDetSchema)
