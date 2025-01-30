// Initialize date picker
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date picker for appointment booking
    const appointmentDate = document.querySelector('#appointment-date');
    if (appointmentDate) {
        flatpickr(appointmentDate, {
            minDate: "today",
            dateFormat: "Y-m-d",
            onChange: function(selectedDates) {
                loadDoctors();
            }
        });
    }

    // Load initial data
    loadAppointments();
    loadProfile();

    // Set up event listeners
    setupEventListeners();

    // Start notification polling
    startNotificationPolling();
});

// Load user's appointments
async function loadAppointments() {
    try {
        const response = await fetch('/appointments/my-appointments');
        const appointments = await response.json();
        
        const appointmentsTable = document.querySelector('#appointments-table tbody');
        if (!appointmentsTable) return;

        appointmentsTable.innerHTML = appointments.map(appointment => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" 
                                 src="${appointment.doctor.profileImage || '/images/default-avatar.png'}" 
                                 alt="${appointment.doctor.name}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${appointment.doctor.name}</div>
                            <div class="text-sm text-gray-500">${appointment.doctor.specialization}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">${new Date(appointment.date).toLocaleDateString()}</span>
                    <span class="text-sm text-gray-500">${appointment.time}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}">
                        ${appointment.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${appointment.symptoms}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${getAppointmentActions(appointment)}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading appointments:', error);
        showNotification('Error loading appointments', 'error');
    }
}

// Load available doctors
async function loadDoctors() {
    try {
        const specialization = document.querySelector('#specialization').value;
        const date = document.querySelector('#appointment-date').value;
        
        if (!date) return;

        const response = await fetch(`/appointments/available-doctors?specialization=${specialization}&date=${date}`);
        const doctors = await response.json();
        
        const doctorList = document.querySelector('#doctor-list');
        if (!doctorList) return;

        doctorList.innerHTML = doctors.map(doctor => `
            <div class="flex items-center justify-between p-4 border-b">
                <div class="flex items-center">
                    <img class="h-12 w-12 rounded-full" 
                         src="${doctor.profileImage || '/images/default-avatar.png'}" 
                         alt="${doctor.name}">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${doctor.name}</div>
                        <div class="text-sm text-gray-500">${doctor.specialization}</div>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <select class="time-slot form-select rounded-md border-gray-300" 
                            data-doctor-id="${doctor._id}">
                        ${generateTimeSlots(doctor.bookedSlots)}
                    </select>
                    <button onclick="bookAppointment('${doctor._id}')"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Book
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading doctors:', error);
        showNotification('Error loading doctors', 'error');
    }
}

// Book appointment
async function bookAppointment(doctorId) {
    try {
        const date = document.querySelector('#appointment-date').value;
        const timeSelect = document.querySelector(`select[data-doctor-id="${doctorId}"]`);
        const time = timeSelect.value;
        const symptoms = document.querySelector('#symptoms').value;

        if (!date || !time || !symptoms) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        const response = await fetch('/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctorId,
                date,
                time,
                symptoms
            })
        });

        if (response.ok) {
            showNotification('Appointment booked successfully', 'success');
            loadAppointments();
            document.querySelector('#symptoms').value = '';
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification('Error booking appointment', 'error');
    }
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
    try {
        const response = await fetch(`/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'cancelled'
            })
        });

        if (response.ok) {
            showNotification('Appointment cancelled successfully', 'success');
            loadAppointments();
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showNotification('Error cancelling appointment', 'error');
    }
}

// Load user profile
async function loadProfile() {
    try {
        const response = await fetch('/profile');
        const user = await response.json();
        
        // Update profile form
        document.querySelector('input[name="name"]').value = user.name;
        document.querySelector('input[name="email"]').value = user.email;
        document.querySelector('input[name="phone"]').value = user.phone || '';
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile', 'error');
    }
}

// Update profile
async function updateProfile(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/profile/update', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showNotification('Profile updated successfully', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
}

function getAppointmentActions(appointment) {
    if (appointment.status === 'pending' || appointment.status === 'confirmed') {
        return `
            <button onclick="cancelAppointment('${appointment._id}')"
                    class="text-red-600 hover:text-red-900">
                Cancel
            </button>
        `;
    }
    return '';
}

function generateTimeSlots(bookedSlots) {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        if (!bookedSlots.includes(time)) {
            slots.push(`<option value="${time}">${time}</option>`);
        }
    }
    return slots.join('');
}

function setupEventListeners() {
    // Profile form submission
    const profileForm = document.querySelector('#profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // Doctor search form submission
    const searchForm = document.querySelector('#search-doctors-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadDoctors();
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Real-time notifications
function startNotificationPolling() {
    setInterval(async () => {
        try {
            const response = await fetch('/notifications');
            const notifications = await response.json();
            
            const notificationCount = document.querySelector('#notification-count');
            if (notificationCount) {
                notificationCount.textContent = notifications.length;
                notificationCount.classList.toggle('hidden', notifications.length === 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, 30000); // Poll every 30 seconds
}