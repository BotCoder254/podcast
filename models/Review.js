const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Ensure one review per appointment
reviewSchema.index({ appointment: 1 }, { unique: true });

// Index for efficient querying
reviewSchema.index({ doctor: 1, date: -1 });
reviewSchema.index({ patient: 1, date: -1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review; 