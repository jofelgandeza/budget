const mongoose = require('mongoose')

  const settingsSchema = new mongoose.Schema({
    budget_year: {
        type: String,
        required: true
    },
    start_budget_date: {
        type: String,
    },
    end_budget_date: {
        type: String,
    },
    status: {
        type: String,
        required: true
    },
  });
  
module.exports = mongoose.model('Setting', settingsSchema)
