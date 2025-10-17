const mongoose = require('mongoose');
const { User } = require('./models');
require('dotenv').config();

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect');
        
        console.log('Connected to database...');

        // Find the user you just created (replace with the email you used)
        const user = await User.findOne({ email: 'admin@college.edu' });
        
        if (!user) {
            console.log('User not found. Please create a user first through signup page.');
            return;
        }

        // Update user role to admin
        user.role = 'admin';
        await user.save();
        
        console.log('✅ User successfully updated to admin:', user.email);
        console.log('User details:', {
            name: user.name,
            email: user.email,
            role: user.role,
            collegeId: user.collegeId
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error making user admin:', error);
        process.exit(1);
    }
};

makeAdmin();