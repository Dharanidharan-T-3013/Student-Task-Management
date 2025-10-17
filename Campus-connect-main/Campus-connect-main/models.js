const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    collegeId: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'organizer'],
        default: 'student'
    },
    department: String,
    year: String
}, {
    timestamps: true
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
// In the UserSchema, add this method:
UserSchema.methods.canCreateEvents = function() {
    return this.role === 'admin' || this.role === 'organizer';
};

// In the EventSchema, ensure organizer can see their own events

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['technical', 'cultural', 'sports', 'workshop', 'seminar'],
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: String,
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxParticipants: Number,
    poster: String,
    rules: [String],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

const RegistrationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    qrCode: String,
    attended: {
        type: Boolean,
        default: false
    },
    attendanceTime: Date
});

RegistrationSchema.index({ student: 1, event: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);
const Registration = mongoose.model('Registration', RegistrationSchema);

module.exports = { User, Event, Registration };