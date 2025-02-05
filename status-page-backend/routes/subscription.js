const express = require('express');
const User = require('../models/User');
const ServiceGroup = require('../models/ServiceGroup');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.post('/subscribe', authMiddleware, async (req, res) => {
    const { serviceGroupId } = req.body;
    const userId = req.userId;

    try {
        const serviceGroup = await ServiceGroup.findById(serviceGroupId);
        if (!serviceGroup) {
            return res.status(404).json({ message: 'Service group not found' });
        }


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.owned_service_groups.includes(serviceGroupId)) {
            return res.status(400).json({ message: 'Already subscribed to this service group' });
        }

        user.owned_service_groups.push(serviceGroupId);
        await user.save();

        res.status(200).json({ message: 'Subscribed successfully', owned_service_groups: user.owned_service_groups });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;