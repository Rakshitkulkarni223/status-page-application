const express = require('express');
const Maintenance = require('../models/Maintenance');
const router = express.Router();

router.post('/', async (req, res) => {
  const { id, ...maintenanceData } = req.body;

  console.log(id)

  let maintenance;
  let data;
  try {
    if (id) {
      maintenance = await Maintenance.findById(id);

      if (!maintenance) {
        return res.status(404).json({ message: 'Scheduled maintenance not found' });
      }

      maintenance.status = maintenanceData.maintenanceData.status;

      if (maintenanceData.maintenanceData.status !== "Scheduled") {
        maintenance.timeline.push({
          status: maintenanceData.maintenanceData.status,
          timestamp: new Date(),
          content: maintenanceData.maintenanceData.content || `Status updated to ${maintenanceData.maintenanceData.status}`
        });
      }
      await maintenance.save();
    
    } else {

      data = {
        ...maintenanceData.maintenanceData,
        timeline: [
          {
            status: maintenanceData.maintenanceData.status,
            timestamp: new Date().toISOString(),
            content: maintenanceData.maintenanceData.description
          }
        ]
      }

      maintenance = new Maintenance(data);
      await maintenance.save();
    }

    
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

module.exports = router;