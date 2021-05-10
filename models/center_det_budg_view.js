const mongoose = require('mongoose')

const center_det_budg_viewSchema = {
    view_code: { 
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    user_level: {
        type: Number,
        required: true
    },
    view_order: {
        type: Number,
        required: true
    }
    
}

module.exports = mongoose.model('Center_det_budg_view', center_det_budg_viewSchema)