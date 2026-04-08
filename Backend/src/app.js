const express = require('express');
require('dotenv').config();
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://192.168.1.7:3000',
    'http://192.168.1.7:5173',
    'https://fplrush.app',
    'http://fplrush.app',
    'https://www.fplrush.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', require('./routes/challenge.routes'));
app.use('/api/pvp', require('./routes/pvpChallenge.routes'));

module.exports = app;