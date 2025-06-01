// run data
const mongoose = require('mongoose');
const runSchema = new mongoose.Schema({
    distannce: Number, // in kilometers
    time: Number, // in minutes and seconds
    date: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Run', runSchema);