const mongoose = require('mongoose')

const clientSchema = new mongoose.Schema({
    client_code: { 
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
    client_name: {
        type: String,
        required: true
    },
    birth_date: {
        type: Date,
        required: true
    },
    center: {
        type: String,
        required: false
    },
    po_code: {
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
    status: {
        type: String,
        required: true
    }  
})

module.exports = mongoose.model('Client', clientSchema)