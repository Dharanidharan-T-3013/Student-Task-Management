const express = require('express');
const jwt = require('jsonwebtoken');
const qr = require('qr-image');
const mongoose = require('mongoose');
const { User, Event, Registration } = require('./models');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect_secret';

// Auth middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password');
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Auth Routes
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, collegeId, role, department, year } = req.body;
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        user = new User({ name, email, password, collegeId, role, department, year });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Event Routes
router.get('/events', async (req, res) => {
    try {
        const { category } = req.query;
        let query = { status: 'upcoming' };
        if (category && category !== 'all') {
            query.category = category;
        }
        
        const events = await Event.find(query)
            .populate('organizer', 'name email')
            .sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/events', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({ error: 'Not authorized to create events' });
        }

        const event = new Event({
            ...req.body,
            organizer: req.user._id
        });
        await event.save();
        
        const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email');
        res.status(201).json(populatedEvent);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Registration Routes - DEBUG VERSION
router.post('/events/:eventId/register', auth, async (req, res) => {
    try {
        const { eventId } = req.params;
        console.log('Registration attempt for event:', eventId, 'by user:', req.user._id);
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if already registered
        const existingRegistration = await Registration.findOne({
            student: req.user._id,
            event: eventId
        });
        if (existingRegistration) {
            return res.status(400).json({ error: 'Already registered for this event' });
        }

        // Generate QR code data - SIMPLIFIED
        const qrData = JSON.stringify({
            studentId: req.user._id.toString(),
            eventId: eventId,
            studentName: req.user.name,
            eventTitle: event.title,
            timestamp: Date.now()
        });

        console.log('Generated QR data:', qrData);

        const registration = new Registration({
            student: req.user._id,
            event: eventId,
            qrCode: qrData
        });
        
        await registration.save();
        console.log('Registration saved with ID:', registration._id);

        // Populate the response
        const populatedRegistration = await Registration.findById(registration._id)
            .populate('student', 'name email collegeId')
            .populate('event', 'title date venue');

        console.log('Registration completed successfully');
        res.status(201).json(populatedRegistration);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

router.get('/my-registrations', auth, async (req, res) => {
    try {
        const registrations = await Registration.find({ student: req.user._id })
            .populate('event')
            .sort({ registrationDate: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// QR Code Generation
router.get('/qrcode/:data', (req, res) => {
    try {
        const data = decodeURIComponent(req.params.data);
        
        const qr_png = qr.image(data, { 
            type: 'png',
            size: 6
        });
        
        res.type('png');
        qr_png.pipe(res);
        
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ error: 'QR generation failed' });
    }
});

// Organizer Routes
router.get('/organizer/events', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const events = await Event.find({ organizer: req.user._id })
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/organizer/registrations/:eventId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if the event belongs to this organizer
        const event = await Event.findOne({ 
            _id: req.params.eventId, 
            organizer: req.user._id 
        });
        
        if (!event && req.user.role !== 'admin') {
            return res.status(404).json({ error: 'Event not found or not authorized' });
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('student', 'name email collegeId department year');
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Routes
router.get('/admin/events', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const events = await Event.find()
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/admin/registrations/:eventId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('student', 'name email collegeId department year');
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (admin only)
router.get('/admin/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;