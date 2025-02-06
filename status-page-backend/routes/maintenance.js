const express = require('express');
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
      maintenance.timeline.push({
        status,
        timestamp: new Date(),
        content: timeline[0].content || `Status updated to ${status} state.`
      });
    }

    if (!["Scheduled", "Delayed"].includes(status) && timeline) {
      maintenance.status = status || maintenance.status;
      maintenance.timeline.push({
        status,
        timestamp: new Date(),
        content: timeline[0].content || `Status updated to ${status} state.`
      });
    }

    await maintenance.save();
    res.status(201).json(maintenance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/',authMiddleware,  async (req, res) => {
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
    const maintenance = await Maintenance.find().populate('affected_services');
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
        maintenance.timeline.push({
          status: "Completed",
          timestamp: now,
          content: "Maintenance completed successfully."
        });
        let { affected_services: serviceId } = maintenance;
        if (serviceId) {
          await Service.findByIdAndUpdate(serviceId, { status: "Operational" });
        }
      }
      else if (new Date(maintenance.scheduled_start) < now && maintenance.status === "Scheduled") {
        maintenance.status = "Delayed";
        maintenance.timeline.push({
          status: "Delayed",
          timestamp: now,
          content: "Maintenance start delayed."
        });
      }
      else if (new Date(maintenance.scheduled_start).toISOString().slice(0, 16) === now.toISOString().slice(0, 16) && maintenance.status === "Scheduled") {
        maintenance.status = "In Progress";
        maintenance.timeline.push({
          status: "In Progress",
          timestamp: now,
          content: "Maintenance is now in progress."
        });

        let { affected_services: serviceId, serviceStatus } = maintenance;
        if (serviceId) {
          await Service.findByIdAndUpdate(serviceId, { status: serviceStatus });
        }
      }

      await maintenance.save();
    }
  } catch (error) {
    console.error("Error updating maintenance status:", error);
  }
};

// setInterval(updateMaintenanceStatus, 60 * 1000);

module.exports = router;