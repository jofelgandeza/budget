const mongoose = require('mongoose')

const userSchema = {
    emp_code: { 
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    e_mail: {
        type: String,
        required: true
    },
    password: {
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
}

module.exports = mongoose.model('User', userSchema)