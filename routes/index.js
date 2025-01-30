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

// Home page
router.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.render('index');
    }
});

// Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    const user = req.session.user;
    if (user.role === 'doctor') {
        res.render('doctor-dashboard', { user });
    } else {
        res.render('patient-dashboard', { user });
    }
});

module.exports = router;
