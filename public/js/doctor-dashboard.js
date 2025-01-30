// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadAppointments();
    loadSchedule();
    loadPatients();
    loadReviews();
    loadProfile();
    
    // Set up event listeners
    setupEventListeners();

    // Start notification polling
    startNotificationPolling();
});

// Load today's appointments
async function loadAppointments() {
    try {
        const response = await fetch('/appointments/doctor-appointments');
        const appointments = await response.json();
        
        const appointmentsTable = document.querySelector('#appointments-table tbody');
        if (!appointmentsTable) return;

        appointmentsTable.innerHTML = appointments.map(appointment => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" 
                                 src="${appointment.patient.profileImage || '/images/default-avatar.png'}" 
                                 alt="${appointment.patient.name}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${appointment.patient.name}</div>
                            <div class="text-sm text-gray-500">${appointment.patient.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${appointment.time}</td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-900">${appointment.symptoms}</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}">
                        ${appointment.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${getActionButtons(appointment)}
                </td>
            </tr>
        `).join('');

        updateAppointmentCount(appointments.length);
    } catch (error) {
        console.error('Error loading appointments:', error);
        showNotification('Error loading appointments', 'error');
    }
}

// Load weekly schedule
async function loadSchedule() {
    try {
        const response = await fetch('/profile/availability');
        const availability = await response.json();
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const daySchedule = availability.find(slot => slot.day.toLowerCase() === day);
            const scheduleElement = document.querySelector(`#schedule-${day}`);
            
            if (scheduleElement) {
                if (daySchedule && daySchedule.slots.length > 0) {
                    scheduleElement.innerHTML = daySchedule.slots.map(slot => `
                        <div class="flex justify-between items-center text-gray-600">
                            <span>${slot.startTime} - ${slot.endTime}</span>
                            <button onclick="removeTimeSlot('${day}', '${slot.startTime}', '${slot.endTime}')"
                                    class="text-red-500 hover:text-red-700">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('');
                } else {
                    scheduleElement.innerHTML = '<p class="text-gray-500">No slots set</p>';
                }
            }
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
        showNotification('Error loading schedule', 'error');
    }
}

// Load patient list
async function loadPatients() {
    try {
        const response = await fetch('/appointments/doctor-patients');
        const patients = await response.json();
        
        const patientList = document.querySelector('#patient-list');
        if (!patientList) return;

        patientList.innerHTML = patients.map(patient => `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center mb-4">
                    <img class="h-12 w-12 rounded-full mr-4" 
                         src="${patient.profileImage || '/images/default-avatar.png'}" 
                         alt="${patient.name}">
                    <div>
                        <h3 class="text-lg font-semibold">${patient.name}</h3>
                        <p class="text-gray-600">${patient.email}</p>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Last Visit:</span>
                        <span>${new Date(patient.lastVisit).toLocaleDateString()}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Total Visits:</span>
                        <span>${patient.totalVisits}</span>
                    </div>
                    <button onclick="viewPatientHistory('${patient._id}')"
                            class="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        View History
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading patients:', error);
        showNotification('Error loading patients', 'error');
    }
}

// Load reviews
async function loadReviews() {
    try {
        const response = await fetch('/profile/reviews');
        const { reviews, averageRating, totalReviews } = await response.json();
        
        // Update average rating display
        document.querySelector('#average-rating').textContent = averageRating.toFixed(1);
        document.querySelector('#total-reviews').textContent = `Based on ${totalReviews} reviews`;
        document.querySelector('#rating-stars').innerHTML = generateStars(averageRating);
        
        const reviewsList = document.querySelector('#reviews-list');
        if (!reviewsList) return;

        reviewsList.innerHTML = reviews.map(review => `
            <div class="border-b border-gray-200 pb-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center">
                        <img class="h-8 w-8 rounded-full mr-2" 
                             src="${review.patient.profileImage || '/images/default-avatar.png'}" 
                             alt="${review.patient.name}">
                        <div>
                            <div class="font-semibold">${review.patient.name}</div>
                            <div class="text-sm text-gray-500">${new Date(review.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="flex text-yellow-400">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <p class="text-gray-600">${review.comment}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNotification('Error loading reviews', 'error');
    }
}

// Load doctor profile
async function loadProfile() {
    try {
        const response = await fetch('/profile');
        const user = await response.json();
        
        // Update profile form
        document.querySelector('input[name="name"]').value = user.name;
        document.querySelector('input[name="email"]').value = user.email;
        document.querySelector('input[name="specialization"]').value = user.specialization;
        document.querySelector('input[name="department"]').value = user.department;
        document.querySelector('input[name="consultationFee"]').value = user.consultationFee || '';
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile', 'error');
    }
}

// Update appointment status
async function updateAppointmentStatus(appointmentId, status) {
    try {
        const response = await fetch(`/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification(`Appointment ${status} successfully`, 'success');
            loadAppointments();
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        showNotification('Error updating appointment status', 'error');
    }
}

// Set availability
async function setAvailability(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const data = {
            day: formData.get('day'),
            slots: [{
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime')
            }]
        };

        const response = await fetch('/profile/availability', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ availability: [data] })
        });

        if (response.ok) {
            showNotification('Availability updated successfully', 'success');
            closeAvailabilityModal();
            loadSchedule();
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Error setting availability:', error);
        showNotification('Error setting availability', 'error');
    }
}

// View patient history
async function viewPatientHistory(patientId) {
    try {
        const response = await fetch(`/appointments/patient-history/${patientId}`);
        const history = await response.json();
        
        // Show history in a modal
        const historyHtml = history.map(appointment => `
            <div class="border-b border-gray-200 py-4">
                <div class="flex justify-between">
                    <div>
                        <div class="font-semibold">${new Date(appointment.date).toLocaleDateString()}</div>
                        <div class="text-sm text-gray-500">${appointment.time}</div>
                    </div>
                    <div class="text-sm">
                        <span class="px-2 py-1 rounded-full ${getStatusColor(appointment.status)}">
                            ${appointment.status}
                        </span>
                    </div>
                </div>
                <p class="mt-2 text-gray-600">${appointment.symptoms}</p>
                ${appointment.notes ? `<p class="mt-1 text-sm text-gray-500">Notes: ${appointment.notes}</p>` : ''}
            </div>
        `).join('');
        
        // Show modal with history
        showModal('Patient History', historyHtml);
    } catch (error) {
        console.error('Error loading patient history:', error);
        showNotification('Error loading patient history', 'error');
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

function getActionButtons(appointment) {
    if (appointment.status === 'pending') {
        return `
            <button onclick="updateAppointmentStatus('${appointment._id}', 'confirmed')"
                    class="text-green-600 hover:text-green-900 mr-3">
                Confirm
            </button>
            <button onclick="updateAppointmentStatus('${appointment._id}', 'cancelled')"
                    class="text-red-600 hover:text-red-900">
                Reject
            </button>
        `;
    } else if (appointment.status === 'confirmed') {
        return `
            <button onclick="updateAppointmentStatus('${appointment._id}', 'completed')"
                    class="text-blue-600 hover:text-blue-900">
                Mark Complete
            </button>
        `;
    }
    return '';
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function setupEventListeners() {
    // Profile form submission
    const profileForm = document.querySelector('#profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // Availability form submission
    const availabilityForm = document.querySelector('#availability-form');
    if (availabilityForm) {
        availabilityForm.addEventListener('submit', setAvailability);
    }
}

// Modal functions
function openAvailabilityModal() {
    document.getElementById('availability-modal').classList.remove('hidden');
}

function closeAvailabilityModal() {
    document.getElementById('availability-modal').classList.add('hidden');
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">${title}</h3>
                <div class="mt-2 max-h-96 overflow-y-auto">
                    ${content}
                </div>
                <div class="mt-4">
                    <button onclick="this.closest('.fixed').remove()"
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
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

// Update appointment count badge
function updateAppointmentCount(count) {
    const badge = document.querySelector('#appointment-count');
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }
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