const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(404).send({ message: "Access denied, you have been logged out please login."});
        }

        const { userId } = payload;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ message: "Access denied, you have been logged out please login."});
        }

        req.userId = user.id;
        return next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;