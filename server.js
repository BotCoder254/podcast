require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const profileRoutes = require('./routes/profile');
const { auth } = require('./middleware/auth');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointment', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/profile', profileRoutes);

// Public routes
app.get('/', async (req, res) => {
    const token = req.cookies.token;
    let isAuthenticated = false;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id);
            if (user) {
                isAuthenticated = true;
            }
        } catch (error) {
            // Token verification failed
        }
    }
    
    res.render('index', { isAuthenticated });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Protected routes
app.get('/dashboard', auth, async (req, res) => {
    if (req.user.role === 'patient') {
        res.render('patient-dashboard', { user: req.user });
    } else {
        res.render('doctor-dashboard', { user: req.user });
    }
});

// API endpoints for AJAX requests
app.get('/api/doctors', auth, async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' })
            .select('name specialization department profileImage');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 