const mongoose = require('mongoose')

const centerTargetSchema = {
    target_year: String,
    loan_type: String,
    loan_term: String,
    month: String,
    semester: String,
    numClient: Number,
    newClient: Number,
    oldClient: Number,
    amount: Number,
    totAmount: Number,
    remarks: String,
    monthOrder: Number,
    dispView: Number,
    resignClient: Number
  };
const centerLoanBegBal = {
    target_year: String,
    loan_type: String, 
    beg_amount: Number,
    beg_interest: Number,
    beg_principal: Number,
    beg_client_count: Number,
    expected_maturity_date: String,
    month_number: Number,
    dispView: Number
}
const centerInfo = {
    address: String, 
    president: String,
    vice_president: String,
    secretaty: String,
    treasurer: String
}
const centerLoan = {
    address: String, 
    president: String,
    vice_president: String,
    secretaty: String,
    treasurer: String
}

  const centersSchema = new mongoose.Schema({
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
    center_no: {
        type: String,
        required: true
    },
    center: {
        type: String,
        required: true
    },
    active_clients: {
        type: Number,
    },
    active_loan_amt: {
        type: Number,
    },
    loan_cycle: {
        type: Number,
    },
    loan_type: {
        type: String,
    },
    status: {
        type: String,
    },
    beg_center_month: {
        type: String,
    },
    Info: [centerInfo],
    Targets: [centerTargetSchema],
    center_cnt_begBal: {
        type: Number,
    },
    Loan_beg_bal : [centerLoanBegBal],
    budget_BegBalCli: {
        type: Number,
    },
    budget_BegBal: {
        type: Number,
    },
    budget_posted: {
        type: Boolean,
    },
    newClient: {
        type: Number,
    },
    newClientAmt: {
        type: Number,
    },
    oldClient: {
        type: Number,
    },
    oldClientAmt: {
        type: Number,
    },
    resClient: {
        type: Number,
    },
    resClient2: {
        type: Number,
    },
  });
  
module.exports = mongoose.model('Center', centersSchema)
