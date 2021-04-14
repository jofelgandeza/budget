const mongoose = require('mongoose')

const centerTargetSchema = {
    loan_type: String,
    month: String,
    semester: String,
    numClient: Number,
    amount: Number,
    totAmount: Number,
    remarks: String,
    monthOrder: Number,
    dispView: Number,
    resignClient: Number
  };
const centerLoanBegBal = {
    loan_type: String, 
    beg_amount: Number,
    beg_client_count: Number,
    dispView: Number
}

  const centersSchema = new mongoose.Schema({
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
        center: {
        type: String,
        required: true
    },
    Targets: [centerTargetSchema],
    Loan_beg_bal : [centerLoanBegBal],
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
  });
  
module.exports = mongoose.model('Center', centersSchema)
