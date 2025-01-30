const express = require('express');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// List appointments page
router.get('/', isAuthenticated, (req, res) => {
    res.render('appointments', { user: req.session.user });
});

// New appointment page
router.get('/new', isAuthenticated, (req, res) => {
    res.render('new-appointment', { user: req.session.user });
});

// Get appointments list
router.get('/list', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { patientId: req.session.user._id };
        
        // Apply filters
        if (req.query.status) query.status = req.query.status;
        if (req.query.dateFrom) query.date = { $gte: new Date(req.query.dateFrom) };
        if (req.query.dateTo) query.date = { ...query.date, $lte: new Date(req.query.dateTo) };

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'name specialization profileImage')
            .sort({ date: -1, time: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Appointment.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({ appointments, total, totalPages });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
});

// Book appointment
router.post('/book', isAuthenticated, async (req, res) => {
    try {
        const { doctorId, date, time, symptoms, notes } = req.body;
        const patientId = req.session.user._id;

        // Check if slot is available
        const isAvailable = await checkSlotAvailability(doctorId, date, time);
        if (!isAvailable) {
            return res.status(400).json({ message: 'This time slot is no longer available' });
        }

        const appointment = new Appointment({
            doctorId,
            patientId,
            date,
            time,
            symptoms,
            notes,
            status: 'requested'
        });

        await appointment.save();
        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Error booking appointment' });
    }
});

// Update appointment status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check permissions
        if (req.session.user.role === 'patient' && 
            appointment.patientId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();

        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ message: 'Error updating appointment status' });
    }
});

// Cancel appointment
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check permissions
        if (appointment.patientId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await appointment.remove();
        res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ message: 'Error cancelling appointment' });
    }
});

// Check slot availability
router.get('/check-availability', isAuthenticated, async (req, res) => {
    try {
        const { doctorId, date, time } = req.query;
        const available = await checkSlotAvailability(doctorId, date, time);
        res.json({ available });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ message: 'Error checking availability' });
    }
});

// Helper function to check slot availability
async function checkSlotAvailability(doctorId, date, time) {
    const existingAppointment = await Appointment.findOne({
        doctorId,
        date,
        time,
        status: { $nin: ['cancelled'] }
    });
    return !existingAppointment;
}

module.exports = router;