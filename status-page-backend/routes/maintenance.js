const express = require('express');
const moment = require('moment');
const Maintenance = require('../models/Maintenance');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const { broadcast } = require('../utils/websocketManager');
const router = express.Router();


router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, delayed_start, delayed_end, timeline } = req.body;

    const id = req.params.id;

    var maintenance = await Maintenance.findById(id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Scheduled maintenance not found' });
    }

    if (status === "Delayed" && timeline) {
      maintenance.scheduled_start = delayed_start;
      maintenance.scheduled_end = delayed_end;
      maintenance.delayed_start = delayed_start;
      maintenance.delayed_end = delayed_end;
      maintenance.status = "Scheduled";
      maintenance.updated_at = new Date();
      maintenance.timeline.push({
        status,
        timestamp: new Date(),
        content: timeline[0].content || `Status updated to ${status} state.`
      });
    }

    if (!["Scheduled", "Delayed"].includes(status) && timeline) {
      maintenance.status = status || maintenance.status;
      maintenance.updated_at = new Date();
      maintenance.timeline.push({
        status,
        timestamp: new Date(),
        content: timeline[0].content || `Status updated to ${status} state.`
      });
    }

    await maintenance.save();
    broadcast({ type: "UPDATE_SCHEDULE_MAINTENANCE", maintenance });
    res.status(201).json(maintenance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { timeline } = req.body;
  try {
    const data = {
      ...req.body,
      timeline: [
        {
          ...timeline[0],
          timestamp: new Date()
        }
      ]
    }
    const maintenance = new Maintenance(data);
    await maintenance.save();
    broadcast({ type: "SCHEDULE_NEW_MAINTENANCE", maintenance });
    res.status(201).json(maintenance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    var maintenance = await Maintenance.find().populate('affected_services').sort({ updated_at: -1 });
    maintenance = maintenance.map((item) => ({
      ...item.toObject(),
      scheduled_start: moment.utc(item.scheduled_start).local().format("MMMM Do YYYY, h:mm A"),
      scheduled_end: moment.utc(item.scheduled_end).local().format("MMMM Do YYYY, h:mm A"),
      delayed_start: moment.utc(item.delayed_start).local().format("MMMM Do YYYY, h:mm A"),
      delayed_end: moment.utc(item.delayed_end).local().format("MMMM Do YYYY, h:mm A"),
      updated_at: moment.utc(item.updated_at).local().format("MMMM Do YYYY, h:mm A"),
    }));
    res.status(200).json(maintenance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const updateMaintenanceStatus = async () => {
  try {
    const now = new Date();

    const maintenances = await Maintenance.find({
      status: { $ne: "Completed" }
    });

    for (let maintenance of maintenances) {
      if (new Date(maintenance.scheduled_end) < now && maintenance.status !== "Completed") {
        maintenance.status = "Completed";
        maintenance.updated_at = now;
        maintenance.timeline.push({
          status: "Completed",
          timestamp: now,
          content: "Maintenance completed successfully."
        });

        let { affected_services: serviceId } = maintenance;
        if (serviceId) {
          const updatedService = await Service.findByIdAndUpdate(serviceId, { status: "Operational" }, { new: true });
          broadcast({ type: "SERVICE_STATUS_UPDATE", updatedService });
        }
      }
      else if (new Date(maintenance.scheduled_start) <= now && maintenance.status === "Scheduled") {
        maintenance.status = "In Progress";
        maintenance.updated_at = now;
        maintenance.timeline.push({
          status: "In Progress",
          timestamp: now,
          content: "Maintenance is now in progress."
        });

        let { affected_services: serviceId, serviceStatus } = maintenance;
        if (serviceId) {
          const updatedService = await Service.findByIdAndUpdate(serviceId, { status: serviceStatus }, { new: true });
          broadcast({ type: "SERVICE_STATUS_UPDATE", updatedService });
        }
      }
      else if (new Date(maintenance.scheduled_start) < now && maintenance.status === "Scheduled") {
        maintenance.status = "Delayed";
        maintenance.updated_at = now;
        maintenance.timeline.push({
          status: "Delayed",
          timestamp: now,
          content: "Maintenance start delayed."
        });
      }

      await maintenance.save();
      broadcast({ type: "UPDATE_SCHEDULE_MAINTENANCE", maintenance });
    }
  } catch (error) {
    console.error("Error updating maintenance status:", error);
  }
};

setInterval(updateMaintenanceStatus, 60 * 1000);

module.exports = router;