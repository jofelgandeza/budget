const mongoose = require('mongoose')

const coaSchema = new mongoose.Schema({
    code: { 
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Coa', coaSchema)