const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const moment = require('moment');


router.post('/signup', async (req, res) => {
    const { username, email, password, isAdmin } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            username,
            email,
            password,
            role: isAdmin ? "Admin" : "User",
            status: "Active",
            owned_service_groups: []
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!', user: { id: newUser._id, username, email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        req.userId = user.id;

        let expires = moment().add(2, 'hours');

        const payload = {
            userId: user._id,
            expires,
            iat: moment().unix(),
            exp: expires.unix()
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET);

        res.status(200).json({ token, expires: expires.toDate(), userId: user._id, role: user.role, owned_service_groups: user.owned_service_groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/refreshToken', async (req, res) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { userId, expires } = payload;

        if (!userId) {
            return res.status(404).send({ message: "Not authorized..you have been logged out please login."});
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ message: "Not authorized..you have been logged out please login."});
        }

        return res.status(200).json({ token, expires, userId, role: user.role, owned_service_groups: user.owned_service_groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
