// WebSocket connection
const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

const SocketService = {
    isConnected: false,
    connectionListeners: new Set(),

    // Connection status
    onConnect(callback) {
        socket.on('connect', () => {
            this.isConnected = true;
            this.notifyConnectionListeners();
            callback?.();
        });
    },

    onDisconnect(callback) {
        socket.on('disconnect', () => {
            this.isConnected = false;
            this.notifyConnectionListeners();
            callback?.();
        });
    },

    addConnectionListener(callback) {
        this.connectionListeners.add(callback);
    },

    removeConnectionListener(callback) {
        this.connectionListeners.delete(callback);
    },

    notifyConnectionListeners() {
        this.connectionListeners.forEach(callback => callback(this.isConnected));
    },

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