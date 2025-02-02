const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true },
  affected_services: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  occurred_at: { type: Date, required: true },
  updated_at: { type: Date },
  timeline: [{
    status: String,
    timestamp: Date,
    content: String
  }],
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Incident', IncidentSchema);
