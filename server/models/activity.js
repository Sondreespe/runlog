const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title:   { type: String, trim: true, maxlength: 120 },
  distance: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 1 }, 
  date:     { type: Date, default: Date.now, index: true },
  sport:    { type: String, enum: ['run', 'cycle', 'swim']},
  comment:  { type: String, trim: true, maxlength: 1000 }, 
});

module.exports = mongoose.model('Activity', ActivitySchema);