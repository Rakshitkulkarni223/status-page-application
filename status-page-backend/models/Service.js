const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
  link: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);