const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// CORS configuration
app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'CampusConnect API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 CAMPUSCONNECT SERVER STARTED');
    console.log('='.repeat(50));
    console.log(`📍 BACKEND API: http://localhost:${PORT}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`🔑 API Base: http://localhost:${PORT}/api`);
    console.log('');
    console.log(`🌐 FRONTEND URL: http://localhost:3000`);
    console.log(`📱 Signup Page: http://localhost:3000/signup.html`);
    console.log(`🔐 Login Page: http://localhost:3000/login.html`);
    console.log('='.repeat(50));
    console.log('💡 Make sure frontend is running in another terminal:');
    console.log('   cd frontend && python -m http.server 3000');
    console.log('='.repeat(50) + '\n');
});