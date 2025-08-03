const express = require('express');

const cors = require('cors');
const contestRoutes = require('./routes/contestRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
// Update your CORS configuration to be more specific
app.use(cors({
  origin: ['chrome-extension://enhbabinmkfdkfhjhaboaicppalngemm', 'http://localhost:5173',
    'https://codifier.onrender.com'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Contest Notifier API is running!',
    version: '1.0.0',
    endpoints: [
      'GET /api/contests - All contests',
      'GET /api/contests/live - Live contests',
      'GET /api/contests/upcoming - Upcoming contests'
    ]
  });
});

// API Routes
app.use('/api/contests', contestRoutes);
app.use('/api/scraper', require('./routes/scraperRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
