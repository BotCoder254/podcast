const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/medical-records');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
        }
    }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Medical records page
router.get('/', isAuthenticated, (req, res) => {
    res.render('medical-records', { user: req.session.user });
});

// Get medical records list
router.get('/list', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { patientId: req.session.user._id };
        
        // Apply filters
        if (req.query.doctor) query.doctorId = req.query.doctor;
        if (req.query.dateFrom) query.date = { $gte: new Date(req.query.dateFrom) };
        if (req.query.dateTo) query.date = { ...query.date, $lte: new Date(req.query.dateTo) };
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const records = await MedicalRecord.find(query)
            .populate('doctorId', 'name specialization')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await MedicalRecord.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({ records, total, totalPages });
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ message: 'Error fetching medical records' });
    }
});

// Get single medical record
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id)
            .populate('doctorId', 'name specialization')
            .populate('attachments');

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check permissions
        if (record.patientId.toString() !== req.session.user._id.toString() &&
            record.doctorId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error fetching medical record:', error);
        res.status(500).json({ message: 'Error fetching medical record' });
    }
});

// Download medical record
router.get('/:id/download', isAuthenticated, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id)
            .populate('doctorId', 'name specialization')
            .populate('attachments');

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Check permissions
        if (record.patientId.toString() !== req.session.user._id.toString() &&
            record.doctorId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Generate PDF
        const pdf = await generatePDF(record);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=medical-record-${record._id}.pdf`);
        res.send(pdf);
    } catch (error) {
        console.error('Error downloading medical record:', error);
        res.status(500).json({ message: 'Error downloading medical record' });
    }
});

// Get medical record attachment
router.get('/attachment/:id', isAuthenticated, async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Check permissions by finding the associated medical record
        const record = await MedicalRecord.findOne({ attachments: attachment._id });
        if (!record || (record.patientId.toString() !== req.session.user._id.toString() &&
            record.doctorId.toString() !== req.session.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.download(attachment.path, attachment.originalName);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).json({ message: 'Error downloading attachment' });
    }
});

module.exports = router; 