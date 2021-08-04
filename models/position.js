const mongoose = require('mongoose')

const positionSchema = new mongoose.Schema({
    code: { 
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    group_code: {
        type: String,
        required: true
    },
    dept_code: {
        type: String,
        required: true
    },
    short_title: {
        type: String,
        required: true
    },
    position_class: {
        type: String,
        required: true
    },
    off_group: {
        type: String,
        required: true
    },
    sort_key: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Position', positionSchema)