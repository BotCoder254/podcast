// WebSocket connection
const socket = io();

const SocketService = {
    // Listen for appointment updates
    listenForAppointmentUpdates(callback) {
        socket.on('appointmentUpdate', (data) => {
            callback(data);
        });
    },

    // Listen for availability updates
    listenForAvailabilityUpdates(callback) {
        socket.on('availabilityUpdate', (data) => {
            callback(data);
        });
    },

    // Listen for notifications
    listenForNotifications(callback) {
        socket.on('notification', (data) => {
            callback(data);
        });
    },

    // Emit appointment request
    requestAppointment(appointmentData) {
        socket.emit('requestAppointment', appointmentData);
    },

    // Emit appointment status update
    updateAppointmentStatus(appointmentId, status) {
        socket.emit('updateAppointmentStatus', { appointmentId, status });
    },

    // Emit doctor availability update
    updateDoctorAvailability(availabilityData) {
        socket.emit('updateAvailability', availabilityData);
    },

    // Disconnect socket
    disconnect() {
        socket.disconnect();
    }
};

export default SocketService; 