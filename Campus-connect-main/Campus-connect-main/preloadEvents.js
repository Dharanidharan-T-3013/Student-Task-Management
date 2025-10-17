const mongoose = require('mongoose');
const { Event, User } = require('./models');
require('dotenv').config();

const preloadEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect');
        
        // Find an admin user to assign as organizer
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('No admin user found. Please create an admin account first.');
            return;
        }

        const events = [
            {
                title: "Paper Presentation",
                description: "A core component of many symposiums, allowing students to present research and innovative ideas in various academic fields.",
                category: "technical",
                venue: "Main Auditorium",
                date: new Date('2025-10-15'),
                time: "10:00 AM",
                organizer: adminUser._id,
                maxParticipants: 50,
                rules: [
                    "Presentation time: 15 minutes",
                    "Team size: 1-3 members",
                    "Original research work only",
                    "Submit abstract one week before"
                ]
            },
            {
                title: "Project Expo",
                description: "Showcase your innovative projects and prototypes to industry experts and peers.",
                category: "technical",
                venue: "Engineering Block",
                date: new Date('2025-10-16'),
                time: "9:00 AM",
                organizer: adminUser._id,
                maxParticipants: 30,
                rules: [
                    "Working prototype required",
                    "Team size: 2-4 members",
                    "10-minute demonstration",
                    "Bring your own equipment"
                ]
            },
            {
                title: "Hackathon",
                description: "24-hour coding marathon to build innovative software solutions.",
                category: "technical",
                venue: "Computer Lab",
                date: new Date('2025-10-20'),
                time: "6:00 PM",
                organizer: adminUser._id,
                maxParticipants: 100,
                rules: [
                    "24-hour duration",
                    "Team size: 2-4 members",
                    "Internet access provided",
                    "Original code only"
                ]
            },
            {
                title: "Technical Quiz",
                description: "Test your technical knowledge across various engineering domains.",
                category: "technical",
                venue: "Seminar Hall",
                date: new Date('2025-10-18'),
                time: "2:00 PM",
                organizer: adminUser._id,
                maxParticipants: 80,
                rules: [
                    "Individual participation",
                    "Multiple choice questions",
                    "No electronic devices",
                    "Time limit: 60 minutes"
                ]
            },
            {
                title: "Poster Presentation",
                description: "Display your research findings through creative and informative posters.",
                category: "technical",
                venue: "Exhibition Hall",
                date: new Date('2025-10-17'),
                time: "11:00 AM",
                organizer: adminUser._id,
                maxParticipants: 40,
                rules: [
                    "Poster size: A1 format",
                    "Individual or team of 2",
                    "10-minute presentation",
                    "Print your own poster"
                ]
            },
            {
                title: "Workshops",
                description: "Hands-on learning sessions on cutting-edge technologies and tools.",
                category: "workshop",
                venue: "Workshop Room",
                date: new Date('2025-10-19'),
                time: "10:00 AM",
                organizer: adminUser._id,
                maxParticipants: 25,
                rules: [
                    "Prior registration required",
                    "Bring your own laptop",
                    "Active participation expected",
                    "Materials provided"
                ]
            },
            {
                title: "Design Thinking Challenge",
                description: "Solve real-world problems using design thinking methodology.",
                category: "technical",
                venue: "Innovation Center",
                date: new Date('2025-10-22'),
                time: "9:30 AM",
                organizer: adminUser._id,
                maxParticipants: 60,
                rules: [
                    "Team size: 3-5 members",
                    "6-hour challenge",
                    "Present your solution",
                    "Judging based on innovation"
                ]
            },
            {
                title: "Robotics Competition",
                description: "Build and program robots to complete challenging tasks.",
                category: "technical",
                venue: "Robotics Lab",
                date: new Date('2025-10-25'),
                time: "10:00 AM",
                organizer: adminUser._id,
                maxParticipants: 20,
                rules: [
                    "Team size: 2-3 members",
                    "Provided kit only",
                    "3-hour building time",
                    "Autonomous operation required"
                ]
            },
            {
                title: "Coding Battle",
                description: "Competitive programming contest with algorithmic challenges.",
                category: "technical",
                venue: "Programming Lab",
                date: new Date('2025-10-21'),
                time: "3:00 PM",
                organizer: adminUser._id,
                maxParticipants: 50,
                rules: [
                    "Individual participation",
                    "3-hour duration",
                    "Multiple programming languages",
                    "Online judge system"
                ]
            },
            {
                title: "AI Challenge",
                description: "Develop AI models to solve complex problems and compete for prizes.",
                category: "technical",
                venue: "AI Research Center",
                date: new Date('2025-10-28'),
                time: "11:00 AM",
                organizer: adminUser._id,
                maxParticipants: 30,
                rules: [
                    "Team size: 1-3 members",
                    "Dataset provided",
                    "48-hour timeline",
                    "Model performance evaluation"
                ]
            }
        ];

        // Clear existing preloaded events
        await Event.deleteMany({ title: { $in: events.map(e => e.title) } });
        
        // Insert new events
        await Event.insertMany(events);
        
        console.log('✅ 10 technical events preloaded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error preloading events:', error);
        process.exit(1);
    }
};

preloadEvents();