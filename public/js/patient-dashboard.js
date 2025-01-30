import SocketService from './socket-service.js';
import NotificationService from './notification-service.js';
import { 
    AppointmentStatus, 
    generateAppointmentCard, 
    generateTimeSlots, 
    isTimeSlotAvailable 
} from './appointment-utils.js';

// Initialize date picker
document.addEventListener('DOMContentLoaded', function() {
    initializeDatePicker();
    loadDashboardData();
    setupEventListeners();
    initializeRealTimeUpdates();
});

// Initialize Flatpickr date picker
function initializeDatePicker() {
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
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadAppointments(),
            loadProfile(),
            loadMedicalHistory()
        ]);
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        NotificationService.error('Error loading dashboard data');
    }
}

// Load user's appointments
async function loadAppointments() {
    try {
        const response = await fetch('/appointments/my-appointments');
        const appointments = await response.json();
        
        const appointmentsContainer = document.querySelector('#appointments-container');
        if (!appointmentsContainer) return;

        if (appointments.length === 0) {
            appointmentsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-4"></i>
                    <p>No appointments scheduled</p>
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

        if (doctors.length === 0) {
            doctorList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-user-md text-4xl mb-4"></i>
                    <p>No doctors available for selected criteria</p>
                </div>
            `;
            return;
        }

        doctorList.innerHTML = doctors.map(doctor => `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transform transition duration-200 hover:shadow-md">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${doctor.profileImage || '/images/default-avatar.png'}" 
                             alt="${doctor.name}" 
                             class="w-12 h-12 rounded-full object-cover">
                        <div class="ml-4">
                            <h3 class="font-semibold text-gray-800">${doctor.name}</h3>
                            <p class="text-sm text-gray-500">${doctor.specialization}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center text-yellow-400 mb-1">
                            ${generateStarRating(doctor.rating)}
                        </div>
                        <p class="text-sm text-gray-500">${doctor.totalReviews} reviews</p>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="grid grid-cols-3 gap-2">
                        ${generateTimeSlots(doctor.availability.startTime, doctor.availability.endTime)
                            .map(slot => `
                                <button onclick="bookAppointment('${doctor._id}', '${slot.time}')"
                                        class="px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-150">
                                    ${slot.formatted}
                                </button>
                            `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading doctors:', error);
        NotificationService.error('Error loading doctors');
    }
}

// Book appointment
async function bookAppointment(doctorId, time) {
    try {
        const date = document.querySelector('#appointment-date').value;
        const symptoms = document.querySelector('#symptoms').value;

        if (!date || !time || !symptoms) {
            NotificationService.warning('Please fill in all required fields');
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
            NotificationService.success('Appointment booked successfully');
            document.querySelector('#symptoms').value = '';
            loadAppointments();
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        NotificationService.error('Error booking appointment');
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
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        NotificationService.error('Error updating appointment status');
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
        document.querySelector('select[name="bloodGroup"]').value = user.bloodGroup || '';
    } catch (error) {
        console.error('Error loading profile:', error);
        NotificationService.error('Error loading profile');
    }
}

// Load medical history
async function loadMedicalHistory() {
    try {
        const response = await fetch('/profile/medical-history');
        const history = await response.json();
        
        const historyContainer = document.querySelector('#medical-history');
        if (!historyContainer) return;

        if (history.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-notes-medical text-4xl mb-4"></i>
                    <p>No medical history available</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = history.map(record => `
            <div class="border-l-4 border-blue-500 pl-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold">${record.title}</p>
                        <p class="text-sm text-gray-500">Dr. ${record.doctor.name} - ${record.doctor.specialization}</p>
                    </div>
                    <p class="text-sm text-gray-500">${new Date(record.date).toLocaleDateString()}</p>
                </div>
                <p class="mt-2 text-gray-600">${record.description}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading medical history:', error);
        NotificationService.error('Error loading medical history');
    }
}

// Update dashboard stats
function updateDashboardStats(appointments) {
    if (!appointments) return;

    const totalAppointments = appointments.length;
    const upcomingAppointments = appointments.filter(a => 
        [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED].includes(a.status)
    ).length;
    const completedVisits = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const prescriptionsCount = appointments.filter(a => a.prescription).length;

    document.getElementById('total-appointments').textContent = totalAppointments;
    document.getElementById('upcoming-appointments').textContent = upcomingAppointments;
    document.getElementById('completed-visits').textContent = completedVisits;
    document.getElementById('prescriptions-count').textContent = prescriptionsCount;
}

// Generate star rating HTML
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

// Setup event listeners
function setupEventListeners() {
    // Profile form submission
    const profileForm = document.querySelector('#profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData(e.target);
                const response = await fetch('/profile/update', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                if (response.ok) {
                    NotificationService.success('Profile updated successfully');
                } else {
                    const error = await response.json();
                    NotificationService.error(error.message);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                NotificationService.error('Error updating profile');
            }
        });
    }

    // Quick action buttons
    const newAppointmentBtn = document.querySelector('[data-action="new-appointment"]');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', () => {
            document.querySelector('#booking-section').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// Initialize real-time updates
function initializeRealTimeUpdates() {
    SocketService.listenForAppointmentUpdates((data) => {
        loadAppointments();
        NotificationService.info(`Appointment ${data.status}: ${data.message}`);
    });

    SocketService.listenForNotifications((data) => {
        NotificationService.info(data.message);
    });
}

// Export functions for global access
window.bookAppointment = bookAppointment;
window.updateAppointmentStatus = updateAppointmentStatus;