const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Review = require('../models/Review');

// Get user profile
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.patch('/update', auth, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['name', 'email', 'phone', 'specialization', 'department', 'consultationFee'];
        const isValidOperation = Object.keys(updates).every(update => 
            allowedUpdates.includes(update)
        );

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        // Check if email is being updated and is unique
        if (updates.email) {
            const existingUser = await User.findOne({ 
                email: updates.email,
                _id: { $ne: req.user._id }
            });
            
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user
        Object.keys(updates).forEach(update => {
            req.user[update] = updates[update];
        });

        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile image
router.patch('/update-image', auth, async (req, res) => {
    try {
        const { profileImage } = req.body;
        req.user.profileImage = profileImage;
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get doctor's availability
router.get('/availability', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(req.user.availability);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update doctor's availability
router.patch('/availability', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { availability } = req.body;
        req.user.availability = availability;
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get doctor's reviews
router.get('/reviews', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const reviews = await Review.find({ doctor: req.user._id })
            .populate('patient', 'name profileImage')
            .sort({ date: -1 })
            .limit(10);

        // Calculate average rating
        const allReviews = await Review.find({ doctor: req.user._id });
        const averageRating = allReviews.reduce((acc, review) => acc + review.rating, 0) / allReviews.length;

        res.json({
            reviews,
            averageRating,
            totalReviews: allReviews.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit a review
router.post('/reviews', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can submit reviews' });
        }

        const { appointmentId, rating, comment } = req.body;

        // Check if appointment exists and is completed
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patient: req.user._id,
            status: 'completed'
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or not completed' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ appointment: appointmentId });
        if (existingReview) {
            return res.status(400).json({ message: 'Review already submitted for this appointment' });
        }

        const review = new Review({
            patient: req.user._id,
            doctor: appointment.doctor,
            appointment: appointmentId,
            rating,
            comment
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 