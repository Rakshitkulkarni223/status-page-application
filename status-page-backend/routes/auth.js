const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();


router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            username,
            email,
            password,
            role: "User",
            status: "Active",
            owned_service_groups: []
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!', user: { id: newUser._id, username, email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Sign-In (Login) Endpoint
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        req.userId = user.id;

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET, // Ensure this is set in your environment variables
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Respond with the token
        res.status(200).json({ token, userId: user._id, role: user.role, owned_service_groups: JSON.stringify(user.owned_service_groups) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
