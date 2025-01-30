const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    profileImage: {
        type: String,
        default: 'default-profile.png'
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                return /^\+?[\d\s-]+$/.test(v);
            },
            message: 'Please provide a valid phone number'
        }
    },
    address: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    // Doctor specific fields
    specialization: {
        type: String,
        required: function() {
            return this.role === 'doctor';
        }
    },
    qualifications: [{
        degree: String,
        institution: String,
        year: Number
    }],
    experience: {
        type: Number,
        default: 0
    },
    consultationFee: {
        type: Number,
        min: 0
    },
    // Account verification fields
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Add index for email
userSchema.index({ email: 1 });

// Check if the model exists before compiling it
module.exports = mongoose.models.User || mongoose.model('User', userSchema); 