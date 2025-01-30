import SocketService from './socket-service.js';
import NotificationService from './notification-service.js';
import { 
    AppointmentStatus, 
    generateAppointmentCard, 
    generateTimeSlots 
} from './appointment-utils.js';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
    initializeRealTimeUpdates();
});

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadAppointments(),
            loadSchedule(),
            loadPatients(),
            loadReviews(),
            loadProfile()
        ]);
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        NotificationService.error('Error loading dashboard data');
    }
}

// Load today's appointments
async function loadAppointments() {
    try {
        const response = await fetch('/appointments/doctor-appointments');
        const appointments = await response.json();
        
        const appointmentsContainer = document.querySelector('#appointments-container');
        if (!appointmentsContainer) return;

        if (appointments.length === 0) {
            appointmentsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-4"></i>
                    <p>No appointments scheduled for today</p>
                </div>
            `;
            return;
        }

        appointmentsContainer.innerHTML = appointments
            .map(appointment => generateAppointmentCard(appointment))
            .join('');

        updateDashboardStats(appointments);
    } catch (error) {
        console.error('Error loading appointments:', error);
        NotificationService.error('Error loading appointments');
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
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">
                                ${formatTimeRange(slot.startTime, slot.endTime)}
                            </span>
                            <button onclick="removeTimeSlot('${day}', '${slot.startTime}', '${slot.endTime}')"
                                    class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition duration-150">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('');
                } else {
                    scheduleElement.innerHTML = `
                        <p class="text-gray-500 text-sm">No slots set</p>
                    `;
                }
            }
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
        NotificationService.error('Error loading schedule');
    }
}

// Load patient list
async function loadPatients() {
    try {
        const response = await fetch('/appointments/doctor-patients');
        const patients = await response.json();
        
        const patientList = document.querySelector('#patient-list');
        if (!patientList) return;

        if (patients.length === 0) {
            patientList.innerHTML = `
                <div class="text-center py-8 text-gray-500 col-span-2">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>No patients yet</p>
                </div>
            `;
            return;
        }

        patientList.innerHTML = patients.map(patient => `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transform transition duration-200 hover:shadow-md">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${patient.profileImage || '/images/default-avatar.png'}" 
                             alt="${patient.name}" 
                             class="w-12 h-12 rounded-full object-cover">
                        <div class="ml-4">
                            <h3 class="font-semibold text-gray-800">${patient.name}</h3>
                            <p class="text-sm text-gray-500">${patient.email}</p>
                        </div>
                    </div>
                    <button onclick="viewPatientHistory('${patient._id}')"
                            class="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition duration-150">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-gray-500">Last Visit</p>
                        <p class="font-medium">${new Date(patient.lastVisit).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Total Visits</p>
                        <p class="font-medium">${patient.totalVisits}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading patients:', error);
        NotificationService.error('Error loading patients');
    }
}

// Load reviews
async function loadReviews() {
    try {
        const response = await fetch('/profile/reviews');
        const { reviews, averageRating, totalReviews } = await response.json();
        
        // Update average rating display
        document.querySelector('#average-rating').textContent = averageRating.toFixed(1);
        document.querySelector('#rating-stars').innerHTML = generateStarRating(averageRating);
        
        const reviewsList = document.querySelector('#reviews-list');
        if (!reviewsList) return;

        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-star text-4xl mb-4"></i>
                    <p>No reviews yet</p>
                </div>
            `;
            return;
        }

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
                        ${generateStarRating(review.rating)}
                    </div>
                </div>
                <p class="text-gray-600">${review.comment}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        NotificationService.error('Error loading reviews');
    }
}

// Load doctor profile
async function loadProfile() {
    try {
        const response = await fetch('/profile');
        const user = await response.json();
        
        // Update profile information
        document.querySelector('input[name="name"]').value = user.name;
        document.querySelector('input[name="email"]').value = user.email;
        document.querySelector('input[name="specialization"]').value = user.specialization;
        document.querySelector('input[name="department"]').value = user.department;
        document.querySelector('input[name="consultationFee"]').value = user.consultationFee || '';
    } catch (error) {
        console.error('Error loading profile:', error);
        NotificationService.error('Error loading profile');
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
            NotificationService.success(`Appointment ${status} successfully`);
            loadAppointments();
            SocketService.emit('appointmentStatusUpdated', { appointmentId, status });
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        NotificationService.error('Error updating appointment status');
    }
}

// View patient history
async function viewPatientHistory(patientId) {
    try {
        const response = await fetch(`/appointments/patient-history/${patientId}`);
        const history = await response.json();
        
        const historyHtml = history.map(appointment => `
            <div class="border-b border-gray-200 py-4">
                <div class="flex justify-between">
                    <div>
                        <div class="font-semibold">${new Date(appointment.date).toLocaleDateString()}</div>
                        <div class="text-sm text-gray-500">${appointment.time}</div>
                    </div>
                    <div class="text-sm">
                        <span class="${getStatusBadgeClass(appointment.status)}">
                            ${appointment.status}
                        </span>
                    </div>
                </div>
                <p class="mt-2 text-gray-600">${appointment.symptoms}</p>
                ${appointment.notes ? `<p class="mt-1 text-sm text-gray-500">Notes: ${appointment.notes}</p>` : ''}
            </div>
        `).join('');
        
        showModal('Patient History', historyHtml);
    } catch (error) {
        console.error('Error loading patient history:', error);
        NotificationService.error('Error loading patient history');
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
            NotificationService.success('Availability updated successfully');
            closeAvailabilityModal();
            loadSchedule();
            SocketService.emit('availabilityUpdated', data);
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error setting availability:', error);
        NotificationService.error('Error setting availability');
    }
}

// Helper functions
function formatTimeRange(startTime, endTime) {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function formatTime(time) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
}

function generateStarRating(rating) {
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

// Update dashboard stats
function updateDashboardStats(appointments) {
    if (!appointments) return;

    const totalAppointments = appointments.length;
    const todayAppointments = appointments.filter(a => 
        new Date(a.date).toDateString() === new Date().toDateString()
    ).length;

    document.getElementById('appointment-count').textContent = totalAppointments;
    document.getElementById('today-appointments').textContent = todayAppointments;
}

// Setup event listeners
function setupEventListeners() {
    // Availability form submission
    const availabilityForm = document.querySelector('#availability-form');
    if (availabilityForm) {
        availabilityForm.addEventListener('submit', setAvailability);
    }

    // Search patients functionality
    const searchInput = document.querySelector('input[placeholder="Search patients..."]');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length < 2) {
                loadPatients();
                return;
            }

            try {
                const response = await fetch(`/appointments/search-patients?q=${searchTerm}`);
                const patients = await response.json();
                const patientList = document.querySelector('#patient-list');
                if (patientList) {
                    // Update patient list with search results
                    // ... (reuse patient list rendering logic)
                }
            } catch (error) {
                console.error('Error searching patients:', error);
            }
        }, 300));
    }

    // Quick action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            switch (action) {
                case 'set-schedule':
                    openAvailabilityModal();
                    break;
                case 'add-prescription':
                    // Handle prescription action
                    break;
                case 'view-records':
                    // Handle records action
                    break;
                case 'messages':
                    // Handle messages action
                    break;
            }
        });
    });
}

// Initialize real-time updates
function initializeRealTimeUpdates() {
    SocketService.listenForAppointmentUpdates((data) => {
        loadAppointments();
        NotificationService.info(`New appointment ${data.status}`);
    });

    SocketService.listenForNotifications((data) => {
        NotificationService.info(data.message);
    });
}

// Modal functions
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-400 hover:text-gray-500 focus:outline-none">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mt-4">
                    ${content}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global access
window.updateAppointmentStatus = updateAppointmentStatus;
window.viewPatientHistory = viewPatientHistory;
window.setAvailability = setAvailability;