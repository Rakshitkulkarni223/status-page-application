const express = require('express');
const moment = require('moment');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const { broadcast } = require('../utils/websocketManager');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, affected_services, occurred_at, reported_by, timeline } = req.body;

  if (!title || !description || !affected_services || !occurred_at || !reported_by) {
    return res.status(400).json({ message: 'Missing required fields: title, description, status, occurred_at, or reported_by' });
  }

  if(req.userId !== reported_by){
    return res.status(403).json({ message: 'You are not authorized. Please login to create an incident.' });
  }

  const existingIncident = await Incident.findOne({ affected_services, reported_by }).populate('affected_services');

  if (existingIncident && existingIncident.status !== "Fixed") {
    return res.status(409).json({ message: `An incident for the ${existingIncident.affected_services.name} service has already been reported by you. The incident is in ${existingIncident.status} state. Once it is in Fixed state then you can report another incident.` });
  }

  const newIncident = new Incident({
    title,
    description,
    status: "Reported",
    affected_services,
    occurred_at,
    updated_at: new Date(),
    reported_by: req.userId,
    timeline: [
      {
        ...timeline[0],
        timestamp: new Date()
      }
    ]
  });
  
  try {
    const savedIncident = await newIncident.save();
    broadcast({ type: "REPORT_NEW_INCIDENT", incident: savedIncident });
    res.status(201).json(savedIncident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.put('/:id', authMiddleware, async (req, res) => {
  const { status, timeline, serviceStatus } = req.body;
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.status = status || incident.status;
    incident.updated_at = new Date();

    if (status !== "Reported" && timeline) {
      incident.timeline.push({
        status,
        timestamp: new Date(),
        content: timeline[0].content || `Status updated to ${status} state.`
      });
    }

    const updatedIncident = await incident.save();
    let updatedService;

    if (updatedIncident.affected_services) {
      updatedService = await Service.findByIdAndUpdate(updatedIncident.affected_services, { status: serviceStatus }, {new: true})
    }
    broadcast({ type: "UPDATE_INCIDENT", incident: updatedIncident });
    broadcast({ type: "SERVICE_STATUS_UPDATE", updatedService });
    res.status(200).json(updatedIncident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  const { status, service } = req.query;

  try {
    let query = {};

    if (status) {
      query.status = status;
    }

    if (service) {
      query.affected_services = service;
    }

    var incidents = await Incident.find(query).populate('affected_services').sort({ updated_at: -1 });;
    incidents = incidents.map((incident) => ({
      ...incident.toObject(),
      occurred_at : moment.utc(incident.occurred_at).local().format("MMMM Do YYYY, h:mm A"),
      updated_at: moment.utc(incident.updated_at).local().format("MMMM Do YYYY, h:mm A"),
    }));
    res.status(200).json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/service-status/:id', authMiddleware, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('affected_services', 'name status');

        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }
        res.json(incident);
    } catch (error) {
        console.error("Error fetching incident:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;