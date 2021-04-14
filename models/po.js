const mongoose = require('mongoose')

const posSchema = new mongoose.Schema({
    po_code: {
        type: String,
        required: true
    },
    po_number: {
        type: String,
        required: true
    },
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
    num_centers: {
        type: Number,
        required: false
    },
    num_centers_budg: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        required: true
    },
  });
  
module.exports = mongoose.model('Po', posSchema)
