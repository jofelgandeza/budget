const mongoose = require('mongoose')

  const branchesSchema = new mongoose.Schema({
    branch: {
        type: String,
        required: true
    },
    branch_desc: {
        type: String,
        required: true
    },
    branch_category: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    emp_code: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: true
    },
    num_units: {
        type: Number,
        required: false
    },
    num_pos: {
        type: Number,
        required: false
    },
    num_centers: {
        type: Number,
        required: false
    },
    num_units_budg: {
        type: Number,
        required: false
    },
    num_pos_budg: {
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
    budget_posted: {
        type: Boolean,
    },
  });
  
module.exports = mongoose.model('Branch', branchesSchema)
