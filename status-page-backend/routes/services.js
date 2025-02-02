const express = require('express');
const ServiceGroup = require('../models/ServiceGroup');
const Service = require('../models/Service'); // Assuming you have a Service model
const router = express.Router();


router.post('/', async (req, res) => {
  const { newServiceName, newServiceStatus, newGroupName} = req.body;
  
  try {

    const newService = new Service({
        name: newServiceName,
        status: newServiceStatus
    })

    await newService.save();

    let serviceGroup = await ServiceGroup.findOne({ name:  newGroupName });

    if (serviceGroup) {
      serviceGroup.services.push(newService);
    } else {
      serviceGroup = new ServiceGroup({ name: newGroupName, services: [newService] });
    }
    
    const savedServiceGroup = await serviceGroup.save();
    res.status(201).json(savedServiceGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.post('/:id', async (req, res) => {
    const { name, status} = req.body;
    
    try {
      const id = req.params.id;
      const updatedService = await Service.findByIdAndUpdate(id, {name, status})
      res.status(201).json(updatedService);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.get('/', async (req, res) => {
  try {
    const serviceGroups = await ServiceGroup.find().populate('services');
  
    const groupedServices = serviceGroups.map(group => ({
      id: group._id,
      name: group.name,
      services: group.services.map(service => ({
        id: service._id,
        name: service.name,
        status: service.status
      }))
    }));

    res.status(200).json(groupedServices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
