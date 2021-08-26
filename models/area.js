const mongoose = require('mongoose')

  const areasSchema = new mongoose.Schema({
    area: {
        type: String,
        required: true
    },
    area_desc: {
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
    office_loc: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    num_branches: {
        type: Number,
        required: false
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
    num_branches_budg: {
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
  });
  
module.exports = mongoose.model('Area', areasSchema)
