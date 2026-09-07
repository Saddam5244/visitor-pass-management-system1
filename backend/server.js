const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Body Parser Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder for visitor photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Visitor Pass Management System API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/passes', require('./routes/passRoutes'));
app.use('/api/checklogs', require('./routes/checkLogRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/organizations', require('./routes/organizationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Serve React frontend in production if dist exists
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Visitor Pass Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
