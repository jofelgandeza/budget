const mongoose = require('mongoose')

  const regionSchema = new mongoose.Schema({
    region: {
        type: String,
        required: true
    },
    region_desc: {
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
    num_areas: {
        type: Number,
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
    num_areas_budg: {
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
  
module.exports = mongoose.model('Region', regionSchema)
