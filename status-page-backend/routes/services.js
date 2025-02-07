const express = require('express');
const ServiceGroup = require('../models/ServiceGroup');
const Maintenance = require('../models/Maintenance');
const Service = require('../models/Service');
const authMiddleware = require('../middleware/auth');
const { broadcast } = require('../utils/websocketManager');
const router = express.Router();


router.post('/', authMiddleware, async (req, res) => {
  const { newServiceName, newServiceStatus, newGroupName, newServiceLink } = req.body;
  try {
    const newService = new Service({
      name: newServiceName,
      status: newServiceStatus,
      link: newServiceLink
    })

    await newService.save();

    let serviceGroup = await ServiceGroup.findOne({ name: newGroupName });

    if (serviceGroup) {
      serviceGroup.services.push(newService);
    } else {
      serviceGroup = new ServiceGroup({ name: newGroupName, services: [newService] });
    }

    const savedServiceGroup = await serviceGroup.save();
    broadcast({ type: "CREATE_NEW_SERVICE", savedServiceGroup });
    res.status(201).json(savedServiceGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.post('/:id', authMiddleware, async (req, res) => {
  const { name, status, link } = req.body;
  try {
    const id = req.params.id;
    console.log(id, status)
    var updatedService;
    if (name) {
      updatedService = await Service.findByIdAndUpdate(id, { name, status, link }, { new: true })
    } else {
      updatedService = await Service.findByIdAndUpdate(id, { status, link }, { new: true })
    }
    broadcast({ type: "SERVICE_STATUS_UPDATE", updatedService });
    res.status(200).json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.put('/group/:id', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const id = req.params.id;
    const updatedService = await ServiceGroup.findByIdAndUpdate(id, { name }, { new: true });
    broadcast({ type: "GROUP_NAME_UPDATE", updatedService });
    res.status(200).json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const serviceGroups = await ServiceGroup.find().populate('services');

    const groupedServices = await Promise.all(serviceGroups.map(async (group) => {
      const servicesWithMaintenance = await Promise.all(group.services.map(async (service) => {
        const maintenance = await Maintenance.findOne({
          affected_services: service._id,
          status: { $in: ["Scheduled", "In Progress", "Delayed"] }
        });

        return {
          id: service._id,
          name: service.name,
          status: service.status,
          link: service.link,
          maintenanceScheduled: maintenance ? true : false,
          maintenanceDetails: maintenance ? {
            id: maintenance._id,
            title: maintenance.title,
            status: maintenance.status,
            scheduled_start: maintenance.scheduled_start,
            scheduled_end: maintenance.scheduled_end
          } : null
        };
      }));

      return {
        id: group._id,
        name: group.name,
        services: servicesWithMaintenance
      };
    }));

    res.status(200).json(groupedServices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
