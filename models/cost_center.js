const mongoose = require('mongoose')

const costCenterSchema = new mongoose.Schema({
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

module.exports = mongoose.model('Cost_center', costCenterSchema)