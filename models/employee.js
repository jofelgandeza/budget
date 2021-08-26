const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
    emp_code: { 
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    middle_name: {
        type: String,
        required: true
    },
    position_code: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Position'
    },
    assign_code: {
        type: String,
        required: true
    },
    po_number: {
        type: String,
        required: true
    },
    branch: {
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
    unit: {
        type: String,
        required: true
    }   
})

module.exports = mongoose.model('Employee', employeeSchema)