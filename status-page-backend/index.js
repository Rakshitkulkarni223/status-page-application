const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const serviceRoutes = require('./routes/services');
const incidentRoutes = require('./routes/incidents');
const maintenanceRoutes = require('./routes/maintenance');
const userRoutes = require('./routes/users');
const authRooutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const isDev = app.get('env') === 'development';

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const corsOptions = {
    origin: !isDev ? process.env.WEB_APP : "http://localhost:5173",
    credentials: true,
}

app.use(cors(corsOptions));

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRooutes);
app.use('/api/subscription', subscriptionRoutes);


app.get('/', (req, res) => {
    return res.json("Running..")
});


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB!");
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch(err => {
        console.error("Error connecting to MongoDB", err);
    });
