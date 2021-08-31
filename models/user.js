const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    assCode: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    emp_code: {
        type: String,
        required: false
    },
    role: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: false
    },
    area: {
        type: String,
        required: false
    },
    branch: {
        type: String,
        required: false
    },
    unit: {
        type: String,
        required: false
    },
    po: {
        type: String,
        required: false
    },
})

module.exports = mongoose.model('User', userSchema)