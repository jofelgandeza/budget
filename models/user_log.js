const mongoose = require('mongoose')

const user_logSchema = new mongoose.Schema({
    IP: { 
        type: String,
        required: true
    },
    login_date: { 
        type: String,
        required: true
    },
    user_name: {
        type: String,
        required: true
    },
    assign_code: {
        type: String,
        required: true
    },
    activity: {
        type: String,
        required: true
    },
    activity_desc: {
        type: String,
        required: true
    }   
})

module.exports = mongoose.model('User_log', user_logSchema)