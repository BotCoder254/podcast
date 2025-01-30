const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Get all appointments for the logged-in patient
router.get('/my-appointments', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user._id })
            .populate('doctor', 'name specialization')
            .sort({ date: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get doctor's appointments for today
router.get('/doctor-appointments', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await Appointment.find({
            doctor: req.user._id,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('patient', 'name email profileImage');

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get doctor's patients
router.get('/doctor-patients', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const appointments = await Appointment.find({
            doctor: req.user._id,
            status: 'completed'
        }).populate('patient', 'name email profileImage');

        // Get unique patients with their last visit and total visits
        const patientMap = new Map();
        appointments.forEach(appointment => {
            const patient = appointment.patient;
            const existingPatient = patientMap.get(patient._id.toString());
            
            if (!existingPatient || new Date(appointment.date) > new Date(existingPatient.lastVisit)) {
                patientMap.set(patient._id.toString(), {
                    ...patient.toObject(),
                    lastVisit: appointment.date,
                    totalVisits: (existingPatient?.totalVisits || 0) + 1
                });
            } else {
                patientMap.get(patient._id.toString()).totalVisits++;
            }
        });

        res.json(Array.from(patientMap.values()));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available doctors by specialization and date
router.get('/available-doctors', auth, async (req, res) => {
    try {
        const { specialization, date } = req.query;
        const query = { role: 'doctor' };
        
        if (specialization) {
            query.specialization = specialization;
        }

        const doctors = await User.find(query).select('-password');
        
        // Get booked appointments for the date
        const bookedAppointments = await Appointment.find({
            date: new Date(date),
            status: { $ne: 'cancelled' }
        });

        // Filter out unavailable time slots
        const availableDoctors = doctors.map(doctor => {
            const doctorAppointments = bookedAppointments.filter(
                app => app.doctor.toString() === doctor._id.toString()
            );
            
            return {
                ...doctor.toObject(),
                bookedSlots: doctorAppointments.map(app => app.time)
            };
        });

        res.json(availableDoctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Book a new appointment
router.post('/book', auth, async (req, res) => {
    try {
        const { doctorId, date, time, symptoms } = req.body;

        // Check if the slot is available
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            date,
            time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        const appointment = new Appointment({
            patient: req.user._id,
            doctor: doctorId,
            date,
            time,
            symptoms
        });

        await appointment.save();
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update appointment status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check authorization
        if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Validate status changes
        const validStatusChanges = {
            patient: ['cancelled'],
            doctor: ['confirmed', 'cancelled', 'completed']
        };

        if (!validStatusChanges[req.user.role].includes(status)) {
            return res.status(400).json({ message: 'Invalid status change' });
        }

        appointment.status = status;
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reschedule appointment
router.patch('/:id/reschedule', auth, async (req, res) => {
    try {
        const { date, time } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check if new slot is available
        const existingAppointment = await Appointment.findOne({
            doctor: appointment.doctor,
            date,
            time,
            status: { $ne: 'cancelled' },
            _id: { $ne: appointment._id }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        appointment.date = date;
        appointment.time = time;
        appointment.status = 'pending'; // Reset status when rescheduled
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get patient history
router.get('/patient-history/:patientId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const appointments = await Appointment.find({
            doctor: req.user._id,
            patient: req.params.patientId,
            status: 'completed'
        }).sort({ date: -1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 