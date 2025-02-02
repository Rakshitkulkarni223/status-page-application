const express = require('express');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, affected_services, occurred_at, reported_by } = req.body;

  if (!title || !description || !affected_services || !occurred_at || !reported_by) {
    return res.status(400).json({ message: 'Missing required fields: title, description, status, occurred_at, or reported_by' });
  }

  const newIncident = new Incident({
    type: "Incident",
    title,
    description,
    status: "Reported",
    affected_services,
    occurred_at,
    updated_at: new Date().toISOString(),
    reported_by: req.userId,
    timeline: [
      {
        status: "Reported",
        timestamp: new Date().toISOString(),
        content: `${title} reported. Our team is assessing the issue.`
      }
    ]
  });

  try {
    const savedIncident = await newIncident.save();
    res.status(201).json(savedIncident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.put('/:id', async (req, res) => {
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
        content: timeline.content || `Status updated to ${status}`
      });
    }

    const updatedIncident = await incident.save();


    if (updatedIncident.affected_services) {
      console.log(updatedIncident.affected_services, serviceStatus)
      await Service.findByIdAndUpdate(updatedIncident.affected_services, { status: serviceStatus })
    }

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

    const incidents = await Incident.find(query).populate('affected_services');
    console.log(incidents)
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
        console.log(incident)

        res.json(incident);
    } catch (error) {
        console.error("Error fetching incident:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;