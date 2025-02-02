const mongoose = require('mongoose');

const ServiceGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }]
});

module.exports = mongoose.model('ServiceGroup', ServiceGroupSchema);
