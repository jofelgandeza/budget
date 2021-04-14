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

  const unitsSchema = new mongoose.Schema({
    unit_code: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    loan_type: {
        type: String,
        required: true
    },
    emp_code: {
        type: String,
        required: false
    },
    office_loc: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    num_centers: {
        type: Number,
        required: false
    },
    num_pos: {
        type: Number,
        required: false
    },
    num_centers_budg: {
        type: Number,
        required: false
    },
    num_pos_budg: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        required: true
    },
  });
  
module.exports = mongoose.model('Unit', unitsSchema)
