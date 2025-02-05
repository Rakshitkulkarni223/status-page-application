const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true },
  serviceStatus: { type: String, required: true },
  affected_services: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  scheduled_start: { type: Date, required: true },
  scheduled_end: { type: Date, required: true },
  delayed_start: { type: Date },
  delayed_end: { type: Date },
  timeline: [{
    status: String,
    timestamp: Date,
    content: String
  }]
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
