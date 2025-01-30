require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Session configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.IO middleware
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/appointments', require('./routes/appointments'));
app.use('/medical-records', require('./routes/medical-records'));
app.use('/profile', require('./routes/profile'));
app.use('/doctors', require('./routes/doctors'));

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Get user from session
    const user = socket.request.session.user;
    if (user) {
        socket.join(`user_${user._id}`);
        if (user.role === 'doctor') {
            socket.join(`doctor_${user._id}`);
        }
    }

    // Handle appointment requests
    socket.on('requestAppointment', (data) => {
        io.to(`doctor_${data.doctorId}`).emit('appointmentUpdate', {
            type: 'new',
            appointment: data
        });
    });

    // Handle appointment status updates
    socket.on('updateAppointmentStatus', (data) => {
        io.to(`user_${data.patientId}`).emit('appointmentUpdate', {
            type: 'status',
            appointment: data
        });
    });

    // Handle doctor availability updates
    socket.on('updateAvailability', (data) => {
        io.emit('availabilityUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 