//  Importing express package
require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
require('./config/db');
const visitorRoutes = require('./routes/visitors');
const userRoutes = require('./routes/users');
const appointmentRoutes = require('./routes/appointmentRoutes');
const passRoutes = require('./routes/passRoutes');
const reportRoutes = require('./routes/reportRoutes');
const checkLogRoutes = require('./routes/checkLogRoutes');
const emailRoutes = require('./routes/emailRoutes');
const smsRoutes = require("./routes/smsRoutes");
const cors = require('cors');
const bodyParser = require("body-parser");


//  Express APP
const app = express();
app.use(cors({
  origin: "https://visitor-pass-management-system1-6.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api/visitors', visitorRoutes);
app.use('/api/user', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/checklogs', checkLogRoutes);
app.use('/api', emailRoutes);
app.use("/api", smsRoutes);

app.get("/", (req, res) => {
  res.send("Visitor Pass Management API Running 🚀");
});

const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// PORT num
const PORT = process.env.PORT || 4000;

        // Listen for requets
        app.listen(PORT, () => {
            console.log(`Server is running on port: http://localhost:${PORT}`)
        });
  

